import { getDb } from '../../db/client.js'

export interface UserBalance {
  wallet: string
  balance: number
  total_deposited: number
  total_spent: number
}

export function getBalance(wallet: string): UserBalance {
  const db = getDb()
  const row = db.prepare('SELECT * FROM user_balances WHERE wallet = $wallet').get({ $wallet: wallet.toLowerCase() }) as UserBalance | undefined

  if (!row) {
    return { wallet: wallet.toLowerCase(), balance: 0, total_deposited: 0, total_spent: 0 }
  }
  return row
}

export function deposit(wallet: string, amount: number): UserBalance {
  const db = getDb()
  const w = wallet.toLowerCase()

  db.prepare(`
    INSERT INTO user_balances (wallet, balance, total_deposited)
    VALUES ($wallet, $amount, $amount)
    ON CONFLICT(wallet) DO UPDATE SET
      balance = balance + $amount,
      total_deposited = total_deposited + $amount,
      updated_at = datetime('now')
  `).run({ $wallet: w, $amount: amount })

  return getBalance(w)
}

/**
 * Charge a user for a skill execution.
 * Returns true if charge succeeded, false if insufficient balance.
 * If price is 0, always succeeds (free skill).
 */
/**
 * Atomically charge a user. Uses WHERE balance >= amount to prevent
 * race conditions where concurrent requests overdraft the account.
 * Returns true if charge succeeded, false if insufficient balance.
 */
export function charge(wallet: string, amount: number): boolean {
  if (amount <= 0) return true

  const db = getDb()
  const w = wallet.toLowerCase()

  const result = db.prepare(`
    UPDATE user_balances SET
      balance = balance - $amount,
      total_spent = total_spent + $amount,
      updated_at = datetime('now')
    WHERE wallet = $wallet AND balance >= $amount
  `).run({ $wallet: w, $amount: amount })

  return result.changes > 0
}
