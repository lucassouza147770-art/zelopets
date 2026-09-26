import { NivelEnergia, Porte, TipoPrestador } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreatePrestadorDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEnum(TipoPrestador)
  tipo: TipoPrestador;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  experienciaAnos?: number;

  @IsOptional()
  @IsUrl()
  fotoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Porte, { each: true })
  portesAtendidos?: Porte[];

  @IsOptional()
  @IsArray()
  @IsEnum(NivelEnergia, { each: true })
  niveisEnergiaAtendidos?: NivelEnergia[];
}