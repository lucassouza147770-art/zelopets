import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class MensagemZelinhoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  texto: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pet_id?: string;

  @IsOptional()
  @IsString()
  intencao_forcada?: string;

  @IsOptional()
  @IsIn(['sim', 'nao'])
  resposta_confirmacao?: 'sim' | 'nao';

  @IsOptional()
  @IsString()
  intencao_confirmada?: string;
}
