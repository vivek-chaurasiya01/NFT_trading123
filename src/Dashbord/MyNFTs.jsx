import React, { useState, useEffect } from "react";
import {
  FaCoins,
  FaDollarSign,
  FaChartLine,
  FaGift,
  FaFire,
  FaLock,
  FaStore,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import Swal from "sweetalert2";
import api, { nftAPI } from "../services/api";

const MyNFTs = () => {
  const [myNFTs, setMyNFTs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(null);

  useEffect(() => {
    fetchMyNFTs();
  }, []);

  const fetchMyNFTs = async () => {
    try {
      const response = await nftAPI.getMyNFTs();
      const nfts = response.data.nfts || [];
      const apiStats = response.data.stats || {};

      console.log("📦 API Response:", response.data);
      console.log("📊 NFTs received:", nfts);
      console.log("📈 Stats received:", apiStats);

      // Calculate profit for each NFT properly
      const nftsWithProfit = nfts.map((nft) => {
        console.log(
          "🔄 Processing NFT:",
          nft.nftId,
          "holdStatus:",
          nft.holdStatus,
          "Status:",
          nft.status,
        );

        // Calculate potential profit (70% of sell price as per JSON spec)
        const potentialProfit = nft.sellPrice ? nft.sellPrice * 0.7 : 0;

        return {
          ...nft,
          // Use API profit if available, otherwise calculate potential profit
          profit: nft.profit || potentialProfit,
          potentialProfit: potentialProfit,
        };
      });

      // Calculate stats using holdStatus (not status)
      const calculatedStats = {
        total: nftsWithProfit.length,
        holdNFTs: nftsWithProfit.filter((nft) => nft.holdStatus === "hold")
          .length,
        sellNFTs: nftsWithProfit.filter((nft) => nft.holdStatus === "sell")
          .length,
        stakedNFTs: nftsWithProfit.filter((nft) => nft.isStaked).length,
        soldNFTs: nftsWithProfit.filter((nft) => nft.status === "sold").length,
        totalValue: nftsWithProfit.reduce(
          (sum, nft) => sum + (nft.buyPrice || 0),
          0,
        ),
        totalProfit: nftsWithProfit
          .filter((nft) => nft.status === "sold")
          .reduce((sum, nft) => sum + (nft.profit || 0), 0),
        potentialProfit: nftsWithProfit
          .filter((nft) => nft.holdStatus === "sell")
          .reduce((sum, nft) => sum + (nft.potentialProfit || 0), 0),
      };

      // Use API stats if available, otherwise use calculated stats
      const finalStats = {
        total: apiStats.total || calculatedStats.total,
        holdNFTs: apiStats.holdNFTs || calculatedStats.holdNFTs,
        sellNFTs: apiStats.sellNFTs || calculatedStats.sellNFTs,
        stakedNFTs: apiStats.stakedNFTs || calculatedStats.stakedNFTs,
        soldNFTs: apiStats.soldNFTs || calculatedStats.soldNFTs,
        totalValue: apiStats.totalValue || calculatedStats.totalValue,
        totalProfit: apiStats.totalProfit || calculatedStats.totalProfit,
        potentialProfit: calculatedStats.potentialProfit,
      };

      console.log("📊 Final stats:", finalStats);
      setMyNFTs(nftsWithProfit);
      setStats(finalStats);
    } catch (error) {
      console.error("❌ Error fetching NFTs:", error);

      // Fallback to demo NFTs if API fails
      const demoNFTs = [
        {
          _id: "1",
          nftId: "NFT-DEMO-001",
          holdStatus: "hold",
          status: "sold",
          buyPrice: 10,
          sellPrice: 20,
          generation: 1,
          isStaked: false,
          profit: 0,
          potentialProfit: 14, // 70% of 20
          createdAt: new Date().toISOString(),
        },
        {
          _id: "2",
          nftId: "NFT-DEMO-002",
          holdStatus: "sell",
          status: "sold",
          buyPrice: 10,
          sellPrice: 20,
          generation: 1,
          isStaked: false,
          profit: 0,
          potentialProfit: 14, // 70% of 20
          createdAt: new Date().toISOString(),
        },
      ];

      const demoStats = {
        total: 2,
        holdNFTs: 1,
        sellNFTs: 1,
        stakedNFTs: 0,
        soldNFTs: 0,
        totalValue: 20,
        totalProfit: 0,
        potentialProfit: 14, // Only sell NFT can generate profit
      };

      setMyNFTs(demoNFTs);
      setStats(demoStats);

      // Show demo mode notification
      Swal.fire({
        icon: "info",
        title: "Demo Mode",
        text: "Backend unavailable - showing demo NFTs",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
    setLoading(false);
  };

  const checkSellConditions = (nft) => {
    console.log(
      "🔍 Checking sell conditions for NFT:",
      nft.nftId,
      "holdStatus:",
      nft.holdStatus,
      "Status:",
      nft.status,
    );

    // Check if NFT is staked
    if (nft.isStaked) {
      return {
        allowed: false,
        reason: "NFT is currently staked",
        suggestion: "Unstake the NFT first before selling.",
      };
    }

    // Check if NFT status allows selling
    if (nft.status === "burned") {
      return {
        allowed: false,
        reason: "NFT has been burned",
        suggestion: "Burned NFTs cannot be sold.",
      };
    }

    if (nft.status === "listed") {
      return {
        allowed: false,
        reason: "NFT is already listed in marketplace",
        suggestion: "Remove from marketplace first, then try selling.",
      };
    }

    // Check holdStatus - only 'sell' status NFTs can be sold
    if (nft.holdStatus !== "sell") {
      return {
        allowed: false,
        reason: `NFT holdStatus is '${nft.holdStatus}' - only 'sell' status can be sold`,
        suggestion:
          "Only NFTs with 'sell' holdStatus can be sold. Hold NFTs are for keeping.",
      };
    }

    console.log("✅ NFT can be sold:", nft.nftId);
    return {
      allowed: true,
      reason: "All conditions met",
      suggestion: "NFT is ready to be sold",
    };
  };

  const sellNFT = async (nftId) => {
    const nft = myNFTs.find((n) => n.nftId === nftId);
    if (!nft) return;

    // Check sell conditions
    const canSell = checkSellConditions(nft);
    if (!canSell.allowed) {
      Swal.fire({
        icon: "warning",
        title: "Cannot Sell NFT",
        html: `
          <div class="text-left space-y-2">
            <p><strong>NFT:</strong> ${nft.nftId}</p>
            <p><strong>Status:</strong> ${nft.holdStatus}</p>
            <hr class="my-3">
            <p class="text-red-600">⚠️ <strong>Reason:</strong> ${canSell.reason}</p>
            <p class="text-sm text-gray-600">${canSell.suggestion}</p>
          </div>
        `,
        confirmButtonColor: "#0f7a4a",
      });
      return;
    }

    const result = await Swal.fire({
      title: "List NFT for Sale",
      html: `
        <div class="text-left space-y-3">
          <div class="bg-gray-50 p-3 rounded-lg">
            <p><strong>NFT ID:</strong> ${nft.nftId}</p>
            <p><strong>Your Buy Price:</strong> $${nft.buyPrice}</p>
            <p><strong>List Price:</strong> $${nft.sellPrice}</p>
          </div>
          <div class="bg-blue-50 p-3 rounded-lg">
            <h4 class="font-bold text-blue-800 mb-2">📋 Listing Process</h4>
            <p class="text-sm text-blue-700">• Your NFT will be listed in marketplace at $${nft.sellPrice}</p>
            <p class="text-sm text-blue-700">• You will NOT receive payment immediately</p>
            <p class="text-sm text-blue-700">• Payment comes when someone buys your NFT</p>
          </div>
          <div class="bg-green-50 p-3 rounded-lg">
            <h4 class="font-bold text-green-800 mb-2">💰 Payment When Sold</h4>
            <p class="text-sm text-green-700">• Your Share (70%): <span class="font-bold">$${(nft.sellPrice * 0.7).toFixed(2)}</span></p>
            <p class="text-sm text-green-700">• Company Share (20%): $${(nft.sellPrice * 0.2).toFixed(2)}</p>
            <p class="text-sm text-green-700">• Parent Bonus (10%): $${(nft.sellPrice * 0.1).toFixed(2)}</p>
          </div>
          <div class="bg-yellow-50 p-3 rounded-lg">
            <h4 class="font-bold text-yellow-800 mb-2">🎁 Buyer Gets</h4>
            <p class="text-sm text-yellow-700">• 2 new NFTs (1 Hold + 1 Sell)</p>
            <p class="text-sm text-yellow-700">• Your original NFT will be removed from marketplace</p>
          </div>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0f7a4a",
      confirmButtonText: "List for Sale",
      cancelButtonText: "Cancel",
      width: "600px",
    });

    if (!result.isConfirmed) return;

    setSelling(nftId);
    try {
      const response = await nftAPI.sellNFT(nftId);

      Swal.fire({
        icon: "success",
        title: "NFT Listed Successfully!",
        html: `
          <div class="text-left space-y-2">
            <p><strong>NFT ID:</strong> ${response.data.nft?.nftId || nftId}</p>
            <p><strong>Listed Price:</strong> $${response.data.listedPrice || nft.sellPrice}</p>
            <p><strong>Generation:</strong> ${response.data.nft?.generation || "Gen 2"}</p>
            <hr class="my-3">
            <div class="bg-blue-50 p-3 rounded">
              <p class="text-blue-800 font-medium">📋 ${response.data.note || "Your NFT is now listed in marketplace"}</p>
              <p class="text-blue-700 text-sm mt-2">💰 You will receive $${(nft.sellPrice * 0.7).toFixed(2)} when someone buys it</p>
            </div>
            <div class="bg-green-50 p-3 rounded">
              <p class="text-green-800 font-medium">✅ Next Steps:</p>
              <p class="text-green-700 text-sm">• Check marketplace to see your listed NFT</p>
              <p class="text-green-700 text-sm">• Wait for buyers to purchase</p>
              <p class="text-green-700 text-sm">• Receive payment automatically when sold</p>
            </div>
          </div>
        `,
        confirmButtonColor: "#0f7a4a",
      });

      // No immediate balance update - payment comes when NFT is bought
      // Just refresh the NFT list to show updated status
      fetchMyNFTs();

      // Dispatch event to refresh marketplace
      window.dispatchEvent(
        new CustomEvent("nftListedForSale", {
          detail: { nftId: nftId, listedPrice: nft.sellPrice },
        }),
      );

      console.log("✅ NFT listed for sale, no immediate payment");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Listing failed";
      Swal.fire("Error", errorMsg, "error");
    }
    setSelling(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "hold":
        return <FaCheckCircle className="text-green-600" />;
      case "listed":
        return <FaStore className="text-blue-600" />;
      case "locked":
        return <FaLock className="text-yellow-600" />;
      case "sold":
        return <FaCoins className="text-gray-600" />;
      default:
        return <FaClock className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "hold":
        return "bg-green-100 text-green-800";
      case "listed":
        return "bg-blue-100 text-blue-800";
      case "locked":
        return "bg-yellow-100 text-yellow-800";
      case "sold":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <div className="min-h-screen bg-gray-50 space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
              <div className="bg-[#0f7a4a] p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                <FaCoins className="text-white" size={16} />
              </div>
              My GTN
            </h2>
            <p className="text-gray-600 mt-1 text-sm">
              Manage and sell your GTN collection
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs sm:text-sm text-gray-500">Total</p>
            <p className="text-lg sm:text-2xl font-bold text-[#0f7a4a]">
              {stats.total || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="bg-green-100 p-1.5 sm:p-2 rounded-md sm:rounded-lg">
              <FaCheckCircle className="text-green-600" size={12} />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              Hold NFTs
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-green-600">
            {stats.holdNFTs || 0}
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="bg-blue-100 p-1.5 sm:p-2 rounded-md sm:rounded-lg">
              <FaStore className="text-blue-600" size={12} />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              Sell NFTs
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-blue-600">
            {stats.sellNFTs || 0}
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="bg-purple-100 p-1.5 sm:p-2 rounded-md sm:rounded-lg">
              <FaLock className="text-purple-600" size={12} />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              Staked
            </span>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-purple-600">
            {stats.stakedNFTs || 0}
          </p>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="bg-green-100 p-1.5 sm:p-2 rounded-md sm:rounded-lg">
              <FaDollarSign className="text-green-600" size={12} />
            </div>
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              Potential Profit
            </span>
          </div>
          <p
            className={`text-lg sm:text-2xl font-bold ${
              (stats.potentialProfit || 0) >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            ${(stats.potentialProfit || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* NFTs List */}
      {myNFTs.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {myNFTs.map((nft) => {
            const canSell = checkSellConditions(nft);
            return (
              <div
                key={nft.nftId}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border hover:shadow-md transition-all duration-300"
              >
                {/* NFT Header */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-[#0f7a4a] to-green-600 rounded-2xl flex items-center justify-center shadow-md p-[2px]">
                      <img
                        src="/22.png"
                        alt="GTN Token"
                        className="w-full h-full rounded-xl bg-white object-cover"
                      />
                    </div>
                    <div>
                      <h3
                        className="font-bold text-sm sm:text-lg text-gray-800"
                        title={nft.nftId}
                      >
                        {nft.nftId}
                      </h3>
                      <p className="text-gray-500 text-xs sm:text-sm">
                        Generation {nft.generation}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(nft.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    {nft.isStaked ? (
                      <FaLock className="text-purple-600" />
                    ) : nft.holdStatus === "hold" ? (
                      <FaCheckCircle className="text-green-600" />
                    ) : nft.holdStatus === "sell" ? (
                      <FaStore className="text-blue-600" />
                    ) : (
                      <FaClock className="text-gray-600" />
                    )}
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                        nft.isStaked
                          ? "bg-purple-100 text-purple-800"
                          : nft.holdStatus === "hold"
                            ? "bg-green-100 text-green-800"
                            : nft.holdStatus === "sell"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {nft.isStaked ? "Staked" : nft.holdStatus || "Unknown"}
                    </span>
                  </div>
                </div>

                {/* NFT Details */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <div className="text-center p-2 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
                    <p className="text-gray-600 text-xs sm:text-sm mb-1">
                      Buy Price
                    </p>
                    <p className="font-bold text-sm sm:text-lg text-gray-800">
                      ${nft.buyPrice}
                    </p>
                  </div>
                  <div className="text-center p-2 sm:p-4 bg-blue-50 rounded-lg sm:rounded-xl">
                    <p className="text-gray-600 text-xs sm:text-sm mb-1">
                      Sell Price
                    </p>
                    <p className="font-bold text-sm sm:text-lg text-blue-600">
                      ${nft.sellPrice}
                    </p>
                  </div>
                  <div className="text-center p-2 sm:p-4 bg-green-50 rounded-lg sm:rounded-xl">
                    <p className="text-gray-600 text-xs sm:text-sm mb-1">
                      Potential Profit
                    </p>
                    <p
                      className={`font-bold text-sm sm:text-lg ${
                        nft.holdStatus === "sell"
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      $
                      {nft.holdStatus === "sell"
                        ? (nft.sellPrice * 0.7).toFixed(2)
                        : "0.00"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {nft.holdStatus === "sell"
                        ? "70% seller share"
                        : "Hold NFT"}
                    </p>
                  </div>
                </div>

                {/* Sell Benefits Preview */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FaDollarSign className="text-green-600" size={14} />
                    <span className="font-medium text-gray-800 text-sm">
                      Sell Benefits
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-600">Your Share (70%)</p>
                      <p
                        className={`font-bold ${
                          nft.holdStatus === "sell"
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        $
                        {nft.holdStatus === "sell"
                          ? (nft.sellPrice * 0.7).toFixed(2)
                          : "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p
                        className={`font-bold ${
                          nft.holdStatus === "sell"
                            ? "text-blue-600"
                            : "text-gray-600"
                        }`}
                      >
                        {nft.holdStatus === "sell" ? "Can Sell" : "Hold Only"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Always Show */}
                {canSell.allowed ? (
                  <button
                    onClick={() => sellNFT(nft.nftId)}
                    disabled={selling === nft.nftId}
                    className="w-full bg-gradient-to-r from-[#0f7a4a] to-green-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                  >
                    {selling === nft.nftId ? (
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <FaDollarSign size={14} />
                        <span>Sell for ${nft.sellPrice}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      disabled
                      className="w-full bg-gray-400 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <FaLock size={14} />
                      <span>Cannot Sell</span>
                    </button>
                    <div className="bg-red-50 border border-red-200 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <FaLock className="text-red-600" size={12} />
                        <span className="font-medium text-red-800 text-xs sm:text-sm">
                          Reason
                        </span>
                      </div>
                      <p className="text-red-700 text-xs sm:text-sm">
                        {canSell.reason}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-12">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-sm border">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FaCoins className="text-gray-400 text-xl sm:text-2xl" />
            </div>
            <h3 className="font-bold text-lg sm:text-xl text-gray-800 mb-2">
              No NFTs Yet
            </h3>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
              Buy your first NFT from the marketplace to start earning!
            </p>
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg sm:rounded-xl text-blue-800 border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaStore size={14} />
                <span className="font-medium text-sm">Get Started</span>
              </div>
              <p className="text-xs sm:text-sm">
                Visit NFT Marketplace to purchase your first NFT
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyNFTs;
