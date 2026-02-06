import React, { useState, useEffect } from "react";
import {
  FaHistory,
  FaShoppingCart,
  FaDollarSign,
  FaUsers,
} from "react-icons/fa";
import { userAPI } from "../services/api";

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setError(null);
      const response = await userAPI.getTransactions();
      setTransactions(response.data.transactions || []);
    } catch (error) {
      setError("Failed to load transactions");
      setTransactions([]);
    }
    setLoading(false);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "demo_payment":
        return <FaDollarSign className="text-green-700" size={14} />;
      case "nft_purchase":
        return <FaShoppingCart className="text-blue-700" size={14} />;
      case "nft_sale":
        return <FaDollarSign className="text-green-700" size={14} />;
      case "referral_bonus":
        return <FaUsers className="text-purple-700" size={14} />;
      default:
        return <FaHistory className="text-gray-600" size={14} />;
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "demo_payment":
        return "bg-green-100";
      case "nft_purchase":
        return "bg-blue-100";
      case "nft_sale":
        return "bg-green-100";
      case "referral_bonus":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  };

  const getAmountColor = (type) => {
    switch (type) {
      case "demo_payment":
      case "nft_sale":
      case "referral_bonus":
        return "text-green-700";
      case "nft_purchase":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getAmountPrefix = (type) => {
    switch (type) {
      case "demo_payment":
      case "nft_sale":
      case "referral_bonus":
        return "+";
      case "nft_purchase":
        return "-";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#f4f7f6]">
        <div className="animate-spin h-10 w-10 border-b-2 border-[#0f7a4a] rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f4f7f6]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white border-b">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Transaction History
          </h2>
          <p className="text-xs text-gray-500">All your activities</p>
        </div>
        <div className="bg-[#0f7a4a] p-2 rounded-full">
          <FaHistory className="text-white" size={18} />
        </div>
      </div>

      {/* List */}
      <div className=" py-3 space-y-3">
        {error ? (
          <div className="text-center text-red-600 text-sm">{error}</div>
        ) : transactions.length > 0 ? (
          transactions.map((tx, index) => (
            <div
              key={tx._id || index}
              className="flex items-center justify-between bg-white px-3 py-3 rounded-lg shadow-sm"
            >
              <div className="flex gap-3 items-center flex-1 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionColor(tx.type)}`}
                >
                  {getTransactionIcon(tx.type)}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {tx.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="text-right ml-2">
                <p className={`font-bold ${getAmountColor(tx.type)}`}>
                  {getAmountPrefix(tx.type)}${tx.amount}
                </p>
                <p className="text-[10px] text-gray-400 capitalize">
                  {tx.type?.replace("_", " ")}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 text-sm mt-20">
            <FaHistory size={40} className="mx-auto mb-3 opacity-40" />
            No transactions yet
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
