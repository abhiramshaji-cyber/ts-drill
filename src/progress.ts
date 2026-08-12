export type Progress = { solved: string[]; streak: number }

const KEY = 'ts-drill.progress.v1'
const EMPTY: Progress = { solved: [], streak: 0 }

let cache: Progress | null = null

export function loadProgress(): Progress {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<Progress>) : null
    cache = {
      solved: Array.isArray(parsed?.solved) ? parsed.solved.filter((id) => typeof id === 'string') : [],
      streak: typeof parsed?.streak === 'number' ? parsed.streak : 0,
    }
  } catch {
    cache = EMPTY
  }
  return cache
}

export function saveProgress(next: Progress): void {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage blocked; in-memory cache still carries the session
  }
}
