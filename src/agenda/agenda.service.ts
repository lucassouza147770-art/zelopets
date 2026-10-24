import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type TipoCuidado = 'PASSEIO' | 'HOSPEDAGEM' | 'NUTRICAO';

type Cuidado = {
  tipo: TipoCuidado;
  petNome: string;
  dataHora: Date;
  status: string;
};

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(tutorId: string): Promise<Cuidado[]> {
    const agora = new Date();
    const [passeios, hospedagens, assinaturas] = await Promise.all([
      this.prisma.passeio.findMany({
        where: {
          tutorId,
          status: { in: ['PENDENTE', 'CONFIRMADO'] },
          dataHora: { gte: agora },
        },
        select: {
          dataHora: true,
          status: true,
          pet: { select: { nome: true } },
        },
      }),
      this.prisma.hospedagem.findMany({
        where: {
          tutorId,
          status: { in: ['PENDENTE', 'CONFIRMADO'] },
          dataCheckin: { gte: agora },
        },
        select: {
          dataCheckin: true,
          status: true,
          pet: { select: { nome: true } },
        },
      }),
      this.prisma.assinaturaNutricional.findMany({
        where: {
          tutorId,
          status: 'ATIVA',
          previsaoProximaEntrega: { gte: agora },
        },
        select: {
          previsaoProximaEntrega: true,
          status: true,
          pet: { select: { nome: true } },
        },
      }),
    ]);

    return [
      ...passeios.map(
        (passeio): Cuidado => ({
          tipo: 'PASSEIO',
          petNome: passeio.pet.nome,
          dataHora: passeio.dataHora,
          status: passeio.status,
        }),
      ),
      ...hospedagens.map(
        (hospedagem): Cuidado => ({
          tipo: 'HOSPEDAGEM',
          petNome: hospedagem.pet.nome,
          dataHora: hospedagem.dataCheckin,
          status: hospedagem.status,
        }),
      ),
      ...assinaturas.map((assinatura): Cuidado => {
        if (!assinatura.previsaoProximaEntrega) {
          throw new Error('Assinatura ativa sem previsão de próxima entrega');
        }

        return {
          tipo: 'NUTRICAO',
          petNome: assinatura.pet.nome,
          dataHora: assinatura.previsaoProximaEntrega,
          status: assinatura.status,
        };
      }),
    ].sort((a, b) => a.dataHora.getTime() - b.dataHora.getTime());
  }

  async obterProximo(tutorId: string) {
    const cuidados = await this.listar(tutorId);
    return { proximo: cuidados[0] ?? null };
  }
}
