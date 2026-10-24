import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssinaturaDto } from './dto/create-assinatura.dto';
import { UpdateAssinaturaDto } from './dto/update-assinatura.dto';

function calcularPrevisaoProximaEntrega(quantidadeRacaoKg: number, consumoDiarioEstimadoG: number) {
  const diasRestantes = Math.floor((quantidadeRacaoKg * 1000) / consumoDiarioEstimadoG);
  const data = new Date();
  data.setDate(data.getDate() + diasRestantes);
  return data;
}

@Injectable()
export class AssinaturaNutricionalService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(tutorId: string, dto: CreateAssinaturaDto) {
    const pet = await this.prisma.pet.findFirst({ where: { id: dto.petId, tutorId } });
    if (!pet) {
      throw new NotFoundException('Pet não encontrado para este tutor');
    }

    const plano = await this.prisma.planoNutricional.findUnique({ where: { id: dto.planoId } });
    if (!plano) {
      throw new NotFoundException('Plano nutricional não encontrado');
    }

    return this.prisma.assinaturaNutricional.create({
      data: {
        tutorId,
        petId: dto.petId,
        planoId: dto.planoId,
        quantidadeRacaoKg: dto.quantidadeRacaoKg,
        consumoDiarioEstimadoG: dto.consumoDiarioEstimadoG,
        previsaoProximaEntrega: calcularPrevisaoProximaEntrega(
          dto.quantidadeRacaoKg,
          dto.consumoDiarioEstimadoG,
        ),
      },
    });
  }

  listarDoTutor(tutorId: string) {
    return this.prisma.assinaturaNutricional.findMany({
      where: { tutorId },
      orderBy: { criadoEm: 'desc' },
      include: { pet: true, plano: true },
    });
  }

  async buscarUm(tutorId: string, id: string) {
    const assinatura = await this.prisma.assinaturaNutricional.findFirst({
      where: { id, tutorId },
      include: { pet: true, plano: true },
    });
    if (!assinatura) {
      throw new NotFoundException('Assinatura não encontrada');
    }
    return assinatura;
  }

  async atualizar(tutorId: string, id: string, dto: UpdateAssinaturaDto) {
    const atual = await this.buscarUm(tutorId, id);
    if (dto.planoId) {
      const plano = await this.prisma.planoNutricional.findUnique({ where: { id: dto.planoId } });
      if (!plano) {
        throw new NotFoundException('Plano nutricional não encontrado');
      }
    }

    const quantidade = dto.quantidadeRacaoKg ?? atual.quantidadeRacaoKg;
    const consumo = dto.consumoDiarioEstimadoG ?? atual.consumoDiarioEstimadoG;
    const data: Prisma.AssinaturaNutricionalUncheckedUpdateInput = {};

    if (dto.planoId !== undefined) data.planoId = dto.planoId;
    if (dto.quantidadeRacaoKg !== undefined) data.quantidadeRacaoKg = dto.quantidadeRacaoKg;
    if (dto.consumoDiarioEstimadoG !== undefined) {
      data.consumoDiarioEstimadoG = dto.consumoDiarioEstimadoG;
    }
    if (dto.status !== undefined) data.status = dto.status;
    if (
      dto.quantidadeRacaoKg !== undefined ||
      dto.consumoDiarioEstimadoG !== undefined
    ) {
      data.previsaoProximaEntrega = calcularPrevisaoProximaEntrega(quantidade, consumo);
    }

    return this.prisma.assinaturaNutricional.update({
      where: { id },
      data,
    });
  }

  async cancelar(tutorId: string, id: string) {
    await this.buscarUm(tutorId, id);
    return this.prisma.assinaturaNutricional.update({
      where: { id },
      data: { status: 'CANCELADA' },
    });
  }
}