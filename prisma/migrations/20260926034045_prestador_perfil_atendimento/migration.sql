-- AlterTable
ALTER TABLE "Prestador" ADD COLUMN     "niveisEnergiaAtendidos" "NivelEnergia"[] DEFAULT ARRAY[]::"NivelEnergia"[],
ADD COLUMN     "portesAtendidos" "Porte"[] DEFAULT ARRAY[]::"Porte"[];
