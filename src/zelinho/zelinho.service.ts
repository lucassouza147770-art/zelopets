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

type PetResumo = { id: string; nome: string };
type AgendamentoPendente = {
  servico: 'passeio' | 'hotel';
  etapa: 'pet' | 'data' | 'horario' | 'checkout' | 'confirmacao';
  petId?: string;
  dataHora?: Date;
  checkin?: Date;
  checkout?: Date;
};
type ChatResultado = {
  resposta?: string;
  intencao?: string;
  sugestoes?: Array<{ rotulo: string; valor: string }>;
  handoff?: { motivo: string; prioridade: string; resumo: string } | null;
  protocolo?: string;
  [chave: string]: unknown;
};

@Injectable()
export class ZelinhoService {
  private readonly logger = new Logger(ZelinhoService.name);
  private readonly requisicoes = new Map<string, number[]>();
  private readonly mensagensPorDia = new Map<string, { inicio: number; total: number }>();
  private readonly agendamentos = new Map<string, AgendamentoPendente>();
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

  async inicio(tutorId: string) {
    const tutor = await this.prisma.tutor.findUnique({
      where: { id: tutorId },
      select: { nome: true },
    });
    const primeiroNome = tutor?.nome.trim().split(/\s+/)[0] ?? 'por aqui';
    return {
      resposta: `Olá, ${primeiroNome}! O que você quer fazer hoje? Escolha uma opção ou mande outra dúvida.`,
      intencao: 'saudacao',
      sugestoes: this.sugestoesMenu(),
      handoff: null,
    };
  }

  private sugestoesMenu() {
    return [
      { rotulo: 'Agendar passeio', valor: 'agendar_passeio' },
      { rotulo: 'Reservar hotel', valor: 'reservar_hotel' },
      { rotulo: 'Consultar preços', valor: 'pacotes_precos_hotel' },
      { rotulo: 'Ver nutrição', valor: 'planos_nutricao' },
      { rotulo: 'Ver minha agenda', valor: 'abrir_agenda' },
      { rotulo: 'Falar com atendente', valor: 'falar_com_atendente' },
    ];
  }

  private normalizar(texto: string) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  private extrairData(texto: string) {
    const normalizado = this.normalizar(texto);
    const agora = new Date();
    if (normalizado.includes('amanha') || normalizado.includes('amanh')) {
      agora.setDate(agora.getDate() + 1);
      agora.setHours(0, 0, 0, 0);
      return agora;
    }
    if (normalizado.includes('hoje')) {
      agora.setHours(0, 0, 0, 0);
      return agora;
    }
    const encontrada = normalizado.match(/\b(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?\b/);
    if (!encontrada) return undefined;
    const ano = encontrada[3] ? Number(encontrada[3].length === 2 ? `20${encontrada[3]}` : encontrada[3]) : agora.getFullYear();
    const data = new Date(ano, Number(encontrada[2]) - 1, Number(encontrada[1]));
    return data.getDate() === Number(encontrada[1]) && data.getMonth() === Number(encontrada[2]) - 1 ? data : undefined;
  }

  private extrairHorario(texto: string) {
    const encontrada = this.normalizar(texto).match(/\b(?:as|a|pelas?)?\s*(\d{1,2})(?:h|:(\d{2}))\b/);
    if (!encontrada) return undefined;
    const hora = Number(encontrada[1]);
    const minuto = Number(encontrada[2] ?? 0);
    return hora <= 23 && minuto <= 59 ? { hora, minuto } : undefined;
  }

  private petMencionado(pets: PetResumo[], texto: string) {
    const normalizado = this.normalizar(texto);
    return pets.find((pet) => normalizado.includes(this.normalizar(pet.nome)));
  }

  private respostaAgendamento(texto: string, sugestoes: Array<{ rotulo: string; valor: string }> = []) {
    return {
      resposta: texto,
      intencao: 'agendar_passeio',
      confianca: 1,
      sugestoes,
      handoff: null,
    };
  }

  private async enriquecerResposta(tutorId: string, resultado: ChatResultado) {
    const intencao = resultado.intencao;
    if (intencao === 'pacotes_precos_hotel') {
      const pacotes = await this.prisma.pacoteHospedagem.findMany({ orderBy: { precoDiaria: 'asc' } });
      return {
        ...resultado,
        resposta: pacotes.length
          ? `Os pacotes de hotel são: ${pacotes.map((pacote) => `${pacote.nome}: R$ ${Number(pacote.precoDiaria).toFixed(2).replace('.', ',')} por diária`).join('; ')}.`
          : 'Ainda não encontrei pacotes de hotel disponíveis.',
      };
    }
    if (intencao === 'planos_nutricao') {
      const planos = await this.prisma.planoNutricional.findMany({ orderBy: { precoMensal: 'asc' } });
      return {
        ...resultado,
        resposta: planos.length
          ? `Os planos mensais são: ${planos.map((plano) => `${plano.nome}: R$ ${Number(plano.precoMensal).toFixed(2).replace('.', ',')}`).join('; ')}.`
          : 'Ainda não encontrei planos nutricionais disponíveis.',
      };
    }
    if (intencao === 'saldo_moedas') {
      const tutor = await this.prisma.tutor.findUnique({ where: { id: tutorId }, select: { zeloCoins: true } });
      return { ...resultado, resposta: `Você tem ${tutor?.zeloCoins ?? 0} ZeloCoins.` };
    }
    if (intencao === 'minha_agenda' || intencao === 'proximo_cuidado') {
      return {
        ...resultado,
        resposta: 'Sua agenda mostra passeios, hospedagens e próximas entregas. Quer abrir agora?',
        sugestoes: [{ rotulo: 'Ver na agenda', valor: 'abrir_agenda' }],
      };
    }
    return resultado;
  }

  private async processarAgendamento(
    tutorId: string,
    texto: string,
    pets: PetResumo[],
    intencao?: string,
    petIdInformado?: string,
  ) {
    let pendente = this.agendamentos.get(tutorId);
    if (!pendente && intencao === 'agendar_passeio') {
      pendente = { servico: 'passeio', etapa: 'pet' };
    } else if (!pendente && intencao === 'reservar_hotel') {
      pendente = { servico: 'hotel', etapa: 'pet' };
    }
    if (!pendente) return null;

    const pet = pets.find((item) => item.id === petIdInformado) ?? this.petMencionado(pets, texto);
    if (!pendente.petId && pet) pendente.petId = pet.id;
    if (!pendente.petId && pets.length === 1) pendente.petId = pets[0].id;
    if (!pendente.petId && (pendente.etapa === 'pet' || pets.length > 1)) {
      this.agendamentos.set(tutorId, pendente);
      return this.respostaAgendamento(
        `Para qual cachorro você quer ${pendente.servico === 'hotel' ? 'reservar o hotel' : 'agendar o serviço'}?`,
        pets.map((item) => ({ rotulo: item.nome, valor: `pet:${item.id}` })).concat({ rotulo: 'Cancelar', valor: 'cancelar_agendamento' }),
      );
    }
    if (pendente.servico === 'passeio') {
      const data = pendente.dataHora ?? this.extrairData(texto);
      const horario = this.extrairHorario(texto);
      if (data && !pendente.dataHora) {
        pendente.dataHora = data;
      }
      if (pendente.dataHora && horario) {
        pendente.dataHora.setHours(horario.hora, horario.minuto, 0, 0);
      }
      if (!pendente.dataHora) {
        pendente.etapa = 'data';
        this.agendamentos.set(tutorId, pendente);
        return this.respostaAgendamento('Qual dia você prefere? Você pode dizer, por exemplo, “amanhã”.');
      }
      if (!horario && pendente.dataHora.getHours() === 0) {
        pendente.etapa = 'horario';
        this.agendamentos.set(tutorId, pendente);
        return this.respostaAgendamento('Qual horário você prefere? Por exemplo: 10h ou 14:30.');
      }
      if (pendente.dataHora <= new Date()) {
        return this.respostaAgendamento('Esse horário já passou. Escolha uma data e horário futuros, por favor.');
      }
      pendente.etapa = 'confirmacao';
      this.agendamentos.set(tutorId, pendente);
      const petNome = pets.find((item) => item.id === pendente?.petId)?.nome;
      const dataFormatada = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(pendente.dataHora);
      if (!texto.match(/\b(sim|confirmo|pode marcar)\b/i)) {
        return this.respostaAgendamento(`Confirma o passeio de ${petNome} em ${dataFormatada}?`, [
          { rotulo: 'Sim, marcar', valor: 'confirmar_agendamento' },
          { rotulo: 'Não', valor: 'cancelar_agendamento' },
        ]);
      }
      await this.prisma.passeio.create({
        data: { tutorId, petId: pendente.petId!, dataHora: pendente.dataHora, duracaoMinutos: 30, valor: 25 },
      });
      this.agendamentos.delete(tutorId);
      return this.respostaAgendamento(`Está marcado! O passeio de ${petNome} ficou para ${dataFormatada}.`, [
        { rotulo: 'Ver na agenda', valor: 'abrir_agenda' },
      ]);
    }

    const checkin = pendente.checkin ?? this.extrairData(texto);
    if (checkin && !pendente.checkin) pendente.checkin = checkin;
    if (!pendente.checkin) {
      pendente.etapa = 'data';
      this.agendamentos.set(tutorId, pendente);
      return this.respostaAgendamento('Qual será a data de check-in?');
    }
    if (!pendente.checkout) {
      const datas = this.extrairData(texto);
      if (datas && datas.getTime() !== pendente.checkin.getTime()) pendente.checkout = datas;
    }
    if (!pendente.checkout) {
      pendente.etapa = 'checkout';
      this.agendamentos.set(tutorId, pendente);
      return this.respostaAgendamento('E qual será a data de check-out?');
    }
    if (pendente.checkout <= pendente.checkin) {
      return this.respostaAgendamento('O check-out precisa ser depois do check-in. Qual data você prefere?');
    }
    const pacote = await this.prisma.pacoteHospedagem.findFirst({ orderBy: { precoDiaria: 'asc' } });
    if (!pacote) return this.respostaAgendamento('Ainda não há pacotes de hotel disponíveis para marcar.');
    const petNome = pets.find((item) => item.id === pendente?.petId)?.nome;
    const dataFormatada = `${new Intl.DateTimeFormat('pt-BR').format(pendente.checkin)} a ${new Intl.DateTimeFormat('pt-BR').format(pendente.checkout)}`;
    if (!texto.match(/\b(sim|confirmo|pode marcar)\b/i)) {
      pendente.etapa = 'confirmacao';
      this.agendamentos.set(tutorId, pendente);
      return this.respostaAgendamento(`Confirma a hospedagem de ${petNome} de ${dataFormatada}, no pacote ${pacote.nome}?`, [
        { rotulo: 'Sim, reservar', valor: 'confirmar_agendamento' },
        { rotulo: 'Não', valor: 'cancelar_agendamento' },
      ]);
    }
    await this.prisma.hospedagem.create({
      data: {
        tutorId,
        petId: pendente.petId!,
        pacoteId: pacote.id,
        dataCheckin: pendente.checkin,
        dataCheckout: pendente.checkout,
        valorTotal: Number(pacote.precoDiaria) * Math.ceil((pendente.checkout.getTime() - pendente.checkin.getTime()) / 86400000),
      },
    });
    this.agendamentos.delete(tutorId);
    return this.respostaAgendamento(`Está reservado! A hospedagem de ${petNome} ficou para ${dataFormatada}.`, [
      { rotulo: 'Ver na agenda', valor: 'abrir_agenda' },
    ]);
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

    const contexto = await this.prisma.tutor.findUnique({
      where: { id: tutorId },
      select: { nome: true, pets: { select: { id: true, nome: true }, orderBy: { criadoEm: 'asc' } } },
    });
    const pendente = this.agendamentos.get(tutorId);
    const textoNormalizado = this.normalizar(dto.texto);
    const pareceRespostaDeAgendamento = Boolean(
      this.petMencionado(contexto?.pets ?? [], dto.texto) ||
      this.extrairData(dto.texto) ||
      this.extrairHorario(dto.texto) ||
      /\b(sim|nao|não|confirmo|cancelar)\b/.test(textoNormalizado),
    );
    if (pendente && !pareceRespostaDeAgendamento) {
      this.agendamentos.delete(tutorId);
    }
    if (pendente && pareceRespostaDeAgendamento) {
      if (dto.pet_id?.startsWith('pet:')) {
        const respostaPet = await this.processarAgendamento(tutorId, dto.texto, contexto?.pets ?? [], undefined, dto.pet_id.slice(4));
        if (respostaPet) return respostaPet;
      }
      if (/\b(cancelar|nao|não)\b/i.test(dto.texto) && pendente.etapa === 'confirmacao') {
        this.agendamentos.delete(tutorId);
        return this.respostaAgendamento('Tudo bem, não marquei nada. Se quiser, podemos começar de novo.');
      }
      if (/\b(sim|confirmo|pode marcar)\b/i.test(dto.texto) && pendente.etapa === 'confirmacao') {
        const respostaConfirmada = await this.processarAgendamento(tutorId, `sim ${dto.texto}`, contexto?.pets ?? []);
        if (respostaConfirmada) return respostaConfirmada;
      }
      const respostaPendente = await this.processarAgendamento(tutorId, dto.texto, contexto?.pets ?? []);
      if (respostaPendente) return respostaPendente;
    }

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
      const resultado = (await resposta.json()) as ChatResultado;
      const agendamento = await this.processarAgendamento(
        tutorId,
        dto.texto,
        contexto?.pets ?? [],
        typeof resultado.intencao === 'string' ? resultado.intencao : undefined,
        dto.pet_id,
      );
      if (agendamento) return agendamento;
      if (resultado.intencao === 'saudacao' && contexto?.nome) {
        const primeiroNome = contexto.nome.trim().split(/\s+/)[0];
        resultado.resposta = `Olá, ${primeiroNome}! O que você quer fazer hoje? Escolha uma opção ou mande outra dúvida.`;
        resultado.sugestoes = this.sugestoesMenu();
      }
      const respostaEnriquecida = await this.enriquecerResposta(tutorId, resultado);
      Object.assign(resultado, respostaEnriquecida);
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
