import { TipoPrestador } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';

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
}