import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateHospedagemDto } from './create-hospedagem.dto';

export class UpdateHospedagemDto extends PartialType(
  OmitType(CreateHospedagemDto, ['petId'] as const),
) {}