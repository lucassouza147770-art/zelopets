import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FaixaDistancia, TipoPasseio } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePasseioDto } from './dto/create-passeio.dto';
import { UpdatePasseioDto } from './dto/update-passeio.dto';

const PRECO_POR_DURACAO: Record<30 | 45 | 60, number> = {
  30: 25,
  45: 35,
  60: 45,
};
const PRECO_POR_DISTANCIA: Record<FaixaDistancia, number> = {
  ATE_3KM: 18,
  DE_3_A_8KM: 30,
  DE_8_A_15KM: 48,
};

@Injectable()
export class PasseioService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(tutorId: string, dto: CreatePasseioDto) {
    // garante que o pet pertence a este tutor antes de criar o passeio
    const pet = await this.prisma.pet.findFirst({
      where: { id: dto.petId, tutorId },
    });
    if (!pet) {
      throw new NotFoundException('Pet não encontrado para este tutor');
    }

    const duracaoMinutos = dto.duracaoMinutos ?? 30;
    const tipo = dto.tipo ?? TipoPasseio.PASSEIO;
    if (tipo === TipoPasseio.TRANSPORTE && (!dto.origem || !dto.destino || !dto.faixaDistancia)) {
      throw new BadRequestException('Transporte exige origem, destino e faixa de distância');
    }
    if (tipo === TipoPasseio.PASSEIO && (dto.origem || dto.destino || dto.faixaDistancia)) {
      throw new BadRequestException('Origem, destino e distância só podem ser usados em transporte');
    }
    return this.prisma.passeio.create({
      data: {
        tutorId,
        petId: dto.petId,
        prestadorId: dto.prestadorId,
        tipo,
        origem: dto.origem,
        destino: dto.destino,
        faixaDistancia: dto.faixaDistancia,
        dataHora: new Date(dto.dataHora),
        duracaoMinutos,
        valor: tipo === TipoPasseio.TRANSPORTE
          ? PRECO_POR_DISTANCIA[dto.faixaDistancia!]
          : PRECO_POR_DURACAO[duracaoMinutos],
      },
    });
  }

  listarDoTutor(tutorId: string) {
    return this.prisma.passeio.findMany({
      where: { tutorId },
      orderBy: { dataHora: 'asc' },
      include: { pet: true, prestador: true },
    });
  }

  // é isso que o Painel do Tutor vai chamar pra parar de simular a
  // FaixaDeAgendamento — o próximo passeio pendente/confirmado no futuro
  buscarProximoDoTutor(tutorId: string) {
    return this.prisma.passeio.findFirst({
      where: {
        tutorId,
        status: { in: ['PENDENTE', 'CONFIRMADO'] },
        dataHora: { gte: new Date() },
      },
      orderBy: { dataHora: 'asc' },
      include: { pet: true },
    });
  }

  async buscarUm(tutorId: string, id: string) {
    const passeio = await this.prisma.passeio.findFirst({
      where: { id, tutorId },
      include: { pet: true, prestador: true },
    });
    if (!passeio) {
      throw new NotFoundException('Passeio não encontrado');
    }
    return passeio;
  }

  async atualizar(tutorId: string, id: string, dto: UpdatePasseioDto) {
    await this.buscarUm(tutorId, id);
    const data: Prisma.PasseioUncheckedUpdateInput = {};

    if (dto.prestadorId !== undefined) data.prestadorId = dto.prestadorId;
    if (dto.dataHora !== undefined) data.dataHora = new Date(dto.dataHora);
    if (dto.duracaoMinutos !== undefined) {
      data.duracaoMinutos = dto.duracaoMinutos;
      data.valor = PRECO_POR_DURACAO[dto.duracaoMinutos];
    }
    return this.prisma.passeio.update({
      where: { id },
      data,
    });
  }

  async cancelar(tutorId: string, id: string) {
    await this.buscarUm(tutorId, id);
    return this.prisma.passeio.update({ where: { id }, data: { status: 'CANCELADO' } });
  }
}