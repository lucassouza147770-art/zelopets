import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MensagemZelinhoDto } from './dto/mensagem-zelinho.dto';

const JANELA_MS = 60_000;
const LIMITE_POR_MINUTO = 20;
const TIMEOUT_MS = 8_000;

@Injectable()
export class ZelinhoService {
  private readonly requisicoes = new Map<string, number[]>();

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

    const tokenInterno = process.env.ML_INTERNAL_TOKEN;
    const baseUrl = process.env.ML_SERVICE_URL ?? 'http://localhost:8000';
    if (!tokenInterno) {
      throw new ServiceUnavailableException(
        'O Zelinho está indisponível no momento.',
      );
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
        body: JSON.stringify({ tutor_id: tutorId, texto: dto.texto }),
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
      throw new ServiceUnavailableException(
        'O Zelinho está indisponível no momento. Tente novamente.',
      );
    }

    try {
      return await resposta.json();
    } catch {
      throw new ServiceUnavailableException(
        'O Zelinho está indisponível no momento. Tente novamente.',
      );
    }
  }
}
