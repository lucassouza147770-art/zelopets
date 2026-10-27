import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RecomendacaoService } from './recomendacao.service';

type RequisicaoAutenticada = { user: { tutorId: string } };

@ApiTags('Recomendações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('recomendacoes')
export class RecomendacaoController {
  constructor(private readonly recomendacaoService: RecomendacaoService) {}

  @Get()
  @ApiOperation({
    summary: 'Recomenda prestadores compatíveis com um pet do tutor autenticado',
  })
  @ApiQuery({ name: 'petId', required: false, description: 'Pet do tutor; por padrão, usa o primeiro cadastrado.' })
  @ApiResponse({ status: 200, description: 'Perfil do cluster e prestadores recomendados.' })
  @ApiResponse({ status: 404, description: 'Pet não encontrado para este tutor.' })
  @ApiResponse({ status: 503, description: 'Recomendações indisponíveis no momento.' })
  obter(
    @Req() req: RequisicaoAutenticada,
    @Query('petId') petId?: string,
  ) {
    return this.recomendacaoService.obter(req.user.tutorId, petId);
  }
}
