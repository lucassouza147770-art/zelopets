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
import { CreateAssinaturaDto } from './dto/create-assinatura.dto';
import { UpdateAssinaturaDto } from './dto/update-assinatura.dto';
import { AssinaturaNutricionalService } from './assinatura-nutricional.service';

type RequisicaoAutenticada = { user: { tutorId: string; email: string } };

@Controller('assinaturas-nutricionais')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AssinaturaNutricionalController {
  constructor(private readonly assinaturaService: AssinaturaNutricionalService) {}

  @Post()
  criar(@Req() req: RequisicaoAutenticada, @Body() dto: CreateAssinaturaDto) {
    return this.assinaturaService.criar(req.user.tutorId, dto);
  }

  @Get()
  listar(@Req() req: RequisicaoAutenticada) {
    return this.assinaturaService.listarDoTutor(req.user.tutorId);
  }

  @Get(':id')
  buscarUm(@Req() req: RequisicaoAutenticada, @Param('id') id: string) {
    return this.assinaturaService.buscarUm(req.user.tutorId, id);
  }

  @Patch(':id')
  atualizar(
    @Req() req: RequisicaoAutenticada,
    @Param('id') id: string,
    @Body() dto: UpdateAssinaturaDto,
  ) {
    return this.assinaturaService.atualizar(req.user.tutorId, id, dto);
  }

  @Delete(':id')
  cancelar(@Req() req: RequisicaoAutenticada, @Param('id') id: string) {
    return this.assinaturaService.cancelar(req.user.tutorId, id);
  }
}