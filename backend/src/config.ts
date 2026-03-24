export const config = {
  port: parseInt(process.env.PORT || '3001'),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  platformWallet: process.env.PLATFORM_WALLET || '0x0000000000000000000000000000000000000000',
  platformFeeRate: BigInt(process.env.PLATFORM_FEE_RATE || '300'),
  xlayerRpc: process.env.XLAYER_RPC_URL || 'https://rpc.xlayer.tech',
  xlayerWs: process.env.XLAYER_WS_URL || 'wss://xlayerws.okx.com',
  escrowAddress: process.env.ESCROW_CONTRACT_ADDRESS || '',
  usdcAddress: process.env.USDC_ADDRESS || '',
  platformOperatorKey: process.env.PLATFORM_OPERATOR_KEY || '',
  okxApiKey: process.env.OKX_API_KEY || '',
  okxSecretKey: process.env.OKX_SECRET_KEY || '',
  okxPassphrase: process.env.OKX_PASSPHRASE || '',
}
