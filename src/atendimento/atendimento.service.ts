import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AtendimentoService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.atendimentoHumano.findMany({
      include: { tutor: { select: { id: true, nome: true, email: true } } },
      orderBy: [{ prioridade: 'desc' }, { abertoEm: 'asc' }],
    });
  }

  async atualizar(id: string, dados: { status?: 'ABERTO' | 'EM_ATENDIMENTO' | 'RESOLVIDO'; respostaEquipe?: string }) {
    const atual = await this.prisma.atendimentoHumano.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Atendimento não encontrado');
    return this.prisma.atendimentoHumano.update({
      where: { id },
      data: {
        status: dados.status,
        respostaEquipe: dados.respostaEquipe,
        resolvidoEm: dados.status === 'RESOLVIDO' ? new Date() : undefined,
      },
    });
  }
}
