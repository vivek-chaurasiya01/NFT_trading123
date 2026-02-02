// Network Switcher Utility
export const networkSwitcher = {
  
  // Get target network based on configuration
  getTargetNetwork() {
    const isProduction = import.meta.env.VITE_APP_ENV === 'production';
    const networkType = import.meta.env.VITE_NETWORK_TYPE || 'eth';
    
    if (networkType === 'bnb') {
      return {
        chainId: isProduction ? 56 : 97,
        chainIdHex: isProduction ? '0x38' : '0x61',
        name: isProduction ? 'BSC Mainnet' : 'BSC Testnet',
        rpcUrl: isProduction ? 'https://bsc-dataseed.binance.org/' : 'https://data-seed-prebsc-1-s1.binance.org:8545/',
        blockExplorer: isProduction ? 'https://bscscan.com' : 'https://testnet.bscscan.com',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18
        }
      };
    }
    
    // Default Ethereum
    return {
      chainId: isProduction ? 1 : 11155111,
      chainIdHex: isProduction ? '0x1' : '0xaa36a7',
      name: isProduction ? 'Ethereum Mainnet' : 'Sepolia Testnet',
      rpcUrl: isProduction ? 'https://mainnet.infura.io/v3/' : 'https://sepolia.infura.io/v3/',
      blockExplorer: isProduction ? 'https://etherscan.io' : 'https://sepolia.etherscan.io',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18
      }
    };
  },

  // Check if user is on correct network
  async checkNetwork() {
    try {
      if (!window.ethereum) {
        return { success: false, error: 'No wallet connected' };
      }

      const currentChainId = await window.ethereum.request({
        method: 'eth_chainId'
      });
      
      const currentChainIdDecimal = parseInt(currentChainId, 16);
      const targetNetwork = this.getTargetNetwork();
      
      return {
        success: true,
        isCorrectNetwork: currentChainIdDecimal === targetNetwork.chainId,
        currentChainId: currentChainIdDecimal,
        targetChainId: targetNetwork.chainId,
        targetNetwork
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Switch to target network
  async switchToTargetNetwork() {
    try {
      if (!window.ethereum) {
        throw new Error('No wallet connected');
      }

      const targetNetwork = this.getTargetNetwork();
      
      console.log(`🔄 Switching to ${targetNetwork.name}...`);
      
      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetNetwork.chainIdHex }]
        });
        
        console.log(`✅ Switched to ${targetNetwork.name}`);
        return { success: true, network: targetNetwork };
        
      } catch (switchError) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          console.log(`🔄 Adding ${targetNetwork.name} to wallet...`);
          
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetNetwork.chainIdHex,
              chainName: targetNetwork.name,
              rpcUrls: [targetNetwork.rpcUrl],
              blockExplorerUrls: [targetNetwork.blockExplorer],
              nativeCurrency: targetNetwork.nativeCurrency
            }]
          });
          
          console.log(`✅ Added and switched to ${targetNetwork.name}`);
          return { success: true, network: targetNetwork };
        }
        
        throw switchError;
      }
    } catch (error) {
      console.error('❌ Network switch failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to switch network'
      };
    }
  },

  // Auto-switch with user confirmation
  async autoSwitchWithConfirm() {
    const networkCheck = await this.checkNetwork();
    
    if (!networkCheck.success) {
      return networkCheck;
    }
    
    if (networkCheck.isCorrectNetwork) {
      return { success: true, message: 'Already on correct network' };
    }
    
    // Show confirmation dialog
    const confirmed = confirm(
      `You're on ${this.getNetworkName(networkCheck.currentChainId)}.\n\n` +
      `Switch to ${networkCheck.targetNetwork.name} for payments?`
    );
    
    if (!confirmed) {
      return { success: false, error: 'User cancelled network switch' };
    }
    
    return await this.switchToTargetNetwork();
  },

  // Get network name by chain ID
  getNetworkName(chainId) {
    const networks = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      56: 'BSC Mainnet',
      97: 'BSC Testnet'
    };
    
    return networks[chainId] || `Unknown Network (${chainId})`;
  }
};

export default networkSwitcher;