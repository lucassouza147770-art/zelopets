import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PasseioController } from './passeio.controller';
import { PasseioService } from './passeio.service';

@Module({
  imports: [AuthModule],
  controllers: [PasseioController],
  providers: [PasseioService],
})
export class PasseioModule {}