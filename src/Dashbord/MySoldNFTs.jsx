import React, { useState, useEffect } from 'react';
import { FaStore, FaCoins } from 'react-icons/fa';
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
      const response = await axios.get(
        `http://localhost:5000/api/nft-transactions/marketplace/${userEmail}`
      );

      if (response.data.success) {
        setUser(response.data.data.user);
        setNfts(response.data.data.marketplaceNFTs);
      }
    } catch (error) {
      console.error('Error fetching sold NFTs:', error);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Sold NFTs</h2>
        <FaStore className="text-[#0f7a4a]" size={20} />
      </div>

      <div className="bg-gradient-to-r from-[#0f7a4a] to-green-600 p-4 rounded-xl text-white">
        <p className="text-sm opacity-90">Total Listed</p>
        <p className="text-3xl font-bold">{nfts.length}</p>
      </div>

      {nfts.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center">
          <FaStore className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500">No NFTs listed in marketplace</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nfts.map((nft) => (
            <div key={nft._id} className="bg-white p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{nft.nftId}</h3>
                  <p className="text-xs text-gray-500">Batch #{nft.batchId} - Position {nft.batchPosition}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  {nft.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Sell Price</p>
                  <p className="text-lg font-bold text-blue-600">${nft.sellPrice}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600">Generation</p>
                  <p className="text-lg font-bold text-purple-600">GEN {nft.generation}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Phase: {nft.phase}</span>
                <span>Profit: ${nft.profit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySoldNFTs;
