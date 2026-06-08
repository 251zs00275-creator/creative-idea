export type Category =
  | 'movie'
  | 'anime'
  | 'illustration'
  | 'photo'
  | 'music'
  | 'design'
  | 'other'

export type FrameworkKey = 'vts' | 'orid' | 'element' | 'self'

export interface User {
  id: string
  email: string
  display_name: string | null
  slack_user_id: string | null
  created_at: string
}

export interface Work {
  id: string
  user_id: string
  title: string
  category: Category
  url: string | null
  thumbnail_url: string | null
  memo: string | null
  framework: FrameworkKey | null
  ws_answers: WorksheetAnswers | null
  source: 'web' | 'slack'
  created_at: string
}

/** ステップID => 回答テキスト */
export type WorksheetAnswers = Record<string, string>

export interface AiChatLog {
  id: string
  work_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Analysis {
  id: string
  user_id: string
  aesthetic: string
  values: string
  pattern: string
  keywords: string[]
  works_count: number
  created_at: string
}

export interface SlackConnection {
  id: string
  user_id: string
  slack_workspace_id: string
  slack_channel_id: string
  bot_token: string
  created_at: string
}

export interface OgpData {
  title: string | null
  description: string | null
  image: string | null
}
