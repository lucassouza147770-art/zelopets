import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PetsModule } from './pets/pets.module';
import { PrestadorModule } from './prestador/prestador.module';
import { PasseioModule } from './passeio/passeio.module';
import { HospedagemModule } from './hospedagem/hospedagem.module';
import { AssinaturaNutricionalModule } from './assinatura-nutricional/assinatura-nutricional.module';
import { CatalogoModule } from './catalogo/catalogo.module';
import { TutorModule } from './tutor/tutor.module';
import { AgendaModule } from './agenda/agenda.module';
import { RecomendacaoModule } from './recomendacao/recomendacao.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PetsModule,
    PrestadorModule,
    PasseioModule,
    HospedagemModule,
    AssinaturaNutricionalModule,
    CatalogoModule,
    TutorModule,
    AgendaModule,
    RecomendacaoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
