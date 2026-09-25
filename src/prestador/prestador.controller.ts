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
import { TipoPrestador } from '@prisma/client';
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
  @UseGuards(JwtAuthGuard)
  criar(@Body() dto: CreatePrestadorDto) {
    return this.prestadorService.criar(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  atualizar(@Param('id') id: string, @Body() dto: UpdatePrestadorDto) {
    return this.prestadorService.atualizar(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remover(@Param('id') id: string) {
    return this.prestadorService.remover(id);
  }
}