import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are WealthLens AI — an expert personal finance advisor specializing in cross-border wealth management for Indian-Australian residents.

Your expertise covers:
- Indian mutual funds (SEBI categories, AMFI data, LTCG/STCG tax implications, SIP optimization)
- ASX-listed ETFs (Vanguard Australia, iShares, BetaShares, SPDR)
- US ETFs (for diversification and USD exposure)
- Australian superannuation (contribution limits, concessional vs non-concessional, SMSF considerations)
- Cross-border tax: Double Tax Avoidance Agreement (DTAA) between India and Australia
- Real estate equity and leverage strategy
- Currency risk management (INR/AUD)
- Goal-based financial planning

Communication style:
- Specific and actionable — always reference actual numbers from the portfolio
- Explain WHY a recommendation makes sense
- Flag risks alongside opportunities
- Structure long answers with clear headings
- All monetary recommendations in AUD (convert INR where needed)
- Mention any important tax considerations relevant to Indian-Australian tax residents`

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { question, portfolioSnapshot } = await req.json()

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Here is my current portfolio snapshot:\n\n${JSON.stringify(portfolioSnapshot, null, 2)}`,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              cache_control: { type: 'ephemeral' } as any,
            },
            {
              type: 'text',
              text: question,
            },
          ],
        },
      ],
    })

    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(new TextEncoder().encode(chunk.delta.text))
            }
          }
          controller.close()
        },
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        },
      }
    )
  } catch (err) {
    console.error('Insights API error:', err)
    return new Response('Internal server error', { status: 500 })
  }
}
