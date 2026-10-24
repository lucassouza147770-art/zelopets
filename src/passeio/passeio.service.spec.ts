import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePasseioDto } from './dto/create-passeio.dto';
import { PasseioService } from './passeio.service';
import { UpdatePasseioDto } from './dto/update-passeio.dto';

describe('PasseioService', () => {
  let service: PasseioService;
  const prisma = {
    pet: { findFirst: jest.fn() },
    passeio: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasseioService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(PasseioService);
  });

  it.each([
    [30, 25],
    [45, 35],
    [60, 45],
  ] as const)('calcula o preço para passeio de %i minutos', async (duration, price) => {
    prisma.pet.findFirst.mockResolvedValue({ id: 'pet-1', tutorId: 'tutor-1' });
    prisma.passeio.create.mockResolvedValue({});

    await service.criar('tutor-1', {
      petId: 'pet-1',
      dataHora: '2030-01-01T10:00:00.000Z',
      duracaoMinutos: duration,
    });

    expect(prisma.passeio.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ duracaoMinutos: duration, valor: price }),
    });
  });

  it('recalcula o preço na alteração de duração e não permite trocar o pet', async () => {
    prisma.passeio.findFirst.mockResolvedValue({ id: 'walk-1', tutorId: 'tutor-1' });
    prisma.passeio.update.mockResolvedValue({});
    const dto = Object.assign(new UpdatePasseioDto(), {
      duracaoMinutos: 60,
      petId: 'pet-de-outro-tutor',
    });

    await service.atualizar('tutor-1', 'walk-1', dto);

    expect(prisma.passeio.update).toHaveBeenCalledWith({
      where: { id: 'walk-1' },
      data: { duracaoMinutos: 60, valor: 45 },
    });
  });

  it('valida durações e remove petId e valor enviados no corpo', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const metadata = {
      type: 'body' as const,
      metatype: CreatePasseioDto,
      data: '',
    };
    const dto = await pipe.transform(
      {
        petId: 'pet-1',
        dataHora: '2030-01-01T10:00:00.000Z',
        duracaoMinutos: 45,
        valor: 0.01,
      },
      metadata,
    );

    expect(dto).toEqual({
      petId: 'pet-1',
      dataHora: '2030-01-01T10:00:00.000Z',
      duracaoMinutos: 45,
    });
    await expect(
      pipe.transform(
        {
          petId: 'pet-1',
          dataHora: '2030-01-01T10:00:00.000Z',
          duracaoMinutos: 15,
        },
        metadata,
      ),
    ).rejects.toThrow();

    const updateDto = await pipe.transform(
      { petId: 'pet-de-outro-tutor', status: 'CONFIRMADO' },
      { ...metadata, metatype: UpdatePasseioDto },
    );
    expect(updateDto).not.toHaveProperty('petId');
    expect(updateDto).toHaveProperty('status', 'CONFIRMADO');
  });
});
