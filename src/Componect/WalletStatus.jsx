import React, { useState, useEffect } from 'react';
import { FaWallet, FaEthereum, FaCopy, FaExternalLinkAlt, FaMobile } from 'react-icons/fa';
import realWalletService from '../services/realWalletService';
import directWalletService from '../services/directWalletService';
import Swal from 'sweetalert2';

const WalletStatus = () => {
  const [walletInfo, setWalletInfo] = useState({
    connected: false,
    address: null,
    balance: '0.0000',
    network: 'Unknown',
    chainId: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkWalletStatus();
  }, []);

  const checkWalletStatus = async () => {
    try {
      if (realWalletService.isWalletConnected()) {
        const address = realWalletService.getAccount();
        const balanceResult = await realWalletService.getBalance();
        const networkInfo = realWalletService.getNetworkInfo();
        const chainId = realWalletService.getChainId();
        
        setWalletInfo({
          connected: true,
          address,
          balance: balanceResult.success ? balanceResult.balance : '0.0000',
          network: networkInfo.networkName,
          chainId: chainId || 'Unknown'
        });
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
        
        // Get balance and network info
        const balanceResult = await realWalletService.getBalance();
        const networkInfo = realWalletService.getNetworkInfo();
        const chainId = realWalletService.getChainId();
        
        setWalletInfo({
          connected: true,
          address,
          balance: balanceResult.success ? balanceResult.balance : '0.0000',
          network: networkInfo.networkName,
          chainId: chainId || 'Unknown'
        });
        
        Swal.fire({
          icon: "success",
          title: "🎉 Connected!",
          html: `
            <div class="text-left">
              <p><strong>Address:</strong> ${address.substring(0, 6)}...${address.substring(38)}</p>
              <p><strong>Network:</strong> ${networkInfo.networkName}</p>
              <p><strong>Balance:</strong> ${balanceResult.success ? balanceResult.balance + ' ETH' : 'Unable to fetch'}</p>
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
        text: `Current balance: ${walletInfo.balance} ETH`,
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
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Wallet Connected</h3>
          <p className="text-gray-500 mb-4">Connect your crypto wallet to view balance and make transactions</p>
          
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
            <span>+ More</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FaWallet className="text-[#0f7a4a]" />
          Connected Wallet
        </h3>
        <div className="flex items-center gap-2">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            Connected
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Address */}
        <div>
          <label className="text-sm font-medium text-gray-600">Wallet Address</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-gray-50 px-3 py-2 rounded-md text-sm font-mono">
              {walletInfo.address?.substring(0, 6)}...{walletInfo.address?.substring(38)}
            </div>
            <button
              onClick={copyAddress}
              className="p-2 text-gray-500 hover:text-[#0f7a4a] transition-colors"
              title="Copy Address"
            >
              <FaCopy />
            </button>
            <button
              onClick={openEtherscan}
              className="p-2 text-gray-500 hover:text-[#0f7a4a] transition-colors"
              title="View on Etherscan"
            >
              <FaExternalLinkAlt />
            </button>
          </div>
        </div>

        {/* Balance */}
        <div>
          <label className="text-sm font-medium text-gray-600">Balance</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-gray-50 px-3 py-2 rounded-md">
              <span className="text-lg font-semibold text-gray-800">{walletInfo.balance} ETH</span>
            </div>
            <button
              onClick={refreshBalance}
              disabled={loading}
              className="px-3 py-2 bg-[#0f7a4a] text-white rounded-md text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Network */}
        <div>
          <label className="text-sm font-medium text-gray-600">Network</label>
          <div className="bg-gray-50 px-3 py-2 rounded-md mt-1">
            <span className="text-sm text-gray-800">{walletInfo.network}</span>
            {walletInfo.chainId && walletInfo.chainId !== 'Unknown' && (
              <span className="text-xs text-gray-500 ml-2">(Chain ID: {walletInfo.chainId})</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={disconnectWallet}
            className="flex-1 bg-red-500 text-white py-2 rounded-md font-medium hover:bg-red-600 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletStatus;