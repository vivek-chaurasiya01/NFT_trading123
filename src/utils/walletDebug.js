// Wallet Debug Utility
export const walletDebug = {
  // Check if MetaMask is installed
  isMetaMaskInstalled() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
  },

  // Check if any wallet is installed
  isWalletInstalled() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  },

  // Get browser info
  getBrowserInfo() {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    return {
      browser,
      userAgent,
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    };
  },

  // Check network connectivity
  async checkConnectivity() {
    try {
      const response = await fetch('https://api.github.com/zen', { 
        method: 'GET',
        mode: 'cors'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  // Get detailed wallet info
  getWalletInfo() {
    if (typeof window === 'undefined') return null;
    
    const info = {
      hasEthereum: !!window.ethereum,
      isMetaMask: !!(window.ethereum && window.ethereum.isMetaMask),
      isTrust: !!(window.ethereum && window.ethereum.isTrust),
      isCoinbase: !!(window.ethereum && window.ethereum.isCoinbaseWallet),
      providers: []
    };

    if (window.ethereum) {
      if (window.ethereum.providers) {
        info.providers = window.ethereum.providers.map(p => ({
          isMetaMask: p.isMetaMask,
          isTrust: p.isTrust,
          isCoinbaseWallet: p.isCoinbaseWallet
        }));
      } else {
        info.providers.push({
          isMetaMask: window.ethereum.isMetaMask,
          isTrust: window.ethereum.isTrust,
          isCoinbaseWallet: window.ethereum.isCoinbaseWallet
        });
      }
    }

    return info;
  },

  // Generate debug report
  async generateDebugReport() {
    const browserInfo = this.getBrowserInfo();
    const walletInfo = this.getWalletInfo();
    const connectivity = await this.checkConnectivity();
    
    return {
      timestamp: new Date().toISOString(),
      browser: browserInfo,
      wallet: walletInfo,
      connectivity,
      url: window.location.href,
      projectId: import.meta.env.VITE_REOWN_PROJECT_ID
    };
  },

  // Log debug info to console
  async logDebugInfo() {
    const report = await this.generateDebugReport();
    console.group('🔍 Wallet Debug Report');
    console.log('📊 Full Report:', report);
    console.log('🌐 Browser:', report.browser.browser, report.browser.isMobile ? '(Mobile)' : '(Desktop)');
    console.log('💳 Wallet Installed:', report.wallet?.hasEthereum ? '✅' : '❌');
    console.log('🔗 Internet:', report.connectivity ? '✅' : '❌');
    console.log('🆔 Project ID:', report.projectId ? '✅' : '❌');
    
    if (report.wallet?.hasEthereum) {
      console.log('💼 Available Wallets:');
      report.wallet.providers.forEach((provider, index) => {
        if (provider.isMetaMask) console.log(`  ${index + 1}. MetaMask ✅`);
        if (provider.isTrust) console.log(`  ${index + 1}. Trust Wallet ✅`);
        if (provider.isCoinbaseWallet) console.log(`  ${index + 1}. Coinbase Wallet ✅`);
      });
    }
    console.groupEnd();
    
    return report;
  }
};

export default walletDebug;