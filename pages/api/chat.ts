import { streamText, convertToModelMessages, stepCountIs } from 'ai'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getCurrentUser } from '@utils/getCurrentUser'
import { SYSTEM_PROMPT } from '@common/services/aiAssistant/prompt'
import { AI_MAX_STEPS, getModel } from '@common/services/aiAssistant/config'
import { buildAssistantTools } from '@common/services/aiAssistant/tools'
import type { UserContext } from '@common/services/paymentService/payment.service'

export const config = {
  api: {
    bodyParser: true,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  // Access gate: the assistant can read the user's own data via tools, so it
  // must run in an authenticated context. It is currently limited to admins
  // (DomainAdmin / GlobalAdmin) — this both scopes the feature and prevents
  // unauthenticated callers from burning the AI budget.
  let ctx: Awaited<ReturnType<typeof getCurrentUser>>
  try {
    ctx = await getCurrentUser(req, res)
  } catch {
    // getCurrentUser throws 'no user found' when there is no valid session.
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  if (!ctx.isAdmin) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  try {
    const { messages: uiMessages } = req.body

    if (!uiMessages || !Array.isArray(uiMessages)) {
      res.status(400).json({ error: 'Messages array is required' })
      return
    }

    // Resolves the active provider's model; throws if its API key is missing.
    const model = getModel()

    const userContext: UserContext = {
      isUser: ctx.isUser,
      isDomainAdmin: ctx.isDomainAdmin,
      isGlobalAdmin: ctx.isGlobalAdmin,
      user: { email: ctx.user.email },
    }

    const modelMessages = await convertToModelMessages(uiMessages)

    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools: buildAssistantTools(userContext),
      // Without this the SDK stops after the first step (a tool call) and never
      // produces a textual answer. Allow a few steps so the model can call a
      // tool and then respond based on its result.
      stopWhen: stepCountIs(AI_MAX_STEPS),
    })

    res.socket?.setNoDelay(true)
    result.pipeUIMessageStreamToResponse(res)
  } catch (error: any) {
    console.error('AI Chat API Error:', error)
    res.status(500).json({ error: error.message || 'Internal Server Error' })
  }
}
