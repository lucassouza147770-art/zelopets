import { useState } from 'react'
import { PainelDoTutor } from './PainelDoTutor'
import { TelaCadastroDoPet } from './TelaCadastroDoPet'
import { TelaLogin } from './TelaLogin'

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
