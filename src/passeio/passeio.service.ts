import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePasseioDto } from './dto/create-passeio.dto';
import { UpdatePasseioDto } from './dto/update-passeio.dto';

const PRECO_POR_DURACAO: Record<30 | 45 | 60, number> = {
  30: 25,
  45: 35,
  60: 45,
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
    return this.prisma.passeio.create({
      data: {
        tutorId,
        petId: dto.petId,
        prestadorId: dto.prestadorId,
        dataHora: new Date(dto.dataHora),
        duracaoMinutos,
        valor: PRECO_POR_DURACAO[duracaoMinutos],
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
    if (dto.status !== undefined) data.status = dto.status;

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