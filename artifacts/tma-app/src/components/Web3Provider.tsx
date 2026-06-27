import { createWeb3Modal } from '@web3modal/wagmi/react'
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { WagmiProvider } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const projectId = 'demo-project-id'

const metadata = {
  name: 'Nova Airdrop',
  description: 'Premium airdrop claim terminal',
  url: 'https://nova-airdrop.com', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet] as const
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
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
