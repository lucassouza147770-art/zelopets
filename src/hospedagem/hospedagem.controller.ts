import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateHospedagemDto } from './dto/create-hospedagem.dto';
import { UpdateHospedagemDto } from './dto/update-hospedagem.dto';
import { HospedagemService } from './hospedagem.service';

type RequisicaoAutenticada = { user: { tutorId: string; email: string } };

@Controller('hospedagens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class HospedagemController {
  constructor(private readonly hospedagemService: HospedagemService) {}

  @Post()
  criar(@Req() req: RequisicaoAutenticada, @Body() dto: CreateHospedagemDto) {
    return this.hospedagemService.criar(req.user.tutorId, dto);
  }

  @Get()
  listar(@Req() req: RequisicaoAutenticada) {
    return this.hospedagemService.listarDoTutor(req.user.tutorId);
  }

  @Get(':id')
  buscarUm(@Req() req: RequisicaoAutenticada, @Param('id') id: string) {
    return this.hospedagemService.buscarUm(req.user.tutorId, id);
  }

  @Patch(':id')
  atualizar(
    @Req() req: RequisicaoAutenticada,
    @Param('id') id: string,
    @Body() dto: UpdateHospedagemDto,
  ) {
    return this.hospedagemService.atualizar(req.user.tutorId, id, dto);
  }

  @Delete(':id')
  cancelar(@Req() req: RequisicaoAutenticada, @Param('id') id: string) {
    return this.hospedagemService.cancelar(req.user.tutorId, id);
  }
}