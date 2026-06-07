import { Agent } from '@mastra/core/agent'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createStoreTools } from '../tools/store-tools'
import { decrypt } from '@/lib/encryption'

type OrgConfig = {
  id: string
  ai_provider?: string | null
  ai_model?: string | null
  ai_api_key_encrypted?: string | null
  ai_endpoint_url?: string | null
  name: string
  currency: string
  description?: string | null
  ai_system_prompt?: string | null
  ai_persona?: string | null
  plan?: string | null
}

function buildModel(org: OrgConfig) {
  const isPremium = ['pro', 'elite', 'custom'].includes(org.plan || '')
  const provider = (isPremium || org.ai_provider === 'Chatevo' || !org.ai_provider) ? 'Chatevo' : org.ai_provider!

  switch (provider) {
    case 'Chatevo':
      return createGroq({ apiKey: process.env.GROQ_API_KEY })(org.ai_model || 'llama-3.3-70b-versatile')
    case 'openai': {
      const apiKey = org.ai_api_key_encrypted ? decrypt(org.ai_api_key_encrypted) : ''
      return createOpenAI({ apiKey })(org.ai_model || 'gpt-4o-mini')
    }
    case 'anthropic': {
      const apiKey = org.ai_api_key_encrypted ? decrypt(org.ai_api_key_encrypted) : ''
      return createAnthropic({ apiKey })(org.ai_model || 'claude-3-5-sonnet-20240620')
    }
    case 'google': {
      const apiKey = org.ai_api_key_encrypted ? decrypt(org.ai_api_key_encrypted) : ''
      return createGoogleGenerativeAI({ apiKey })(org.ai_model || 'gemini-1.5-flash')
    }
    case 'custom': {
      const apiKey = org.ai_api_key_encrypted ? decrypt(org.ai_api_key_encrypted) : ''
      return createOpenAI({ apiKey, baseURL: org.ai_endpoint_url || undefined })(org.ai_model || 'gpt-4o-mini')
    }
    default:
      return createGroq({ apiKey: process.env.GROQ_API_KEY })('llama-3.3-70b-versatile')
  }
}

function buildInstructions(generalPrompt: string, org: OrgConfig) {
  let context = `\nStore Context: Brand name is "${org.name}", currency is ${org.currency}. `
  if (org.description) context += `Description: ${org.description}. `

  const systemPrompt = generalPrompt + context + (org.ai_system_prompt || '')

  if (org.ai_persona === 'sales' && !org.ai_system_prompt?.includes('products')) {
    context += `\nYou have access to the getProducts tool — use it to look up products when the merchant asks about them.`
  }

  return systemPrompt
}

export function createStoreAgent(org: OrgConfig, generalPrompt: string) {
  const model = buildModel(org)
  const instructions = buildInstructions(generalPrompt, org)
  const tools = createStoreTools(org.id)

  return new Agent({
    id: 'store-agent',
    name: 'Chatevo Store Agent',
    instructions,
    model,
    tools,
  })
}
