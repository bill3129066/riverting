export function buildSignMessage(wallet: string, action: string, skillId?: string): { message: string; timestamp: number } {
  const timestamp = Math.floor(Date.now() / 1000)
  let message = `Riverting Skill Action\nWallet: ${wallet}\nAction: ${action}\nTimestamp: ${timestamp}`
  if (skillId) message += `\nSkill: ${skillId}`
  return { message, timestamp }
}

export interface SignedHeaders {
  'X-Wallet-Address': string
  'X-Signature': string
  'X-Timestamp': string
}

export async function signAction(
  signMessageAsync: (args: { message: string }) => Promise<string>,
  wallet: string,
  action: string,
  skillId?: string,
): Promise<SignedHeaders> {
  const { message, timestamp } = buildSignMessage(wallet, action, skillId)
  const signature = await signMessageAsync({ message })
  return {
    'X-Wallet-Address': wallet,
    'X-Signature': signature,
    'X-Timestamp': String(timestamp),
  }
}
