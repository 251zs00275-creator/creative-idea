import OpenAI from 'openai'

/** OpenAI-compatible client — works with Ollama, Claude, or any provider */
export function createAiClient(): OpenAI {
  return new OpenAI({
    baseURL: process.env.AI_BASE_URL ?? 'http://localhost:11434/v1',
    apiKey: process.env.AI_API_KEY ?? 'ollama',
  })
}

export function getAiModel(): string {
  return process.env.AI_MODEL ?? 'llama3.2'
}

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

export async function chatWithRetry(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  systemPrompt: string,
): Promise<string> {
  const client = createAiClient()
  const model = getAiModel()

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await client.chat.completions.create({
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      })
      return res.choices[0]?.message?.content ?? ''
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt))
    }
  }
  throw new Error('AI request failed after retries')
}

/** Streaming — returns a ReadableStream of text chunks */
export async function streamChat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  systemPrompt: string,
): Promise<ReadableStream<string>> {
  const client = createAiClient()
  const model = getAiModel()

  const stream = await client.chat.completions.create({
    model,
    stream: true,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  })

  return new ReadableStream<string>({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) controller.enqueue(text)
      }
      controller.close()
    },
  })
}
