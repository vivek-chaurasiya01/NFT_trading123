import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'

import App from './App.jsx'

// Import wagmi config from our wallet service
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { sepolia, mainnet } from 'viem/chains'

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || '5af094431cbc89a0153658536ff59fcc'

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [sepolia, mainnet]
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
)
