import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecomendacaoController } from './recomendacao.controller';
import { RecomendacaoService } from './recomendacao.service';

@Module({
  imports: [AuthModule],
  controllers: [RecomendacaoController],
  providers: [RecomendacaoService],
})
export class RecomendacaoModule {}
