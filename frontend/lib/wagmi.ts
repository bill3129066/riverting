import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { xlayerTestnet } from './networks'

export { xlayerTestnet as xlayer } from './networks'

export function createWagmiConfig() {
  return getDefaultConfig({
    appName: 'Riverting',
    projectId: 'riverting-hackathon',
    chains: [xlayerTestnet],
    ssr: true,
  })
}
