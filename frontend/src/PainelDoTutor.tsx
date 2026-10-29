import { useEffect, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  House,
  MessageCircle,
  PawPrint,
  UserRound,
  Footprints,
  Package,
} from 'lucide-react'
import { ApiError, api } from './api/client'
import { obterToken } from './api/auth'
import { obterProximoCuidado, type Cuidado } from './api/agenda'
import { obterTutor, type Tutor } from './api/tutor'

type Pet = {
  id: string
  nome: string
  fotoUrl?: string | null
}

type EstadoRecurso = 'carregando' | 'ok' | 'erro'
type ServicoId = 'mobilidade' | 'hotel' | 'nutricao'
export type TelaPrincipal = 'inicio' | 'agenda' | 'zelinho' | 'perfil'

type Props = {
  onAbrirCarteira?: () => void
  onAbrirPerfil?: () => void
  onAbrirAgenda?: () => void
  onAbrirZelinho?: () => void
  onAbrirServico?: (servico: ServicoId) => void
  onCadastrarPet?: () => void
  onSessaoExpirada?: () => void
}

export const CHAVE_PET_ATIVO = 'zelopets:petAtivoId'

const servicos: {
  id: ServicoId
  titulo: string
  descricao: string
  Icone: typeof Footprints
}[] = [
  {
    id: 'mobilidade',
    titulo: 'Mobilidade',
    descricao: 'Passeios e transporte do pet',
    Icone: Footprints,
  },
  {
    id: 'hotel',
    titulo: 'Hotel ZeloPets',
    descricao: 'Hospedagem com pacotes',
    Icone: House,
  },
  {
    id: 'nutricao',
    titulo: 'Nutrição',
    descricao: 'Plano alimentar por assinatura',
    Icone: Package,
  },
]

function formatarMoedas(saldo: number) {
  return saldo.toLocaleString('pt-BR')
}

function formatarData(dataHora: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dataHora))
}

function nomeDoServico(tipo: Cuidado['tipo']) {
  switch (tipo) {
    case 'PASSEIO':
      return 'Passeio'
    case 'HOSPEDAGEM':
      return 'Hospedagem'
    case 'NUTRICAO':
      return 'Nutrição'
  }
}

function isSessaoExpirada(erro: unknown) {
  return erro instanceof ApiError && erro.status === 401
}

function ChipZeloCoins({
  tutor,
  estadoTutor,
  onAbrirCarteira,
}: {
  tutor: Tutor | null
  estadoTutor: EstadoRecurso
  onAbrirCarteira?: () => void
}) {
  return (
    <button
      className="chip-zelocoins"
      type="button"
      onClick={onAbrirCarteira}
      aria-label={
        estadoTutor === 'erro'
          ? 'Abrir carteira; saldo indisponível'
          : `Abrir carteira; saldo de ${tutor ? formatarMoedas(tutor.zeloCoins) : 'carregando'} ZeloCoins`
      }
      aria-busy={estadoTutor === 'carregando'}
    >
      <CircleDollarSign aria-hidden="true" size={18} />
      <span>{estadoTutor === 'erro' ? 'Indisponível' : tutor ? formatarMoedas(tutor.zeloCoins) : '...'}</span>
    </button>
  )
}

function BotaoPerfil({ onAbrirPerfil }: { onAbrirPerfil?: () => void }) {
  return (
    <button className="botao-perfil" type="button" onClick={onAbrirPerfil} aria-label="Abrir perfil">
      <UserRound aria-hidden="true" size={21} />
    </button>
  )
}

function CabecalhoZelo({
  tutor,
  estadoTutor,
  onAbrirCarteira,
  onAbrirPerfil,
}: {
  tutor: Tutor | null
  estadoTutor: EstadoRecurso
  onAbrirCarteira?: () => void
  onAbrirPerfil?: () => void
}) {
  return (
    <header className="cabecalho-zelo">
      <div className="marca-zelopets">
        <PawPrint aria-hidden="true" size={24} />
        <span>ZeloPets</span>
      </div>
      <div className="cabecalho-zelo__acoes">
        <ChipZeloCoins tutor={tutor} estadoTutor={estadoTutor} onAbrirCarteira={onAbrirCarteira} />
        <BotaoPerfil onAbrirPerfil={onAbrirPerfil} />
      </div>
    </header>
  )
}

function SeletorDePet({
  petAtivo,
  pets,
  onSelecionarPet,
}: {
  petAtivo: Pet
  pets: Pet[]
  onSelecionarPet: (petId: string) => void
}) {
  return (
    <label className="seletor-de-pet">
      <span className="seletor-de-pet__avatar" aria-hidden="true">
        {petAtivo.fotoUrl ? (
          <img src={petAtivo.fotoUrl} alt="" />
        ) : (
          petAtivo.nome.charAt(0).toLocaleUpperCase('pt-BR')
        )}
      </span>
      <span className="sr-only">Selecionar cão ativo</span>
      <select
        value={petAtivo.id}
        onChange={(evento) => onSelecionarPet(evento.target.value)}
        aria-label="Selecionar cão ativo"
      >
        {pets.map((pet) => (
          <option key={pet.id} value={pet.id}>
            {pet.nome}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" size={16} />
    </label>
  )
}

function SaudacaoComPet({
  tutor,
  estadoTutor,
  pets,
  estadoPets,
  petAtivoId,
  onSelecionarPet,
  onCadastrarPet,
}: {
  tutor: Tutor | null
  estadoTutor: EstadoRecurso
  pets: Pet[]
  estadoPets: EstadoRecurso
  petAtivoId: string | null
  onSelecionarPet: (petId: string) => void
  onCadastrarPet?: () => void
}) {
  const petAtivo = pets.find((pet) => pet.id === petAtivoId) ?? pets[0]

  return (
    <section className="saudacao-com-pet" aria-labelledby="titulo-home">
      <div className="saudacao-com-pet__texto">
        <p className="saudacao-com-pet__ola">
          {estadoTutor === 'carregando'
            ? 'Carregando seu perfil'
            : estadoTutor === 'erro'
              ? 'Olá'
              : `Olá, ${tutor?.nome ?? ''}`}
        </p>
        {estadoTutor === 'erro' ? (
          <>
            <h1 id="titulo-home">Não foi possível carregar seu perfil</h1>
            <p className="mensagem-de-erro">Tente novamente em instantes.</p>
          </>
        ) : estadoPets === 'carregando' ? (
          <h1 id="titulo-home" aria-busy="true">Carregando os dados do seu cão</h1>
        ) : estadoPets === 'erro' ? (
          <>
            <h1 id="titulo-home">Não foi possível carregar seus cães</h1>
            <p className="mensagem-de-erro">Tente novamente em instantes.</p>
          </>
        ) : pets.length === 0 ? (
          <>
            <h1 id="titulo-home">Cadastre seu primeiro cão para começar</h1>
            <button className="acao-secundaria" type="button" onClick={onCadastrarPet}>
              Cadastrar cão
            </button>
          </>
        ) : (
          <h1 id="titulo-home">Qual cuidado o {petAtivo?.nome} precisa hoje?</h1>
        )}
      </div>
      {estadoPets === 'ok' && pets.length > 0 && petAtivo && (
        <SeletorDePet petAtivo={petAtivo} pets={pets} onSelecionarPet={onSelecionarPet} />
      )}
    </section>
  )
}

function ChipDeStatus({ status }: { status: string }) {
  const pendente = status === 'PENDENTE'
  const texto = pendente ? 'Pendente' : status === 'ATIVA' ? 'Ativa' : 'Agendado'
  const Icone = pendente ? Clock3 : CheckCircle2

  return (
    <span className={`chip-status ${pendente ? 'chip-status--pendente' : 'chip-status--agendado'}`}>
      <Icone aria-hidden="true" size={15} />
      {texto}
    </span>
  )
}

const heroSlides = [
  { imagem: '/assets/fotos/01_cao_retrato_dourado.jpg', titulo: 'Um jeito mais leve de cuidar todos os dias.', texto: 'Encontre o próximo cuidado do seu pet em poucos passos.' },
  { imagem: '/assets/fotos/03_cao_correndo_gramado.jpg', titulo: 'Mais movimento, mais momentos juntos.', texto: 'Encontre passeios compatíveis com a energia do seu cão.' },
  { imagem: '/assets/fotos/06_cao_descansando.jpg', titulo: 'Cuidado também é saber desacelerar.', texto: 'Planeje uma rotina de descanso e bem-estar.' },
]

function HeroInterativo({ onAbrirServico }: { onAbrirServico?: (servico: ServicoId) => void }) {
  const [slide, setSlide] = useState(0)
  const atual = heroSlides[slide]

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((valor) => (valor + 1) % heroSlides.length), 6000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section className="hero-interativo" aria-roledescription="carrossel" aria-label="Destaques ZeloPets" aria-labelledby="titulo-hero">
      <div className="hero-interativo__conteudo">
        <span className="hero-interativo__eyebrow">Cuidado que acompanha</span>
        <h2 id="titulo-hero">{atual.titulo}</h2>
        <p>{atual.texto}</p>
        <button
          className="hero-interativo__cta"
          type="button"
          onClick={() => onAbrirServico?.('mobilidade')}
        >
          Encontrar um passeio
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </div>
      <div className="hero-interativo__visual">
        <img src={atual.imagem} alt="Imagem ilustrativa de cuidado para pets" />
        <span className="hero-interativo__badge hero-interativo__badge--status">
          <CheckCircle2 aria-hidden="true" size={15} />
          Cuidado em dia
        </span>
        <span className="hero-interativo__badge hero-interativo__badge--coins">
          <CircleDollarSign aria-hidden="true" size={15} />
          +50 ZeloCoins
        </span>
        <div className="hero-interativo__controles">
          <button type="button" aria-label="Slide anterior" onClick={() => setSlide((slide - 1 + heroSlides.length) % heroSlides.length)}>‹</button>
          <span>{slide + 1} / {heroSlides.length}</span>
          <button type="button" aria-label="Próximo slide" onClick={() => setSlide((slide + 1) % heroSlides.length)}>›</button>
        </div>
      </div>
    </section>
  )
}

function CartaoProximoCuidado({
  cuidado,
  estado,
}: {
  cuidado: Cuidado | null
  estado: EstadoRecurso
}) {
  if (estado === 'carregando') {
    return (
      <section className="cartao-proximo-cuidado cartao-proximo-cuidado--carregando" aria-busy="true">
        <CalendarDays aria-hidden="true" size={24} />
        <p>Buscando o próximo cuidado...</p>
      </section>
    )
  }

  if (estado === 'erro') {
    return (
      <section className="cartao-proximo-cuidado cartao-proximo-cuidado--erro" role="status">
        <CalendarDays aria-hidden="true" size={24} />
        <div>
          <h2>Próximo cuidado</h2>
          <p>Não foi possível carregar a agenda. Tente novamente.</p>
        </div>
      </section>
    )
  }

  if (!cuidado) {
    return (
      <section className="cartao-proximo-cuidado cartao-proximo-cuidado--vazio">
        <CalendarDays aria-hidden="true" size={24} />
        <div>
          <h2>Próximo cuidado</h2>
          <p>Nenhum cuidado agendado. Que tal um passeio?</p>
        </div>
      </section>
    )
  }

  return (
    <section className="cartao-proximo-cuidado">
      <CalendarDays aria-hidden="true" size={24} />
      <div className="cartao-proximo-cuidado__conteudo">
        <p className="cartao-proximo-cuidado__data">{formatarData(cuidado.dataHora)}</p>
        <h2>{nomeDoServico(cuidado.tipo)} com {cuidado.petNome}</h2>
      </div>
      <ChipDeStatus status={cuidado.status} />
    </section>
  )
}

function LinhaDeServico({
  id,
  titulo,
  descricao,
  Icone,
  onAbrir,
}: {
  id: ServicoId
  titulo: string
  descricao: string
  Icone: typeof Footprints
  onAbrir?: (servico: ServicoId) => void
}) {
  return (
    <button className="linha-de-servico" type="button" onClick={() => onAbrir?.(id)}>
      <span className="linha-de-servico__icone">
        <Icone aria-hidden="true" size={24} />
      </span>
      <span className="linha-de-servico__texto">
        <span className="linha-de-servico__titulo">{titulo}</span>
        <span className="linha-de-servico__descricao">{descricao}</span>
      </span>
      <ChevronRight aria-hidden="true" size={22} />
    </button>
  )
}

function ListaDeServicos({ onAbrirServico }: { onAbrirServico?: (servico: ServicoId) => void }) {
  return (
    <section className="lista-de-servicos" aria-labelledby="titulo-servicos">
      <h2 id="titulo-servicos">Serviços</h2>
      <div className="lista-de-servicos__itens">
        {servicos.map(({ id, ...servico }) => (
          <LinhaDeServico key={id} id={id} {...servico} onAbrir={onAbrirServico} />
        ))}
      </div>
    </section>
  )
}

function AtalhoZelinho({ onAbrir }: { onAbrir?: () => void }) {
  return (
    <button className="atalho-zelinho" type="button" onClick={onAbrir}>
      <span className="atalho-zelinho__avatar" aria-hidden="true">Z</span>
      <span>Dúvidas? Fale com o Zelinho</span>
      <ChevronRight aria-hidden="true" size={22} />
    </button>
  )
}

export function BarraDeNavegacao({
  telaAtiva,
  onAbrirInicio,
  onAbrirAgenda,
  onAbrirZelinho,
  onAbrirPerfil,
}: {
  telaAtiva: TelaPrincipal | null
  onAbrirInicio?: () => void
  onAbrirAgenda?: () => void
  onAbrirZelinho?: () => void
  onAbrirPerfil?: () => void
}) {
  return (
    <nav className="barra-de-navegacao" aria-label="Principal">
      <button
        className={`barra-de-navegacao__item ${telaAtiva === 'inicio' ? 'barra-de-navegacao__item--ativo' : ''}`}
        type="button"
        onClick={onAbrirInicio}
        aria-current={telaAtiva === 'inicio' ? 'page' : undefined}
      >
        <House aria-hidden="true" size={23} />
        <span>Início</span>
      </button>
      <button
        className={`barra-de-navegacao__item ${telaAtiva === 'agenda' ? 'barra-de-navegacao__item--ativo' : ''}`}
        type="button"
        onClick={onAbrirAgenda}
        aria-current={telaAtiva === 'agenda' ? 'page' : undefined}
      >
        <CalendarDays aria-hidden="true" size={23} />
        <span>Agenda</span>
      </button>
      <button
        className={`barra-de-navegacao__item ${telaAtiva === 'zelinho' ? 'barra-de-navegacao__item--ativo' : ''}`}
        type="button"
        onClick={onAbrirZelinho}
        aria-current={telaAtiva === 'zelinho' ? 'page' : undefined}
      >
        <MessageCircle aria-hidden="true" size={23} />
        <span>Zelinho</span>
      </button>
      <button
        className={`barra-de-navegacao__item ${telaAtiva === 'perfil' ? 'barra-de-navegacao__item--ativo' : ''}`}
        type="button"
        onClick={onAbrirPerfil}
        aria-current={telaAtiva === 'perfil' ? 'page' : undefined}
      >
        <UserRound aria-hidden="true" size={23} />
        <span>Perfil</span>
      </button>
    </nav>
  )
}

export function PainelDoTutor({
  onAbrirCarteira,
  onAbrirPerfil,
  onAbrirAgenda,
  onAbrirZelinho,
  onAbrirServico,
  onCadastrarPet,
  onSessaoExpirada,
}: Props) {
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [estadoTutor, setEstadoTutor] = useState<EstadoRecurso>('carregando')
  const [pets, setPets] = useState<Pet[]>([])
  const [estadoPets, setEstadoPets] = useState<EstadoRecurso>('carregando')
  const [petAtivoId, setPetAtivoId] = useState<string | null>(() => localStorage.getItem(CHAVE_PET_ATIVO))
  const [cuidado, setCuidado] = useState<Cuidado | null>(null)
  const [estadoCuidado, setEstadoCuidado] = useState<EstadoRecurso>('carregando')

  useEffect(() => {
    const token = obterToken()
    if (!token) {
      onSessaoExpirada?.()
      return
    }

    let ativo = true
    obterTutor(token)
      .then((dado) => {
        if (!ativo) return
        setTutor(dado)
        setEstadoTutor('ok')
      })
      .catch((erro: unknown) => {
        if (!ativo) return
        if (isSessaoExpirada(erro)) {
          onSessaoExpirada?.()
          return
        }
        setEstadoTutor('erro')
      })

    api
      .get<Pet[]>('/pets', token)
      .then((dado) => {
        if (!ativo) return
        setPets(dado)
        setEstadoPets('ok')
      })
      .catch((erro: unknown) => {
        if (!ativo) return
        if (isSessaoExpirada(erro)) {
          onSessaoExpirada?.()
          return
        }
        setEstadoPets('erro')
      })

    obterProximoCuidado(token)
      .then((resposta) => {
        if (!ativo) return
        setCuidado(resposta.proximo)
        setEstadoCuidado('ok')
      })
      .catch((erro: unknown) => {
        if (!ativo) return
        if (isSessaoExpirada(erro)) {
          onSessaoExpirada?.()
          return
        }
        setEstadoCuidado('erro')
      })

    return () => {
      ativo = false
    }
  }, [onSessaoExpirada])

  useEffect(() => {
    if (estadoPets !== 'ok') return

    const petSelecionado = pets.find((pet) => pet.id === petAtivoId)
    const idValido = petSelecionado?.id ?? pets[0]?.id ?? null
    if (idValido !== petAtivoId) {
      setPetAtivoId(idValido)
    }
    if (idValido) {
      localStorage.setItem(CHAVE_PET_ATIVO, idValido)
    } else {
      localStorage.removeItem(CHAVE_PET_ATIVO)
    }
  }, [estadoPets, pets, petAtivoId])

  function selecionarPet(petId: string) {
    setPetAtivoId(petId)
    localStorage.setItem(CHAVE_PET_ATIVO, petId)
  }

  return (
    <div className="home-do-tutor">
      <CabecalhoZelo
        tutor={tutor}
        estadoTutor={estadoTutor}
        onAbrirCarteira={onAbrirCarteira}
        onAbrirPerfil={onAbrirPerfil}
      />
      <main className="conteudo-home" tabIndex={-1}>
        <HeroInterativo onAbrirServico={onAbrirServico} />
        <SaudacaoComPet
          tutor={tutor}
          estadoTutor={estadoTutor}
          pets={pets}
          estadoPets={estadoPets}
          petAtivoId={petAtivoId}
          onSelecionarPet={selecionarPet}
          onCadastrarPet={onCadastrarPet}
        />
        <CartaoProximoCuidado cuidado={cuidado} estado={estadoCuidado} />
        <ListaDeServicos onAbrirServico={onAbrirServico} />
        <AtalhoZelinho onAbrir={onAbrirZelinho} />
      </main>
      <BarraDeNavegacao
        telaAtiva="inicio"
        onAbrirAgenda={onAbrirAgenda}
        onAbrirZelinho={onAbrirZelinho}
        onAbrirPerfil={onAbrirPerfil}
      />
    </div>
  )
}
