import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HospedagemController } from './hospedagem.controller';
import { HospedagemService } from './hospedagem.service';

@Module({
  imports: [AuthModule],
  controllers: [HospedagemController],
  providers: [HospedagemService],
})
export class HospedagemModule {}