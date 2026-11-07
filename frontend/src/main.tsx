import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './styles/tipografia.css'
import './styles/cores.css'
import './styles/responsivo.css'
import './styles/movimento.css'
import './styles/cadastro-pet.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)