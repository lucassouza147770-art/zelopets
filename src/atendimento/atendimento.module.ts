import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AtendimentoController } from './atendimento.controller';
import { AtendimentoService } from './atendimento.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AtendimentoController],
  providers: [AtendimentoService],
})
export class AtendimentoModule {}
