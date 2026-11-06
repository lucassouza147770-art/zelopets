import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MensagemZelinhoDto } from './dto/mensagem-zelinho.dto';
import { ZelinhoService } from './zelinho.service';

@Controller('zelinho')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ZelinhoController {
  constructor(private readonly zelinhoService: ZelinhoService) {}

  @Post('mensagens')
  responder(
    @Req() req: { user: { tutorId: string } },
    @Body() dto: MensagemZelinhoDto,
  ) {
    return this.zelinhoService.responder(req.user.tutorId, dto);
  }
}
