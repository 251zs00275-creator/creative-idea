import { Work } from '@/types'
import { CATEGORY_LABELS, getFramework } from '@/lib/frameworks'

/** ファイル名等に使える形式の日付文字列（YYYY-MM-DD） */
export function formatDateForFilename(isoDate: string): string {
  const date = new Date(isoDate)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 表示用の日付文字列（YYYY年M月D日） */
export function formatDateForDisplay(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/** ファイル名として安全な文字列に変換 */
export function sanitizeFilename(title: string): string {
  const sanitized = title
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .trim()

  return sanitized.length > 0 ? sanitized : 'untitled'
}

export interface WorksheetEntry {
  label: string
  question: string
  answer: string
}

/** フレームワークの設問IDと回答を対応づけたエントリ一覧を返す */
export function getWorksheetEntries(work: Work): WorksheetEntry[] {
  if (!work.framework || !work.ws_answers) return []

  const framework = getFramework(work.framework)

  return framework.steps
    .map((step) => ({
      label: step.label,
      question: step.question,
      answer: work.ws_answers?.[step.id]?.trim() ?? '',
    }))
    .filter((entry) => entry.answer.length > 0)
}

/** 作品情報からフルのMarkdownドキュメントを生成 */
export function buildMarkdown(work: Work): string {
  const lines: string[] = []
  const categoryLabel = CATEGORY_LABELS[work.category] ?? work.category
  const framework = work.framework ? getFramework(work.framework) : null
  const worksheetEntries = getWorksheetEntries(work)

  lines.push(`# ${work.title}`)
  lines.push('')
  lines.push(`- カテゴリ: ${categoryLabel}`)
  if (work.url) {
    lines.push(`- URL: ${work.url}`)
  }
  lines.push(`- 記録日: ${formatDateForDisplay(work.created_at)}`)
  if (framework) {
    lines.push(`- フレームワーク: ${framework.name}（${framework.description}）`)
  }
  lines.push('')

  if (work.memo) {
    lines.push('## 最初の一言')
    lines.push('')
    lines.push(work.memo)
    lines.push('')
  }

  if (worksheetEntries.length > 0) {
    lines.push('## 言語化メモ')
    lines.push('')
    for (const entry of worksheetEntries) {
      lines.push(`### ${entry.label}`)
      lines.push('')
      lines.push(`**Q. ${entry.question}**`)
      lines.push('')
      lines.push(entry.answer)
      lines.push('')
    }
  }

  lines.push('---')
  lines.push('')
  lines.push('_Created with Creative Sense Archive_')

  return lines.join('\n')
}

const SNS_CHAR_LIMIT = 280

/** SNS投稿向けの短縮版テキストを生成（タイトル＋要点を280字程度に） */
export function buildSnsSummary(work: Work): string {
  const categoryLabel = CATEGORY_LABELS[work.category] ?? work.category
  const worksheetEntries = getWorksheetEntries(work)

  const headerLines = [`${work.title}（${categoryLabel}）`]
  if (work.url) {
    headerLines.push(work.url)
  }
  const header = headerLines.join('\n')

  // 要点として、メモ → ワークシートの最初の回答 の優先順で本文を選ぶ
  const bodyCandidate = work.memo?.trim() || worksheetEntries[0]?.answer || ''

  const footer = '#CreativeSenseArchive'
  const separator = '\n\n'

  // header/body/footerの3パートがjoinされる際、区切り(separator)は
  // header-body間・body-footer間の2箇所に入るため separator.length * 2
  const fixedLength = header.length + footer.length + separator.length * 2
  const remaining = SNS_CHAR_LIMIT - fixedLength

  let body = bodyCandidate
  if (body.length > remaining && remaining > 1) {
    body = `${body.slice(0, remaining - 1)}…`
  } else if (remaining <= 1) {
    body = ''
  }

  return [header, body, footer].filter((part) => part.length > 0).join(separator)
}
