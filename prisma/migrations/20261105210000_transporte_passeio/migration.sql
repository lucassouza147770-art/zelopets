CREATE TYPE "TipoPasseio" AS ENUM ('PASSEIO', 'TRANSPORTE');
CREATE TYPE "FaixaDistancia" AS ENUM ('ATE_3KM', 'DE_3_A_8KM', 'DE_8_A_15KM');

ALTER TABLE "Passeio"
ADD COLUMN "tipo" "TipoPasseio" NOT NULL DEFAULT 'PASSEIO',
ADD COLUMN "origem" TEXT,
ADD COLUMN "destino" TEXT,
ADD COLUMN "faixaDistancia" "FaixaDistancia";
