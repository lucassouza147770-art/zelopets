import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'demo@zelopets.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'demo1234' })
  @IsString()
  senha: string;
}
