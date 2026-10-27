import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ML_SERVICE_URL_PADRAO = 'http://127.0.0.1:8000';
const TIMEOUT_ML_MS = 3000;

type PerfilDoCluster = {
  porte: string;
  nivel_energia: string;
  raca: string;
};

type RespostaMl = {
  cluster: number;
  perfilDoCluster: PerfilDoCluster;
  prestadoresRecomendadosIds: string[];
};

function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null;
}

function ehRespostaMl(valor: unknown): valor is RespostaMl {
  if (!ehRegistro(valor) || !ehRegistro(valor.perfilDoCluster)) {
    return false;
  }

  const perfil = valor.perfilDoCluster;
  return (
    typeof valor.cluster === 'number' &&
    typeof perfil.porte === 'string' &&
    typeof perfil.nivel_energia === 'string' &&
    typeof perfil.raca === 'string' &&
    Array.isArray(valor.prestadoresRecomendadosIds) &&
    valor.prestadoresRecomendadosIds.every((id) => typeof id === 'string')
  );
}

function criarMotivo(
  porte: string,
  nivelEnergia: string,
  prestador: {
    portesAtendidos: string[];
    niveisEnergiaAtendidos: string[];
  },
) {
  const atendePorte = prestador.portesAtendidos.includes(porte);
  const atendeEnergia = prestador.niveisEnergiaAtendidos.includes(nivelEnergia);
  const partes = [];

  if (atendePorte) {
    const nomePorte =
      { PEQUENO: 'pequeno', MEDIO: 'médio', GRANDE: 'grande' }[porte] ??
      porte.toLowerCase();
    partes.push(`porte ${nomePorte}`);
  }
  if (atendeEnergia) {
    const nomeEnergia =
      { BAIXO: 'baixa', MEDIO: 'média', ALTO: 'alta' }[nivelEnergia] ??
      nivelEnergia.toLowerCase();
    partes.push(`energia ${nomeEnergia}`);
  }

  if (partes.length === 0) {
    return undefined;
  }
  return `Atende cães de ${partes.join(' e de ')}`;
}

@Injectable()
export class RecomendacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async obter(tutorId: string, petId?: string) {
    const pet = petId
      ? await this.prisma.pet.findFirst({
          where: { id: petId, tutorId },
          select: { id: true },
        })
      : await this.prisma.pet.findFirst({
          where: { tutorId },
          orderBy: { criadoEm: 'asc' },
          select: { id: true },
        });

    if (!pet) {
      throw new NotFoundException('Pet não encontrado para este tutor');
    }

    const tokenInterno = process.env.ML_INTERNAL_TOKEN;
    if (!tokenInterno) {
      throw new ServiceUnavailableException(
        'Recomendações indisponíveis no momento',
      );
    }

    const baseUrl = process.env.ML_SERVICE_URL ?? ML_SERVICE_URL_PADRAO;
    let url: URL;
    try {
      url = new URL(`/recommend/${encodeURIComponent(tutorId)}`, baseUrl);
    } catch {
      throw new ServiceUnavailableException(
        'Recomendações indisponíveis no momento',
      );
    }
    url.searchParams.set('pet_id', pet.id);

    let respostaHttp: Response;
    try {
      respostaHttp = await fetch(url, {
        headers: { 'X-Internal-Token': tokenInterno },
        signal: AbortSignal.timeout(TIMEOUT_ML_MS),
      });
    } catch (erro: unknown) {
      if (
        erro instanceof TypeError ||
        (erro instanceof Error &&
          (erro.name === 'TimeoutError' || erro.name === 'AbortError'))
      ) {
        throw new ServiceUnavailableException(
          'Recomendações indisponíveis no momento',
        );
      }
      throw erro;
    }

    if (respostaHttp.status === 404) {
      throw new NotFoundException('Pet não encontrado para este tutor');
    }
    if (!respostaHttp.ok) {
      throw new ServiceUnavailableException(
        'Recomendações indisponíveis no momento',
      );
    }

    let payload: unknown;
    try {
      payload = await respostaHttp.json();
    } catch {
      throw new ServiceUnavailableException(
        'Recomendações indisponíveis no momento',
      );
    }
    if (!ehRespostaMl(payload)) {
      throw new ServiceUnavailableException(
        'Recomendações indisponíveis no momento',
      );
    }

    const ids = [...new Set(payload.prestadoresRecomendadosIds)];
    const prestadores = await this.prisma.prestador.findMany({
      where: { id: { in: ids }, ativo: true },
      select: {
        id: true,
        nome: true,
        tipo: true,
        avaliacaoMedia: true,
        experienciaAnos: true,
        portesAtendidos: true,
        niveisEnergiaAtendidos: true,
      },
    });
    const prestadoresPorId = new Map(prestadores.map((item) => [item.id, item]));

    return {
      cluster: payload.cluster,
      perfilDoCluster: payload.perfilDoCluster,
      prestadores: ids.flatMap((id) => {
        const prestador = prestadoresPorId.get(id);
        if (!prestador) {
          return [];
        }
        const motivo = criarMotivo(
          payload.perfilDoCluster.porte,
          payload.perfilDoCluster.nivel_energia,
          prestador,
        );
        if (!motivo) {
          return [];
        }
        return [{
          id: prestador.id,
          nome: prestador.nome,
          tipo: prestador.tipo,
          avaliacaoMedia: prestador.avaliacaoMedia,
          experienciaAnos: prestador.experienciaAnos,
          motivo,
        }];
      }),
    };
  }
}
