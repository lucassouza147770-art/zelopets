import { PartialType } from '@nestjs/mapped-types';
import { StatusAgendamento } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreatePasseioDto } from './create-passeio.dto';

export class UpdatePasseioDto extends PartialType(CreatePasseioDto) {
  @IsOptional()
  @IsEnum(StatusAgendamento)
  status?: StatusAgendamento;
}