import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { bsc, type AppKitNetwork } from '@reown/appkit/networks'
import { WagmiProvider, useReconnect, cookieStorage, createStorage } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useEffect } from 'react'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''

const APP_URL = 'https://anonxchang--airdropper06.replit.app'

const metadata = {
  name: 'NOVA Airdrop',
  description: 'Claim your 900,000 NOVA tokens on BNB Smart Chain',
  url: APP_URL,
  icons: ['https://coin-images.coingecko.com/coins/images/52975/large/NOVA_Logo.png']
}

const networks = [bsc] as [AppKitNetwork, ...AppKitNetwork[]]

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
  storage: createStorage({ storage: cookieStorage }),
})

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false,
    emailShowWallets: false,
    onramp: false,
    swaps: false,
  },
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

function WalletReconnect() {
  const { reconnect } = useReconnect()

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reconnect()
    }
    const onFocus = () => reconnect()

    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
    }
  }, [reconnect])

  return null
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} reconnectOnMount>
      <QueryClientProvider client={queryClient}>
        <WalletReconnect />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
