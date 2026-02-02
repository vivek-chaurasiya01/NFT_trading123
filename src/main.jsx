import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

import App from "./App.jsx";
import realWalletService from "./services/realWalletService.js";

// ✅ IMPORT SAME wagmiConfig FROM SERVICE
// import walletService from "./services/RealWalletService";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  // ❌ StrictMode hata diya (DEV me)
  <WagmiProvider config={realWalletService.wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </WagmiProvider>,
);
