import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type NivelEnergia, type Porte, type TipoPrestador } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const DEMO_DOMAIN = '@demo.zelopets.local';
const DATA_REFERENCE_DATE = new Date('2026-10-23T12:00:00.000Z');
const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? '',
  }),
});

function uuidDeterministico(chave: string) {
  const digitos = createHash('sha1')
    .update(`zelopets-ml-demo:${chave}`)
    .digest('hex')
    .slice(0, 32)
    .split('');
  digitos[12] = '5';
  digitos[16] = ((Number.parseInt(digitos[16], 16) & 0x3) | 0x8).toString(16);
  const hex = digitos.join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function criarGerador(seed: number) {
  let estado = seed >>> 0;
  return () => {
    let valor = (estado += 0x6d2b79f5);
    valor = Math.imul(valor ^ (valor >>> 15), valor | 1);
    valor ^= valor + Math.imul(valor ^ (valor >>> 7), valor | 61);
    return ((valor ^ (valor >>> 14)) >>> 0) / 4294967296;
  };
}

function inteiroEntre(aleatorio: () => number, minimo: number, maximo: number) {
  return minimo + Math.floor(aleatorio() * (maximo - minimo + 1));
}

function escolha<T>(aleatorio: () => number, valores: readonly T[]) {
  return valores[Math.floor(aleatorio() * valores.length)];
}

function dataNascimento(idade: number, aleatorio: () => number) {
  const ano = DATA_REFERENCE_DATE.getUTCFullYear() - idade;
  const mes = inteiroEntre(aleatorio, 0, 11);
  const dia = inteiroEntre(aleatorio, 1, 28);
  return new Date(Date.UTC(ano, mes, dia));
}

function gerarPets(tutorIds: string[]) {
  const aleatorio = criarGerador(42);
  const grupos = [
    {
      nome: 'Pequeno Calmo',
      porte: 'PEQUENO' as const,
      nivelEnergia: 'BAIXO' as const,
      peso: [3.5, 8.5] as const,
      idade: [7, 11] as const,
      racas: ['Shih Tzu', 'Poodle'],
      restricoes: [] as string[],
      comportamento: ['medroso', 'ansioso'],
    },
    {
      nome: 'Medio Sociavel',
      porte: 'MEDIO' as const,
      nivelEnergia: 'MEDIO' as const,
      peso: [11, 19] as const,
      idade: [3, 6] as const,
      racas: ['Vira-lata', 'Bulldog'],
      restricoes: [] as string[],
      comportamento: ['sociavel'],
    },
    {
      nome: 'Grande Energico',
      porte: 'GRANDE' as const,
      nivelEnergia: 'ALTO' as const,
      peso: [26, 39] as const,
      idade: [2, 4] as const,
      racas: ['Labrador', 'Golden Retriever'],
      restricoes: [] as string[],
      comportamento: ['brincalhao', 'sociavel'],
    },
    {
      nome: 'Medio Alergico Tranquilo',
      porte: 'MEDIO' as const,
      nivelEnergia: 'BAIXO' as const,
      peso: [11, 19] as const,
      idade: [3, 9] as const,
      racas: ['Vira-lata', 'Bulldog'],
      restricoes: ['alergia a frango', 'sem gluten'],
      comportamento: ['calmo'],
    },
  ];

  return grupos.flatMap((grupo, indiceGrupo) =>
    Array.from({ length: 12 }, (_, indicePet) => {
      const indice = indiceGrupo * 12 + indicePet + 1;
      const idade = inteiroEntre(aleatorio, grupo.idade[0], grupo.idade[1]);
      const peso = grupo.peso[0] + aleatorio() * (grupo.peso[1] - grupo.peso[0]);
      return {
        id: uuidDeterministico(`pet-${indice}`),
        tutorId: tutorIds[indicePet % tutorIds.length],
        nome: `Demo ${grupo.nome} ${String(indice).padStart(2, '0')}`,
        especie: 'CACHORRO' as const,
        porte: grupo.porte,
        nivelEnergia: grupo.nivelEnergia,
        raca: escolha(aleatorio, grupo.racas),
        pesoKg: Math.round(peso * 10) / 10,
        dataNascimento: dataNascimento(idade, aleatorio),
        restricoesAlimentares:
          grupo.restricoes.length > 0 ? [escolha(aleatorio, grupo.restricoes)] : [],
        comportamento: grupo.comportamento,
      };
    }),
  );
}

type PrestadorDemo = {
  chave: string;
  nome: string;
  tipo: TipoPrestador;
  experienciaAnos: number;
  avaliacaoMedia: number;
  portesAtendidos: Porte[];
  niveisEnergiaAtendidos: NivelEnergia[];
};

const prestadoresDemo: PrestadorDemo[] = [
  {
    chave: 'passeador-01',
    nome: 'Demo Passeador Porte Pequeno',
    tipo: 'PASSEADOR' as const,
    experienciaAnos: 4,
    avaliacaoMedia: 4.7,
    portesAtendidos: ['PEQUENO'],
    niveisEnergiaAtendidos: ['BAIXO', 'MEDIO'],
  },
  {
    chave: 'passeador-02',
    nome: 'Demo Passeador Porte Medio',
    tipo: 'PASSEADOR' as const,
    experienciaAnos: 6,
    avaliacaoMedia: 4.9,
    portesAtendidos: ['MEDIO'],
    niveisEnergiaAtendidos: ['MEDIO', 'ALTO'],
  },
  {
    chave: 'passeador-03',
    nome: 'Demo Passeador Porte Grande',
    tipo: 'PASSEADOR' as const,
    experienciaAnos: 3,
    avaliacaoMedia: 4.4,
    portesAtendidos: ['GRANDE'],
    niveisEnergiaAtendidos: ['ALTO'],
  },
  {
    chave: 'passeador-04',
    nome: 'Demo Passeador Todos os Portes',
    tipo: 'PASSEADOR' as const,
    experienciaAnos: 8,
    avaliacaoMedia: 4.8,
    portesAtendidos: ['PEQUENO', 'MEDIO', 'GRANDE'],
    niveisEnergiaAtendidos: ['BAIXO', 'MEDIO', 'ALTO'],
  },
  {
    chave: 'hotel-01',
    nome: 'Demo Hotel Acolhedor',
    tipo: 'HOTEL' as const,
    experienciaAnos: 5,
    avaliacaoMedia: 4.6,
    portesAtendidos: ['PEQUENO', 'MEDIO'],
    niveisEnergiaAtendidos: ['BAIXO', 'MEDIO'],
  },
  {
    chave: 'hotel-02',
    nome: 'Demo Hotel Todos os Portes',
    tipo: 'HOTEL' as const,
    experienciaAnos: 9,
    avaliacaoMedia: 4.9,
    portesAtendidos: ['PEQUENO', 'MEDIO', 'GRANDE'],
    niveisEnergiaAtendidos: ['BAIXO', 'MEDIO', 'ALTO'],
  },
] as const;

async function limparDadosDemo() {
  await prisma.pet.deleteMany({
    where: { tutor: { email: { endsWith: DEMO_DOMAIN } } },
  });
  await prisma.tutor.deleteMany({
    where: { email: { endsWith: DEMO_DOMAIN } },
  });
  console.log('Tutores de demonstração e pets associados removidos.');
}

async function semearDadosDemo() {
  const senhaHash = await bcrypt.hash('demo1234', 10);
  const tutores = await Promise.all(
    Array.from({ length: 8 }, (_, indice) => {
      const numero = String(indice + 1).padStart(2, '0');
      const email = `demo${numero}${DEMO_DOMAIN}`;
      return prisma.tutor.upsert({
        where: { email },
        update: {
          nome: `Tutor ML Demo ${numero}`,
          senhaHash,
          zeloCoins: 0,
        },
        create: {
          id: uuidDeterministico(`tutor-${indice + 1}`),
          nome: `Tutor ML Demo ${numero}`,
          email,
          senhaHash,
          zeloCoins: 0,
        },
      });
    }),
  );

  const pets = gerarPets(tutores.map((tutor) => tutor.id));
  for (const pet of pets) {
    const { id, ...dados } = pet;
    await prisma.pet.upsert({
      where: { id },
      update: dados,
      create: pet,
    });
  }

  for (const prestador of prestadoresDemo) {
    const { chave, ...dados } = prestador;
    await prisma.prestador.upsert({
      where: { id: uuidDeterministico(chave) },
      update: dados,
      create: { id: uuidDeterministico(chave), ...dados },
    });
  }

  console.log(`Dados de demonstração idempotentes: ${tutores.length} tutores, ${pets.length} cães, ${prestadoresDemo.length} prestadores.`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurado; seed de demonstração não executada.');
  }
  if (process.argv.includes('--limpar')) {
    await limparDadosDemo();
    return;
  }
  await semearDadosDemo();
}

main()
  .catch(() => {
    console.error('Seed de demonstração falhou; confira DATABASE_URL e a conectividade sem exibir credenciais.');
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
