interface OrgSchema {
  ai_personality?: string | null
  ai_rules?: string | null
  ai_enabled?: number | null
}

export async function generateAiReply(
  org: OrgSchema,
  message: string,
  history: any[] = []
): Promise<string> {
  // Safe stub for AI generation logic
  return "I'm a virtual assistant. Currently, AI functionality is not configured for this store."
}
