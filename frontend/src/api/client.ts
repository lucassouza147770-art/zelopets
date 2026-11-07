const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

function traduzirMensagem(mensagem: string) {
  const traducoes: Array<[RegExp, string]> = [
    [/email must be an email/i, 'Informe um e-mail válido.'],
    [/must be an email/i, 'Informe um e-mail válido.'],
    [/email should not be empty|email must not be empty/i, 'Informe seu e-mail.'],
    [/password should not be empty|senha must not be empty/i, 'Informe sua senha.'],
    [/name should not be empty|nome must not be empty/i, 'Informe seu nome.'],
    [/must be a string/i, 'Confira os campos preenchidos.'],
    [/should not be empty|must not be empty/i, 'Preencha todos os campos obrigatórios.'],
    [/is not valid|invalid/i, 'Confira os dados informados.'],
  ]

  return traducoes.reduce((atual, [padrao, traducao]) => atual.replace(padrao, traducao), mensagem)
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
    const mensagem = Array.isArray(corpo?.message) ? corpo.message.map(String).map(traduzirMensagem).join(' ') : corpo?.message
    throw new ApiError(resposta.status, mensagem ? traduzirMensagem(String(mensagem)) : 'Não foi possível concluir a operação.')
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
  patch: <T>(caminho: string, corpo: unknown, token?: string) =>
    requisitar<T>(caminho, {
      method: 'PATCH',
      body: JSON.stringify(corpo),
      headers: cabecalhoDeAutenticacao(token),
    }),
  delete: <T>(caminho: string, token?: string) =>
    requisitar<T>(caminho, {
      method: 'DELETE',
      headers: cabecalhoDeAutenticacao(token),
    }),
}
