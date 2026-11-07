import { useEffect, useState } from 'react'
import { ApiError, api } from './api/client'

type Atendimento = {
  id: string
  protocolo: string
  motivo: string
  prioridade: 'NORMAL' | 'ALTA'
  resumo: string
  status: 'ABERTO' | 'EM_ATENDIMENTO' | 'RESOLVIDO'
  respostaEquipe?: string | null
  tutor: { nome: string; email: string }
}

export function AtendimentosAdmin({ token, onSair }: { token: string; onSair: () => void }) {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([])
  const [erro, setErro] = useState<string | null>(null)

  const carregar = () => {
    void api.get<Atendimento[]>('/atendimentos', token).then(setAtendimentos).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) onSair()
      else setErro('Não foi possível carregar os atendimentos.')
    })
  }

  useEffect(() => carregar(), [token])

  function atualizar(id: string, status: Atendimento['status']) {
    void api.patch(`/atendimentos/${id}`, { status }, token).then(carregar).catch(() => setErro('Não foi possível atualizar o atendimento.'))
  }

  return (
    <main className="tela-interna" tabIndex={-1}>
      <header className="cabecalho-interno">
        <div><span className="eyebrow">Equipe ZeloPets</span><h1>Atendimentos</h1></div>
        <button className="botao-voltar" type="button" onClick={onSair}>Sair</button>
      </header>
      {erro && <p role="alert">{erro}</p>}
      {atendimentos.length === 0 ? <p>Nenhum atendimento aberto.</p> : (
        <ul aria-label="Lista de atendimentos" className="lista-agenda">
          {atendimentos.map((atendimento) => (
            <li className="item-agenda" key={atendimento.id}>
              <div>
                <strong>{atendimento.protocolo} · {atendimento.prioridade}</strong>
                <span>{atendimento.tutor.nome} ({atendimento.tutor.email})</span>
                <span>{atendimento.motivo}</span>
                <p>{atendimento.resumo}</p>
              </div>
              <label>
                Status
                <select value={atendimento.status} onChange={(event) => atualizar(atendimento.id, event.target.value as Atendimento['status'])}>
                  <option value="ABERTO">Aberto</option>
                  <option value="EM_ATENDIMENTO">Em atendimento</option>
                  <option value="RESOLVIDO">Resolvido</option>
                </select>
              </label>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
