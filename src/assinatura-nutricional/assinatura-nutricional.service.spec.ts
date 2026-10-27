import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AssinaturaNutricionalService } from './assinatura-nutricional.service';
import { UpdateAssinaturaDto } from './dto/update-assinatura.dto';

describe('AssinaturaNutricionalService', () => {
  let service: AssinaturaNutricionalService;
  const prisma = {
    assinaturaNutricional: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    planoNutricional: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssinaturaNutricionalService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(AssinaturaNutricionalService);
  });

  it('atualiza apenas campos permitidos e impede trocar o pet', async () => {
    prisma.assinaturaNutricional.findFirst.mockResolvedValue({
      id: 'subscription-1',
      tutorId: 'tutor-1',
      petId: 'pet-1',
      planoId: 'plan-1',
      quantidadeRacaoKg: 5,
      consumoDiarioEstimadoG: 300,
    });
    prisma.assinaturaNutricional.update.mockResolvedValue({});
    const dto = Object.assign(new UpdateAssinaturaDto(), {
      petId: 'pet-de-outro-tutor',
    });

    await service.atualizar('tutor-1', 'subscription-1', dto);

    expect(prisma.assinaturaNutricional.update).toHaveBeenCalledWith({
      where: { id: 'subscription-1' },
      data: {},
    });
  });
});
