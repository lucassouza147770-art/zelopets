import { api } from './client'

export type Tutor = {
  id: string
  nome: string
  email: string
  zeloCoins: number
}

export function obterTutor(token: string) {
  return api.get<Tutor>('/tutores/me', token)
}
