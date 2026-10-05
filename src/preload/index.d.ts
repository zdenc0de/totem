import type { TotemApi } from './index'

declare global {
  interface Window {
    totem: TotemApi
  }
}
