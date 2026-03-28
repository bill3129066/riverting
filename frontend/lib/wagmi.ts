import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { xlayerMainnet } from './networks'

export { xlayerMainnet as xlayer } from './networks'

export function createWagmiConfig() {
  return getDefaultConfig({
    appName: 'Riverting',
    projectId: 'riverting-hackathon',
    chains: [xlayerMainnet],
    ssr: true,
  })
}
