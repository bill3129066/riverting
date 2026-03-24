import type { Context, Next } from 'hono'
import { getDb } from '../../db/client.js'
import { randomUUID } from 'crypto'

export interface PriceConfig {
  amount: string
  asset: 'USDC'
  network: 'xlayer' | 'base'
}

export const QUERY_PRICES: Record<string, PriceConfig> = {
  '/queries/agent/:id/summary': { amount: '0.001', asset: 'USDC', network: 'xlayer' },
  '/queries/agent/:id/ask': { amount: '0.003', asset: 'USDC', network: 'xlayer' },
  '/queries/agent/:id/evidence': { amount: '0.005', asset: 'USDC', network: 'xlayer' },
}

export function x402Middleware(price: PriceConfig) {
  return async (c: Context, next: Next) => {
    const paymentHeader = c.req.header('X-Payment') || c.req.header('x-payment')

    if (!paymentHeader) {
      return c.json({
        error: 'Payment Required',
        x402Version: 1,
        accepts: [{
          scheme: 'exact',
          network: price.network,
          maxAmountRequired: price.amount,
          resource: c.req.url,
          description: `Pay ${price.amount} ${price.asset} to access this analysis`,
          mimeType: 'application/json',
          payTo: process.env.X402_PAYMENT_ADDRESS || process.env.PLATFORM_WALLET || '0x0000000000000000000000000000000000000000',
          maxTimeoutSeconds: 300,
          asset: price.asset === 'USDC'
            ? (process.env.USDC_ADDRESS || '0x74b7F16337b8972027F6196A17a631aC6dE26d22')
            : price.asset,
          extra: { name: 'Riverting Analysis', version: '1.0' },
        }],
      }, 402)
    }

    try {
      const db = getDb()
      const agentId = parseInt(c.req.param('id') || '1')
      db.prepare(`
        INSERT INTO query_sales (id, agent_id, route, payer_address, amount_usdc, receipt_ref, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        randomUUID(),
        agentId,
        c.req.path,
        'unknown', // Would extract from payment header in production
        price.amount,
        paymentHeader.slice(0, 100),
      )
    } catch (_e) {
      // Non-critical: don't block request if logging fails
    }

    await next()
  }
}
