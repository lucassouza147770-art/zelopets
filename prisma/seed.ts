import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL não configurado');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function seedCatalogo() {
  if ((await prisma.pacoteHospedagem.count()) === 0) {
    await prisma.pacoteHospedagem.createMany({
      data: [
        {
          nome: 'Essencial',
          descricao: 'Hospedagem básica, confortável e segura',
          precoDiaria: 60,
          nivelConvivencia: 'GRUPO_PEQUENO',
          nivelContato: 'MEDIO',
        },
        {
          nome: 'Conforto',
          descricao: 'Mais espaço e atenção individual',
          precoDiaria: 90,
          nivelConvivencia: 'INDIVIDUAL',
          nivelContato: 'ALTO',
        },
        {
          nome: 'Premium',
          descricao: 'Suíte individual com monitoramento 24h',
          precoDiaria: 140,
          nivelConvivencia: 'INDIVIDUAL',
          nivelContato: 'ALTO',
        },
      ],
    });
  }

  if ((await prisma.planoNutricional.count()) === 0) {
    await prisma.planoNutricional.createMany({
      data: [
        {
          nome: 'Natural Balanceado',
          descricao: 'Ração natural para o dia a dia',
          precoMensal: 120,
          tipoDieta: 'natural',
        },
        {
          nome: 'Premium Performance',
          descricao: 'Para pets de alta energia',
          precoMensal: 180,
          tipoDieta: 'premium',
        },
        {
          nome: 'Hipoalergênico',
          descricao: 'Para pets com restrições alimentares',
          precoMensal: 160,
          tipoDieta: 'hipoalergenica',
        },
      ],
    });
  }
}

async function seedDemo() {
  const emailDemo = 'demo@zelopets.com.br';
  const tutorExistente = await prisma.tutor.findUnique({ where: { email: emailDemo } });
  if (tutorExistente) {
    await prisma.tutor.update({
      where: { email: emailDemo },
      data: { zeloCoins: 1250 },
    });
    console.log('Demo já existia — saldo de demonstração atualizado.');
    return;
  }

  const senhaHash = await bcrypt.hash('demo1234', 10);
  const tutor = await prisma.tutor.create({
    data: { nome: 'Tutor Demo', email: emailDemo, senhaHash, zeloCoins: 1250 },
  });

  await prisma.pet.create({
    data: {
      tutorId: tutor.id,
      nome: 'Bento',
      especie: 'CACHORRO',
      porte: 'MEDIO',
      nivelEnergia: 'ALTO',
      raca: 'Labrador',
      pesoKg: 18,
      comportamento: ['sociavel', 'brincalhao'],
    },
  });

  await prisma.prestador.createMany({
    data: [
      {
        nome: 'Ana Passeadora',
        tipo: 'PASSEADOR',
        experienciaAnos: 3,
        avaliacaoMedia: 4.8,
        portesAtendidos: ['PEQUENO', 'MEDIO'],
        niveisEnergiaAtendidos: ['MEDIO', 'ALTO'],
      },
      {
        nome: 'Hotel Patinhas Felizes',
        tipo: 'HOTEL',
        experienciaAnos: 5,
        avaliacaoMedia: 4.6,
        portesAtendidos: ['PEQUENO', 'MEDIO', 'GRANDE'],
        niveisEnergiaAtendidos: ['BAIXO', 'MEDIO', 'ALTO'],
      },
    ],
  });

  console.log(`Demo criada — login no Swagger com ${emailDemo} / demo1234`);
}

async function main() {
  await seedCatalogo();
  await seedDemo();
  console.log('Seed concluído.');
}

main()
  .catch((erro: unknown) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());