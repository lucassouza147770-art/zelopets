import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TutorService {
  constructor(private readonly prisma: PrismaService) {}

  async obterPerfil(tutorId: string) {
    const tutor = await this.prisma.tutor.findUnique({
      where: { id: tutorId },
      select: { id: true, nome: true, email: true, zeloCoins: true },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor não encontrado');
    }

    return tutor;
  }
}
