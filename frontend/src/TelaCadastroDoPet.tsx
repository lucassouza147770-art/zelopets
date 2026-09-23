import { useState } from 'react'

type Raca = { id: string; nome: string; iconeUrl: string }
const racasComuns: Raca[] = [
  { id: 'vira-lata', nome: 'Vira-lata', iconeUrl: '/icones-racas/vira-lata.svg' },
  { id: 'labrador', nome: 'Labrador', iconeUrl: '/icones-racas/labrador.svg' },
  { id: 'poodle', nome: 'Poodle', iconeUrl: '/icones-racas/poodle.svg' },
  { id: 'shih-tzu', nome: 'Shih Tzu', iconeUrl: '/icones-racas/shih-tzu.svg' },
  { id: 'golden', nome: 'Golden Retriever', iconeUrl: '/icones-racas/golden.svg' },
  { id: 'bulldog', nome: 'Bulldog', iconeUrl: '/icones-racas/bulldog.svg' },
]

function GaleriaDeRacas({ selecionada, onSelecionar }: { selecionada: string | null; onSelecionar: (racaId: string) => void }) {
  return <div className="galeria-de-racas">{racasComuns.map((raca) => <button key={raca.id} type="button" className={`galeria-de-racas__item ${selecionada === raca.id ? 'galeria-de-racas__item--selecionado' : ''}`} onClick={() => onSelecionar(raca.id)}><img src={raca.iconeUrl} alt={raca.nome} /><span>{raca.nome}</span></button>)}</div>
}

type EstadoFoto = { tipo: 'ociosa' } | { tipo: 'enviando' } | { tipo: 'erro'; mensagem: string } | { tipo: 'pronta'; preview: string }

function BotaoAdicionarFotoReal({ estado, onArquivoSelecionado }: { estado: EstadoFoto; onArquivoSelecionado: (arquivo: File) => void }) {
  return <label className="botao-adicionar-foto-real">
    {estado.tipo === 'pronta' ? <img src={estado.preview} alt="Prévia da foto do seu pet" className="botao-adicionar-foto-real__preview" /> : <span>{estado.tipo === 'enviando' ? 'Enviando foto...' : 'Adicionar foto do seu pet'}</span>}
    {estado.tipo === 'erro' && <p className="botao-adicionar-foto-real__erro">{estado.mensagem}</p>}
    <input type="file" accept="image/*" disabled={estado.tipo === 'enviando'} onChange={(evento) => { const arquivo = evento.target.files?.[0]; if (arquivo) onArquivoSelecionado(arquivo) }} />
  </label>
}

function EscolhaDeRetrato({ racaSelecionada, onSelecionarRaca, estadoFoto, onArquivoSelecionado }: { racaSelecionada: string | null; onSelecionarRaca: (racaId: string) => void; estadoFoto: EstadoFoto; onArquivoSelecionado: (arquivo: File) => void }) {
  return <section className="escolha-de-retrato"><h2>Com quem seu pet mais se parece?</h2><GaleriaDeRacas selecionada={racaSelecionada} onSelecionar={onSelecionarRaca} /><BotaoAdicionarFotoReal estado={estadoFoto} onArquivoSelecionado={onArquivoSelecionado} /></section>
}

type Porte = 'PEQUENO' | 'MEDIO' | 'GRANDE'
type NivelEnergia = 'BAIXO' | 'MEDIO' | 'ALTO'

function CamposEssenciais({ nome, porte, nivelEnergia, onMudarNome, onMudarPorte, onMudarNivelEnergia }: { nome: string; porte: Porte | null; nivelEnergia: NivelEnergia | null; onMudarNome: (valor: string) => void; onMudarPorte: (valor: Porte) => void; onMudarNivelEnergia: (valor: NivelEnergia) => void }) {
  return <section className="campos-essenciais"><label>Nome do pet<input value={nome} onChange={(e) => onMudarNome(e.target.value)} /></label><fieldset><legend>Porte</legend>{(['PEQUENO', 'MEDIO', 'GRANDE'] as Porte[]).map((opcao) => <button key={opcao} type="button" aria-pressed={porte === opcao} onClick={() => onMudarPorte(opcao)}>{opcao}</button>)}</fieldset><fieldset><legend>Nível de energia</legend>{(['BAIXO', 'MEDIO', 'ALTO'] as NivelEnergia[]).map((opcao) => <button key={opcao} type="button" aria-pressed={nivelEnergia === opcao} onClick={() => onMudarNivelEnergia(opcao)}>{opcao}</button>)}</fieldset></section>
}

function DetalhesOpcionais({ aberto, onAlternar }: { aberto: boolean; onAlternar: () => void }) {
  return <section className="detalhes-opcionais"><button type="button" onClick={onAlternar}>{aberto ? 'Ocultar detalhes' : 'Adicionar mais detalhes (opcional)'}</button>{aberto && <div className="detalhes-opcionais__conteudo"><label>Raça específica<input type="text" /></label><label>Peso (kg)<input type="number" /></label><label>Restrições alimentares<input type="text" placeholder="ex: alergia a frango" /></label><label>Comportamento<input type="text" placeholder="ex: ansioso, sociável" /></label></div>}</section>
}

type EstadoEnvio = 'ocioso' | 'enviando' | 'erro'

function BotaoCriarGemeoDigital({ nomePet, habilitado, estado, onClick }: { nomePet: string; habilitado: boolean; estado: EstadoEnvio; onClick: () => void }) {
  return <div className="botao-criar-gemeo-digital-wrapper"><button className="botao-criar-gemeo-digital" type="button" onClick={onClick} disabled={!habilitado || estado === 'enviando'}>{estado === 'enviando' ? 'Criando perfil...' : nomePet ? `Criar perfil do ${nomePet}` : 'Criar perfil do pet'}</button>{estado === 'erro' && <p className="botao-criar-gemeo-digital__erro">Não deu pra criar o perfil agora. Tenta de novo.</p>}</div>
}

export function TelaCadastroDoPet() {
  const [racaSelecionada, setRacaSelecionada] = useState<string | null>(null)
  const [estadoFoto, setEstadoFoto] = useState<EstadoFoto>({ tipo: 'ociosa' })
  const [nome, setNome] = useState('')
  const [porte, setPorte] = useState<Porte | null>(null)
  const [nivelEnergia, setNivelEnergia] = useState<NivelEnergia | null>(null)
  const [detalhesAbertos, setDetalhesAbertos] = useState(false)
  const [estadoEnvio, setEstadoEnvio] = useState<EstadoEnvio>('ocioso')
  const camposObrigatoriosPreenchidos = Boolean(nome.trim() && porte && nivelEnergia)

  function handleArquivoSelecionado(arquivo: File) {
    if (arquivo.size > 5 * 1024 * 1024) {
      setEstadoFoto({ tipo: 'erro', mensagem: 'Essa imagem é muito grande. Tenta uma menor que 5MB.' })
      return
    }
    setEstadoFoto({ tipo: 'enviando' })
    const leitor = new FileReader()
    leitor.onload = () => setEstadoFoto({ tipo: 'pronta', preview: leitor.result as string })
    leitor.onerror = () => setEstadoFoto({ tipo: 'erro', mensagem: 'Não deu pra ler essa foto. Tenta outra.' })
    leitor.readAsDataURL(arquivo)
  }

  async function handleCriarGemeoDigital() {
    setEstadoEnvio('enviando')
    try {
      // integração com POST /pets entra numa etapa futura
      setEstadoEnvio('ocioso')
    } catch {
      setEstadoEnvio('erro')
    }
  }

  return <main className="tela-cadastro-do-pet"><h1>Cadastro do pet</h1><EscolhaDeRetrato racaSelecionada={racaSelecionada} onSelecionarRaca={setRacaSelecionada} estadoFoto={estadoFoto} onArquivoSelecionado={handleArquivoSelecionado} /><CamposEssenciais nome={nome} porte={porte} nivelEnergia={nivelEnergia} onMudarNome={setNome} onMudarPorte={setPorte} onMudarNivelEnergia={setNivelEnergia} /><DetalhesOpcionais aberto={detalhesAbertos} onAlternar={() => setDetalhesAbertos((valor) => !valor)} /><BotaoCriarGemeoDigital nomePet={nome} habilitado={camposObrigatoriosPreenchidos} estado={estadoEnvio} onClick={handleCriarGemeoDigital} /></main>
}
