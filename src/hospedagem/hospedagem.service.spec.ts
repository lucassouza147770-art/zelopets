import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HospedagemService } from './hospedagem.service';
import { UpdateHospedagemDto } from './dto/update-hospedagem.dto';

describe('HospedagemService', () => {
  let service: HospedagemService;
  const prisma = {
    hospedagem: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    pacoteHospedagem: { findUnique: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HospedagemService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(HospedagemService);
  });

  it('revalida as datas e recalcula o total ao atualizar a hospedagem', async () => {
    prisma.hospedagem.findFirst.mockResolvedValue({
      id: 'stay-1',
      tutorId: 'tutor-1',
      petId: 'pet-1',
      pacoteId: 'package-1',
      dataCheckin: new Date('2030-01-01T12:00:00.000Z'),
      dataCheckout: new Date('2030-01-02T12:00:00.000Z'),
    });
    prisma.pacoteHospedagem.findUnique.mockResolvedValue({
      id: 'package-1',
      precoDiaria: 30,
    });
    prisma.hospedagem.update.mockResolvedValue({});

    await service.atualizar('tutor-1', 'stay-1', {
      dataCheckin: '2030-01-01T12:00:00.000Z',
      dataCheckout: '2030-01-04T12:00:00.000Z',
    });

    expect(prisma.hospedagem.update).toHaveBeenCalledWith({
      where: { id: 'stay-1' },
      data: {
        dataCheckin: new Date('2030-01-01T12:00:00.000Z'),
        dataCheckout: new Date('2030-01-04T12:00:00.000Z'),
        valorTotal: 90,
      },
    });
  });

  it('rejeita datas inválidas sem atualizar a reserva', async () => {
    prisma.hospedagem.findFirst.mockResolvedValue({
      id: 'stay-1',
      tutorId: 'tutor-1',
      petId: 'pet-1',
      pacoteId: 'package-1',
      dataCheckin: new Date('2030-01-02T12:00:00.000Z'),
      dataCheckout: new Date('2030-01-02T12:00:00.000Z'),
    });

    await expect(
      service.atualizar('tutor-1', 'stay-1', {
        dataCheckout: '2030-01-01T12:00:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.hospedagem.update).not.toHaveBeenCalled();
    expect(prisma.pacoteHospedagem.findUnique).not.toHaveBeenCalled();
  });

  it('não permite trocar o pet nem recalcula preço numa alteração de status', async () => {
    prisma.hospedagem.findFirst.mockResolvedValue({
      id: 'stay-1',
      tutorId: 'tutor-1',
      petId: 'pet-1',
      pacoteId: 'package-1',
      dataCheckin: new Date('2030-01-01T12:00:00.000Z'),
      dataCheckout: new Date('2030-01-02T12:00:00.000Z'),
    });
    prisma.hospedagem.update.mockResolvedValue({});
    const dto = Object.assign(new UpdateHospedagemDto(), {
      status: 'CONFIRMADO',
      petId: 'pet-de-outro-tutor',
    });

    await service.atualizar('tutor-1', 'stay-1', dto);

    expect(prisma.hospedagem.update).toHaveBeenCalledWith({
      where: { id: 'stay-1' },
      data: { status: 'CONFIRMADO' },
    });
    expect(prisma.pacoteHospedagem.findUnique).not.toHaveBeenCalled();
  });
});
