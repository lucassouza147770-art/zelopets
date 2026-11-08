import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, Validate } from 'class-validator';
import { NivelEnergia, Porte } from '@prisma/client';

class DataNaoFutura {
  validate(valor: string) {
    const partes = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!partes) return false;
    const data = new Date(Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])));
    const dataValida =
      data.getUTCFullYear() === Number(partes[1]) &&
      data.getUTCMonth() === Number(partes[2]) - 1 &&
      data.getUTCDate() === Number(partes[3]);
    return dataValida && data <= new Date();
  }

  defaultMessage() {
    return 'A data de nascimento não pode ser futura';
  }
}

export class CreatePetDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do pet é obrigatório' })
  nome: string;

  @IsEnum(Porte)
  porte: Porte;

  @IsEnum(NivelEnergia)
  nivelEnergia: NivelEnergia;

  @IsOptional()
  @IsString()
  raca?: string;

  @IsOptional()
  @IsDateString()
  @Validate(DataNaoFutura)
  dataNascimento?: string;

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
