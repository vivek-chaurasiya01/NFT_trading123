import React, { useState, useEffect } from 'react';
import { FaStore, FaCoins, FaClock, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import useAuthCheck from '../utils/useAuthCheck';

const MySoldNFTs = () => {
  const token = useAuthCheck();
  const [nfts, setNfts] = useState([]);
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);

  if (!token) return null;

  useEffect(() => {
    fetchSoldNFTs();
  }, []);

  const fetchSoldNFTs = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      console.log('📧 User Email from localStorage:', userEmail);
      
      if (!userEmail) {
        console.error('❌ No email found in localStorage');
        setLoading(false);
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(
        `${API_URL}/api/nft-transactions/marketplace/${userEmail}`
      );

      console.log('✅ API Response:', response.data);

      if (response.data.success) {
        setUser(response.data.data.user);
        setNfts(response.data.data.marketplaceNFTs);
        console.log('📦 NFTs loaded:', response.data.data.marketplaceNFTs.length);
      }
    } catch (error) {
      console.error('❌ Error fetching sold NFTs:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f7a4a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3 sm:p-0">
      <div className="bg-gradient-to-r from-[#0f7a4a] to-green-600 p-4 sm:p-6 rounded-xl sm:rounded-2xl text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm opacity-90 mb-1">My Listed NFTs</p>
            <p className="text-3xl sm:text-4xl font-bold">{nfts.length}</p>
          </div>
          <div className="bg-white/20 p-3 sm:p-4 rounded-lg sm:rounded-xl">
            <FaStore size={24} className="sm:w-8 sm:h-8" />
          </div>
        </div>
      </div>

      {nfts.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 rounded-xl sm:rounded-2xl text-center shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <FaStore className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">No NFTs Listed</h3>
          <p className="text-sm sm:text-base text-gray-500">You haven't listed any NFTs in the marketplace yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nfts.map((nft) => (
            <div key={nft._id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#0f7a4a] to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md p-[2px] flex-shrink-0">
                  <img src="/22.png" alt="GTN" className="w-full h-full rounded-lg bg-white object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-gray-800 mb-1 truncate">{nft.nftId}</h3>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-500">
                    <span>Batch #{nft.batchId}</span>
                    <span>•</span>
                    <span>Pos {nft.batchPosition}</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">GEN {nft.generation}</span>
                  </div>
                </div>
                <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold flex-shrink-0">
                  {nft.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <FaCoins className="text-blue-600" size={12} />
                    <p className="text-xs text-blue-700 font-medium">Sell Price</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">${nft.sellPrice}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <FaCheckCircle className="text-green-600" size={12} />
                    <p className="text-xs text-green-700 font-medium">Profit</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">${nft.profit}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg sm:rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaClock size={12} />
                    <span>Buy Time</span>
                  </div>
                  <span className="font-medium text-gray-800">
                    {nft.buyDate ? new Date(nft.buyDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '----'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaCheckCircle size={12} />
                    <span>Sell Time</span>
                  </div>
                  <span className="font-medium text-gray-800">----</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Phase: <span className="font-medium text-gray-700">{nft.phase}</span></p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySoldNFTs;
