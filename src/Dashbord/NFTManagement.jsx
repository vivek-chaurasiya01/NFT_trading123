import React, { useState, useEffect } from 'react';
import { FaImage, FaShoppingCart, FaDollarSign, FaCoins, FaStore, FaCheckCircle, FaClock, FaGift } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { nftAPI, walletAPI } from '../services/api';

const NFTManagement = () => {
  const [myNFTs, setMyNFTs] = useState([]);
  const [stats, setStats] = useState({});
  const [systemStatus, setSystemStatus] = useState(null);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [selling, setSelling] = useState(null);

  useEffect(() => {
    fetchData();
    fetchBalance();
    
    // Listen for balance updates
    const handleBalanceUpdate = (event) => {
      setUserBalance(event.detail.balance);
    };
    
    window.addEventListener('balanceUpdate', handleBalanceUpdate);
    window.addEventListener('walletBalanceUpdate', handleBalanceUpdate);
    
    return () => {
      window.removeEventListener('balanceUpdate', handleBalanceUpdate);
      window.removeEventListener('walletBalanceUpdate', handleBalanceUpdate);
    };
  }, []);

  const fetchBalance = async () => {
    try {
      // Use same balance logic as NFTDashboard
      const [balanceRes] = await Promise.allSettled([
        walletAPI.getBalance()
      ]);
      
      const balanceData = balanceRes.status === 'fulfilled' ? balanceRes.value.data : { balance: 0 };
      const balance = balanceData.balance || parseFloat(localStorage.getItem('demoBalance') || '0');
      
      setUserBalance(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      const balance = parseFloat(localStorage.getItem('demoBalance') || '0');
      setUserBalance(balance);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user's NFTs
      const nftResponse = await nftAPI.getMyNFTs();
      const nfts = nftResponse.data.nfts || [];
      const apiStats = nftResponse.data.stats || {};
      
      // Calculate comprehensive stats
      const calculatedStats = {
        total: nfts.length,
        holdNFTs: nfts.filter(nft => nft.holdStatus === 'hold').length,
        sellNFTs: nfts.filter(nft => nft.holdStatus === 'sell').length,
        totalValue: nfts.reduce((sum, nft) => sum + (nft.buyPrice || 0), 0),
        totalProfit: nfts.filter(nft => nft.status === 'sold').reduce((sum, nft) => sum + (nft.profit || 0), 0),
        potentialProfit: nfts.filter(nft => nft.holdStatus === 'sell').reduce((sum, nft) => sum + ((nft.sellPrice || 0) * 0.7), 0)
      };
      
      setMyNFTs(nfts);
      setStats({ ...apiStats, ...calculatedStats });
      
      // Fetch system status
      const statusResponse = await nftAPI.getNFTStatus();
      setSystemStatus(statusResponse.data);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Demo data if API fails
      const demoNFTs = [
        {
          _id: '1',
          nftId: 'NFT-DEMO-001',
          holdStatus: 'hold',
          status: 'sold',
          buyPrice: 10,
          sellPrice: 20,
          generation: 1,
          isStaked: false,
          buyDate: new Date().toISOString()
        },
        {
          _id: '2',
          nftId: 'NFT-DEMO-002',
          holdStatus: 'sell',
          status: 'sold',
          buyPrice: 10,
          sellPrice: 20,
          generation: 1,
          isStaked: false,
          buyDate: new Date().toISOString()
        }
      ];
      
      setMyNFTs(demoNFTs);
      setStats({
        total: 2,
        holdNFTs: 1,
        sellNFTs: 1,
        stakedNFTs: 0,
        burnedNFTs: 0,
        totalValue: 20,
        totalProfit: 0
      });
    }
    setLoading(false);
  };

  const buyPreLaunchNFT = async () => {
    if (userBalance < 10) {
      Swal.fire('Error', 'Insufficient balance. Need $10 to buy NFT.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Buy Pre-Launch NFT',
      html: `
        <div class="text-left space-y-3">
          <div class="bg-blue-50 p-3 rounded-lg">
            <h4 class="font-bold text-blue-800 mb-2">💰 Purchase Details</h4>
            <p class="text-sm text-blue-700">Price: $10 per NFT</p>
            <p class="text-sm text-blue-700">Your Balance: $${userBalance.toFixed(2)}</p>
          </div>
          <div class="bg-green-50 p-3 rounded-lg">
            <h4 class="font-bold text-green-800 mb-2">🎯 NFT Status Rules</h4>
            <p class="text-sm text-green-700">• First NFT: Hold status (cannot sell immediately)</p>
            <p class="text-sm text-green-700">• Second NFT: Sell status (can sell after admin sellout)</p>
          </div>
          <div class="bg-yellow-50 p-3 rounded-lg">
            <h4 class="font-bold text-yellow-800 mb-2">⚠️ Important</h4>
            <p class="text-sm text-yellow-700">Maximum 2 NFTs per user in pre-launch phase</p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f7a4a',
      confirmButtonText: 'Buy NFT ($10)',
      cancelButtonText: 'Cancel',
      width: '500px'
    });

    if (!result.isConfirmed) return;

    setBuying(true);
    try {
      const response = await nftAPI.buyPreLaunchNFT();
      
      Swal.fire({
        icon: 'success',
        title: 'NFT Purchased Successfully!',
        html: `
          <div class="text-left space-y-2">
            <p><strong>NFT ID:</strong> ${response.data.nft.nftId}</p>
            <p><strong>Status:</strong> ${response.data.nft.holdStatus}</p>
            <p><strong>Buy Price:</strong> $${response.data.nft.buyPrice}</p>
            <p><strong>Sell Price:</strong> $${response.data.nft.sellPrice}</p>
            <p><strong>Batch Progress:</strong> ${response.data.batchProgress}</p>
            <hr class="my-3">
            <div class="bg-green-50 p-3 rounded">
              <p class="text-green-800 font-medium">✅ NFT added to your collection!</p>
            </div>
          </div>
        `,
        confirmButtonColor: '#0f7a4a'
      });
      
      // Update balance
      const newBalance = userBalance - 10;
      setUserBalance(newBalance);
      localStorage.setItem('demoBalance', newBalance.toString());
      localStorage.setItem('userBalance', newBalance.toString());
      
      // Dispatch balance update
      window.dispatchEvent(new CustomEvent('balanceUpdate', {
        detail: { balance: newBalance }
      }));
      
      fetchData();
      
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Purchase Failed',
        text: error.response?.data?.message || 'Something went wrong'
      });
    }
    setBuying(false);
  };

  const buyTradingNFT = async () => {
    if (userBalance < 20) {
      Swal.fire('Error', 'Insufficient balance. Need $20 to buy trading NFT.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Buy Trading NFT',
      html: `
        <div class="text-left space-y-3">
          <div class="bg-green-50 p-3 rounded-lg">
            <h4 class="font-bold text-green-800 mb-2">🎁 Trading Benefits</h4>
            <p class="text-sm text-green-700">• Get 2 NFTs for $20 (Buy One Get One Free)</p>
            <p class="text-sm text-green-700">• 1 Hold NFT + 1 Sell NFT</p>
            <p class="text-sm text-green-700">• Previous Hold NFT converts to Sell status</p>
          </div>
          <div class="bg-blue-50 p-3 rounded-lg">
            <h4 class="font-bold text-blue-800 mb-2">💰 Your Investment</h4>
            <p class="text-sm text-blue-700">Price: $20</p>
            <p class="text-sm text-blue-700">Your Balance: $${userBalance.toFixed(2)}</p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f7a4a',
      confirmButtonText: 'Buy Trading NFT ($20)',
      cancelButtonText: 'Cancel',
      width: '500px'
    });

    if (!result.isConfirmed) return;

    setBuying(true);
    try {
      const response = await nftAPI.buyTradingNFT();
      
      Swal.fire({
        icon: 'success',
        title: 'Trading NFTs Purchased!',
        html: `
          <div class="text-left space-y-2">
            <p><strong>NFTs Received:</strong> ${response.data.nftsReceived}</p>
            <p><strong>Previous Hold Moved to Sell:</strong> ${response.data.previousHoldMovedToSell || 0}</p>
            <hr class="my-3">
            <div class="bg-green-50 p-3 rounded">
              <h4 class="font-bold text-green-800 mb-2">📊 Current Status</h4>
              <p class="text-sm text-green-700">Hold NFTs: ${response.data.currentStatus?.holdNFTs || 0}</p>
              <p class="text-sm text-green-700">Sell NFTs: ${response.data.currentStatus?.sellNFTs || 0}</p>
              <p class="text-sm text-green-700">Total NFTs: ${response.data.currentStatus?.totalNFTs || 0}</p>
            </div>
          </div>
        `,
        confirmButtonColor: '#0f7a4a'
      });
      
      // Update balance
      const newBalance = userBalance - 20;
      setUserBalance(newBalance);
      localStorage.setItem('demoBalance', newBalance.toString());
      localStorage.setItem('userBalance', newBalance.toString());
      
      // Dispatch balance update
      window.dispatchEvent(new CustomEvent('balanceUpdate', {
        detail: { balance: newBalance }
      }));
      
      fetchData();
      
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Purchase Failed',
        text: error.response?.data?.message || 'Something went wrong'
      });
    }
    setBuying(false);
  };

  const sellNFT = async (nftId) => {
    const nft = myNFTs.find(n => n.nftId === nftId);
    if (!nft) return;

    const result = await Swal.fire({
      title: 'Sell NFT',
      html: `
        <div class="text-left space-y-3">
          <div class="bg-gray-50 p-3 rounded-lg">
            <p><strong>NFT ID:</strong> ${nft.nftId}</p>
            <p><strong>Buy Price:</strong> $${nft.buyPrice}</p>
            <p><strong>Sell Price:</strong> $${nft.sellPrice}</p>
          </div>
          <div class="bg-green-50 p-3 rounded-lg">
            <h4 class="font-bold text-green-800 mb-2">💰 Payment Distribution</h4>
            <p class="text-sm text-green-700">• Your Share (70%): $${(nft.sellPrice * 0.7).toFixed(2)}</p>
            <p class="text-sm text-green-700">• Company Share (20%): $${(nft.sellPrice * 0.2).toFixed(2)}</p>
            <p class="text-sm text-green-700">• Parent Bonus (10%): $${(nft.sellPrice * 0.1).toFixed(2)}</p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f7a4a',
      confirmButtonText: 'Sell NFT',
      cancelButtonText: 'Cancel',
      width: '500px'
    });

    if (!result.isConfirmed) return;

    setSelling(nftId);
    try {
      const response = await nftAPI.sellNFT(nftId);
      
      Swal.fire({
        icon: 'success',
        title: 'NFT Sold Successfully!',
        html: `
          <div class="text-left space-y-2">
            <p><strong>Listed Price:</strong> $${response.data.listedPrice}</p>
            <p><strong>Generation:</strong> ${response.data.nft.generation}</p>
            <hr class="my-3">
            <div class="bg-blue-50 p-3 rounded">
              <p class="text-blue-800 font-medium">📝 ${response.data.note}</p>
            </div>
          </div>
        `,
        confirmButtonColor: '#0f7a4a'
      });
      
      fetchData();
      
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Sale Failed',
        text: error.response?.data?.message || 'Something went wrong'
      });
    }
    setSelling(null);
  };



  const getStatusIcon = (nft) => {
    if (nft.isStaked) return <FaLock className="text-purple-600" />;
    if (nft.status === 'burned') return <FaFire className="text-red-600" />;
    if (nft.holdStatus === 'hold') return <FaCheckCircle className="text-green-600" />;
    if (nft.holdStatus === 'sell') return <FaStore className="text-blue-600" />;
    return <FaClock className="text-gray-600" />;
  };

  const getStatusColor = (nft) => {
    if (nft.isStaked) return 'bg-purple-100 text-purple-800';
    if (nft.status === 'burned') return 'bg-red-100 text-red-800';
    if (nft.holdStatus === 'hold') return 'bg-green-100 text-green-800';
    if (nft.holdStatus === 'sell') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f7a4a]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
              <div className="bg-[#0f7a4a] p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <FaImage className="text-white" size={16} />
              </div>
              GTN Management
            </h2>
            <p className="text-gray-600 mt-1 text-sm">Buy, sell, stake and manage your NFTs</p>
            <p className="text-sm text-gray-500">Balance: <span className="font-bold text-green-600">${userBalance.toFixed(2)}</span></p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={buyPreLaunchNFT}
          disabled={buying}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
        >
          {buying ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <FaShoppingCart size={18} />
              <span>Buy Pre-Launch GTN ($10)</span>
            </>
          )}
        </button>
        
        <button
          onClick={buyTradingNFT}
          disabled={buying}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-xl font-bold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 shadow-lg"
        >
          {buying ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <FaGift size={18} />
              <span>Buy Trading GTN ($20)</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="bg-blue-100 p-1.5 sm:p-2 rounded-md sm:rounded-lg">
              <FaImage className="text-blue-600" size={12} />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600">Total</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.total || 0}</p>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="bg-green-100 p-1.5 sm:p-2 rounded-md sm:rounded-lg">
              <FaCheckCircle className="text-green-600" size={12} />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600">Hold</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.holdNFTs || 0}</p>
        </div>
        
        <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="bg-blue-100 p-1.5 sm:p-2 rounded-md sm:rounded-lg">
              <FaStore className="text-blue-600" size={12} />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600">Sell</span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.sellNFTs || 0}</p>
        </div>
      </div>

      {/* NFT List */}
      {myNFTs.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          <h3 className="font-bold text-lg text-gray-800">My GTN Collection</h3>
          {myNFTs.map((nft) => (
            <div key={nft._id || nft.nftId} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border hover:shadow-md transition-all duration-300">
              {/* NFT Header */}
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#0f7a4a] to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <FaCoins className="text-white text-lg sm:text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-lg text-gray-800" title={nft.nftId}>
                      {nft.nftId}
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm">Generation {nft.generation}</p>
                    {nft.buyDate && (
                      <p className="text-xs text-gray-400">{new Date(nft.buyDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  {getStatusIcon(nft)}
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(nft)}`}>
                    {nft.isStaked ? 'Staked' : nft.status === 'burned' ? 'Burned' : nft.holdStatus}
                  </span>
                </div>
              </div>

              {/* NFT Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="text-center p-2 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                  <p className="text-gray-600 text-xs sm:text-sm mb-1">Buy Price</p>
                  <p className="font-bold text-sm sm:text-lg text-gray-800">${nft.buyPrice}</p>
                </div>
                <div className="text-center p-2 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl">
                  <p className="text-gray-600 text-xs sm:text-sm mb-1">Sell Price</p>
                  <p className="font-bold text-sm sm:text-lg text-blue-600">${nft.sellPrice}</p>
                </div>
                <div className="text-center p-2 sm:p-4 bg-green-50 rounded-lg sm:rounded-xl">
                  <p className="text-gray-600 text-xs sm:text-sm mb-1">Potential Profit</p>
                  <p className={`font-bold text-sm sm:text-lg ${
                    nft.holdStatus === 'sell' ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    ${nft.holdStatus === 'sell' ? ((nft.sellPrice || 0) * 0.7).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {nft.holdStatus === 'sell' ? '70% seller share' : 'Hold NFT'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-2 sm:gap-3">
                {/* Sell Button */}
                {nft.holdStatus === 'sell' && nft.status !== 'burned' && (
                  <button
                    onClick={() => sellNFT(nft.nftId)}
                    disabled={selling === nft.nftId}
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 text-sm"
                  >
                    {selling === nft.nftId ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <FaDollarSign size={12} />
                        <span>Sell for ${nft.sellPrice}</span>
                      </>
                    )}
                  </button>
                )}
                
                {/* Status Info */}
                <div className="text-center">
                  {nft.holdStatus === 'hold' && (
                    <span className="text-xs text-green-600 font-medium">💎 Hold NFT - Keep for collection</span>
                  )}
                  {nft.holdStatus === 'sell' && (
                    <span className="text-xs text-blue-600 font-medium">💰 Sell NFT - Ready to list</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaImage className="text-gray-400 text-xl sm:text-2xl" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-gray-800 mb-2">No NFTs Yet</h3>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
              Buy your first NFT to start your collection!
            </p>
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl text-blue-800 border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaShoppingCart size={14} />
                <span className="font-medium text-sm">Get Started</span>
              </div>
              <p className="text-xs sm:text-sm">Choose between Pre-Launch ($10) or Trading ($20) NFTs</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTManagement;