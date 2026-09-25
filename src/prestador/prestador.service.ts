import { Injectable, NotFoundException } from '@nestjs/common';
import { TipoPrestador } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrestadorDto } from './dto/create-prestador.dto';
import { UpdatePrestadorDto } from './dto/update-prestador.dto';

@Injectable()
export class PrestadorService {
  constructor(private readonly prisma: PrismaService) {}

  criar(dto: CreatePrestadorDto) {
    return this.prisma.prestador.create({ data: dto });
  }

  listarTodos(tipo?: TipoPrestador) {
    return this.prisma.prestador.findMany({
      where: { ativo: true, ...(tipo ? { tipo } : {}) },
      orderBy: { avaliacaoMedia: 'desc' },
    });
  }

  async buscarUm(id: string) {
    const prestador = await this.prisma.prestador.findFirst({
      where: { id, ativo: true },
    });
    if (!prestador) {
      throw new NotFoundException('Prestador não encontrado');
    }
    return prestador;
  }

  async atualizar(id: string, dto: UpdatePrestadorDto) {
    await this.buscarUm(id);
    return this.prisma.prestador.update({ where: { id }, data: dto });
  }

  async remover(id: string) {
    await this.buscarUm(id);
    return this.prisma.prestador.update({ where: { id }, data: { ativo: false } });
  }
}