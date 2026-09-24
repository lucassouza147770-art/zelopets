import { useState } from 'react'
import { api, ApiError } from './api/client'
import { salvarToken } from './api/auth'

type EstadoEnvio = 'ocioso' | 'enviando' | 'erro'

export function TelaLogin() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [estado, setEstado] = useState<EstadoEnvio>('ocioso')
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)

  async function handleEnviar() {
    setEstado('enviando')
    setMensagemErro(null)
    try {
      const rota = modo === 'login' ? '/auth/login' : '/auth/registro'
      const corpo = modo === 'login' ? { email, senha } : { nome, email, senha }
      const resposta = await api.post<{ accessToken: string }>(rota, corpo)
      salvarToken(resposta.accessToken)
      setEstado('ocioso')
    } catch (erro) {
      setEstado('erro')
      setMensagemErro(erro instanceof ApiError ? erro.message : 'Não deu pra conectar com o servidor.')
    }
  }

  return (
    <main className="tela-login">
      <h1>ZeloPets</h1>
      {modo === 'registro' && (
        <label>
          Nome
          <input value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
      )}
      <label>
        E-mail
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Senha
        <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
      </label>
      {estado === 'erro' && mensagemErro && <p className="tela-login__erro">{mensagemErro}</p>}
      <button type="button" onClick={handleEnviar} disabled={estado === 'enviando'}>
        {estado === 'enviando' ? 'Enviando...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
      </button>
      <button type="button" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
        {modo === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
      </button>
    </main>
  )
}
