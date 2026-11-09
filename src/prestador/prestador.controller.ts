import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { TipoPrestador } from '@prisma/client';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePrestadorDto } from './dto/create-prestador.dto';
import { UpdatePrestadorDto } from './dto/update-prestador.dto';
import { PrestadorService } from './prestador.service';

@Controller('prestadores')
export class PrestadorController {
  constructor(private readonly prestadorService: PrestadorService) {}

  @Get()
  listar(@Query('tipo') tipo?: TipoPrestador) {
    return this.prestadorService.listarTodos(tipo);
  }

  @Get(':id')
  buscarUm(@Param('id') id: string) {
    return this.prestadorService.buscarUm(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  criar(@Body() dto: CreatePrestadorDto) {
    return this.prestadorService.criar(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  atualizar(@Param('id') id: string, @Body() dto: UpdatePrestadorDto) {
    return this.prestadorService.atualizar(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  remover(@Param('id') id: string) {
    return this.prestadorService.remover(id);
  }
}