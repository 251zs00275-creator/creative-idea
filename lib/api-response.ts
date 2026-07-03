import { NextResponse } from 'next/server'

/**
 * Supabase等のDBエラーをそのままクライアントに返さず、
 * サーバー側にログを残しつつ汎用メッセージを返す。
 */
export function dbErrorResponse(context: string, error: { message: string }) {
  console.error(`[${context}]`, error.message)
  return NextResponse.json(
    { error: '処理中にエラーが発生しました' },
    { status: 500 }
  )
}
