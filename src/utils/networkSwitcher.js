const networkSwitcher = {
  async switchToNetwork(chainId) {
    if (!window.ethereum) return false;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      return true;
    } catch (error) {
      console.error('Network switch failed:', error);
      return false;
    }
  }
};

export default networkSwitcher;