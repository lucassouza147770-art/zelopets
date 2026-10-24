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
import { PasseioService } from './passeio.service';
import { CreatePasseioDto } from './dto/create-passeio.dto';
import { UpdatePasseioDto } from './dto/update-passeio.dto';

type RequisicaoAutenticada = { user: { tutorId: string; email: string } };

@Controller('passeios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PasseioController {
  constructor(private readonly passeioService: PasseioService) {}

  @Post()
  criar(@Req() req: RequisicaoAutenticada, @Body() dto: CreatePasseioDto) {
    return this.passeioService.criar(req.user.tutorId, dto);
  }

  @Get()
  listar(@Req() req: RequisicaoAutenticada) {
    return this.passeioService.listarDoTutor(req.user.tutorId);
  }

  // precisa vir ANTES de ':id', senão o Nest tenta casar "proximo" como id
  @Get('proximo')
  buscarProximo(@Req() req: RequisicaoAutenticada) {
    return this.passeioService.buscarProximoDoTutor(req.user.tutorId);
  }

  @Get(':id')
  buscarUm(@Req() req: RequisicaoAutenticada, @Param('id') id: string) {
    return this.passeioService.buscarUm(req.user.tutorId, id);
  }

  @Patch(':id')
  atualizar(
    @Req() req: RequisicaoAutenticada,
    @Param('id') id: string,
    @Body() dto: UpdatePasseioDto,
  ) {
    return this.passeioService.atualizar(req.user.tutorId, id, dto);
  }

  @Delete(':id')
  cancelar(@Req() req: RequisicaoAutenticada, @Param('id') id: string) {
    return this.passeioService.cancelar(req.user.tutorId, id);
  }
}