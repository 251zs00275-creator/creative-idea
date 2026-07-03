import { z } from 'zod'

export const CATEGORY_VALUES = [
  'movie',
  'anime',
  'illustration',
  'photo',
  'music',
  'design',
  'other',
] as const

export const FRAMEWORK_VALUES = ['vts', 'orid', 'element', 'self'] as const

const MAX_TITLE_LENGTH = 200
const MAX_MEMO_LENGTH = 5000
const MAX_URL_LENGTH = 2000
const MAX_WS_ANSWER_LENGTH = 5000
const MAX_WS_ANSWER_COUNT = 50

function blankToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const httpUrlField = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .max(MAX_URL_LENGTH)
    .refine(isHttpUrl, 'http(s)の有効なURLを指定してください')
    .optional()
)

const memoField = z.preprocess(
  blankToUndefined,
  z.string().trim().max(MAX_MEMO_LENGTH).optional()
)

const wsAnswersField = z
  .record(z.string(), z.string().max(MAX_WS_ANSWER_LENGTH))
  .refine((obj) => Object.keys(obj).length <= MAX_WS_ANSWER_COUNT, {
    message: `ワークシート回答は${MAX_WS_ANSWER_COUNT}項目以下にしてください`,
  })

export const workCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'タイトルは必須です')
    .max(MAX_TITLE_LENGTH, `タイトルは${MAX_TITLE_LENGTH}文字以内にしてください`),
  category: z.enum(CATEGORY_VALUES),
  url: httpUrlField.nullable().optional(),
  thumbnail_url: httpUrlField.nullable().optional(),
  memo: memoField.nullable().optional(),
  framework: z.enum(FRAMEWORK_VALUES).nullable().optional(),
  ws_answers: wsAnswersField.nullable().optional(),
})

export const workUpdateSchema = workCreateSchema.partial()

export type WorkCreateInput = z.infer<typeof workCreateSchema>
export type WorkUpdateInput = z.infer<typeof workUpdateSchema>
