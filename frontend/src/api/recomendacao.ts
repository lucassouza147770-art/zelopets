import { api } from './client'

export type PerfilDoCluster = {
  porte: string
  nivel_energia: string
  raca: string
}

export type PrestadorRecomendado = {
  id: string
  nome: string
  tipo: 'PASSEADOR' | 'HOTEL'
  avaliacaoMedia: number
  experienciaAnos: number
  motivo: string
}

export type RespostaRecomendacao = {
  cluster: number
  perfilDoCluster: PerfilDoCluster
  prestadores: PrestadorRecomendado[]
}

export function obterRecomendacoes(token: string, petId: string) {
  return api.get<RespostaRecomendacao>(
    `/recomendacoes?petId=${encodeURIComponent(petId)}`,
    token,
  )
}
