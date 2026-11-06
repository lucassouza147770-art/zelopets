import { IsIn, IsString } from 'class-validator';

export class SimularPagamentoDto {
  @IsIn(['PASSEIO', 'HOSPEDAGEM', 'ASSINATURA'])
  tipo: 'PASSEIO' | 'HOSPEDAGEM' | 'ASSINATURA';

  @IsString()
  id: string;

  @IsIn(['PIX', 'CARTAO'])
  metodo: 'PIX' | 'CARTAO';

  @IsIn(['APROVADO', 'RECUSADO'])
  resultado: 'APROVADO' | 'RECUSADO';
}
