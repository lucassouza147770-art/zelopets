import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PetsModule } from './pets/pets.module';
import { PrestadorModule } from './prestador/prestador.module';

@Module({
  imports: [PrismaModule, AuthModule, PetsModule, PrestadorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
