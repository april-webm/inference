export type Difficulty = 'chill' | 'medium' | 'hard'

export interface Season {
  id: string
  number: number
  name: string
  starts_at: string
  ends_at: string
  created_at: string
}

export interface Profile {
  id: string
  display_name: string
  university_email: boolean
  created_at: string
}

export interface Round {
  id: string
  season_id: string
  number: number
  title: string
  tagline: string
  description: string
  difficulty: Difficulty
  opens_at: string
  closes_at: string
  is_active: boolean
  created_at: string
}

export interface Submission {
  id: string
  user_id: string
  round_id: string
  answer: Record<string, unknown>
  reasoning: string
  submitted_at: string
}

export interface SubmissionAttempt {
  id: string
  user_id: string
  round_id: string
  attempted_at: string
}

export interface Score {
  id: string
  user_id: string
  round_id: string
  score: number
  raw_score: number
  rank: number
  computed_at: string
}

export interface LeaderboardRow {
  season_id: string
  season_number: number
  season_name: string
  round_id: string
  round_number: number
  round_title: string
  difficulty: Difficulty
  rank: number
  score: number
  display_name: string
  university_email: boolean
  computed_at: string
}

export interface SeasonLeaderboardRow {
  season_id: string
  season_number: number
  season_name: string
  user_id: string
  display_name: string
  university_email: boolean
  total_score: number
  rounds_played: number
  rank: number
}
