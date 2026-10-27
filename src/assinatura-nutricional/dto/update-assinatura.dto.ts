import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAssinaturaDto } from './create-assinatura.dto';

export class UpdateAssinaturaDto extends PartialType(
  OmitType(CreateAssinaturaDto, ['petId'] as const),
) {}