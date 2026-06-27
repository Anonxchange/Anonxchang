import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694'

const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://anonxchang--dicee142.replit.app'

const metadata = {
  name: 'NOVA Airdrop',
  description: 'Claim your 900,000 NOVA tokens',
  url: appUrl,
  icons: ['https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png']
}

const chains = [bsc] as const
const config = defaultWagmiConfig({ chains, projectId, metadata })

createWeb3Modal({ wagmiConfig: config, projectId, enableAnalytics: false })

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
