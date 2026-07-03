import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { OpenAIMock, createMock } = vi.hoisted(() => {
  const createMock = vi.fn()
  // アロー関数は new できないため、通常のfunction式でコンストラクタ互換にする
  const OpenAIMock = vi.fn().mockImplementation(function () {
    return { chat: { completions: { create: createMock } } }
  })
  return { OpenAIMock, createMock }
})

vi.mock('openai', () => ({ default: OpenAIMock }))

import { chatWithRetry, createAiClient, getAiModel, streamChat } from './ai'

// createAiClient/getAiModelは `??` でデフォルト値を決めるため、空文字ではなく
// 「キー自体が存在しない」状態を再現する必要がある(vi.stubEnvは空文字しか
// 設定できないため、対象の環境変数を一時的にdeleteする)
function withoutEnv<T>(keys: string[], fn: () => T): T {
  const original: Record<string, string | undefined> = {}
  for (const key of keys) {
    original[key] = process.env[key]
    delete process.env[key]
  }
  try {
    return fn()
  } finally {
    for (const key of keys) {
      if (original[key] !== undefined) process.env[key] = original[key]
    }
  }
}

describe('createAiClient / getAiModel', () => {
  beforeEach(() => {
    OpenAIMock.mockClear()
    vi.unstubAllEnvs()
  })

  test('uses local Ollama defaults when env vars are unset', () => {
    withoutEnv(['AI_BASE_URL', 'AI_API_KEY'], () => createAiClient())
    expect(OpenAIMock).toHaveBeenCalledWith({
      baseURL: 'http://localhost:11434/v1',
      apiKey: 'ollama',
    })
  })

  test('uses configured env vars when present', () => {
    vi.stubEnv('AI_BASE_URL', 'https://api.example.com/v1')
    vi.stubEnv('AI_API_KEY', 'secret-key')
    createAiClient()
    expect(OpenAIMock).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com/v1',
      apiKey: 'secret-key',
    })
  })

  test('getAiModel defaults to llama3.2', () => {
    expect(withoutEnv(['AI_MODEL'], () => getAiModel())).toBe('llama3.2')
  })

  test('getAiModel returns the configured model', () => {
    vi.stubEnv('AI_MODEL', 'gpt-4o-mini')
    expect(getAiModel()).toBe('gpt-4o-mini')
  })
})

describe('chatWithRetry', () => {
  beforeEach(() => {
    createMock.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('returns the response content on the first successful attempt', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: 'こんにちは' } }] })
    const result = await chatWithRetry([{ role: 'user', content: 'hi' }], 'system prompt')
    expect(result).toBe('こんにちは')
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  test('retries after a failure and succeeds on a later attempt', async () => {
    vi.useFakeTimers()
    createMock
      .mockRejectedValueOnce(new Error('fail once'))
      .mockResolvedValueOnce({ choices: [{ message: { content: 'ok' } }] })

    const promise = chatWithRetry([{ role: 'user', content: 'hi' }], 'system')
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBe('ok')
    expect(createMock).toHaveBeenCalledTimes(2)
  })

  test('throws the last error after exhausting all retries', async () => {
    vi.useFakeTimers()
    createMock.mockRejectedValue(new Error('always fails'))

    const promise = chatWithRetry([{ role: 'user', content: 'hi' }], 'system')
    const assertion = expect(promise).rejects.toThrow('always fails')
    await vi.runAllTimersAsync()
    await assertion
    expect(createMock).toHaveBeenCalledTimes(3)
  })
})

describe('streamChat', () => {
  beforeEach(() => {
    createMock.mockReset()
  })

  test('yields each text chunk from the underlying stream', async () => {
    createMock.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield { choices: [{ delta: { content: 'Hello ' } }] }
        yield { choices: [{ delta: { content: 'World' } }] }
      },
    })

    const stream = await streamChat([{ role: 'user', content: 'hi' }], 'system')
    const reader = stream.getReader()
    const chunks: string[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    expect(chunks).toEqual(['Hello ', 'World'])
  })

  test('skips empty delta content chunks', async () => {
    createMock.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield { choices: [{ delta: {} }] }
        yield { choices: [{ delta: { content: 'X' } }] }
      },
    })

    const stream = await streamChat([{ role: 'user', content: 'hi' }], 'system')
    const reader = stream.getReader()
    const chunks: string[] = []
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    expect(chunks).toEqual(['X'])
  })
})
