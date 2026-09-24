import { Injectable } from '@nestjs/common';
import { Especie } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  findByTutor(tutorId: string) {
    return this.prisma.pet.findMany({
      where: { tutorId },
      orderBy: { criadoEm: 'asc' },
      select: {
        id: true,
        nome: true,
        fotoUrl: true,
        especie: true,
        raca: true,
        porte: true,
        pesoKg: true,
        nivelEnergia: true,
      },
    });
  }

  create(tutorId: string, dto: CreatePetDto) {
    return this.prisma.pet.create({
      data: {
        tutorId,
        nome: dto.nome,
        especie: Especie.CACHORRO,
        porte: dto.porte,
        nivelEnergia: dto.nivelEnergia,
        raca: dto.raca,
        pesoKg: dto.pesoKg,
        restricoesAlimentares: dto.restricoesAlimentares ?? [],
        comportamento: dto.comportamento ?? [],
        fotoUrl: dto.fotoUrl,
      },
      select: {
        id: true,
        nome: true,
        fotoUrl: true,
        especie: true,
        raca: true,
        porte: true,
        pesoKg: true,
        nivelEnergia: true,
      },
    });
  }
}
