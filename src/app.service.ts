import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async saude() {
    let banco = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      banco = true;
    } catch (erro: unknown) {
      this.logger.warn(`Banco indisponível: ${erro instanceof Error ? erro.message : 'erro desconhecido'}`);
    }

    const token = process.env.ML_INTERNAL_TOKEN;
    let mlService = false;
    let tokenConfere = false;
    let chatCarregado = false;
    if (token) {
      try {
        const resposta = await fetch(new URL('/chat/saude', process.env.ML_SERVICE_URL ?? 'http://localhost:8000'), {
          headers: { 'X-Internal-Token': token },
          signal: AbortSignal.timeout(2000),
        });
        mlService = resposta.ok;
        tokenConfere = resposta.status !== 401;
        if (resposta.ok) {
          const corpo = (await resposta.json()) as { modelo_carregado?: boolean };
          chatCarregado = corpo.modelo_carregado === true;
        }
      } catch {
        mlService = false;
      }
    }

    return { status: banco && mlService && chatCarregado ? 'ok' : 'degradado', banco, mlService, tokenConfere, chatCarregado };
  }
}
