import { defineChain } from 'viem'

// ─── Chain definitions ────────────────────────────────────────

export const xlayerTestnet = defineChain({
  id: 1952,
  name: 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testrpc.xlayer.tech/terigon', 'https://xlayertestrpc.okx.com/terigon'] },
    public:  { http: ['https://testrpc.xlayer.tech/terigon', 'https://xlayertestrpc.okx.com/terigon'] },
  },
  blockExplorers: {
    default: { name: 'OKLink', url: 'https://www.oklink.com/xlayer-test' },
  },
  testnet: true,
})

export const xlayerMainnet = defineChain({
  id: 196,
  name: 'X Layer',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.xlayer.tech', 'https://xlayerrpc.okx.com'] },
    public:  { http: ['https://rpc.xlayer.tech', 'https://xlayerrpc.okx.com'] },
  },
  blockExplorers: {
    default: { name: 'OKLink', url: 'https://www.oklink.com/xlayer' },
  },
  testnet: false,
})

// ─── Contract addresses per chain ────────────────────────────

export interface NetworkConfig {
  usdcAddress: `0x${string}`
  escrowAddress: `0x${string}`
  explorerUrl: string
  label: string
}

export const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
  // X Layer Testnet
  [xlayerTestnet.id]: {
    usdcAddress:   '0xcb8bf24c6ce16ad21d707c9505421a17f2bec79d',
    escrowAddress: '0x93e2794E042b6326356768B7CfDeFc871008239e',
    explorerUrl:   'https://www.oklink.com/xlayer-test',
    label: 'X Layer Testnet',
  },
  // X Layer Mainnet (addresses TBD — update after deployment)
  [xlayerMainnet.id]: {
    usdcAddress:   '0x74b7F16337b8972027F6196A17a631aC6dE26d22', // placeholder
    escrowAddress: '0x0000000000000000000000000000000000000000', // placeholder
    explorerUrl:   'https://www.oklink.com/xlayer',
    label: 'X Layer',
  },
}

/** Returns the config for the currently connected chain, falling back to testnet. */
export function getNetworkConfig(chainId: number | undefined): NetworkConfig {
  return NETWORK_CONFIGS[chainId ?? xlayerTestnet.id] ?? NETWORK_CONFIGS[xlayerTestnet.id]
}
