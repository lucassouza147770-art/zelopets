import { BadRequestException, Injectable } from '@nestjs/common';
import { Especie } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';

const FOTO_DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const FOTO_MAX_BYTES = 150 * 1024;

function validarFoto(fotoUrl?: string) {
  if (!fotoUrl) return;
  if (!FOTO_DATA_URL.test(fotoUrl)) {
    throw new BadRequestException('A foto deve ser uma imagem JPEG, PNG ou WebP em base64');
  }
  const base64 = fotoUrl.slice(fotoUrl.indexOf(',') + 1);
  const bytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  if (bytes > FOTO_MAX_BYTES) {
    throw new BadRequestException('A foto deve ter no máximo 150 KB');
  }
}

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
        dataNascimento: true,
        porte: true,
        pesoKg: true,
        nivelEnergia: true,
        restricoesAlimentares: true,
        comportamento: true,
      },
    });
  }

  create(tutorId: string, dto: CreatePetDto) {
    validarFoto(dto.fotoUrl);
    const dataNascimento = dto.dataNascimento ? new Date(dto.dataNascimento) : undefined;
    if (dataNascimento && dataNascimento > new Date()) {
      throw new BadRequestException('A data de nascimento não pode ser futura.');
    }

    return this.prisma.pet.create({
      data: {
        tutorId,
        nome: dto.nome,
        especie: Especie.CACHORRO,
        porte: dto.porte,
        nivelEnergia: dto.nivelEnergia,
        raca: dto.raca,
        dataNascimento,
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
        dataNascimento: true,
        porte: true,
        pesoKg: true,
        nivelEnergia: true,
        restricoesAlimentares: true,
        comportamento: true,
      },
    });
  }
}
