import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { StatusAgendamento } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreatePasseioDto } from './create-passeio.dto';

export class UpdatePasseioDto extends PartialType(
  OmitType(CreatePasseioDto, ['petId'] as const),
) {
  @ApiPropertyOptional({ enum: StatusAgendamento })
  @IsOptional()
  @IsEnum(StatusAgendamento)
  status?: StatusAgendamento;
}