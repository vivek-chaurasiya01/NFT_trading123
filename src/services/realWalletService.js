import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "viem/chains";
import { parseEther, formatEther } from "viem";
import {
  getAccount,
  getBalance,
  sendTransaction,
  waitForTransactionReceipt,
} from "@wagmi/core";
import networkUtils from "../utils/networkUtils";

const projectId =
  import.meta.env.VITE_REOWN_PROJECT_ID || "5af094431cbc89a0153658536ff59fcc";

// Company wallet address for receiving payments
const COMPANY_WALLET = "0x24d77352bf8cc9165cdd1eb781eca3fae75a778f";

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [sepolia],
});

const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [sepolia],
  projectId,
  metadata: {
    name: "GrowTradeNFT",
    description: "NFT Trading Platform with Real Wallet Integration",
    url: typeof window !== 'undefined' ? window.location.origin : 'https://gtnworld.live',
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
  },
  featuredWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
    "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase Wallet
  ],
  enableAnalytics: false,
  enableOnramp: false,
  enableInjected: true,
  allWallets: "SHOW",
  includeWalletIds: [
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
    "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa",
  ],
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#0f7a4a",
    "--w3m-border-radius-master": "8px",
  },
});

class RealWalletService {
  constructor() {
    this.modal = modal;
    this.account = null;
    this.isConnected = false;
    this.provider = null;
  }

  // Connect wallet with real integration
  async connectWallet() {
    try {
      console.log("🔄 Starting wallet connection...");
      
      // Check if running in browser environment
      if (!networkUtils.isBrowser()) {
        return {
          success: false,
          error: "Wallet connection not available in server environment"
        };
      }
      
      // First check if already connected
      const account = getAccount(wagmiAdapter.wagmiConfig);
      console.log("✅ Account check:", account);

      if (account.address && account.isConnected) {
        this.account = account.address;
        this.isConnected = true;

        return {
          success: true,
          account: this.account,
          network: account.chainId,
          method: "reown",
        };
      }

      // Direct modal open without network checks
      console.log("🚀 Opening wallet modal...");
      await this.modal.open({ view: "Connect" });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log("⏰ Connection timeout");
          reject(new Error("Connection timeout - Please try again"));
        }, 45000); // 45 seconds

        let attempts = 0;
        const maxAttempts = 45;

        const checkConnection = () => {
          attempts++;
          const account = getAccount(wagmiAdapter.wagmiConfig);
          console.log(`🔍 Check ${attempts}:`, account?.address ? 'Connected' : 'Not connected');

          if (account.address && account.isConnected) {
            this.account = account.address;
            this.isConnected = true;
            clearTimeout(timeout);
            console.log("✅ Wallet connected successfully!");

            resolve({
              success: true,
              account: this.account,
              network: account.chainId,
              method: "reown",
            });
            return true;
          }
          return false;
        };

        // Check immediately
        if (checkConnection()) return;

        // Poll every 1 second
        const pollInterval = setInterval(() => {
          if (checkConnection() || attempts >= maxAttempts) {
            clearInterval(pollInterval);
          }
        }, 1000);
      });
    } catch (error) {
      console.error("❌ Wallet connection error:", error);
      
      return {
        success: false,
        error: error.message || "Failed to connect wallet",
      };
    }
  }

  // Send real payment to company wallet
  async sendPayment(amountInUSD) {
    try {
      if (!this.isConnected || !this.account) {
        throw new Error("Wallet not connected");
      }

      // Check if user is on Sepolia network
      const account = getAccount(wagmiAdapter.wagmiConfig);
      if (account.chainId !== 11155111) {
        throw new Error("Please switch to Sepolia Testnet in your wallet");
      }

      // Convert USD to ETH (simplified - in production use real exchange rate)
      const ethAmount = (amountInUSD / 2000).toFixed(6); // Assuming 1 ETH = $2000
      const amountInWei = parseEther(ethAmount);

      console.log(
        `Sending ${ethAmount} ETH ($${amountInUSD}) to company wallet on Sepolia...`,
      );

      // Send transaction on Sepolia
      const hash = await sendTransaction(wagmiAdapter.wagmiConfig, {
        to: COMPANY_WALLET,
        value: amountInWei,
        chainId: 11155111, // Force Sepolia
      });

      console.log("Transaction sent on Sepolia:", hash);

      return {
        success: true,
        txHash: hash,
        from: this.account,
        to: COMPANY_WALLET,
        amount: ethAmount,
        amountUSD: amountInUSD,
      };
    } catch (error) {
      console.error("Payment error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get wallet balance
  async getBalance() {
    try {
      if (!this.isConnected || !this.account) {
        throw new Error("Wallet not connected");
      }

      const balance = await getBalance(wagmiAdapter.wagmiConfig, {
        address: this.account,
      });

      const balanceInEth = formatEther(balance.value);

      return {
        success: true,
        balance: parseFloat(balanceInEth).toFixed(4),
        balanceWei: balance.value.toString(),
      };
    } catch (error) {
      console.error("Balance fetch error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Check if wallet is connected
  isWalletConnected() {
    return this.isConnected && this.account !== null;
  }

  // Get connected account
  getAccount() {
    return this.account;
  }

  // Disconnect wallet
  async disconnect() {
    try {
      await this.modal.close();
      this.account = null;
      this.isConnected = false;
      this.provider = null;

      return {
        success: true,
        message: "Wallet disconnected",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get network info
  getNetworkInfo() {
    return {
      networkId: 11155111,
      networkName: "Sepolia Testnet",
    };
  }

  // Validate transaction
  async validateTransaction(txHash) {
    try {
      const receipt = await waitForTransactionReceipt(
        wagmiAdapter.wagmiConfig,
        {
          hash: txHash,
          timeout: 60000, // 1 minute timeout
        },
      );

      return {
        success: true,
        receipt,
        status: receipt.status === "success" ? "confirmed" : "failed",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new RealWalletService();
