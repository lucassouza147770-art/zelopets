import { api } from './client'

export type TipoCuidado = 'PASSEIO' | 'HOSPEDAGEM' | 'NUTRICAO'

export type Cuidado = {
  tipo: TipoCuidado
  petNome: string
  dataHora: string
  status: string
}

export function obterProximoCuidado(token: string) {
  return api.get<{ proximo: Cuidado | null }>('/agenda/proximo', token)
}

export function obterAgenda(token: string) {
  return api.get<Cuidado[]>('/agenda', token)
}
