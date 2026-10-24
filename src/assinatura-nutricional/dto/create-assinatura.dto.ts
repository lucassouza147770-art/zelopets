import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateAssinaturaDto {
  @ApiProperty({ description: 'ID de um pet retornado por GET /pets', example: 'id-do-pet' })
  @IsString()
  @IsNotEmpty()
  petId: string;

  @ApiProperty({ description: 'ID de um plano retornado por GET /planos-nutricionais', example: 'id-do-plano' })
  @IsString()
  @IsNotEmpty()
  planoId: string;

  @ApiProperty({ minimum: 0.1, example: 5 })
  @IsNumber()
  @Min(0.1)
  quantidadeRacaoKg: number;

  @ApiProperty({ minimum: 1, example: 300 })
  @IsNumber()
  @Min(1)
  consumoDiarioEstimadoG: number;
}