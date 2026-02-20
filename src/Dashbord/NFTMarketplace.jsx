import React, { useState, useEffect } from "react";
import {
  FaShoppingCart,
  FaEye,
  FaCoins,
  FaFire,
  FaStore,
  FaDollarSign,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { nftAPI, walletAPI } from "../services/api";

const NFTMarketplace = () => {
  const [nfts, setNfts] = useState([]);
  const [allNfts, setAllNfts] = useState([]);
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [currentBatch, setCurrentBatch] = useState(0);

  useEffect(() => {
    fetchMarketplace();
    fetchBalance();

    // Listen for balance updates
    const handleBalanceUpdate = (event) => {
      setUserBalance(event.detail.balance);
    };

    window.addEventListener("balanceUpdate", handleBalanceUpdate);
    window.addEventListener("walletBalanceUpdate", handleBalanceUpdate);

    return () => {
      window.removeEventListener("balanceUpdate", handleBalanceUpdate);
      window.removeEventListener("walletBalanceUpdate", handleBalanceUpdate);
    };
  }, []);

  const fetchBalance = async () => {
    try {
      // ✅ Always fetch from database API
      const response = await walletAPI.getBalance();
      const balance = response.data.balance || 0;

      setUserBalance(balance);
      console.log("💰 Database balance:", balance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setUserBalance(0);
    }
  };

  const fetchMarketplace = async () => {
    try {
      const response = await nftAPI.getMarketplace();
      const nftData = response.data.nfts || response.data || [];

      console.log('🔍 API Response:', response.data);
      console.log('📊 NFT Data Length:', nftData.length);

      setAllNfts(nftData);
      
      // Filter available NFTs and limit to 10
      const availableNfts = nftData
        .filter(nft => {
          const status = nft.status || 'available';
          return status !== 'sold' && 
                 status !== 'purchased' &&
                 (status === 'available' || status === 'listed' || !nft.status);
        })
        .slice(0, 10); // Only show first 10 NFTs
      
      setNfts(availableNfts);
      setCurrentBatch(0);
      
      console.log(`✅ Total NFTs from API: ${nftData.length}`);
      console.log(`✅ Showing NFTs: ${availableNfts.length}`);
      
      if (nftData.length === 0) {
        console.log('⚠️ No NFTs from API, using demo data');
        const demoNFTs = [
          {
            _id: 'demo1',
            nftId: 'GTN_Batch_1_NFT_1',
            batchId: 1,
            generation: 1,
            status: 'available',
            buyPrice: 10,
            sellPrice: 20,
            phase: 'pre-launch'
          },
          {
            _id: 'demo2', 
            nftId: 'GTN_Batch_1_NFT_2',
            batchId: 1,
            generation: 1,
            status: 'available',
            buyPrice: 10,
            sellPrice: 20,
            phase: 'pre-launch'
          }
        ];
        setNfts(demoNFTs);
        setAllNfts(demoNFTs);
      }
    } catch (error) {
      console.error("❌ Error fetching marketplace:", error);
      console.log('⚠️ API Error, using demo data');
      
      const demoNFTs = [
        {
          _id: 'demo1',
          nftId: 'GTN_Batch_1_NFT_1', 
          batchId: 1,
          generation: 1,
          status: 'available',
          buyPrice: 10,
          sellPrice: 20,
          phase: 'pre-launch'
        }
      ];
      setNfts(demoNFTs);
      setAllNfts(demoNFTs);
    }
    setLoading(false);
  };

  const buyNFT = async (nftId, price, isUserListed = false) => {
    if (userBalance < price) {
      Swal.fire(
        "Error",
        `Insufficient balance. Need $${price} to buy NFT.`,
        "error",
      );
      return;
    }

    setBuying(nftId);
    try {
      let response;

      if (isUserListed) {
        // Buying user-listed NFT (resold NFT)
        response = await nftAPI.buyNFT(nftId);

        Swal.fire({
          icon: "success",
          title: "User NFT Purchased!",
          html: `
            <div class="text-left space-y-2">
              <p><strong>Original NFT:</strong> ${nftId}</p>
              <p><strong>Price Paid:</strong> $${price}</p>
              <hr class="my-3">
              <div class="bg-green-50 p-3 rounded">
                <h4 class="font-bold text-green-800 mb-2">🎁 You Received 2 NFTs:</h4>
                <p class="text-green-700 text-sm">• 1 Hold NFT (for keeping)</p>
                <p class="text-green-700 text-sm">• 1 Sell NFT (can sell later)</p>
              </div>
              <div class="bg-blue-50 p-3 rounded">
                <h4 class="font-bold text-blue-800 mb-2">💰 Payment Distribution:</h4>
                <p class="text-blue-700 text-sm">• Original seller: $${(price * 0.7).toFixed(2)} (70%)</p>
                <p class="text-blue-700 text-sm">• Company: $${(price * 0.2).toFixed(2)} (20%)</p>
                <p class="text-blue-700 text-sm">• Parents: $${(price * 0.1).toFixed(2)} (10%)</p>
              </div>
            </div>
          `,
          confirmButtonColor: "#0f7a4a",
        });
      } else {
        // Buying admin NFT
        try {
          response = await nftAPI.buyPreLaunchNFT();
        } catch (error) {
          if (error.response?.status === 400) {
            response = await nftAPI.buyTradingNFT();
          } else {
            throw error;
          }
        }

        Swal.fire({
          icon: "success",
          title:
            "NFT Purchased Successfully Thanks for being a Part of GTN Project in Phase -1",
          text: response.data.message || "NFT added to your collection",
          confirmButtonColor: "#0f7a4a",
        });
      }

      // Refresh data from backend
      await fetchMarketplace();
      await fetchBalance();

      // Dispatch balance update event
      window.dispatchEvent(
        new CustomEvent("balanceUpdate", {
          detail: { balance: response.data.newBalance || userBalance - price },
        }),
      );
    } catch (error) {
      console.error("Buy error:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Purchase failed",
        "error",
      );
    }
    setBuying(null);
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
        <div>
          <h2 className="text-xl font-bold text-gray-800">GTN Marketplace</h2>
          <p className="text-sm text-gray-600">
            Balance:{" "}
            <span className="font-bold text-green-600">
              ${userBalance.toFixed(2)}
            </span>
          </p>
        </div>
        <FaStore className="text-[#0f7a4a]" size={20} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <FaCoins className="text-blue-600 text-sm" />
            <span className="text-xs text-gray-600">Total Available</span>
          </div>
          <p className="text-lg font-bold text-blue-600">{nfts.length}</p>
        </div>

        <div className="bg-white p-3 rounded-lg border">
          <div className="flex items-center gap-2 mb-1">
            <FaFire className="text-green-600 text-sm" />
            <span className="text-xs text-gray-600">All NFTs</span>
          </div>
          <p className="text-lg font-bold text-green-600">Live</p>
        </div>
      </div>

      {nfts.length > 0 ? (
        <div className="space-y-4">
          <div className="space-y-3">
            {nfts.map((nft) => (
              <div
                key={nft._id || nft.nftId}
                className="bg-white rounded-lg p-4 border hover:shadow-md transition-shadow"
              >
                {/* NFT Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-r from-[#0f7a4a] to-green-600 rounded-2xl flex items-center justify-center shadow-md p-[2px]">
                      <img
                        src="/22.png"
                        alt="GTN Token"
                        className="w-full h-full rounded-xl bg-white object-cover"
                      />
                    </div>
                    <div>
                      <h3
                        className="font-bold text-sm text-gray-800 truncate max-w-[150px]"
                        title={nft.nftId}
                      >
                        {nft.nftId}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Gen {nft.generation} • Phase {nft.batchId}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {nft.status}
                  </span>
                </div>

                {/* NFT Details */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-gray-600">Buy Price</p>
                    <p className="font-bold text-green-600">${nft.buyPrice}</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <p className="text-gray-600">Sell Price</p>
                    <p className="font-bold text-blue-600">${nft.sellPrice}</p>
                  </div>
                </div>

                {/* Profit Preview */}
                <div className="bg-blue-50 p-2 rounded mb-3 text-xs">
                  <p className="font-medium text-blue-800">
                    💰 Potential Profit: ${(nft.sellPrice * 0.4).toFixed(2)}{" "}
                    (40%)
                  </p>
                  <p className="text-blue-700">
                    + 2 new NFTs worth ${nft.sellPrice}
                  </p>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() =>
                    buyNFT(nft.nftId, nft.buyPrice, nft.type === "user_resold")
                  }
                  disabled={buying === nft.nftId || userBalance < nft.buyPrice}
                  className={`w-full py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                    userBalance >= nft.buyPrice
                      ? "bg-[#0f7a4a] text-white hover:bg-green-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {buying === nft.nftId ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : userBalance >= nft.buyPrice ? (
                    <>
                      <FaShoppingCart className="text-sm" />
                      <span>
                        Buy ${nft.buyPrice}{" "}
                        {nft.type === "user_resold" ? "(User)" : "(GTN Token)"}
                      </span>
                    </>
                  ) : (
                    <>
                      <FaDollarSign className="text-sm" />
                      <span>
                        Need ${(nft.buyPrice - userBalance).toFixed(2)} More
                      </span>
                    </>
                  )}
                </button>

                {/* Status Message */}
                {userBalance < nft.buyPrice && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700 text-center">
                    ⚠️ Insufficient Balance: Need ${nft.buyPrice}, Have $
                    {userBalance.toFixed(2)}
                  </div>
                )}

                {nft.status !== "listed" && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700 text-center">
                    ⚠️ NFT Status: {nft.status} (Only 'listed' NFTs can be
                    purchased)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-white rounded-lg p-6 border">
            <FaStore className="mx-auto text-gray-400 mb-3" size={32} />
            <h3 className="font-bold text-gray-800 mb-2">No NFTs Available</h3>
            <p className="text-gray-600 text-sm mb-3">
              All NFTs are currently sold out
            </p>
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
              💡 Check back later for new NFTs
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTMarketplace;
