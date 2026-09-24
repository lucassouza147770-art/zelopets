import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { NivelEnergia, Porte } from '@prisma/client';

export class CreatePetDto {
  @IsString()
  nome: string;

  @IsEnum(Porte)
  porte: Porte;

  @IsEnum(NivelEnergia)
  nivelEnergia: NivelEnergia;

  @IsOptional()
  @IsString()
  raca?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  pesoKg?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restricoesAlimentares?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  comportamento?: string[];

  @IsOptional()
  @IsString()
  fotoUrl?: string;
}
