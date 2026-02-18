import React, { useState, useEffect } from 'react';
import { FaCoins, FaFire, FaStore, FaRocket, FaChartLine, FaDollarSign, FaUsers, FaLock, FaCheckCircle, FaClock, FaGift, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { nftAPI, walletAPI, userAPI } from '../services/api';
import useAuthCheck from '../utils/useAuthCheck';

const NFTDashboard = () => {
  const token = useAuthCheck();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    systemStatus: null,
    userNFTs: [],
    userStats: {},
    marketplaceStats: {},
    userBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const [quickBuying, setQuickBuying] = useState(false);

  if (!token) return null;

  useEffect(() => {
    fetchDashboardData();
    
    // Auto refresh every 60 seconds
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [statusRes, nftsRes, balanceRes, marketplaceRes] = await Promise.allSettled([
        nftAPI.getNFTStatus(),
        nftAPI.getMyNFTs(),
        walletAPI.getBalance(),
        nftAPI.getMarketplace()
      ]);

      const systemStatus = statusRes.status === 'fulfilled' ? statusRes.value.data : null;
      const nftData = nftsRes.status === 'fulfilled' ? nftsRes.value.data : { nfts: [], stats: {} };
      const balanceData = balanceRes.status === 'fulfilled' ? balanceRes.value.data : { balance: 0 };
      const marketplaceData = marketplaceRes.status === 'fulfilled' ? marketplaceRes.value.data : { nfts: [] };

      // Calculate user stats
      const userNFTs = nftData.nfts || [];
      const userStats = {
        totalNFTs: userNFTs.length,
        holdNFTs: userNFTs.filter(nft => nft.holdStatus === 'hold').length,
        sellNFTs: userNFTs.filter(nft => nft.holdStatus === 'sell').length,
        stakedNFTs: userNFTs.filter(nft => nft.isStaked).length,
        totalValue: userNFTs.reduce((sum, nft) => sum + (nft.buyPrice || 0), 0),
        potentialProfit: userNFTs.filter(nft => nft.holdStatus === 'sell').reduce((sum, nft) => sum + ((nft.sellPrice || 0) * 0.7), 0)
      };

      // Calculate marketplace stats
      const marketplaceStats = {
        availableNFTs: marketplaceData.nfts?.length || 0,
        adminNFTs: marketplaceData.summary?.adminNFTs || 0,
        userResoldNFTs: marketplaceData.summary?.userResoldNFTs || 0
      };

      setDashboardData({
        systemStatus,
        userNFTs,
        userStats,
        marketplaceStats,
        userBalance: balanceData.balance || parseFloat(localStorage.getItem('demoBalance') || '0')
      });

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      
      // Fallback demo data
      setDashboardData({
        systemStatus: {
          currentPhase: 'pre-launch',
          preLaunch: {
            totalNFTs: 500,
            soldNFTs: 0,
            pricePerNFT: 10,
            availableNFTs: 500
          }
        },
        userNFTs: [],
        userStats: {
          totalNFTs: 0,
          holdNFTs: 0,
          sellNFTs: 0,
          stakedNFTs: 0,
          totalValue: 0,
          potentialProfit: 0
        },
        marketplaceStats: {
          availableNFTs: 500,
          adminNFTs: 500,
          userResoldNFTs: 0
        },
        userBalance: parseFloat(localStorage.getItem('demoBalance') || '0')
      });
    }
    setLoading(false);
  };

  const quickBuyNFT = async () => {
    const { systemStatus, userBalance } = dashboardData;
    
    if (!systemStatus) {
      Swal.fire('Error', 'System status not available', 'error');
      return;
    }

    const isPreLaunch = systemStatus.currentPhase === 'pre-launch';
    const price = isPreLaunch ? 10 : 20;
    
    if (userBalance < price) {
      Swal.fire('Error', `Insufficient balance. Need $${price} to buy NFT.`, 'error');
      return;
    }

    const result = await Swal.fire({
      title: `Quick Buy ${isPreLaunch ? 'Pre-Launch' : 'Trading'} NFT`,
      html: `
        <div class="text-left space-y-3">
          <div class="bg-blue-50 p-3 rounded-lg">
            <h4 class="font-bold text-blue-800 mb-2">💰 Purchase Details</h4>
            <p class="text-sm text-blue-700">Price: $${price}</p>
            <p class="text-sm text-blue-700">Your Balance: $${userBalance.toFixed(2)}</p>
            <p class="text-sm text-blue-700">Phase: ${systemStatus.currentPhase}</p>
          </div>
          ${isPreLaunch ? `
            <div class="bg-green-50 p-3 rounded-lg">
              <h4 class="font-bold text-green-800 mb-2">🎯 Pre-Launch Benefits</h4>
              <p class="text-sm text-green-700">• First NFT: Hold status</p>
              <p class="text-sm text-green-700">• Second NFT: Sell status</p>
              <p class="text-sm text-green-700">• Max 2 NFTs per user</p>
            </div>
          ` : `
            <div class="bg-green-50 p-3 rounded-lg">
              <h4 class="font-bold text-green-800 mb-2">🎁 Trading Benefits</h4>
              <p class="text-sm text-green-700">• Get 2 NFTs for $20</p>
              <p class="text-sm text-green-700">• 1 Hold + 1 Sell NFT</p>
              <p class="text-sm text-green-700">• Previous Hold → Sell</p>
            </div>
          `}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f7a4a',
      confirmButtonText: `Buy for $${price}`,
      cancelButtonText: 'Cancel',
      width: '500px'
    });

    if (!result.isConfirmed) return;

    setQuickBuying(true);
    try {
      const response = isPreLaunch 
        ? await nftAPI.buyPreLaunchNFT()
        : await nftAPI.buyTradingNFT();
      
      Swal.fire({
        icon: 'success',
        title: 'NFT Purchased Successfully!',
        html: `
          <div class="text-left space-y-2">
            <p><strong>NFTs Received:</strong> ${response.data.nftsReceived || 1}</p>
            ${response.data.nft ? `<p><strong>NFT ID:</strong> ${response.data.nft.nftId}</p>` : ''}
            ${response.data.batchProgress ? `<p><strong>Batch Progress:</strong> ${response.data.batchProgress}</p>` : ''}
            <hr class="my-3">
            <div class="bg-green-50 p-3 rounded">
              <p class="text-green-800 font-medium">✅ ${response.data.message}</p>
            </div>
          </div>
        `,
        confirmButtonColor: '#0f7a4a'
      });
      
      fetchDashboardData();
      
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Purchase Failed',
        text: error.response?.data?.message || 'Something went wrong'
      });
    }
    setQuickBuying(false);
  };

  const getPhaseIcon = (phase) => {
    switch (phase) {
      case 'pre-launch': return <FaRocket className="text-blue-600" />;
      case 'trading': return <FaStore className="text-green-600" />;
      case 'blockchain': return <FaFire className="text-purple-600" />;
      default: return <FaClock className="text-gray-600" />;
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'pre-launch': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'trading': return 'bg-green-100 text-green-800 border-green-200';
      case 'blockchain': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f7a4a]"></div>
      </div>
    );
  }

  const { systemStatus, userStats, marketplaceStats, userBalance } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 space-y-3 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-[#0f7a4a] to-blue-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-r from-[#0f7a4a] to-blue-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg">
                <FaChartLine className="text-white" size={16} />
              </div>
              GTN Dashboard
            </h2>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Complete overview of your GTN portfolio</p>
            <div className="flex items-center gap-2 mt-1 sm:mt-2">
              <div className="bg-green-100 px-2 sm:px-3 py-1 rounded-full">
                <span className="text-xs sm:text-sm font-semibold text-green-700">Balance: ${userBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg"
            title="Refresh Data"
          >
            <FaInfoCircle className="text-gray-600" size={14} />
          </button>
        </div>
      </div>



      {/* User Portfolio Stats */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20">
        <h3 className="font-bold text-lg sm:text-xl text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <div className="bg-gradient-to-r from-[#0f7a4a] to-green-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
            <FaCoins className="text-white" size={16} />
          </div>
          My Portfolio
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          <div className="bg-gradient-to-br from-[#0f7a4a]/10 to-[#0f7a4a]/20 p-3 sm:p-5 rounded-xl sm:rounded-2xl text-center border border-[#0f7a4a]/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="bg-[#0f7a4a] p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <FaCoins className="text-white" size={12} />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-medium text-[#0f7a4a] block mb-1">Total GTN</span>
            <p className="text-lg sm:text-2xl font-bold text-[#0f7a4a]">{userStats.totalNFTs}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-600/10 to-green-600/20 p-3 sm:p-5 rounded-xl sm:rounded-2xl text-center border border-green-600/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="bg-green-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <FaCheckCircle className="text-white" size={12} />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-medium text-green-700 block mb-1">Hold GTN</span>
            <p className="text-lg sm:text-2xl font-bold text-green-600">{userStats.holdNFTs}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#0f7a4a]/10 to-green-600/10 p-3 sm:p-5 rounded-xl sm:rounded-2xl text-center border border-[#0f7a4a]/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="bg-gradient-to-r from-[#0f7a4a] to-green-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <FaStore className="text-white" size={12} />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-medium text-[#0f7a4a] block mb-1">Sell GTN</span>
            <p className="text-lg sm:text-2xl font-bold text-[#0f7a4a]">{userStats.sellNFTs}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-600/10 to-[#0f7a4a]/10 p-3 sm:p-5 rounded-xl sm:rounded-2xl text-center border border-green-600/30 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="bg-green-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <FaDollarSign className="text-white" size={12} />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-medium text-green-700 block mb-1">Total Value</span>
            <p className="text-lg sm:text-2xl font-bold text-green-600">${userStats.totalValue}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#0f7a4a]/10 to-green-600/20 p-3 sm:p-5 rounded-xl sm:rounded-2xl text-center border border-[#0f7a4a]/30 hover:shadow-lg transition-all duration-300 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-3">
              <div className="bg-gradient-to-r from-[#0f7a4a] to-green-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <FaChartLine className="text-white" size={12} />
              </div>
            </div>
            <span className="text-xs sm:text-sm font-medium text-[#0f7a4a] block mb-1">Potential Profit</span>
            <p className="text-lg sm:text-2xl font-bold text-[#0f7a4a]">${userStats.potentialProfit.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20">
        <h3 className="font-bold text-lg sm:text-xl text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
          <div className="bg-gradient-to-r from-[#0f7a4a] to-blue-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
            <FaRocket className="text-white" size={16} />
          </div>
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-[#0f7a4a]/10 to-[#0f7a4a]/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[#0f7a4a]/30 text-center hover:shadow-xl transition-all duration-300 group">
            <div className="bg-[#0f7a4a] p-2 sm:p-3 rounded-xl sm:rounded-2xl mx-auto w-fit mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <FaStore className="text-white" size={20} />
            </div>
            <h4 className="font-semibold text-[#0f7a4a] mb-2 text-base sm:text-lg">Marketplace</h4>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Browse available GTN</p>
            <button 
              onClick={() => navigate('/dashboard/nft-marketplace')}
              className="w-full bg-gradient-to-r from-[#0f7a4a] to-green-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium hover:from-green-600 hover:to-[#0f7a4a] transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              Visit Marketplace
            </button>
          </div>
          
          <div className="bg-gradient-to-br from-[#0f7a4a]/10 to-green-600/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[#0f7a4a]/30 text-center hover:shadow-xl transition-all duration-300 group">
            <div className="bg-green-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl mx-auto w-fit mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
              <FaCoins className="text-white" size={20} />
            </div>
            <h4 className="font-semibold text-green-700 mb-2 text-base sm:text-lg">My GTN</h4>
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Manage your collection</p>
            <button 
              onClick={() => navigate('/dashboard/my-nfts')}
              className="w-full bg-gradient-to-r from-green-600 to-[#0f7a4a] text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium hover:from-[#0f7a4a] hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              Manage Collection
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {dashboardData.userNFTs.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl border border-white/20">
          <h3 className="font-bold text-lg sm:text-xl text-gray-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-r from-[#0f7a4a] to-blue-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
              <FaClock className="text-white" size={16} />
            </div>
            Recent NFTs
          </h3>
          
          <div className="space-y-3 sm:space-y-4">
            {dashboardData.userNFTs.slice(0, 3).map((nft) => (
              <div key={nft._id || nft.nftId} className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-[#0f7a4a] to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                    <FaCoins className="text-white" size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base truncate" title={nft.nftId}>{nft.nftId}</p>
                    <p className="text-xs sm:text-sm text-gray-600">Gen {nft.generation} • ${nft.buyPrice}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold ${
                    nft.isStaked ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800' :
                    nft.holdStatus === 'hold' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                    'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'
                  }`}>
                    {nft.isStaked ? 'Staked' : nft.holdStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {userStats.totalNFTs === 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-white/20">
          <div className="text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#0f7a4a]/20 to-green-600/20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg border border-[#0f7a4a]/30">
              <FaGift className="text-[#0f7a4a]" size={24} />
            </div>
            <h3 className="font-bold text-xl sm:text-2xl text-gray-800 mb-2 sm:mb-3">Get Started with GTN</h3>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base max-w-md mx-auto">
              Buy your first GTN to start earning and building your portfolio
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-lg mx-auto">
              <div className="bg-gradient-to-br from-[#0f7a4a]/10 to-[#0f7a4a]/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-[#0f7a4a]/30 hover:shadow-xl transition-all duration-300 group">
                <div className="bg-[#0f7a4a] p-2 sm:p-3 rounded-xl sm:rounded-2xl mx-auto w-fit mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <FaRocket className="text-white" size={20} />
                </div>
                <h4 className="font-semibold text-[#0f7a4a] mb-2 text-base sm:text-lg">Pre-Launch NFT</h4>
                <p className="text-sm text-gray-600 mb-2 sm:mb-3 font-medium">$10 • Max 2 per user</p>
                <p className="text-xs text-gray-700">First NFT: Hold, Second: Sell</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-600/10 to-green-600/20 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-green-600/30 hover:shadow-xl transition-all duration-300 group">
                <div className="bg-green-600 p-2 sm:p-3 rounded-xl sm:rounded-2xl mx-auto w-fit mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
                  <FaGift className="text-white" size={20} />
                </div>
                <h4 className="font-semibold text-green-700 mb-2 text-base sm:text-lg">Trading NFT</h4>
                <p className="text-sm text-gray-600 mb-2 sm:mb-3 font-medium">$20 • Get 2 NFTs</p>
                <p className="text-xs text-gray-700">Buy One Get One Free</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTDashboard;