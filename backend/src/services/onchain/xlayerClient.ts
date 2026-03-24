import { createPublicClient, createWalletClient, http, type Chain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { config } from '../../config.js'

const xlayer = {
  id: 196,
  name: 'X Layer',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: [config.xlayerRpc], webSocket: [config.xlayerWs] },
  },
} as const satisfies Chain

const xlayerTestnet = {
  id: 195,
  name: 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testrpc.xlayer.tech'] },
  },
} as const satisfies Chain

const activeChain: Chain =
  config.xlayerRpc.includes('testnet') || config.xlayerRpc.includes('testrpc')
    ? xlayerTestnet
    : xlayer

export const publicClient = createPublicClient({
  chain: activeChain,
  transport: http(config.xlayerRpc),
})

export function getWalletClient(privateKey: `0x${string}`) {
  const account = privateKeyToAccount(privateKey)
  return createWalletClient({
    account,
    chain: activeChain,
    transport: http(config.xlayerRpc),
  })
}
