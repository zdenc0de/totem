// Proceso hijo de storage.test.ts: guarda registros con storage.ts sin parar hasta que lo matan.
import type { Registro } from '@shared/types'
import { crearStorage } from './storage'

const storage = crearStorage(process.argv[2])
const relleno = 'x'.repeat(400)

for (let n = 0; ; n++) {
  storage.guardar({
    id: `id-${n}`,
    email: `p${n}@c.com`,
    telefono: String(n),
    relleno
  } as unknown as Registro)
}
