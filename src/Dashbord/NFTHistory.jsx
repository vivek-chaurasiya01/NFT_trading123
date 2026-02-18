import React, { useState, useEffect } from 'react';
import { FaImage, FaArrowUp, FaArrowDown, FaDollarSign, FaCoins, FaHistory, FaCalendarAlt } from 'react-icons/fa';
import api from '../services/api';

const NFTHistory = () => {
  const [nftTransactions, setNftTransactions] = useState([]);
  const [stats, setStats] = useState({ totalBought: 0, totalSold: 0, totalProfit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNFTHistory();
  }, []);

  const fetchNFTHistory = async () => {
    try {
      let transactions = [];
      let calculatedStats = { totalBought: 0, totalSold: 0, totalProfit: 0 };
      
      // Get user transactions and filter NFT-related ones
      const transactionResponse = await api.get('/user/transactions');
      const allTransactions = transactionResponse.data.transactions || [];
      
      transactions = allTransactions.filter(tx => 
        tx.description && (
          tx.description.toLowerCase().includes('nft') ||
          tx.type === 'nft_purchase' ||
          tx.type === 'nft_sale'
        )
      ).map(tx => ({
        ...tx,
        type: tx.description.toLowerCase().includes('purchase') || tx.description.toLowerCase().includes('buy') ? 'buy' : 'sell',
        nftId: tx.nftId || tx.description || 'NFT Transaction'
      }));
      
      // Calculate stats from transactions
      if (transactions.length > 0) {
        calculatedStats = {
          totalBought: transactions.filter(tx => tx.type === 'buy').length,
          totalSold: transactions.filter(tx => tx.type === 'sell').length,
          totalProfit: transactions
            .filter(tx => tx.type === 'sell')
            .reduce((sum, tx) => sum + (tx.profit || 12), 0)
        };
      }
      
      setNftTransactions(transactions);
      setStats(calculatedStats);
      
    } catch (error) {
      // Silent error - app continues to work
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f7a4a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">GTN History</h2>
        <FaHistory className="text-[#0f7a4a]" size={20} />
      </div>
      
      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <FaArrowDown className="text-blue-600 text-sm" />
            <span className="text-xs text-gray-600">Bought</span>
          </div>
          <p className="text-lg font-bold text-blue-600">{stats.totalBought}</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <FaArrowUp className="text-green-600 text-sm" />
            <span className="text-xs text-gray-600">Sold</span>
          </div>
          <p className="text-lg font-bold text-green-600">{stats.totalSold}</p>
        </div>
        
        <div className="bg-white p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <FaDollarSign className="text-purple-600 text-sm" />
            <span className="text-xs text-gray-600">Profit</span>
          </div>
          <p className={`text-lg font-bold ${
            stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            ${stats.totalProfit}
          </p>
        </div>
      </div>

      {/* Transaction List - Mobile Optimized */}
      <div className="bg-white rounded-lg p-4 border">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <FaCoins className="text-[#0f7a4a] text-sm" />
          Transaction History ({nftTransactions.length})
        </h3>
        
        {nftTransactions.length > 0 ? (
          <div className="space-y-3">
            {nftTransactions.map((tx, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                {/* Transaction Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'buy' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {tx.type === 'buy' ? (
                        <FaArrowDown className="text-blue-600 text-sm" />
                      ) : (
                        <FaArrowUp className="text-green-600 text-sm" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {tx.type === 'buy' ? 'Bought GTN' : 'Sold NFT'}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[150px]" title={tx.nftId}>
                        {tx.nftId || 'NFT Transaction'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-bold text-sm ${
                      tx.type === 'buy' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {tx.type === 'buy' ? '-' : '+'}${tx.amount || 0}
                    </p>
                    {tx.type === 'sell' && tx.profit && (
                      <p className="text-xs text-green-600">+${tx.profit}</p>
                    )}
                  </div>
                </div>
                
                {/* Transaction Details */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt className="text-xs" />
                    <span>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tx.status || 'Completed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gray-100 rounded-lg p-6">
              <FaImage className="mx-auto text-gray-400 mb-3" size={32} />
              <h4 className="font-medium text-gray-800 mb-2">No GTN History</h4>
              <p className="text-sm text-gray-600 mb-3">
                Your NFT buy/sell transactions will appear here
              </p>
              <div className="bg-blue-50 p-3 rounded text-xs text-blue-800">
                💡 Start by buying NFTs from the marketplace!
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      {nftTransactions.length > 0 && (
        <div className="bg-gradient-to-r from-[#0f7a4a] to-green-600 p-4 rounded-lg text-white">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <FaDollarSign className="text-sm" />
            Trading Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="opacity-90">Total Invested:</p>
              <p className="font-bold">
                ${(stats.totalBought * 10) || 0} {/* $10 per NFT buy price */}
              </p>
            </div>
            <div>
              <p className="opacity-90">Total Returns:</p>
              <p className="font-bold">
                ${(stats.totalSold * 14) || 0} {/* $14 profit per sale (70% of $20) */}
              </p>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default NFTHistory;