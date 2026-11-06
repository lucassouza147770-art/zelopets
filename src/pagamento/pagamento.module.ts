import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PagamentoController } from './pagamento.controller';
import { PagamentoService } from './pagamento.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [PagamentoController],
  providers: [PagamentoService],
})
export class PagamentoModule {}
