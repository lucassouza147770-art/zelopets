import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { ApiError, api } from './api/client'
import { limparToken, obterToken } from './api/auth'
import { BarraDeNavegacao, PainelDoTutor, type TelaPrincipal } from './PainelDoTutor'
import type { Cuidado } from './api/agenda'
import { TelaCadastroDoPet } from './TelaCadastroDoPet'
import { TelaLogin } from './TelaLogin'
import { obterTutor, type Tutor } from './api/tutor'
import { TelaMobilidade } from './Mobilidade'

type EstadoSessao = 'verificando' | 'deslogado' | 'cadastro-pet' | 'autenticado' | 'erro'
type Rota = TelaPrincipal | 'carteira' | 'servico'
type ServicoId = 'mobilidade' | 'hotel' | 'nutricao'

const nomesServico: Record<ServicoId, string> = {
  mobilidade: 'Mobilidade',
  hotel: 'Hotel ZeloPets',
  nutricao: 'Nutrição',
}

function TelaInterna({
  titulo,
  onVoltar,
  children,
}: {
  titulo: string
  onVoltar: () => void
  children: ReactNode
}) {
  return (
    <main className="tela-interna" tabIndex={-1}>
      <button className="botao-voltar" type="button" onClick={onVoltar}>
        <ArrowLeft aria-hidden="true" size={20} />
        Voltar
      </button>
      <h1>{titulo}</h1>
      {children}
    </main>
  )
}

function TelaAgenda({
  token,
  onSessaoExpirada,
  onVoltar,
}: {
  token: string
  onSessaoExpirada: () => void
  onVoltar: () => void
}) {
  const [cuidados, setCuidados] = useState<Cuidado[]>([])
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')

  useEffect(() => {
    let ativa = true
    api
      .get<Cuidado[]>('/agenda', token)
      .then((dados) => {
        if (!ativa) return
        setCuidados(dados)
        setEstado('ok')
      })
      .catch((erro: unknown) => {
        if (!ativa) return
        if (erro instanceof ApiError && erro.status === 401) {
          onSessaoExpirada()
          return
        }
        setEstado('erro')
      })
    return () => {
      ativa = false
    }
  }, [onSessaoExpirada, token])

  return (
    <TelaInterna titulo="Agenda" onVoltar={onVoltar}>
      {estado === 'carregando' ? (
        <p aria-busy="true">Carregando seus próximos cuidados...</p>
      ) : estado === 'erro' ? (
        <p role="alert">Não foi possível carregar a agenda. Tente novamente.</p>
      ) : cuidados.length === 0 ? (
        <p>Nenhum cuidado agendado. Que tal um passeio?</p>
      ) : (
        <ul className="lista-agenda">
          {cuidados.map((cuidado, indice) => (
            <li className="item-agenda" key={`${cuidado.tipo}-${cuidado.dataHora}-${indice}`}>
              <span className="item-agenda__data">
                {new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(cuidado.dataHora))}
              </span>
              <strong>{cuidado.tipo === 'PASSEIO' ? 'Passeio' : cuidado.tipo === 'HOSPEDAGEM' ? 'Hospedagem' : 'Nutrição'}</strong>
              <span>{cuidado.petNome}</span>
            </li>
          ))}
        </ul>
      )}
    </TelaInterna>
  )
}

function TelaPerfil({
  token,
  onSessaoExpirada,
  onVoltar,
}: {
  token: string
  onSessaoExpirada: () => void
  onVoltar: () => void
}) {
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [pets, setPets] = useState<{ id: string; nome: string }[]>([])
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')

  useEffect(() => {
    let ativa = true
    Promise.all([obterTutor(token), api.get<{ id: string; nome: string }[]>('/pets', token)])
      .then(([perfil, listaPets]) => {
        if (!ativa) return
        setTutor(perfil)
        setPets(listaPets)
        setEstado('ok')
      })
      .catch((erro: unknown) => {
        if (!ativa) return
        if (erro instanceof ApiError && erro.status === 401) {
          onSessaoExpirada()
          return
        }
        setEstado('erro')
      })
    return () => {
      ativa = false
    }
  }, [onSessaoExpirada, token])

  return (
    <TelaInterna titulo="Perfil" onVoltar={onVoltar}>
      {estado === 'carregando' ? (
        <p aria-busy="true">Carregando seu perfil...</p>
      ) : estado === 'erro' ? (
        <p role="alert">Não foi possível carregar seu perfil. Tente novamente.</p>
      ) : (
        <>
          <dl className="dados-perfil">
            <div><dt>Nome</dt><dd>{tutor?.nome}</dd></div>
            <div><dt>E-mail</dt><dd>{tutor?.email}</dd></div>
          </dl>
          <h2>Seus cães</h2>
          {pets.length === 0 ? (
            <p>Nenhum cão cadastrado.</p>
          ) : (
            <ul className="lista-pets">
              {pets.map((pet) => <li key={pet.id}>{pet.nome}</li>)}
            </ul>
          )}
        </>
      )}
    </TelaInterna>
  )
}

function TelaCarteira({
  token,
  onSessaoExpirada,
  onVoltar,
}: {
  token: string
  onSessaoExpirada: () => void
  onVoltar: () => void
}) {
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')

  useEffect(() => {
    let ativa = true
    obterTutor(token)
      .then((perfil) => {
        if (!ativa) return
        setTutor(perfil)
        setEstado('ok')
      })
      .catch((erro: unknown) => {
        if (!ativa) return
        if (erro instanceof ApiError && erro.status === 401) {
          onSessaoExpirada()
          return
        }
        setEstado('erro')
      })
    return () => {
      ativa = false
    }
  }, [onSessaoExpirada, token])

  return (
    <TelaInterna titulo="Carteira ZeloCoins" onVoltar={onVoltar}>
      {estado === 'carregando' ? (
        <p aria-busy="true">Carregando seu saldo...</p>
      ) : estado === 'erro' ? (
        <p role="alert">Não foi possível carregar seu saldo. Tente novamente.</p>
      ) : (
        <p className="saldo-carteira">{tutor?.zeloCoins.toLocaleString('pt-BR')} ZeloCoins</p>
      )}
      <p>O histórico e as regras de acúmulo estão em construção.</p>
    </TelaInterna>
  )
}

function responderZelinho(pergunta: string) {
  const texto = pergunta.toLocaleLowerCase('pt-BR')
  if (texto.includes('agenda') || texto.includes('agendamento')) {
    return 'Você pode consultar seus próximos cuidados na Agenda. Para criar um passeio, abra Mobilidade.'
  }
  if (texto.includes('moeda') || texto.includes('zelocoin') || texto.includes('saldo')) {
    return 'Seu saldo de ZeloCoins fica na Carteira, acessível pelo botão no cabeçalho.'
  }
  if (texto.includes('hotel') || texto.includes('hosped')) {
    return 'O Hotel ZeloPets está em preparação. Em breve você poderá escolher um pacote de hospedagem.'
  }
  if (texto.includes('nutri') || texto.includes('ração') || texto.includes('racao')) {
    return 'A Nutrição funciona por assinatura e permite acompanhar a próxima entrega do seu cão.'
  }
  if (texto.includes('passeio') || texto.includes('mobilidade')) {
    return 'Na Mobilidade você encontra passeadores compatíveis e pode solicitar um passeio.'
  }
  return 'Posso ajudar com agenda, passeio, hospedagem, nutrição ou ZeloCoins. O que você gostaria de saber?'
}

function TelaZelinho({ onVoltar }: { onVoltar: () => void }) {
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState(
    'Olá! Sou o Zelinho. Posso orientar sobre os serviços do ZeloPets.',
  )

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const texto = pergunta.trim()
    if (!texto) return
    setResposta(responderZelinho(texto))
    setPergunta('')
  }

  return (
    <TelaInterna titulo="Zelinho" onVoltar={onVoltar}>
      <p role="status">{resposta}</p>
      <form className="formulario-zelinho" onSubmit={enviar}>
        <label htmlFor="pergunta-zelinho">Sua dúvida</label>
        <input
          id="pergunta-zelinho"
          value={pergunta}
          onChange={(evento) => setPergunta(evento.target.value)}
          placeholder="Ex.: onde vejo minha agenda?"
        />
        <button className="acao-secundaria" type="submit">Enviar pergunta</button>
      </form>
      <p className="texto-apoio">Motor local ativo. Integração LLM: aguardando chave.</p>
    </TelaInterna>
  )
}

export function App() {
  const [estadoSessao, setEstadoSessao] = useState<EstadoSessao>('verificando')
  const [mensagemErro, setMensagemErro] = useState<string | null>(null)
  const [rota, setRota] = useState<Rota>('inicio')
  const [servicoAtivo, setServicoAtivo] = useState<ServicoId>('mobilidade')

  const encerrarSessao = useCallback(() => {
    limparToken()
    setMensagemErro(null)
    setEstadoSessao('deslogado')
  }, [])

  const verificarSessao = useCallback(async () => {
    const token = obterToken()
    if (!token) {
      setEstadoSessao('deslogado')
      return
    }

    setEstadoSessao('verificando')
    setMensagemErro(null)
    try {
      const pets = await api.get<{ id: string }[]>('/pets', token)
      setRota('inicio')
      setEstadoSessao(pets.length === 0 ? 'cadastro-pet' : 'autenticado')
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 401) {
        encerrarSessao()
        return
      }
      setMensagemErro('Não foi possível validar sua sessão. Confira a conexão e tente novamente.')
      setEstadoSessao('erro')
    }
  }, [encerrarSessao])

  useEffect(() => {
    void verificarSessao()
  }, [verificarSessao])

  useEffect(() => {
    if (estadoSessao !== 'autenticado') return
    document.querySelector<HTMLElement>('.aplicacao-autenticada main')?.focus()
  }, [estadoSessao, rota])

  function navegar(tela: TelaPrincipal) {
    setRota(tela)
  }

  function selecionarServico(servico: ServicoId) {
    setServicoAtivo(servico)
    setRota('servico')
  }

  const token = obterToken()

  if (estadoSessao === 'verificando') {
    return <main className="tela-interna" aria-busy="true"><h1>Carregando ZeloPets</h1></main>
  }

  if (estadoSessao === 'deslogado') {
    return <TelaLogin onAutenticado={() => void verificarSessao()} />
  }

  if (estadoSessao === 'cadastro-pet') {
    return (
      <TelaCadastroDoPet
        onPetCriado={() => {
          setRota('inicio')
          setEstadoSessao('autenticado')
        }}
        onSessaoExpirada={encerrarSessao}
      />
    )
  }

  if (estadoSessao === 'erro') {
    return (
      <main className="tela-interna" role="alert">
        <h1>Não foi possível abrir o ZeloPets</h1>
        <p>{mensagemErro}</p>
        <button className="acao-secundaria" type="button" onClick={() => void verificarSessao()}>
          Tentar novamente
        </button>
        <button className="botao-voltar" type="button" onClick={encerrarSessao}>
          Voltar ao login
        </button>
      </main>
    )
  }

  if (!token) {
    return (
      <main className="tela-interna" role="alert">
        <h1>Sua sessão não está disponível</h1>
        <button className="acao-secundaria" type="button" onClick={encerrarSessao}>
          Voltar ao login
        </button>
      </main>
    )
  }

  const telaAtiva: TelaPrincipal | null =
    rota === 'inicio' || rota === 'agenda' || rota === 'zelinho' || rota === 'perfil' ? rota : null

  return (
    <div className="aplicacao-autenticada">
      {rota === 'inicio' ? (
        <PainelDoTutor
          onAbrirCarteira={() => setRota('carteira')}
          onAbrirPerfil={() => navegar('perfil')}
          onAbrirAgenda={() => navegar('agenda')}
          onAbrirZelinho={() => navegar('zelinho')}
          onAbrirServico={selecionarServico}
          onCadastrarPet={() => setEstadoSessao('cadastro-pet')}
          onSessaoExpirada={encerrarSessao}
        />
      ) : rota === 'agenda' ? (
        <TelaAgenda token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('inicio')} />
      ) : rota === 'perfil' ? (
        <TelaPerfil token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('inicio')} />
      ) : rota === 'carteira' ? (
        <TelaCarteira token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('inicio')} />
      ) : rota === 'zelinho' ? (
        <TelaZelinho onVoltar={() => navegar('inicio')} />
      ) : rota === 'servico' && servicoAtivo === 'mobilidade' ? (
        <TelaMobilidade
          token={token}
          onSessaoExpirada={encerrarSessao}
          onVoltar={() => navegar('inicio')}
          onAbrirAgenda={() => navegar('agenda')}
        />
      ) : (
        <TelaInterna titulo={`${nomesServico[servicoAtivo]} — em construção`} onVoltar={() => navegar('inicio')}>
          <p>Este serviço estará disponível em breve.</p>
        </TelaInterna>
      )}
      <footer className="rodape-aplicacao">
        <small>ZeloPets · cuidado que entende seu cão</small>
      </footer>
      {rota !== 'inicio' && (
        <BarraDeNavegacao
          telaAtiva={telaAtiva}
          onAbrirInicio={() => navegar('inicio')}
          onAbrirAgenda={() => navegar('agenda')}
          onAbrirZelinho={() => navegar('zelinho')}
          onAbrirPerfil={() => navegar('perfil')}
        />
      )}
    </div>
  )
}
