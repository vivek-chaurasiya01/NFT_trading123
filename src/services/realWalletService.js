// RealWalletService.js
import { createAppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "viem/chains";
import { parseEther, formatEther } from "viem";
import {
  getBalance,
  sendTransaction,
  waitForTransactionReceipt,
  watchAccount,
} from "@wagmi/core";
import networkUtils from "../utils/networkUtils";

/* ------------------------------------------------------------------ */
/* CONFIG */
/* ------------------------------------------------------------------ */

const projectId =
  import.meta.env.VITE_REOWN_PROJECT_ID || "5af094431cbc89a0153658536ff59fcc";

const COMPANY_WALLET = "0x24d77352bf8cc9165cdd1eb781eca3fae75a778f";

/* ------------------------------------------------------------------ */
/* SINGLETON WALLET KIT (VERY IMPORTANT) */
/* ------------------------------------------------------------------ */

let modalInstance = null;
let wagmiAdapterInstance = null;

function getWalletKit() {
  if (!wagmiAdapterInstance) {
    wagmiAdapterInstance = new WagmiAdapter({
      projectId,
      networks: [sepolia],
    });
  }

  if (!modalInstance) {
    modalInstance = createAppKit({
      adapters: [wagmiAdapterInstance],
      networks: [sepolia],
      projectId,
      metadata: {
        name: "GrowTradeNFT",
        description: "NFT Trading Platform",
        url:
          typeof window !== "undefined"
            ? window.location.origin
            : "https://gtnworld.live",
        icons: ["https://avatars.githubusercontent.com/u/37784886"],
      },
      enableAnalytics: false,
      enableOnramp: false,
      enableInjected: true,
      allWallets: "SHOW",
      themeMode: "light",
    });
  }

  return {
    modal: modalInstance,
    wagmiConfig: wagmiAdapterInstance.wagmiConfig,
  };
}

/* ------------------------------------------------------------------ */
/* SERVICE */
/* ------------------------------------------------------------------ */

class RealWalletService {
  constructor() {
    const { modal, wagmiConfig } = getWalletKit();

    this.modal = modal;
    this.wagmiConfig = wagmiConfig;

    this.account = null;
    this.isConnected = false;
    this.unsubscribe = null;
  }

  /* -------------------- CONNECT WALLET -------------------- */

  async connectWallet() {
    try {
      console.log("🔄 Starting wallet connection...");

      if (!networkUtils.isBrowser()) {
        return {
          success: false,
          error: "Wallet not available on server",
        };
      }

      // Start listening BEFORE opening modal
      if (!this.unsubscribe) {
        this.unsubscribe = watchAccount(this.wagmiConfig, {
          onChange: (account) => {
            console.log("🔄 Account changed:", account);

            if (account.isConnected) {
              this.account = account.address;
              this.isConnected = true;
            } else {
              this.account = null;
              this.isConnected = false;
            }
          },
        });
      }

      await this.modal.open({ view: "Connect" });

      // Wait until wallet connects (event based)
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Connection timeout – wallet not connected"));
        }, 30000);

        const check = setInterval(() => {
          if (this.isConnected && this.account) {
            clearTimeout(timeout);
            clearInterval(check);

            resolve({
              success: true,
              account: this.account,
              network: 11155111,
              method: "reown",
            });
          }
        }, 300);
      });
    } catch (error) {
      console.error("❌ Wallet connect error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /* -------------------- BALANCE -------------------- */

  async getBalance() {
    try {
      if (!this.isConnected || !this.account) {
        throw new Error("Wallet not connected");
      }

      const balance = await getBalance(this.wagmiConfig, {
        address: this.account,
      });

      return {
        success: true,
        balance: Number(formatEther(balance.value)).toFixed(4),
        balanceWei: balance.value.toString(),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /* -------------------- SEND PAYMENT -------------------- */

  async sendPayment(amountInUSD) {
    try {
      if (!this.isConnected || !this.account) {
        throw new Error("Wallet not connected");
      }

      const ethAmount = (amountInUSD / 2000).toFixed(6);
      const value = parseEther(ethAmount);

      const hash = await sendTransaction(this.wagmiConfig, {
        to: COMPANY_WALLET,
        value,
        chainId: 11155111,
      });

      return {
        success: true,
        txHash: hash,
        amountETH: ethAmount,
        amountUSD: amountInUSD,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /* -------------------- TX CONFIRM -------------------- */

  async validateTransaction(txHash) {
    try {
      const receipt = await waitForTransactionReceipt(this.wagmiConfig, {
        hash: txHash,
      });

      return {
        success: true,
        status: receipt.status,
        receipt,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /* -------------------- DISCONNECT -------------------- */

  async disconnect() {
    try {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }

      await this.modal.close();

      this.account = null;
      this.isConnected = false;

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /* -------------------- HELPERS -------------------- */

  isWalletConnected() {
    return this.isConnected;
  }

  getAccount() {
    return this.account;
  }

  getNetworkInfo() {
    return {
      networkId: 11155111,
      networkName: "Sepolia Testnet",
    };
  }
}

export default new RealWalletService();
