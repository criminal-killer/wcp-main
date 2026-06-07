import { createGroq } from '@ai-sdk/groq'
import { Agent } from '@mastra/core/agent'
import { createGreeterAgent } from './greeter-agent'
import { createSalesAgent } from './sales-agent'
import { createSupportAgent } from './support-agent'
import { createStoreTools, createContactTools } from '../tools/store-tools'

type OrgConfig = {
  id: string
  name: string
  currency: string
  slug: string
}

type ContactInfo = {
  id: string
  name: string | null
  phone: string
}

const defaultModel = createGroq({ apiKey: process.env.GROQ_API_KEY })('llama-3.3-70b-versatile')

function classifyIntent(input: string, contact: ContactInfo): string {
  const hasName = !!contact.name
  const trimmed = input.trim().toLowerCase()
  const isGreeting = /^(hi|hello|hey|start|morning|evening|yo|howdy|sasa|jambo|hujambo|hola|ola|bonjour|hallo|hei)\b/i.test(trimmed)

  if (!hasName && isGreeting) return 'greeter'
  if (/\b(order|ORD-|tracking|delivery|shipped|status|cancel)\b/i.test(trimmed)) return 'support'
  if (/\b(paid|payment|money|mpesa|sent|done|completed|paid already)\b/i.test(trimmed)) return 'support'
  if (/\b(buy|want|need|looking for|price|cost|how much|available|have you|sell|product|item)\b/i.test(trimmed)) return 'sales'

  return 'sales'
}

export async function routeToAgent(
  input: string,
  contact: ContactInfo,
  org: OrgConfig,
  storeUrl: string,
) {
  const model = defaultModel
  const storeTools = createStoreTools(org.id)
  const contactTools = createContactTools(org.id, contact.id)

  const intent = classifyIntent(input, contact)

  let agent: Agent<any, any, any, any, any>

  switch (intent) {
    case 'greeter':
      agent = createGreeterAgent(model, contactTools)
      console.log(`[orchestrator] routing to Greeter agent for ${contact.phone}`)
      break
    case 'support':
      agent = createSupportAgent(org.name, org.currency, storeUrl, model, storeTools)
      console.log(`[orchestrator] routing to Support agent for ${contact.phone}`)
      break
    default:
      agent = createSalesAgent(org.name, org.currency, storeUrl, model, storeTools)
      console.log(`[orchestrator] routing to Sales agent for ${contact.phone}`)
      break
  }

  const response = await agent.generateLegacy(input, { maxSteps: 3 })
  return response.text || ''
}

export type { OrgConfig, ContactInfo }
