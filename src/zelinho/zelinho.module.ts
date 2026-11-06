import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ZelinhoController } from './zelinho.controller';
import { ZelinhoService } from './zelinho.service';

@Module({
  imports: [AuthModule],
  controllers: [ZelinhoController],
  providers: [ZelinhoService],
})
export class ZelinhoModule {}
