import { useState } from 'react'

type Pet = {
  nome: string
  fotoUrl?: string
}

type ProximoAgendamento = {
  petNome: string
  servico: 'Passeio' | 'Hospedagem' | 'Nutrição'
  horario: string
} | null

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

function FaixaDeAgendamento({ agendamento }: { agendamento: ProximoAgendamento }) {
  if (!agendamento) {
    return <section className="faixa-de-agendamento faixa-de-agendamento--vazia"><p>Nenhum agendamento no momento</p></section>
  }

  return (
    <section className="faixa-de-agendamento">
      <p>Próximo agendamento</p>
      <p>{agendamento.petNome} · {agendamento.servico} · {agendamento.horario}</p>
    </section>
  )
}

function PortaDeCuidado({ produto, destaque }: { produto: Produto; destaque?: boolean }) {
  return (
    <button className={`porta-de-cuidado ${destaque ? 'porta-de-cuidado--destaque' : ''}`} type="button">
      <h2>{produto.titulo}</h2>
      <p>{produto.descricao}</p>
    </button>
  )
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
  const proximoAgendamento: ProximoAgendamento = { petNome: 'Thor', servico: 'Passeio', horario: '15:30' }

  return (
    <div className="painel-do-tutor">
      <SaudacaoDoZelo tutorNome={tutorNome} petAtivo={petAtivo} />
      <FaixaDeAgendamento agendamento={proximoAgendamento} />
      <TrilhaDePortas itens={produtos} />
      <AcessoAoZelinho />
    </div>
  )
}

export function TelaLogin() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modo, setModo] = useState<'login' | 'registro'>('login')

  function handleEnviar() {
    // integração com POST /auth/login ou /auth/registro entra numa etapa futura
    void nome
    void email
    void senha
  }

  return (
    <div className="tela-login">
      <h1>ZeloPets</h1>
      {modo === 'registro' && <label>Nome<input value={nome} onChange={(e) => setNome(e.target.value)} /></label>}
      <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>Senha<input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} /></label>
      <button type="button" onClick={handleEnviar}>{modo === 'login' ? 'Entrar' : 'Criar conta'}</button>
      <button type="button" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
        {modo === 'login' ? 'Ainda não tenho conta' : 'Já tenho conta'}
      </button>
    </div>
  )
}

type Raca = { id: string; nome: string; iconeUrl: string }
const racasComuns: Raca[] = [
  { id: 'vira-lata', nome: 'Vira-lata', iconeUrl: '/icones-racas/vira-lata.svg' },
  { id: 'labrador', nome: 'Labrador', iconeUrl: '/icones-racas/labrador.svg' },
  { id: 'poodle', nome: 'Poodle', iconeUrl: '/icones-racas/poodle.svg' },
  { id: 'shih-tzu', nome: 'Shih Tzu', iconeUrl: '/icones-racas/shih-tzu.svg' },
  { id: 'golden', nome: 'Golden Retriever', iconeUrl: '/icones-racas/golden.svg' },
  { id: 'bulldog', nome: 'Bulldog', iconeUrl: '/icones-racas/bulldog.svg' },
  { id: 'srd-gato', nome: 'Gato sem raça definida', iconeUrl: '/icones-racas/srd-gato.svg' },
  { id: 'siames', nome: 'Siamês', iconeUrl: '/icones-racas/siames.svg' },
]

function GaleriaDeRacas({ selecionada, onSelecionar }: { selecionada: string | null; onSelecionar: (racaId: string) => void }) {
  return <div className="galeria-de-racas">{racasComuns.map((raca) => (
    <button key={raca.id} type="button" className={`galeria-de-racas__item ${selecionada === raca.id ? 'galeria-de-racas__item--selecionado' : ''}`} onClick={() => onSelecionar(raca.id)}>
      <img src={raca.iconeUrl} alt={raca.nome} /><span>{raca.nome}</span>
    </button>
  ))}</div>
}

function BotaoAdicionarFotoReal({ onFotoSelecionada }: { onFotoSelecionada: (arquivo: File) => void }) {
  return <label className="botao-adicionar-foto-real"><span>Adicionar foto do seu pet</span><input type="file" accept="image/*" onChange={(evento) => { const arquivo = evento.target.files?.[0]; if (arquivo) onFotoSelecionada(arquivo) }} /></label>
}

function EscolhaDeRetrato({ racaSelecionada, onSelecionarRaca, onFotoSelecionada }: { racaSelecionada: string | null; onSelecionarRaca: (racaId: string) => void; onFotoSelecionada: (arquivo: File) => void }) {
  return <section className="escolha-de-retrato"><h2>Com quem seu pet mais se parece?</h2><GaleriaDeRacas selecionada={racaSelecionada} onSelecionar={onSelecionarRaca} /><BotaoAdicionarFotoReal onFotoSelecionada={onFotoSelecionada} /></section>
}

type Especie = 'CACHORRO' | 'GATO'
type Porte = 'PEQUENO' | 'MEDIO' | 'GRANDE'
type NivelEnergia = 'BAIXO' | 'MEDIO' | 'ALTO'

function CamposEssenciais({ nome, especie, porte, nivelEnergia, onMudarNome, onMudarEspecie, onMudarPorte, onMudarNivelEnergia }: { nome: string; especie: Especie | null; porte: Porte | null; nivelEnergia: NivelEnergia | null; onMudarNome: (valor: string) => void; onMudarEspecie: (valor: Especie) => void; onMudarPorte: (valor: Porte) => void; onMudarNivelEnergia: (valor: NivelEnergia) => void }) {
  return <section className="campos-essenciais">
    <label>Nome do pet<input value={nome} onChange={(e) => onMudarNome(e.target.value)} /></label>
    <fieldset><legend>Espécie</legend>{(['CACHORRO', 'GATO'] as Especie[]).map((opcao) => <button key={opcao} type="button" aria-pressed={especie === opcao} onClick={() => onMudarEspecie(opcao)}>{opcao === 'CACHORRO' ? 'Cachorro' : 'Gato'}</button>)}</fieldset>
    <fieldset><legend>Porte</legend>{(['PEQUENO', 'MEDIO', 'GRANDE'] as Porte[]).map((opcao) => <button key={opcao} type="button" aria-pressed={porte === opcao} onClick={() => onMudarPorte(opcao)}>{opcao}</button>)}</fieldset>
    <fieldset><legend>Nível de energia</legend>{(['BAIXO', 'MEDIO', 'ALTO'] as NivelEnergia[]).map((opcao) => <button key={opcao} type="button" aria-pressed={nivelEnergia === opcao} onClick={() => onMudarNivelEnergia(opcao)}>{opcao}</button>)}</fieldset>
  </section>
}

function DetalhesOpcionais({ aberto, onAlternar }: { aberto: boolean; onAlternar: () => void }) {
  return <section className="detalhes-opcionais"><button type="button" onClick={onAlternar}>{aberto ? 'Ocultar detalhes' : 'Adicionar mais detalhes (opcional)'}</button>{aberto && <div className="detalhes-opcionais__conteudo">
    <label>Raça específica<input type="text" /></label><label>Peso (kg)<input type="number" /></label><label>Restrições alimentares<input type="text" placeholder="ex: alergia a frango" /></label><label>Comportamento<input type="text" placeholder="ex: ansioso, sociável" /></label>
  </div>}</section>
}

function BotaoCriarGemeoDigital({ nomePet, onClick }: { nomePet: string; onClick: () => void }) {
  return <button className="botao-criar-gemeo-digital" type="button" onClick={onClick}>{nomePet ? `Criar perfil do ${nomePet}` : 'Criar perfil do pet'}</button>
}

export function TelaCadastroDoPet() {
  const [racaSelecionada, setRacaSelecionada] = useState<string | null>(null)
  const [, setFotoReal] = useState<File | null>(null)
  const [nome, setNome] = useState('')
  const [especie, setEspecie] = useState<Especie | null>(null)
  const [porte, setPorte] = useState<Porte | null>(null)
  const [nivelEnergia, setNivelEnergia] = useState<NivelEnergia | null>(null)
  const [detalhesAbertos, setDetalhesAbertos] = useState(false)

  function handleCriarGemeoDigital() {
    // integração com POST /pets entra numa etapa futura
  }

  return <div className="tela-cadastro-do-pet">
    <EscolhaDeRetrato racaSelecionada={racaSelecionada} onSelecionarRaca={setRacaSelecionada} onFotoSelecionada={setFotoReal} />
    <CamposEssenciais nome={nome} especie={especie} porte={porte} nivelEnergia={nivelEnergia} onMudarNome={setNome} onMudarEspecie={setEspecie} onMudarPorte={setPorte} onMudarNivelEnergia={setNivelEnergia} />
    <DetalhesOpcionais aberto={detalhesAbertos} onAlternar={() => setDetalhesAbertos((valor) => !valor)} />
    <BotaoCriarGemeoDigital nomePet={nome} onClick={handleCriarGemeoDigital} />
  </div>
}

export function App() {
  const [tela, setTela] = useState<'login' | 'painel' | 'pet'>('login')

  return <main className="aplicacao">
    <nav className="navegacao-de-desenvolvimento" aria-label="Navegação das telas">
      <button type="button" onClick={() => setTela('login')}>Login</button>
      <button type="button" onClick={() => setTela('painel')}>Painel do tutor</button>
      <button type="button" onClick={() => setTela('pet')}>Cadastro do pet</button>
    </nav>
    {tela === 'login' && <TelaLogin />}
    {tela === 'painel' && <PainelDoTutor />}
    {tela === 'pet' && <TelaCadastroDoPet />}
  </main>
}