-- CreateEnum
CREATE TYPE "Especie" AS ENUM ('CACHORRO', 'GATO');

-- CreateEnum
CREATE TYPE "Porte" AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE');

-- CreateEnum
CREATE TYPE "NivelEnergia" AS ENUM ('BAIXO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "TipoPrestador" AS ENUM ('PASSEADOR', 'HOTEL');

-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('PENDENTE', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('ATIVA', 'PAUSADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'APROVADO', 'RECUSADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "NivelConvivencia" AS ENUM ('INDIVIDUAL', 'GRUPO_PEQUENO', 'GRUPO_GRANDE');

-- CreateEnum
CREATE TYPE "NivelContato" AS ENUM ('BAIXO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "TipoServicoAvaliado" AS ENUM ('PASSEIO', 'HOSPEDAGEM', 'NUTRICAO');

-- CreateTable
CREATE TABLE "Tutor" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "telefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tutor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especie" "Especie" NOT NULL,
    "raca" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "porte" "Porte" NOT NULL,
    "pesoKg" DOUBLE PRECISION,
    "nivelEnergia" "NivelEnergia" NOT NULL,
    "restricoesAlimentares" TEXT[],
    "comportamento" TEXT[],
    "fotoUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prestador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoPrestador" NOT NULL,
    "bio" TEXT,
    "experienciaAnos" INTEGER NOT NULL DEFAULT 0,
    "avaliacaoMedia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fotoUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prestador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passeio" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "prestadorId" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "duracaoMinutos" INTEGER NOT NULL DEFAULT 30,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'PENDENTE',
    "statusPagamento" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "valor" DECIMAL(10,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Passeio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PacoteHospedagem" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "precoDiaria" DECIMAL(10,2) NOT NULL,
    "nivelConvivencia" "NivelConvivencia" NOT NULL,
    "nivelContato" "NivelContato" NOT NULL,

    CONSTRAINT "PacoteHospedagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospedagem" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "prestadorId" TEXT,
    "pacoteId" TEXT NOT NULL,
    "dataCheckin" TIMESTAMP(3) NOT NULL,
    "dataCheckout" TIMESTAMP(3) NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'PENDENTE',
    "statusPagamento" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hospedagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanoNutricional" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "precoMensal" DECIMAL(10,2) NOT NULL,
    "tipoDieta" TEXT,

    CONSTRAINT "PlanoNutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssinaturaNutricional" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "planoId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "StatusAssinatura" NOT NULL DEFAULT 'ATIVA',
    "quantidadeRacaoKg" DOUBLE PRECISION NOT NULL,
    "consumoDiarioEstimadoG" DOUBLE PRECISION NOT NULL,
    "previsaoProximaEntrega" TIMESTAMP(3),
    "statusPagamento" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssinaturaNutricional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "prestadorId" TEXT NOT NULL,
    "tipoServico" "TipoServicoAvaliado" NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerfilPetCluster" (
    "id" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "clusterId" INTEGER NOT NULL,
    "featuresSnapshot" JSONB NOT NULL,
    "recomendacoes" JSONB NOT NULL,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerfilPetCluster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tutor_email_key" ON "Tutor"("email");

-- CreateIndex
CREATE INDEX "Pet_tutorId_idx" ON "Pet"("tutorId");

-- CreateIndex
CREATE INDEX "Prestador_tipo_idx" ON "Prestador"("tipo");

-- CreateIndex
CREATE INDEX "Passeio_petId_idx" ON "Passeio"("petId");

-- CreateIndex
CREATE INDEX "Passeio_tutorId_idx" ON "Passeio"("tutorId");

-- CreateIndex
CREATE INDEX "Passeio_status_idx" ON "Passeio"("status");

-- CreateIndex
CREATE INDEX "Hospedagem_petId_idx" ON "Hospedagem"("petId");

-- CreateIndex
CREATE INDEX "Hospedagem_tutorId_idx" ON "Hospedagem"("tutorId");

-- CreateIndex
CREATE INDEX "Hospedagem_status_idx" ON "Hospedagem"("status");

-- CreateIndex
CREATE INDEX "AssinaturaNutricional_petId_idx" ON "AssinaturaNutricional"("petId");

-- CreateIndex
CREATE INDEX "AssinaturaNutricional_tutorId_idx" ON "AssinaturaNutricional"("tutorId");

-- CreateIndex
CREATE INDEX "Avaliacao_prestadorId_idx" ON "Avaliacao"("prestadorId");

-- CreateIndex
CREATE UNIQUE INDEX "PerfilPetCluster_petId_key" ON "PerfilPetCluster"("petId");

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passeio" ADD CONSTRAINT "Passeio_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passeio" ADD CONSTRAINT "Passeio_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passeio" ADD CONSTRAINT "Passeio_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "Prestador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospedagem" ADD CONSTRAINT "Hospedagem_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospedagem" ADD CONSTRAINT "Hospedagem_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospedagem" ADD CONSTRAINT "Hospedagem_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "Prestador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hospedagem" ADD CONSTRAINT "Hospedagem_pacoteId_fkey" FOREIGN KEY ("pacoteId") REFERENCES "PacoteHospedagem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaNutricional" ADD CONSTRAINT "AssinaturaNutricional_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaNutricional" ADD CONSTRAINT "AssinaturaNutricional_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaNutricional" ADD CONSTRAINT "AssinaturaNutricional_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "PlanoNutricional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "Prestador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerfilPetCluster" ADD CONSTRAINT "PerfilPetCluster_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
