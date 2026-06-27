import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694'

const metadata = {
  name: 'NOVA Airdrop',
  description: 'Claim your 900,000 NOVA tokens on BNB Smart Chain',
  url: 'https://anonxchang--addicted50.replit.app',
  icons: ['https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png']
}

const chains = [bsc] as const
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: false,
})

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#4f46e5',
    '--w3m-border-radius-master': '12px',
  },
  featuredWalletIds: [
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    'c57ca95b47569778a828d19178114f4db188b89b14915d8e7a6d71a47e5f94e3', // MetaMask
    '8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4', // Binance Web3
  ],
})

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
