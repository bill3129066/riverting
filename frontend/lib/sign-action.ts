export function buildSignMessage(wallet: string, action: string, resourceId?: string): { message: string; timestamp: number } {
  const timestamp = Math.floor(Date.now() / 1000)
  let message = `Riverting Action\nWallet: ${wallet}\nAction: ${action}\nTimestamp: ${timestamp}`
  if (resourceId) message += `\nResource: ${resourceId}`
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
  resourceId?: string,
): Promise<SignedHeaders> {
  const { message, timestamp } = buildSignMessage(wallet, action, resourceId)
  const signature = await signMessageAsync({ message })
  return {
    'X-Wallet-Address': wallet,
    'X-Signature': signature,
    'X-Timestamp': String(timestamp),
  }
}
