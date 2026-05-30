export interface Sentence {
  en: string
  zh: string
}

export interface Scene {
  id: string
  name: string
  sentences: Sentence[]
}

export interface Dictionary {
  id: string
  name: string
  scenes: Scene[]
}
