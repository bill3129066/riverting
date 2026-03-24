import { publicClient } from './xlayerClient.js'
import { rivertingEscrowAbi } from '../../../../shared/abis/RivertingEscrow.js'
import { config } from '../../config.js'

export function getEscrowAddress() {
  return config.escrowAddress as `0x${string}`
}

export async function getSession(sessionId: bigint) {
  if (!config.escrowAddress) return null
  return publicClient.readContract({
    address: getEscrowAddress(),
    abi: rivertingEscrowAbi,
    functionName: 'getSession',
    args: [sessionId],
  })
}

export async function getAgent(agentId: bigint) {
  if (!config.escrowAddress) return null
  return publicClient.readContract({
    address: getEscrowAddress(),
    abi: rivertingEscrowAbi,
    functionName: 'getAgent',
    args: [agentId],
  })
}
