import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrestadorController } from './prestador.controller';
import { PrestadorService } from './prestador.service';

@Module({
  imports: [AuthModule],
  controllers: [PrestadorController],
  providers: [PrestadorService],
})
export class PrestadorModule {}