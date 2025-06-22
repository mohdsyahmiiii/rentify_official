import { createOpenAI } from "@ai-sdk/openai"

// DeepSeek AI provider configuration
export const deepseek = createOpenAI({
  name: "deepseek",
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1",
})
