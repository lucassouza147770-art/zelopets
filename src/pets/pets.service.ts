import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Especie, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

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

  private readonly selectPet = {
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
  } as const;

  findByTutor(tutorId: string) {
    return this.prisma.pet.findMany({
      where: { tutorId },
      orderBy: { criadoEm: 'asc' },
      select: this.selectPet,
    });
  }

  async findOne(tutorId: string, id: string) {
    const pet = await this.prisma.pet.findFirst({ where: { id, tutorId }, select: this.selectPet });
    if (!pet) throw new NotFoundException('Pet não encontrado');
    return pet;
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
      select: this.selectPet,
    });
  }

  async update(tutorId: string, id: string, dto: UpdatePetDto) {
    await this.findOne(tutorId, id);
    validarFoto(dto.fotoUrl);
    const dataNascimento = dto.dataNascimento ? new Date(dto.dataNascimento) : undefined;
    if (dataNascimento && dataNascimento > new Date()) {
      throw new BadRequestException('A data de nascimento não pode ser futura.');
    }

    return this.prisma.pet.update({
      where: { id },
      data: {
        nome: dto.nome,
        porte: dto.porte,
        nivelEnergia: dto.nivelEnergia,
        raca: dto.raca,
        dataNascimento,
        pesoKg: dto.pesoKg,
        restricoesAlimentares: dto.restricoesAlimentares,
        comportamento: dto.comportamento,
        fotoUrl: dto.fotoUrl,
      },
      select: this.selectPet,
    });
  }

  async remove(tutorId: string, id: string) {
    await this.findOne(tutorId, id);
    const mensagem = 'Este pet tem reservas; cancele antes';
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const [passeios, hospedagens, assinaturas] = await Promise.all([
          prisma.passeio.count({ where: { petId: id } }),
          prisma.hospedagem.count({ where: { petId: id } }),
          prisma.assinaturaNutricional.count({ where: { petId: id } }),
        ]);
        if (passeios + hospedagens + assinaturas > 0) {
          throw new ConflictException(mensagem);
        }

        await prisma.perfilPetCluster.deleteMany({ where: { petId: id } });
        return prisma.pet.delete({ where: { id }, select: this.selectPet });
      });
    } catch (erro: unknown) {
      if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2003') {
        throw new ConflictException(mensagem);
      }
      throw erro;
    }
  }
}
