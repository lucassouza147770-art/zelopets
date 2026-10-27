import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { RecomendacaoService } from './recomendacao.service';

describe('RecomendacaoService', () => {
  let service: RecomendacaoService;
  let tokenAnterior: string | undefined;
  const prisma = {
    pet: { findFirst: jest.fn() },
    prestador: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    tokenAnterior = process.env.ML_INTERNAL_TOKEN;
    process.env.ML_INTERNAL_TOKEN = 'test-only-token';
    process.env.ML_SERVICE_URL = 'http://ml-test.local:8000';
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecomendacaoService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(RecomendacaoService);
  });

  afterEach(() => {
    if (tokenAnterior === undefined) {
      delete process.env.ML_INTERNAL_TOKEN;
    } else {
      process.env.ML_INTERNAL_TOKEN = tokenAnterior;
    }
    delete process.env.ML_SERVICE_URL;
    jest.restoreAllMocks();
  });

  it('valida o pet, envia o token interno e preserva a ordem dos IDs', async () => {
    prisma.pet.findFirst.mockResolvedValue({ id: 'pet-1' });
    prisma.prestador.findMany.mockResolvedValue([
      {
        id: 'prestador-2',
        nome: 'Passeador dois',
        tipo: 'PASSEADOR',
        avaliacaoMedia: 4.9,
        experienciaAnos: 5,
        portesAtendidos: [],
        niveisEnergiaAtendidos: ['ALTO'],
      },
      {
        id: 'prestador-1',
        nome: 'Passeador um',
        tipo: 'PASSEADOR',
        avaliacaoMedia: 4.5,
        experienciaAnos: 3,
        portesAtendidos: ['MEDIO'],
        niveisEnergiaAtendidos: [],
      },
    ]);
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          cluster: 2,
          perfilDoCluster: {
            porte: 'MEDIO',
            nivel_energia: 'ALTO',
            raca: 'Labrador',
          },
          prestadoresRecomendadosIds: ['prestador-1', 'prestador-2'],
        }),
        { status: 200 },
      ),
    );

    const resposta = await service.obter('tutor-1', 'pet-1');
    const [url, options] = fetchMock.mock.calls[0];

    expect(prisma.pet.findFirst).toHaveBeenCalledWith({
      where: { id: 'pet-1', tutorId: 'tutor-1' },
      select: { id: true },
    });
    if (!(url instanceof URL)) {
      throw new Error('O endpoint de recomendação precisa ser uma URL válida');
    }
    expect(url.searchParams.get('pet_id')).toBe('pet-1');
    expect(new Headers(options?.headers).get('X-Internal-Token')).toBe('test-only-token');
    expect(resposta.prestadores.map((prestador) => prestador.id)).toEqual([
      'prestador-1',
      'prestador-2',
    ]);
    expect(resposta.prestadores[0].motivo).toBe('Atende cães de porte médio');
    expect(resposta.prestadores[1].motivo).toBe('Atende cães de energia alta');
  });

  it('retorna 404 sem chamar o ML quando o pet não pertence ao tutor', async () => {
    prisma.pet.findFirst.mockResolvedValue(null);
    const fetchMock = jest.spyOn(globalThis, 'fetch');

    await expect(service.obter('tutor-1', 'pet-alheio')).rejects.toThrow(
      NotFoundException,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('converte indisponibilidade do ML em 503 com mensagem clara', async () => {
    prisma.pet.findFirst.mockResolvedValue({ id: 'pet-1' });
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('network down'));

    await expect(service.obter('tutor-1', 'pet-1')).rejects.toThrow(
      new ServiceUnavailableException(
        'Recomendações indisponíveis no momento',
      ),
    );
  });
});
