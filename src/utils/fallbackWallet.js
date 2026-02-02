// Fallback Wallet Connection - Direct MetaMask connection
export const fallbackWalletConnection = {
  
  // Direct MetaMask connection
  async connectMetaMask() {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      console.log('🔄 Attempting direct MetaMask connection...');
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      
      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      console.log('✅ Direct MetaMask connection successful:', {
        address,
        chainId: parseInt(chainId, 16)
      });

      return {
        success: true,
        account: address,
        chainId: parseInt(chainId, 16),
        method: 'direct_metamask'
      };
    } catch (error) {
      console.error('❌ Direct MetaMask connection failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect MetaMask'
      };
    }
  },

  // Get balance using direct MetaMask
  async getBalance(address) {
    try {
      if (!window.ethereum || !address) {
        throw new Error('MetaMask not available or address missing');
      }

      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });

      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      
      return {
        success: true,
        balance: balanceInEth.toFixed(4),
        balanceWei: balance
      };
    } catch (error) {
      console.error('❌ Balance fetch failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch balance'
      };
    }
  },

  // Check if MetaMask is available
  isMetaMaskAvailable() {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined' && 
           window.ethereum.isMetaMask;
  },

  // Switch to correct network
  async switchToNetwork(chainId) {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not available');
      }

      const chainIdHex = '0x' + chainId.toString(16);
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Network switch failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to switch network'
      };
    }
  }
};

export default fallbackWalletConnection;