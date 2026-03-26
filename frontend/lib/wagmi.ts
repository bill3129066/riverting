import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { xlayerTestnet, xlayerMainnet } from './networks'

export { xlayerTestnet as xlayer } from './networks'

export function createWagmiConfig() {
  return getDefaultConfig({
    appName: 'Riverting',
    projectId: 'riverting-hackathon',
    chains: [xlayerTestnet, xlayerMainnet],
    ssr: true,
  })
}
