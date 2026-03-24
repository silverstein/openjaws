/**
 * HighScores — Persistent best scores via localStorage
 */

const STORAGE_KEY = "beachPanic_highScores"

export interface HighScoreEntry {
  score: number
  round: number
  selfies: number
  damageDealt: number
  character: string
  sharkPersonality: string
  date: string
  won: boolean
}

export interface HighScores {
  bestScore: number
  bestRound: number
  totalGames: number
  totalWins: number
  totalDeaths: number
  recentGames: HighScoreEntry[]
}

const DEFAULT_SCORES: HighScores = {
  bestScore: 0,
  bestRound: 0,
  totalGames: 0,
  totalWins: 0,
  totalDeaths: 0,
  recentGames: [],
}

export function loadHighScores(): HighScores {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SCORES }
    return { ...DEFAULT_SCORES, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SCORES }
  }
}

export function saveGameResult(entry: HighScoreEntry): HighScores {
  const scores = loadHighScores()

  scores.totalGames++
  if (entry.won) scores.totalWins++
  if (!entry.won) scores.totalDeaths++
  if (entry.score > scores.bestScore) scores.bestScore = entry.score
  if (entry.round > scores.bestRound) scores.bestRound = entry.round

  // Keep last 10 games
  scores.recentGames = [entry, ...scores.recentGames].slice(0, 10)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
  } catch {
    // localStorage full or unavailable
  }

  return scores
}

export function getStatsLine(scores: HighScores): string {
  if (scores.totalGames === 0) return "First time? Good luck!"
  const winRate = scores.totalWins > 0
    ? `${Math.round((scores.totalWins / scores.totalGames) * 100)}% win rate`
    : "0 wins yet"
  return `Best: Round ${scores.bestRound} (${scores.bestScore} pts) • ${scores.totalGames} games • ${winRate}`
}
