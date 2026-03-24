import { defineChain } from 'viem'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const xlayer = defineChain({
  id: 196,
  name: 'X Layer',
  nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.xlayer.tech'] },
    public: { http: ['https://rpc.xlayer.tech'] },
  },
  blockExplorers: {
    default: { name: 'OKLink', url: 'https://www.oklink.com/xlayer' },
  },
})

export const wagmiConfig = getDefaultConfig({
  appName: 'Riverting',
  projectId: 'riverting-hackathon',
  chains: [xlayer],
  ssr: true,
})
