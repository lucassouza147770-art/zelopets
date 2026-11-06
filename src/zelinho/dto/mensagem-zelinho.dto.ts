import { IsString, MaxLength, MinLength } from 'class-validator';

export class MensagemZelinhoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  texto: string;
}
