import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHospedagemDto } from './dto/create-hospedagem.dto';
import { UpdateHospedagemDto } from './dto/update-hospedagem.dto';

@Injectable()
export class HospedagemService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(tutorId: string, dto: CreateHospedagemDto) {
    const pet = await this.prisma.pet.findFirst({ where: { id: dto.petId, tutorId } });
    if (!pet) {
      throw new NotFoundException('Pet não encontrado para este tutor');
    }

    const pacote = await this.prisma.pacoteHospedagem.findUnique({ where: { id: dto.pacoteId } });
    if (!pacote) {
      throw new NotFoundException('Pacote de hospedagem não encontrado');
    }

    const checkin = new Date(dto.dataCheckin);
    const checkout = new Date(dto.dataCheckout);
    const diarias = Math.ceil((checkout.getTime() - checkin.getTime()) / 86400000);
    if (diarias <= 0) {
      throw new BadRequestException('A data de check-out precisa ser depois do check-in');
    }

    const valorTotal = Number(pacote.precoDiaria) * diarias;
    return this.prisma.hospedagem.create({
      data: {
        tutorId,
        petId: dto.petId,
        pacoteId: dto.pacoteId,
        prestadorId: dto.prestadorId,
        dataCheckin: checkin,
        dataCheckout: checkout,
        valorTotal,
      },
    });
  }

  listarDoTutor(tutorId: string) {
    return this.prisma.hospedagem.findMany({
      where: { tutorId },
      orderBy: { dataCheckin: 'asc' },
      include: { pet: true, pacote: true, prestador: true },
    });
  }

  async buscarUm(tutorId: string, id: string) {
    const hospedagem = await this.prisma.hospedagem.findFirst({
      where: { id, tutorId },
      include: { pet: true, pacote: true, prestador: true },
    });
    if (!hospedagem) {
      throw new NotFoundException('Hospedagem não encontrada');
    }
    return hospedagem;
  }

  async atualizar(tutorId: string, id: string, dto: UpdateHospedagemDto) {
    const atual = await this.buscarUm(tutorId, id);
    const petId = dto.petId ?? atual.petId;
    if (dto.petId) {
      const pet = await this.prisma.pet.findFirst({ where: { id: petId, tutorId } });
      if (!pet) {
        throw new NotFoundException('Pet não encontrado para este tutor');
      }
    }

    const pacoteId = dto.pacoteId ?? atual.pacoteId;
    const pacote = await this.prisma.pacoteHospedagem.findUnique({ where: { id: pacoteId } });
    if (!pacote) {
      throw new NotFoundException('Pacote de hospedagem não encontrado');
    }

    const checkin = dto.dataCheckin ? new Date(dto.dataCheckin) : atual.dataCheckin;
    const checkout = dto.dataCheckout ? new Date(dto.dataCheckout) : atual.dataCheckout;
    const diarias = Math.ceil((checkout.getTime() - checkin.getTime()) / 86400000);
    if (diarias <= 0) {
      throw new BadRequestException('A data de check-out precisa ser depois do check-in');
    }

    return this.prisma.hospedagem.update({
      where: { id },
      data: {
        ...dto,
        petId: dto.petId,
        pacoteId: dto.pacoteId,
        dataCheckin: dto.dataCheckin ? checkin : undefined,
        dataCheckout: dto.dataCheckout ? checkout : undefined,
        valorTotal: Number(pacote.precoDiaria) * diarias,
      },
    });
  }

  async cancelar(tutorId: string, id: string) {
    await this.buscarUm(tutorId, id);
    return this.prisma.hospedagem.update({ where: { id }, data: { status: 'CANCELADO' } });
  }
}