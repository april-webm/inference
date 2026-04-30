export type Difficulty = 'chill' | 'medium' | 'hard'

export interface Profile {
  id: string
  display_name: string
  university_email: boolean
  created_at: string
}

export interface Round {
  id: string
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
  rank: number
  computed_at: string
}

export interface LeaderboardRow {
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
