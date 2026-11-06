import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SimularPagamentoDto } from './dto/simular-pagamento.dto';
import { PagamentoService } from './pagamento.service';

@Controller('pagamentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PagamentoController {
  constructor(private readonly pagamentoService: PagamentoService) {}

  @Post('simular')
  simular(@Req() req: { user: { tutorId: string } }, @Body() dto: SimularPagamentoDto) {
    return this.pagamentoService.simular(req.user.tutorId, dto);
  }
}
