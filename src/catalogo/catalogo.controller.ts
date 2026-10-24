import { Controller, Get } from '@nestjs/common';
import { CatalogoService } from './catalogo.service';

@Controller()
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get('pacotes-hospedagem')
  listarPacotesHospedagem() {
    return this.catalogoService.listarPacotesHospedagem();
  }

  @Get('planos-nutricionais')
  listarPlanosNutricionais() {
    return this.catalogoService.listarPlanosNutricionais();
  }
}