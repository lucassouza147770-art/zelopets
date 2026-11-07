CREATE TYPE "PapelTutor" AS ENUM ('TUTOR', 'ADMIN');
CREATE TYPE "PrioridadeAtendimento" AS ENUM ('NORMAL', 'ALTA');
CREATE TYPE "StatusAtendimento" AS ENUM ('ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO');

ALTER TABLE "Tutor" ADD COLUMN "papel" "PapelTutor" NOT NULL DEFAULT 'TUTOR';

CREATE TABLE "AtendimentoHumano" (
    "id" TEXT NOT NULL,
    "protocolo" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "prioridade" "PrioridadeAtendimento" NOT NULL DEFAULT 'NORMAL',
    "resumo" TEXT NOT NULL,
    "status" "StatusAtendimento" NOT NULL DEFAULT 'ABERTO',
    "respostaEquipe" TEXT,
    "abertoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "resolvidoEm" TIMESTAMP(3),

    CONSTRAINT "AtendimentoHumano_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AtendimentoHumano_protocolo_key" ON "AtendimentoHumano"("protocolo");
CREATE INDEX "AtendimentoHumano_tutorId_status_idx" ON "AtendimentoHumano"("tutorId", "status");
CREATE INDEX "AtendimentoHumano_status_prioridade_idx" ON "AtendimentoHumano"("status", "prioridade");
ALTER TABLE "AtendimentoHumano" ADD CONSTRAINT "AtendimentoHumano_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "Tutor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
