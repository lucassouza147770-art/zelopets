import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgendaService } from './agenda.service';

type RequisicaoAutenticada = { user: { tutorId: string } };

@Controller('agenda')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get('proximo')
  obterProximo(@Req() req: RequisicaoAutenticada) {
    return this.agendaService.obterProximo(req.user.tutorId);
  }

  @Get()
  listar(@Req() req: RequisicaoAutenticada) {
    return this.agendaService.listar(req.user.tutorId);
  }
}
