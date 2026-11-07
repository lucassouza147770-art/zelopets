import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ZelinhoController } from './zelinho.controller';
import { ZelinhoService } from './zelinho.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ZelinhoController],
  providers: [ZelinhoService],
})
export class ZelinhoModule {}
