import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MensagemZelinhoDto } from './dto/mensagem-zelinho.dto';
import { ZelinhoService } from './zelinho.service';

@Controller('zelinho')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ZelinhoController {
  constructor(private readonly zelinhoService: ZelinhoService) {}

  @Get('inicio')
  inicio(@Req() req: { user: { tutorId: string } }) {
    return this.zelinhoService.inicio(req.user.tutorId);
  }

  @Post('mensagens')
  responder(
    @Req() req: { user: { tutorId: string } },
    @Body() dto: MensagemZelinhoDto,
  ) {
    return this.zelinhoService.responder(req.user.tutorId, dto);
  }

  @Get('atendimento/atual')
  atendimentoAtual(@Req() req: { user: { tutorId: string } }) {
    return this.zelinhoService.obterAtendimentoAtual(req.user.tutorId);
  }
}
