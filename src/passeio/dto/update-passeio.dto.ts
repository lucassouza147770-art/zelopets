import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePasseioDto } from './create-passeio.dto';

export class UpdatePasseioDto extends PartialType(
  OmitType(CreatePasseioDto, ['petId'] as const),
) {}