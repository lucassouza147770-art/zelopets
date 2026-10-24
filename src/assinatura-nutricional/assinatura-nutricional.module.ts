import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssinaturaNutricionalController } from './assinatura-nutricional.controller';
import { AssinaturaNutricionalService } from './assinatura-nutricional.service';

@Module({
  imports: [AuthModule],
  controllers: [AssinaturaNutricionalController],
  providers: [AssinaturaNutricionalService],
})
export class AssinaturaNutricionalModule {}