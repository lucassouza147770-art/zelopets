import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TutorService } from './tutor.service';

type RequisicaoAutenticada = { user: { tutorId: string } };

@Controller('tutores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TutorController {
  constructor(private readonly tutorService: TutorService) {}

  @Get('me')
  obterMeuPerfil(@Req() req: RequisicaoAutenticada) {
    return this.tutorService.obterPerfil(req.user.tutorId);
  }
}
