import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePasseioDto {
  @ApiProperty({ description: 'ID de um pet retornado por GET /pets', example: 'id-do-pet' })
  @IsString()
  @IsNotEmpty()
  petId: string;

  @ApiPropertyOptional({ description: 'ID de um prestador retornado por GET /prestadores' })
  @IsOptional()
  @IsString()
  prestadorId?: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2030-01-01T10:00:00.000Z' })
  @IsDateString()
  dataHora: string;

  @ApiPropertyOptional({ minimum: 15, example: 30 })
  @IsOptional()
  @IsInt()
  @Min(15)
  duracaoMinutos?: number;

  // preço fixo/simulado por enquanto — cálculo dinâmico de preço fica
  // pra uma etapa futura, quando existir uma regra de precificação
  @ApiProperty({ minimum: 0, example: 45 })
  @IsNumber()
  @Min(0)
  valor: number;
}