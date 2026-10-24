import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { StatusAssinatura } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateAssinaturaDto } from './create-assinatura.dto';

export class UpdateAssinaturaDto extends PartialType(
  OmitType(CreateAssinaturaDto, ['petId'] as const),
) {
  @ApiPropertyOptional({ enum: StatusAssinatura })
  @IsOptional()
  @IsEnum(StatusAssinatura)
  status?: StatusAssinatura;
}