import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AtendimentoService } from './atendimento.service';

type RequisicaoAdmin = { user: { papel: 'ADMIN' } };
type AtualizacaoAtendimento = {
  status?: 'ABERTO' | 'EM_ATENDIMENTO' | 'RESOLVIDO';
  respostaEquipe?: string;
};

@Controller('atendimentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
export class AtendimentoController {
  constructor(private readonly atendimentoService: AtendimentoService) {}

  @Get()
  listar(@Req() _req: RequisicaoAdmin) {
    return this.atendimentoService.listar();
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() body: AtualizacaoAtendimento, @Req() _req: RequisicaoAdmin) {
    return this.atendimentoService.atualizar(id, body);
  }
}
