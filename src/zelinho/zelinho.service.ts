import {
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MensagemZelinhoDto } from './dto/mensagem-zelinho.dto';

const JANELA_MS = 60_000;
const LIMITE_POR_MINUTO = 20;
const LIMITE_POR_DIA = 200;
const TIMEOUT_MS = 8_000;

@Injectable()
export class ZelinhoService {
  private readonly logger = new Logger(ZelinhoService.name);
  private readonly requisicoes = new Map<string, number[]>();
  private readonly mensagensPorDia = new Map<string, { inicio: number; total: number }>();
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const token = process.env.ML_INTERNAL_TOKEN;
    if (!token) {
      this.logger.warn('ML_INTERNAL_TOKEN não configurado; Zelinho operará em modo reduzido.');
      return;
    }
    try {
      const resposta = await fetch(new URL('/chat/saude', process.env.ML_SERVICE_URL ?? 'http://localhost:8000'), {
        headers: { 'X-Internal-Token': token },
        signal: AbortSignal.timeout(2000),
      });
      if (resposta.status === 401) {
        this.logger.warn(`Token do ml-service recusado (hash ${this.hashToken(token)}).`);
      } else if (!resposta.ok) {
        this.logger.warn(`Saúde do ml-service retornou ${resposta.status}.`);
      }
    } catch {
      this.logger.warn('ml-service indisponível na subida; Zelinho operará em modo reduzido.');
    }
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex').slice(0, 8);
  }

  async responder(tutorId: string, dto: MensagemZelinhoDto) {
    const agora = Date.now();
    const recentes = (this.requisicoes.get(tutorId) ?? []).filter(
      (timestamp) => agora - timestamp < JANELA_MS,
    );
    if (recentes.length >= LIMITE_POR_MINUTO) {
      throw new HttpException(
        'Limite de mensagens atingido. Tente novamente em um minuto.',
        429,
      );
    }
    recentes.push(agora);
    this.requisicoes.set(tutorId, recentes);
    const registro = this.mensagensPorDia.get(tutorId);
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);
    const inicio = inicioDoDia.getTime();
    const diario = registro?.inicio === inicio ? registro : { inicio, total: 0 };
    if (diario.total >= LIMITE_POR_DIA) {
      throw new HttpException(
        'Você enviou muitas mensagens hoje. Tente novamente amanhã.',
        429,
      );
    }
    diario.total += 1;
    this.mensagensPorDia.set(tutorId, diario);

    const tokenInterno = process.env.ML_INTERNAL_TOKEN;
    const baseUrl = process.env.ML_SERVICE_URL ?? 'http://localhost:8000';
    if (!tokenInterno) {
      return this.modoReduzido();
    }

    let url: URL;
    try {
      url = new URL('/chat/mensagem', baseUrl);
    } catch {
      throw new ServiceUnavailableException(
        'O Zelinho está indisponível no momento.',
      );
    }

    let resposta: Response;
    try {
      resposta = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': tokenInterno,
        },
        body: JSON.stringify({
          tutor_id: tutorId,
          mensagem: dto.texto,
          pet_id: dto.pet_id,
          intencao_forcada: dto.intencao_forcada,
          resposta_confirmacao: dto.resposta_confirmacao,
          intencao_confirmada: dto.intencao_confirmada,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (erro: unknown) {
      if (
        erro instanceof TypeError ||
        (erro instanceof Error &&
          (erro.name === 'TimeoutError' || erro.name === 'AbortError'))
      ) {
        throw new ServiceUnavailableException(
          'O Zelinho está indisponível no momento. Tente novamente.',
        );
      }
      throw erro;
    }

    if (!resposta.ok) {
      this.logger.warn(`ml-service recusou a mensagem com status ${resposta.status}.`);
      return this.modoReduzido();
    }

    try {
      const resultado = (await resposta.json()) as {
        resposta?: string;
        handoff?: { motivo: string; prioridade: string; resumo: string } | null;
      };
      if (!resultado.handoff) {
        return resultado;
      }

      const aberto = await this.prisma.atendimentoHumano.findFirst({
        where: { tutorId, status: { in: ['ABERTO', 'EM_ATENDIMENTO'] } },
        orderBy: { abertoEm: 'desc' },
      });
      if (aberto) {
        return {
          ...resultado,
          protocolo: aberto.protocolo,
          resposta: `Seu chamado ${aberto.protocolo} já está aberto. A equipe vai te responder por aqui.`,
        };
      }
      const inicioDoDiaChamado = new Date();
      inicioDoDiaChamado.setHours(0, 0, 0, 0);
      const chamadosHoje = await this.prisma.atendimentoHumano.count({
        where: { tutorId, abertoEm: { gte: inicioDoDiaChamado } },
      });
      if (chamadosHoje >= 3) {
        return {
          ...resultado,
          handoff: null,
          resposta: 'Você atingiu o limite diário de atendimentos. Tente novamente amanhã.',
        };
      }
      const totalAtendimentos = await this.prisma.atendimentoHumano.count();
      const protocolo = `ZEL-${String(totalAtendimentos + 1).padStart(6, '0')}`;
      await this.prisma.atendimentoHumano.create({
        data: {
          protocolo,
          tutorId,
          motivo: resultado.handoff.motivo,
          prioridade: resultado.handoff.prioridade === 'ALTA' ? 'ALTA' : 'NORMAL',
          resumo: resultado.handoff.resumo,
        },
      });
      return {
        ...resultado,
        protocolo,
        resposta: `Vou chamar um atendente da equipe ZeloPets para te ajudar. Seu protocolo é ${protocolo}.`,
      };
    } catch {
      throw new ServiceUnavailableException(
        'O Zelinho está indisponível no momento. Tente novamente.',
      );
    }

  }

  obterAtendimentoAtual(tutorId: string) {
    return this.prisma.atendimentoHumano.findFirst({
      where: { tutorId, status: { in: ['ABERTO', 'EM_ATENDIMENTO'] } },
      orderBy: { abertoEm: 'desc' },
    });
  }

  private modoReduzido() {
    return {
      resposta: 'Estou com dificuldade agora. Escolha um assunto ou fale com um atendente.',
      intencao: 'modo_reduzido',
      confianca: 0,
      sugestoes: [
        { rotulo: 'Agendar passeio', valor: 'agendar_passeio' },
        { rotulo: 'Pedir transporte', valor: 'pedir_transporte' },
        { rotulo: 'Reservar hotel', valor: 'reservar_hotel' },
        { rotulo: 'Planos de nutrição', valor: 'planos_nutricao' },
        { rotulo: 'Meu próximo cuidado', valor: 'proximo_cuidado' },
        { rotulo: 'Minhas ZeloCoins', valor: 'saldo_moedas' },
        { rotulo: 'Falar com atendente', valor: 'falar_com_atendente' },
      ],
      handoff: null,
    };
  }
}
