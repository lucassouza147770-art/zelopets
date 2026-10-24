import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHospedagemDto {
  @ApiProperty({ description: 'ID de um pet retornado por GET /pets', example: 'id-do-pet' })
  @IsString()
  @IsNotEmpty()
  petId: string;

  @ApiProperty({ description: 'ID de um pacote retornado por GET /pacotes-hospedagem', example: 'id-do-pacote' })
  @IsString()
  @IsNotEmpty()
  pacoteId: string;

  @ApiPropertyOptional({ description: 'ID de um prestador retornado por GET /prestadores' })
  @IsOptional()
  @IsString()
  prestadorId?: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2030-01-01T12:00:00.000Z' })
  @IsDateString()
  dataCheckin: string;

  @ApiProperty({ type: String, format: 'date-time', example: '2030-01-03T12:00:00.000Z' })
  @IsDateString()
  dataCheckout: string;
}