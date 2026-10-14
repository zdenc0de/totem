// Proceso hijo de storage.test.ts: guarda registros completos con storage.ts sin parar hasta que
// lo matan.
import { crearStorage } from './storage'

const storage = crearStorage(process.argv[2])

for (let n = 0; ; n++) {
  storage.guardar({
    id: `id-${n}`,
    totemId: 'T1',
    createdAt: '2026-10-18T10:00:00-06:00',
    nombre: 'María José',
    apellido: 'Núñez Peña '.repeat(4).trim(),
    email: `p${n}@correo.com`,
    telefono: String(5500000000 + n),
    aceptoPrivacidad: true,
    privacyVersion: 'v1',
    respuestas: ['A', 'A', 'A', 'I', 'V'],
    conteo: { A: 3, I: 1, V: 1 },
    talento: 'A',
    juego: 'simulador',
    desempate: false,
    duracionSeg: 42
  })
}
