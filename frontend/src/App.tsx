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
import { obterRecomendacoes, type RespostaRecomendacao } from './api/recomendacao'

type EstadoSessao = 'verificando' | 'deslogado' | 'cadastro-pet' | 'autenticado' | 'erro'
type Rota = TelaPrincipal | 'carteira' | 'servico' | 'gemeo'
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
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(new Date().getDate())

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

  const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1)
  const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const deslocamento = (inicio.getDay() + 6) % 7
  const cuidadosDoDia = cuidados.filter((cuidado) => {
    const data = new Date(cuidado.dataHora)
    return data.getFullYear() === mes.getFullYear() && data.getMonth() === mes.getMonth() && data.getDate() === diaSelecionado
  })

  return (
    <TelaInterna titulo="Agenda" onVoltar={onVoltar}>
      {estado === 'carregando' ? (
        <p aria-busy="true">Carregando seus próximos cuidados...</p>
      ) : estado === 'erro' ? (
        <p role="alert">Não foi possível carregar a agenda. Tente novamente.</p>
      ) : (
        <>
          <section className="calendario-agenda" aria-label="Calendário de cuidados">
            <div className="calendario-agenda__cabecalho">
              <button type="button" aria-label="Mês anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>‹</button>
              <h2>{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(mes)}</h2>
              <button type="button" aria-label="Próximo mês" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>›</button>
            </div>
            <div className="calendario-agenda__semana">{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((dia, indice) => <span key={`${dia}-${indice}`}>{dia}</span>)}</div>
            <div className="calendario-agenda__dias">
              {Array.from({ length: deslocamento }, (_, indice) => <span className="calendario-agenda__dia calendario-agenda__dia--vazio" key={`vazio-${indice}`} />)}
              {Array.from({ length: diasNoMes }, (_, indice) => {
                const dia = indice + 1
                const marcado = cuidados.some((cuidado) => {
                  const data = new Date(cuidado.dataHora)
                  return data.getFullYear() === mes.getFullYear() && data.getMonth() === mes.getMonth() && data.getDate() === dia
                })
                return <button className={`calendario-agenda__dia ${marcado ? 'calendario-agenda__dia--marcado' : ''} ${dia === new Date().getDate() && mes.getMonth() === new Date().getMonth() ? 'calendario-agenda__dia--hoje' : ''}`} type="button" key={dia} onClick={() => setDiaSelecionado(dia)}>{dia}</button>
              })}
            </div>
            {diaSelecionado && <p className="calendario-agenda__selecionado">{cuidadosDoDia.length ? `${cuidadosDoDia.length} cuidado(s) neste dia` : 'Nenhum cuidado neste dia'}</p>}
          </section>
          {cuidadosDoDia.length > 0 && <ul className="lista-agenda">{cuidadosDoDia.map((cuidado, indice) => <li className="item-agenda" key={`${cuidado.tipo}-${cuidado.dataHora}-${indice}`}><span className="item-agenda__data">{new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' }).format(new Date(cuidado.dataHora))}</span><strong>{cuidado.tipo === 'PASSEIO' ? 'Passeio' : cuidado.tipo === 'HOSPEDAGEM' ? 'Hospedagem' : 'Nutrição'}</strong><span>{cuidado.petNome}</span></li>)}</ul>}
        </>
      )}
    </TelaInterna>
  )
}

function TelaPerfil({
  token,
  onSessaoExpirada,
  onVoltar,
  onAbrirGemeo,
}: {
  token: string
  onSessaoExpirada: () => void
  onVoltar: () => void
  onAbrirGemeo: () => void
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
            <>
              <ul className="lista-pets">
                {pets.map((pet) => <li key={pet.id}>{pet.nome}</li>)}
              </ul>
              <button className="acao-secundaria" type="button" onClick={onAbrirGemeo}>
                Abrir gêmeo digital
              </button>
            </>
          )}
        </>
      )}
    </TelaInterna>
  )
}

type PetDetalhado = {
  id: string
  nome: string
  fotoUrl?: string | null
  especie: string
  raca?: string | null
  dataNascimento?: string | null
  porte: string
  pesoKg?: number | null
  nivelEnergia: string
  restricoesAlimentares: string[]
  comportamento: string[]
}

function rotuloPet(valor: string) {
  return valor.toLocaleLowerCase('pt-BR').replace('_', ' ')
}

function TelaGemeoDigital({
  token,
  onSessaoExpirada,
  onVoltar,
}: {
  token: string
  onSessaoExpirada: () => void
  onVoltar: () => void
}) {
  const [pet, setPet] = useState<PetDetalhado | null>(null)
  const [recomendacoes, setRecomendacoes] = useState<RespostaRecomendacao | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')

  useEffect(() => {
    let ativa = true
    api.get<PetDetalhado[]>('/pets', token)
      .then(async (pets) => {
        const selecionado = pets[0]
        if (!selecionado) throw new Error('Nenhum pet cadastrado')
        const resultado = await obterRecomendacoes(token, selecionado.id).catch(() => null)
        if (!ativa) return
        setPet(selecionado)
        setRecomendacoes(resultado)
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
    <TelaInterna titulo="Gêmeo digital" onVoltar={onVoltar}>
      {estado === 'carregando' ? (
        <p aria-busy="true">Preparando o perfil vivo do seu cão...</p>
      ) : estado === 'erro' || !pet ? (
        <p role="alert">Não foi possível carregar o perfil do seu cão.</p>
      ) : (
        <div className="gemeo-digital">
          <section className="gemeo-digital__identidade" aria-labelledby="nome-gemeo">
            <div className="gemeo-digital__foto">
              {pet.fotoUrl ? <img src={pet.fotoUrl} alt="" /> : pet.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="texto-apoio">Perfil baseado nos dados cadastrados</p>
              <h2 id="nome-gemeo">{pet.nome}</h2>
              <p>{pet.raca || 'Raça não informada'} · porte {rotuloPet(pet.porte)}</p>
            </div>
          </section>
          <section className="gemeo-digital__dados" aria-labelledby="dados-gemeo">
            <h2 id="dados-gemeo">Características</h2>
            <dl className="grade-gemeo">
              <div><dt>Energia</dt><dd>{rotuloPet(pet.nivelEnergia)}</dd></div>
              <div><dt>Peso</dt><dd>{pet.pesoKg ? `${pet.pesoKg} kg` : 'Não informado'}</dd></div>
              <div><dt>Comportamento</dt><dd>{pet.comportamento.length ? pet.comportamento.join(', ') : 'Não informado'}</dd></div>
              <div><dt>Restrições</dt><dd>{pet.restricoesAlimentares.length ? pet.restricoesAlimentares.join(', ') : 'Nenhuma informada'}</dd></div>
            </dl>
          </section>
          <section className="gemeo-digital__recomendacoes" aria-labelledby="recomendacoes-gemeo">
            <h2 id="recomendacoes-gemeo">Recomendações</h2>
            {recomendacoes ? (
              <>
                <p className="texto-apoio">Perfil de compatibilidade: {rotuloPet(recomendacoes.perfilDoCluster.nivel_energia)} energia, porte {rotuloPet(recomendacoes.perfilDoCluster.porte)}.</p>
                {recomendacoes.prestadores.length ? (
                  <ul className="lista-recomendacoes">
                    {recomendacoes.prestadores.map((prestador) => (
                      <li key={prestador.id}><strong>{prestador.nome}</strong><span>{prestador.motivo}</span></li>
                    ))}
                  </ul>
                ) : <p>Nenhum prestador compatível foi encontrado no momento.</p>}
              </>
            ) : <p>Recomendações indisponíveis no momento. Os dados do perfil continuam disponíveis.</p>}
          </section>
        </div>
      )}
    </TelaInterna>
  )
}

function MascoteZelinho({ onAbrir }: { onAbrir: () => void }) {
  return (
    <button className="mascote-zelinho" type="button" onClick={onAbrir} aria-label="Abrir conversa com o Zelinho">
      <img src="/assets/icones/chat_zelinho.svg" alt="" />
      <span>Fale comigo</span>
    </button>
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
        <>
          <section className="carteira-destaque">
            <span>Saldo disponível</span>
            <strong>{tutor?.zeloCoins.toLocaleString('pt-BR')} ZeloCoins</strong>
            <span>Use seus pontos para desbloquear benefícios.</span>
          </section>
          <section className="carteira-acoes" aria-label="Ações da carteira">
            <button className="carteira-acao" type="button">Trocar por desconto<br /><small>Em breve</small></button>
            <button className="carteira-acao" type="button">Ganhar mais moedas<br /><small>Avalie um serviço</small></button>
          </section>
        </>
      )}
      <p className="texto-apoio">Histórico e resgates serão ativados no fluxo de pagamento sandbox.</p>
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
        <TelaPerfil token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('inicio')} onAbrirGemeo={() => setRota('gemeo')} />
      ) : rota === 'carteira' ? (
        <TelaCarteira token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('inicio')} />
      ) : rota === 'gemeo' ? (
        <TelaGemeoDigital token={token} onSessaoExpirada={encerrarSessao} onVoltar={() => navegar('perfil')} />
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
      <MascoteZelinho onAbrir={() => navegar('zelinho')} />
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
