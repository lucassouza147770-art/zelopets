const CHAVE_TOKEN = 'zelopets:accessToken'

export function salvarToken(token: string) {
  localStorage.setItem(CHAVE_TOKEN, token)
}

export function obterToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN)
}

export function limparToken() {
  localStorage.removeItem(CHAVE_TOKEN)
}

export function ehAdministrador(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { papel?: string }
    return payload.papel === 'ADMIN'
  } catch {
    return false
  }
}
