import { useState } from 'react'
import { api, ApiError } from './api/client'
import { salvarToken } from './api/auth'

type EstadoEnvio = 'ocioso' | 'enviando' | 'erro'

export function TelaLogin({ onAutenticado }: { onAutenticado: () => void }) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modo, setModo] = useState<'login' | 'registro'>('login')
  const [estado, setEstado] = useState<EstadoEnvio>('ocioso')
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)

  async function handleEnviar() {
    const faltantes = [
      ...(modo === 'registro' && !nome.trim() ? ['Nome'] : []),
      ...(!email.trim() ? ['E-mail'] : []),
      ...(!senha ? ['Senha'] : []),
    ]
    if (faltantes.length > 0) {
      setEstado('erro')
      setMensagemErro(`Preencha os campos obrigatórios: ${faltantes.join(', ')}.`)
      return
    }
    setEstado('enviando')
    setMensagemErro(null)
    try {
      const rota = modo === 'login' ? '/auth/login' : '/auth/registro'
      const corpo = modo === 'login' ? { email, senha } : { nome, email, senha }
      const resposta = await api.post<{ accessToken: string }>(rota, corpo)
      salvarToken(resposta.accessToken)
      onAutenticado()
      setEstado('ocioso')
    } catch (erro) {
      setEstado('erro')
      setMensagemErro(erro instanceof ApiError ? erro.message : 'Não deu pra conectar com o servidor.')
    }
  }

  return (
    <main className="tela-login">
      <div className="login-marca">
        <img src="/assets/icones/coracao_pata.svg" alt="" />
        <span>ZeloPets</span>
      </div>
      <p className="login-eyebrow">{modo === 'login' ? 'Cuidado que acompanha vocês' : 'Comece o perfil do seu pet'}</p>
      <h1>{modo === 'login' ? 'Bem-vindo de volta!' : 'Crie uma conta conosco!'}</h1>
      <p className="login-nota">Campos com * são obrigatórios.</p>
      {modo === 'registro' && (
        <label>
          Nome *
          <input required aria-required="true" value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
      )}
      <label>
        E-mail *
        <input required aria-required="true" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Senha * <small>(mínimo de 6 caracteres no cadastro)</small>
        <input required aria-required="true" minLength={modo === 'registro' ? 6 : undefined} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
      </label>
      {estado === 'erro' && mensagemErro && <p className="tela-login__erro">{mensagemErro}</p>}
      <button className="login-cta" type="button" onClick={handleEnviar} disabled={estado === 'enviando'}>
        {estado === 'enviando' ? 'Enviando...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
      </button>
      <button type="button" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
        {modo === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
      </button>
      <p className="login-nota">Login seguro com sua conta ZeloPets.</p>
    </main>
  )
}
