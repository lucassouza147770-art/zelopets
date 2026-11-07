import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envPath = resolve(import.meta.dirname, '..', '.env')
const atual = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
const temToken = /^ML_INTERNAL_TOKEN\s*=\s*(?!\s*(?:#|$)).+/m.test(atual)

if (!temToken) {
  const separador = atual.length > 0 && !atual.endsWith('\n') ? '\n' : ''
  writeFileSync(envPath, `${atual}${separador}ML_INTERNAL_TOKEN=${randomBytes(32).toString('hex')}\n`, 'utf8')
}
