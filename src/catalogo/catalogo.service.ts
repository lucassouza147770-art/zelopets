import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogoService {
  constructor(private readonly prisma: PrismaService) {}

  listarPacotesHospedagem() {
    return this.prisma.pacoteHospedagem.findMany({ orderBy: { precoDiaria: 'asc' } });
  }

  listarPlanosNutricionais() {
    return this.prisma.planoNutricional.findMany({ orderBy: { precoMensal: 'asc' } });
  }
}