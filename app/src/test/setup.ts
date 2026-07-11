import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Node 的 experimental localStorage 可能不完整；保证测试有可用的 Storage API
function installMemoryLocalStorage() {
  const map = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null
    },
    removeItem(key: string) {
      map.delete(key)
    },
    setItem(key: string, value: string) {
      map.set(key, String(value))
    },
  }
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
}

const existing = globalThis.localStorage
if (
  !existing ||
  typeof existing.getItem !== 'function' ||
  typeof existing.setItem !== 'function' ||
  typeof existing.clear !== 'function'
) {
  installMemoryLocalStorage()
}

// Clean up after each test
afterEach(() => {
  cleanup()
  try {
    localStorage.clear()
  } catch {
    // ignore
  }
})
