import type { Context, Next } from 'hono'
import { verifyMessage } from 'viem'

const TIMESTAMP_MAX_AGE_SEC = 300 // 5 minutes

export function buildSignMessage(wallet: string, action: string, skillId: string | undefined, timestamp: number): string {
  let msg = `Riverting Skill Action\nWallet: ${wallet}\nAction: ${action}\nTimestamp: ${timestamp}`
  if (skillId) msg += `\nSkill: ${skillId}`
  return msg
}

/**
 * Hono middleware that verifies EIP-191 personal_sign signatures.
 * On success, sets c.verifiedWallet to the recovered address.
 */
export function requireSignature(action: string) {
  return async (c: Context, next: Next) => {
    const wallet = c.req.header('x-wallet-address')
    const signature = c.req.header('x-signature')
    const timestampStr = c.req.header('x-timestamp')

    if (!wallet || !signature || !timestampStr) {
      return c.json({ error: 'Missing authentication headers: x-wallet-address, x-signature, x-timestamp' }, 401)
    }

    const timestamp = parseInt(timestampStr)
    if (isNaN(timestamp)) {
      return c.json({ error: 'Invalid timestamp' }, 401)
    }

    // Check timestamp freshness
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - timestamp) > TIMESTAMP_MAX_AGE_SEC) {
      return c.json({ error: 'Signature expired. Please sign again.' }, 401)
    }

    // Build the expected message
    const skillId = c.req.param('id')
    const message = buildSignMessage(wallet, action, skillId, timestamp)

    try {
      const valid = await verifyMessage({
        address: wallet as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      })

      if (!valid) {
        return c.json({ error: 'Invalid signature' }, 401)
      }
    } catch {
      return c.json({ error: 'Signature verification failed' }, 401)
    }

    // Set verified wallet for downstream handlers
    c.set('verifiedWallet', wallet.toLowerCase())
    await next()
  }
}
