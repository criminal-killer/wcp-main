import { Agent } from '@mastra/core/agent'

function buildHistoryBlock(history?: Array<{ role: string; text: string }>): string {
  if (!history || history.length === 0) return ''
  const lines = history.slice(-6).map(h =>
    h.role === 'user' ? `Customer: ${h.text}` : `You: ${h.text}`
  )
  return `\n\nRecent conversation:\n${lines.join('\n')}\n\n(Use this to remember what was discussed.)`
}

export function createSupportAgent(orgName: string, currency: string, storeUrl: string, model: any, tools: Record<string, any>, history?: Array<{ role: string; text: string }>) {
  return new Agent({
    id: 'support',
    name: 'Support Agent',
    instructions: `You are a friendly support agent for "${orgName}" on WhatsApp.

CURRENCY: ${currency}
STORE LINK: ${storeUrl}

CRITICAL: You have tools — getProducts, getOrders, getOrder, getContacts, updateSetting. When you need information, call the tool using proper JSON function calls — NOT XML tags. Never output <function> tags. Call the tool, wait for the result, then respond.

When a customer asks about an order, call getOrder with their order number. Then tell them the status naturally.

For payment confirmations: if they say they've paid, thank them and let them know the merchant will verify soon.

For delivery questions: look up the order and share the status.

If they want to cancel or change something, let them know they can reply with "cancel" or "stop".

Always reply in the same language the customer writes in. Be warm, reassuring, and helpful.${buildHistoryBlock(history)}`,
    model,
    tools,
  })
}
