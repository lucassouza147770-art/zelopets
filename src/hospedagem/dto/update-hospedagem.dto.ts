import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { StatusAgendamento } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateHospedagemDto } from './create-hospedagem.dto';

export class UpdateHospedagemDto extends PartialType(CreateHospedagemDto) {
  @ApiPropertyOptional({ enum: StatusAgendamento })
  @IsOptional()
  @IsEnum(StatusAgendamento)
  status?: StatusAgendamento;
}