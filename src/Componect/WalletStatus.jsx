import React, { useState, useEffect } from 'react';
import { FaWallet, FaEthereum, FaCopy, FaExternalLinkAlt, FaMobile } from 'react-icons/fa';
import realWalletService from '../services/realWalletService';
import networkSwitcher from '../utils/networkSwitcher';
import bnbTokenUtils from '../utils/bnbTokenUtils';
import Swal from 'sweetalert2';

const WalletStatus = () => {
  const [walletInfo, setWalletInfo] = useState({
    connected: false,
    address: null,
    balance: '0.0000',
    network: 'Unknown',
    chainId: null,
    tokenSymbol: 'ETH'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWalletStatus();
    
    // Listen for account and network changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Account changed:', accounts);
        checkWalletStatus();
      });
      
      window.ethereum.on('chainChanged', (chainId) => {
        console.log('Network changed:', chainId);
        checkWalletStatus();
      });
    }
    
    // Cleanup listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  const autoSwitchToBSC = async () => {
    try {
      if (realWalletService.isWalletConnected() && window.ethereum) {
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        
        // If not on BSC network, auto-switch
        if (chainId !== 56 && chainId !== 97) {
          console.log('🔄 Auto-switching to BSC network...');
          const result = await networkSwitcher.switchToTargetNetwork();
          if (result.success) {
            await checkWalletStatus();
          }
        }
      }
    } catch (error) {
      console.log('Auto-switch failed:', error);
    }
  };

  const checkWalletStatus = async () => {
    try {
      // Direct wallet check instead of service
      if (window.ethereum) {
        // Get current accounts directly from MetaMask/TrustWallet
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length > 0) {
          const address = accounts[0];
          
          // Get current chain ID directly
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          const chainId = parseInt(chainIdHex, 16);
          
          // Get balance - BNB token on Ethereum or native token on other networks
          let balanceInEth, tokenSymbol;
          
          if (import.meta.env.VITE_NETWORK_TYPE === 'bnb' && (chainId === 1 || chainId === 11155111)) {
            // Get BNB token balance on Ethereum networks
            const bnbBalance = await bnbTokenUtils.getBNBBalance(address);
            balanceInEth = bnbBalance.success ? parseFloat(bnbBalance.balance) : 0;
            tokenSymbol = 'BNB';
          } else {
            // Get native token balance
            const balanceHex = await window.ethereum.request({
              method: 'eth_getBalance',
              params: [address, 'latest']
            });
            balanceInEth = parseInt(balanceHex, 16) / Math.pow(10, 18);
            
            // Determine token symbol based on network type setting
            if (import.meta.env.VITE_NETWORK_TYPE === 'bnb') {
              tokenSymbol = 'BNB';
            } else {
              tokenSymbol = chainId === 56 || chainId === 97 ? 'BNB' : 
                          chainId === 137 || chainId === 80001 ? 'MATIC' : 'ETH';
            }
          }
          
          // Get network name and token symbol based on actual chain ID
          const getNetworkName = (chainId) => {
            const networks = {
              1: 'Ethereum Mainnet',
              11155111: 'Sepolia Testnet',
              56: 'BSC Mainnet',
              97: 'BSC Testnet',
              137: 'Polygon Mainnet',
              80001: 'Polygon Mumbai'
            };
            return networks[chainId] || `Unknown Network (${chainId})`;
          };
          
          const getTokenSymbol = (chainId) => {
            // Always show BNB when VITE_NETWORK_TYPE is bnb
            if (import.meta.env.VITE_NETWORK_TYPE === 'bnb') {
              return 'BNB';
            }
            // Default behavior for other network types
            if (chainId === 56 || chainId === 97) return 'BNB';
            if (chainId === 137 || chainId === 80001) return 'MATIC';
            return 'ETH';
          };
          
          setWalletInfo({
            connected: true,
            address,
            balance: balanceInEth.toFixed(4),
            network: getNetworkName(chainId),
            chainId: chainId,
            tokenSymbol: tokenSymbol
          });
          
          // Update real wallet service state
          realWalletService.account = address;
          realWalletService.isConnected = true;
          realWalletService.chainId = chainId;
        }
      }
    } catch (error) {
      console.error('Error checking wallet status:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setLoading(true);
      
      // Enhanced connection with better error handling
      console.log('🚀 Starting wallet connection from WalletStatus...');
      
      // Check if wallet is available
      if (!window.ethereum) {
        Swal.fire({
          icon: "warning",
          title: "No Wallet Found",
          html: `
            <div class="text-left">
              <p>No cryptocurrency wallet detected.</p>
              <div class="mt-3 p-3 bg-blue-50 rounded">
                <p><strong>Please install a wallet:</strong></p>
                <ul class="mt-2 space-y-1">
                  <li>• <a href="https://metamask.io/download/" target="_blank" class="text-blue-600 underline">MetaMask</a> (Recommended)</li>
                  <li>• <a href="https://trustwallet.com/browser-extension" target="_blank" class="text-blue-600 underline">Trust Wallet</a></li>
                  <li>• <a href="https://wallet.coinbase.com/" target="_blank" class="text-blue-600 underline">Coinbase Wallet</a></li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">After installation, refresh this page and try again.</p>
              </div>
            </div>
          `,
          confirmButtonColor: "#0f7a4a",
        });
        setLoading(false);
        return;
      }

      // Use the enhanced wallet service instead of direct calls
      const result = await realWalletService.connectWallet();
      
      if (result.success) {
        const address = result.account;
        
        // Auto-switch to BSC after connection
        await autoSwitchToBSC();
        
        // Get balance and network info after potential switch
        const balanceResult = await realWalletService.getBalance();
        let chainId = realWalletService.getChainId();
        if (!chainId && window.ethereum) {
          const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
          chainId = parseInt(chainIdHex, 16);
        }
        
        const getNetworkName = (chainId) => {
          const networks = {
            1: 'Ethereum Mainnet',
            11155111: 'Sepolia Testnet',
            56: 'BSC Mainnet',
            97: 'BSC Testnet',
            137: 'Polygon Mainnet',
            80001: 'Polygon Mumbai'
          };
          return networks[chainId] || `Unknown Network (${chainId})`;
        };
        
        const getTokenSymbol = (chainId) => {
          if (chainId === 56 || chainId === 97) return 'BNB';
          if (chainId === 137 || chainId === 80001) return 'MATIC';
          return 'ETH';
        };
        
        setWalletInfo({
          connected: true,
          address,
          balance: balanceResult.success ? balanceResult.balance : '0.0000',
          network: getNetworkName(chainId),
          chainId: chainId || 'Unknown',
          tokenSymbol: getTokenSymbol(chainId)
        });
        
        Swal.fire({
          icon: "success",
          title: "🎉 Connected!",
          html: `
            <div class="text-left">
              <p><strong>Address:</strong> ${address.substring(0, 6)}...${address.substring(38)}</p>
              <p><strong>Network:</strong> ${getNetworkName(chainId)}</p>
              <p><strong>Balance:</strong> ${balanceResult.success ? balanceResult.balance + ' ' + getTokenSymbol(chainId) : 'Unable to fetch'}</p>
            </div>
          `,
          confirmButtonColor: "#0f7a4a",
        });
      } else {
        throw new Error(result.error || 'Failed to connect wallet');
      }
    } catch (error) {
      console.error('❌ Connection failed:', error);
      
      let errorMessage = error.message || "Failed to connect wallet. Please try again.";
      let troubleshootingTips = [
        "• Make sure your wallet is installed and unlocked",
        "• Allow popups for this site",
        "• Try refreshing the page",
        "• Check your internet connection"
      ];
      
      // Specific error handling
      if (error.message.includes('User rejected') || error.message.includes('rejected')) {
        errorMessage = "Connection was cancelled. Please approve the connection request.";
        troubleshootingTips = [
          "• Click 'Connect' when prompted by your wallet",
          "• Make sure you approve the connection request",
          "• Try connecting again"
        ];
      } else if (error.message.includes('timeout')) {
        errorMessage = "Connection timed out. Please try again.";
        troubleshootingTips = [
          "• Make sure your wallet is unlocked",
          "• Check your internet connection",
          "• Try refreshing the page"
        ];
      }
      
      Swal.fire({
        icon: "error",
        title: "Connection Failed",
        html: `
          <div class="text-left">
            <p class="mb-3">${errorMessage}</p>
            <div class="p-2 bg-blue-50 rounded text-sm">
              <p><strong>Troubleshooting:</strong></p>
              <ul class="mt-1 space-y-1">
                ${troubleshootingTips.map(tip => `<li>${tip}</li>`).join('')}
              </ul>
            </div>
          </div>
        `,
        confirmButtonColor: "#0f7a4a",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      const result = await Swal.fire({
        title: 'Disconnect Wallet?',
        text: 'Are you sure you want to disconnect your wallet?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#0f7a4a',
        confirmButtonText: 'Disconnect',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        await realWalletService.disconnect();
        setWalletInfo({
          connected: false,
          address: null,
          balance: '0.0000',
          network: 'Unknown',
          chainId: null
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Disconnected',
          text: 'Wallet disconnected successfully',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to disconnect wallet',
        confirmButtonColor: '#0f7a4a'
      });
    }
  };

  const copyAddress = () => {
    if (walletInfo.address) {
      navigator.clipboard.writeText(walletInfo.address);
      Swal.fire({
        icon: "success",
        title: "Copied!",
        text: "Wallet address copied to clipboard",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const openEtherscan = () => {
    if (walletInfo.address) {
      const baseUrl = walletInfo.network.includes('Sepolia') 
        ? 'https://sepolia.etherscan.io' 
        : 'https://etherscan.io';
      window.open(`${baseUrl}/address/${walletInfo.address}`, '_blank');
    }
  };

  const refreshBalance = async () => {
    try {
      setLoading(true);
      await checkWalletStatus();
      
      Swal.fire({
        icon: 'success',
        title: 'Balance Updated',
        text: `Current balance: ${walletInfo.balance} ${walletInfo.tokenSymbol}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to refresh balance',
        confirmButtonColor: '#0f7a4a'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!walletInfo.connected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="text-center">
          <FaWallet className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Wallet Not Connected</h3>
          
          <button
            onClick={connectWallet}
            disabled={loading}
            className="bg-[#0f7a4a] text-white px-6 py-2 rounded-md font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            <FaWallet />
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
          
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <FaEthereum className="text-blue-600" />
              <span>MetaMask</span>
            </div>
            <div className="flex items-center gap-1">
              <FaMobile className="text-blue-500" />
              <span>TrustWallet</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="text-center">
        <FaWallet className="mx-auto text-4xl text-[#0f7a4a] mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Wallet Connected</h3>
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            ✅ Connected
          </span>
        </div>
        
        <button
          onClick={disconnectWallet}
          className="bg-red-500 text-white px-6 py-2 rounded-md font-semibold hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
        
        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <FaEthereum className="text-blue-600" />
            <span>MetaMask</span>
          </div>
          <div className="flex items-center gap-1">
            <FaMobile className="text-blue-500" />
            <span>TrustWallet</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletStatus;