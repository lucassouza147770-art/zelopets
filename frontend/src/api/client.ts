const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...opcoes.headers,
    },
  })

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    const mensagem = Array.isArray(corpo?.message) ? corpo.message.join(', ') : corpo?.message
    throw new ApiError(resposta.status, mensagem ?? 'Erro inesperado no servidor.')
  }

  if (resposta.status === 204) return undefined as T
  return resposta.json() as Promise<T>
}

function cabecalhoDeAutenticacao(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const api = {
  get: <T>(caminho: string, token?: string) =>
    requisitar<T>(caminho, { headers: cabecalhoDeAutenticacao(token) }),
  post: <T>(caminho: string, corpo: unknown, token?: string) =>
    requisitar<T>(caminho, {
      method: 'POST',
      body: JSON.stringify(corpo),
      headers: cabecalhoDeAutenticacao(token),
    }),
}
