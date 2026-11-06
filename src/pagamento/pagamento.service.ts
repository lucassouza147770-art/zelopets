import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SimularPagamentoDto } from './dto/simular-pagamento.dto';

@Injectable()
export class PagamentoService {
  constructor(private readonly prisma: PrismaService) {}

  async simular(tutorId: string, dto: SimularPagamentoDto) {
    const resultado = dto.resultado === 'APROVADO' ? 'APROVADO' : 'RECUSADO';
    if (dto.tipo === 'PASSEIO') {
      const registro = await this.prisma.passeio.findFirst({ where: { id: dto.id, tutorId } });
      if (!registro) throw new NotFoundException('Passeio não encontrado');
      if (registro.statusPagamento !== 'PENDENTE') throw new ConflictException('Pagamento já processado');
      return this.prisma.passeio.update({ where: { id: dto.id }, data: { statusPagamento: resultado } });
    }
    if (dto.tipo === 'HOSPEDAGEM') {
      const registro = await this.prisma.hospedagem.findFirst({ where: { id: dto.id, tutorId } });
      if (!registro) throw new NotFoundException('Hospedagem não encontrada');
      if (registro.statusPagamento !== 'PENDENTE') throw new ConflictException('Pagamento já processado');
      return this.prisma.hospedagem.update({ where: { id: dto.id }, data: { statusPagamento: resultado } });
    }
    const registro = await this.prisma.assinaturaNutricional.findFirst({ where: { id: dto.id, tutorId } });
    if (!registro) throw new NotFoundException('Assinatura não encontrada');
    if (registro.statusPagamento !== 'PENDENTE') throw new ConflictException('Pagamento já processado');
    return this.prisma.assinaturaNutricional.update({ where: { id: dto.id }, data: { statusPagamento: resultado } });
  }
}
