import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

  @ApiPropertyOptional({ enum: [30, 45, 60], default: 30, example: 45 })
  @IsOptional()
  @IsIn([30, 45, 60])
  duracaoMinutos?: 30 | 45 | 60;
}