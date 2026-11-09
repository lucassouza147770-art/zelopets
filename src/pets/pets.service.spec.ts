import { ConflictException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { PetsService } from './pets.service';

describe('PetsService', () => {
  let service: PetsService;
  const prisma = {
    pet: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    passeio: { count: jest.fn() },
    hospedagem: { count: jest.fn() },
    assinaturaNutricional: { count: jest.fn() },
    perfilPetCluster: { deleteMany: jest.fn() },
    $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) => callback(prisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [PetsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(PetsService);
  });

  it('persists and returns the optional pet profile fields', async () => {
    const nascimento = '2021-03-04';
    const restricoesAlimentares = ['alergia a frango'];
    const comportamento = ['sociável', 'ansioso'];
    prisma.pet.create.mockResolvedValue({
      id: 'pet-1',
      raca: 'Labrador',
      dataNascimento: new Date(`${nascimento}T00:00:00.000Z`),
      pesoKg: 24.5,
      restricoesAlimentares,
      comportamento,
    });

    const pet = await service.create('tutor-1', {
      nome: 'Luna',
      porte: 'MEDIO',
      nivelEnergia: 'ALTO',
      raca: 'Labrador',
      dataNascimento: nascimento,
      pesoKg: 24.5,
      restricoesAlimentares,
      comportamento,
    });

    expect(prisma.pet.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tutorId: 'tutor-1',
        raca: 'Labrador',
        dataNascimento: new Date(`${nascimento}T00:00:00.000Z`),
        pesoKg: 24.5,
        restricoesAlimentares,
        comportamento,
      }),
      select: expect.objectContaining({
        dataNascimento: true,
        pesoKg: true,
        restricoesAlimentares: true,
        comportamento: true,
      }),
    });
    expect(pet).toEqual(expect.objectContaining({
      dataNascimento: new Date(`${nascimento}T00:00:00.000Z`),
      pesoKg: 24.5,
      restricoesAlimentares,
      comportamento,
    }));
  });

  it('rejects a future date of birth', async () => {
    expect(() => service.create('tutor-1', {
      nome: 'Luna',
      porte: 'MEDIO',
      nivelEnergia: 'ALTO',
      dataNascimento: '2999-01-01',
    })).toThrow('A data de nascimento não pode ser futura.');

    expect(prisma.pet.create).not.toHaveBeenCalled();
  });

  it('rejects pet deletion while it has reservations', async () => {
    prisma.pet.findFirst.mockResolvedValue({ id: 'pet-1' });
    prisma.passeio.count.mockResolvedValue(1);
    prisma.hospedagem.count.mockResolvedValue(0);
    prisma.assinaturaNutricional.count.mockResolvedValue(0);

    await expect(service.remove('tutor-1', 'pet-1')).rejects.toThrow(
      new ConflictException('Este pet tem reservas; cancele antes'),
    );
    expect(prisma.pet.delete).not.toHaveBeenCalled();
  });

  it('deletes a pet without reservations and its cluster profile', async () => {
    prisma.pet.findFirst.mockResolvedValue({ id: 'pet-1' });
    prisma.passeio.count.mockResolvedValue(0);
    prisma.hospedagem.count.mockResolvedValue(0);
    prisma.assinaturaNutricional.count.mockResolvedValue(0);
    prisma.perfilPetCluster.deleteMany.mockResolvedValue({ count: 1 });
    prisma.pet.delete.mockResolvedValue({ id: 'pet-1' });

    await service.remove('tutor-1', 'pet-1');

    expect(prisma.perfilPetCluster.deleteMany).toHaveBeenCalledWith({ where: { petId: 'pet-1' } });
    expect(prisma.pet.delete).toHaveBeenCalled();
  });

  it('validates the profile data received by the API', async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const metadata = {
      type: 'body' as const,
      metatype: CreatePetDto,
      data: '',
    };
    const dto = await pipe.transform({
      nome: 'Luna',
      porte: 'MEDIO',
      nivelEnergia: 'ALTO',
      dataNascimento: '2021-03-04',
      pesoKg: 24.5,
      restricoesAlimentares: ['alergia a frango'],
      comportamento: ['sociável'],
    }, metadata);

    expect(dto).toEqual(expect.objectContaining({
      dataNascimento: '2021-03-04',
      pesoKg: 24.5,
      restricoesAlimentares: ['alergia a frango'],
      comportamento: ['sociável'],
    }));

    await expect(pipe.transform({
      nome: 'Luna',
      porte: 'MEDIO',
      nivelEnergia: 'ALTO',
      pesoKg: '24.5',
    }, metadata)).rejects.toThrow();
  });
});
