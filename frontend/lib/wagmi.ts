import { defineChain } from 'viem'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const xlayer = defineChain({
  id: 1952,
  name: 'X Layer Testnet',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testrpc.xlayer.tech/terigon', 'https://xlayertestrpc.okx.com/terigon'] },
    public: { http: ['https://testrpc.xlayer.tech/terigon', 'https://xlayertestrpc.okx.com/terigon'] },
  },
  blockExplorers: {
    default: { name: 'OKLink', url: 'https://www.oklink.com/xlayer-test' },
  },
  testnet: true,
})

export function createWagmiConfig() {
  return getDefaultConfig({
    appName: 'Riverting',
    projectId: 'riverting-hackathon',
    chains: [xlayer],
    ssr: true,
  })
}
