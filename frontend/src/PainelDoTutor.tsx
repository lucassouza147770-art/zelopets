import { useEffect, useState } from 'react'

type Pet = {
  nome: string
  fotoUrl?: string
}

type EstadoAgendamento =
  | { tipo: 'carregando' }
  | { tipo: 'vazio' }
  | { tipo: 'erro' }
  | {
      tipo: 'ok'
      dado: {
        petNome: string
        servico: 'Passeio' | 'Hospedagem' | 'Nutrição'
        horario: string
      }
    }

type Produto = {
  id: 'mobilidade' | 'hospedagem' | 'nutricao'
  titulo: string
  descricao: string
}

const produtos: Produto[] = [
  { id: 'mobilidade', titulo: 'Passeio ou transporte', descricao: 'Agende um passeio pro seu pet' },
  { id: 'hospedagem', titulo: 'Hospedagem', descricao: 'Reserve uma estadia no Hotel ZeloPets' },
  { id: 'nutricao', titulo: 'Plano alimentar', descricao: 'Assine uma entrega de ração personalizada' },
]

function RetratoDoPet({ pet }: { pet: Pet }) {
  return (
    <div className="retrato-do-pet">
      {pet.fotoUrl ? <img src={pet.fotoUrl} alt={pet.nome} /> : <span aria-hidden>{pet.nome.charAt(0)}</span>}
    </div>
  )
}

function SaudacaoDoZelo({ tutorNome, petAtivo }: { tutorNome: string; petAtivo: Pet }) {
  return (
    <header className="saudacao-do-zelo">
      <RetratoDoPet pet={petAtivo} />
      <div>
        <p>Olá, {tutorNome}!</p>
        <h1>Qual cuidado o {petAtivo.nome} precisa hoje?</h1>
      </div>
    </header>
  )
}

function FaixaDeAgendamento({ estado }: { estado: EstadoAgendamento }) {
  if (estado.tipo === 'carregando') {
    return <section className="faixa-de-agendamento faixa-de-agendamento--carregando" aria-busy="true"><p>Buscando seus agendamentos...</p></section>
  }
  if (estado.tipo === 'erro') {
    return <section className="faixa-de-agendamento faixa-de-agendamento--erro"><p>Não deu pra carregar seus agendamentos agora.</p></section>
  }
  if (estado.tipo === 'vazio') {
    return <section className="faixa-de-agendamento faixa-de-agendamento--vazia"><p>Nenhum agendamento no momento</p></section>
  }
  return <section className="faixa-de-agendamento"><p>Próximo agendamento</p><p>{estado.dado.petNome} · {estado.dado.servico} · {estado.dado.horario}</p></section>
}

function PortaDeCuidado({ produto, destaque }: { produto: Produto; destaque?: boolean }) {
  return <button className={`porta-de-cuidado ${destaque ? 'porta-de-cuidado--destaque' : ''}`} type="button"><h2>{produto.titulo}</h2><p>{produto.descricao}</p></button>
}

function TrilhaDePortas({ itens }: { itens: Produto[] }) {
  return <nav className="trilha-de-portas">{itens.map((produto, indice) => <PortaDeCuidado key={produto.id} produto={produto} destaque={indice === 0} />)}</nav>
}

function AcessoAoZelinho() {
  return <button className="acesso-ao-zelinho" type="button" aria-label="Falar com o Zelinho">Falar com o Zelinho</button>
}

export function PainelDoTutor() {
  const tutorNome = 'Lucas'
  const petAtivo: Pet = { nome: 'Thor' }
  const [estadoAgendamento, setEstadoAgendamento] = useState<EstadoAgendamento>({ tipo: 'carregando' })

  useEffect(() => {
    // simulação da chamada à API — troca pelo fetch real na etapa de integração
    const tempo = setTimeout(() => {
      setEstadoAgendamento({ tipo: 'ok', dado: { petNome: 'Thor', servico: 'Passeio', horario: '15:30' } })
    }, 600)
    return () => clearTimeout(tempo)
  }, [])

  return <div className="painel-do-tutor"><SaudacaoDoZelo tutorNome={tutorNome} petAtivo={petAtivo} /><FaixaDeAgendamento estado={estadoAgendamento} /><TrilhaDePortas itens={produtos} /><AcessoAoZelinho /></div>
}
