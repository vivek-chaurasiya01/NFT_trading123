import React, { useState, useEffect } from "react";
import {
  FaWallet,
  FaPlus,
  FaMinus,
  FaHistory,
  FaCoins,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { walletAPI, userAPI, demoAPI } from "../services/api";
import WalletStatus from "../Componect/WalletStatus";
import realWalletService from "../services/realWalletService";

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [profit, setProfit] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchProfit();
    fetchTransactions();

    // Listen for balance updates from other components
    const handleBalanceUpdate = (event) => {
      setBalance(event.detail.balance);
    };

    window.addEventListener("balanceUpdate", handleBalanceUpdate);

    return () => {
      window.removeEventListener("balanceUpdate", handleBalanceUpdate);
    };
  }, []);

  const fetchBalance = async () => {
    try {
      // ✅ Real API First - Using API #8
      const response = await walletAPI.getBalance();
      const realBalance = response.data.balance || 0;

      console.log("🔍 Real API Balance:", realBalance);

      // Use real balance if available
      if (realBalance > 0) {
        setBalance(realBalance);
        console.log("✅ Using real balance:", realBalance);
        return;
      }

      // Fallback to demo balance only if real balance is 0
      const demoBalance =
        localStorage.getItem("demoBalance") ||
        localStorage.getItem("userBalance");
      if (demoBalance) {
        setBalance(parseFloat(demoBalance));
        console.log("⚠️ Using demo balance:", demoBalance);
      } else {
        setBalance(0);
        console.log("❌ No balance found");
      }
    } catch (error) {
      console.error("❌ Real API failed:", error);
      // Only use demo on API failure
      const demoBalance =
        localStorage.getItem("demoBalance") ||
        localStorage.getItem("userBalance");
      setBalance(demoBalance ? parseFloat(demoBalance) : 0);
      console.log("⚠️ API failed, using demo:", demoBalance || 0);
    }
  };

  const fetchProfit = async () => {
    try {
      const response = await walletAPI.getBalance();
      setProfit(response.data.profit || 0);
    } catch (error) {
      console.error("Error fetching profit:", error);
      setProfit(0);
    }
  };

  const fetchTransactions = async () => {
    try {
      // Use same API as History page
      const response = await userAPI.getTransactions();
      const apiTransactions = response.data.transactions || [];
      
      // Sort by date (newest first) and take only 5 recent transactions
      const recentTransactions = apiTransactions
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      setTransactions(recentTransactions);
      console.log('✅ Recent transactions loaded:', recentTransactions.length);
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  const handleAddBalance = async () => {
    // First check if wallet is connected
    if (!realWalletService.isWalletConnected()) {
      Swal.fire({
        icon: "warning",
        title: "Wallet Not Connected",
        text: "Please connect your crypto wallet first to add balance",
        confirmButtonColor: "#0f7a4a",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Get wallet balance
      const walletBalance = await realWalletService.getBalance();
      const walletAccount = realWalletService.getAccount();
      const networkInfo = realWalletService.getNetworkInfo();
      
      if (!walletBalance.success) {
        throw new Error(walletBalance.error || "Failed to fetch wallet balance");
      }

      const ethBalance = parseFloat(walletBalance.balance);
      const ethToUsd = 2000; // 1 ETH = $2000 (you can make this dynamic)
      const maxUsdAmount = (ethBalance * ethToUsd).toFixed(2);

      setLoading(false);

      // Show wallet info and amount input
      const { value: amount } = await Swal.fire({
        title: "Add Balance from Wallet",
        html: `
          <div class="text-left space-y-4 mb-4">
            <div class="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 class="font-semibold text-green-800 mb-2">Connected Wallet</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Status:</span>
                  <span class="text-green-600 font-medium">✅ Connected</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Address:</span>
                  <span class="font-mono text-xs">${walletAccount.substring(0, 6)}...${walletAccount.substring(38)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Balance:</span>
                  <span class="font-medium">${ethBalance} ETH (~$${maxUsdAmount})</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Network:</span>
                  <span class="text-blue-600">${networkInfo.networkName}</span>
                </div>
              </div>
              <button 
                onclick="location.reload()" 
                class="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                🔄 Refresh Balance
              </button>
            </div>
          </div>
        `,
        input: "number",
        inputLabel: `Enter Amount (Max: $${maxUsdAmount} USD)`,
        inputPlaceholder: "Enter USD amount to add",
        inputAttributes: {
          min: 1,
          max: parseFloat(maxUsdAmount),
          step: 0.01,
        },
        showCancelButton: true,
        confirmButtonColor: "#0f7a4a",
        confirmButtonText: "Add from Wallet",
        inputValidator: (value) => {
          if (!value || value <= 0) {
            return "Please enter a valid amount!";
          }
          if (parseFloat(value) > parseFloat(maxUsdAmount)) {
            return `Insufficient wallet balance! Max: $${maxUsdAmount}`;
          }
        },
      });

      if (amount) {
        setLoading(true);
        const addAmount = parseFloat(amount);
        const ethRequired = (addAmount / ethToUsd).toFixed(6);

        // Confirm transaction
        const confirmResult = await Swal.fire({
          title: "Confirm Transaction",
          html: `
            <div class="text-left space-y-2">
              <p><strong>Amount to Add:</strong> $${addAmount} USD</p>
              <p><strong>ETH Required:</strong> ${ethRequired} ETH</p>
              <p><strong>From Wallet:</strong> ${walletAccount.substring(0, 6)}...${walletAccount.substring(38)}</p>
              <p class="text-sm text-gray-600 mt-3">This will deduct ETH from your connected wallet</p>
            </div>
          `,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#0f7a4a",
          confirmButtonText: "Confirm & Add",
          cancelButtonText: "Cancel",
        });

        if (confirmResult.isConfirmed) {
          try {
            // Send ETH transaction (this will deduct from wallet)
            const paymentResult = await realWalletService.sendPayment(addAmount);
            
            if (paymentResult.success) {
              // Add to platform balance via API
              const response = await demoAPI.addDemoBalance(addAmount);
              
              if (response.data.success) {
                const newBalance = response.data.newBalance;
                setBalance(newBalance);

                // Notify other components
                window.dispatchEvent(
                  new CustomEvent("balanceUpdate", {
                    detail: { balance: newBalance },
                  }),
                );

                Swal.fire({
                  icon: "success",
                  title: "Balance Added Successfully!",
                  html: `
                    <div class="text-left space-y-2">
                      <p><strong>Amount Added:</strong> $${addAmount}</p>
                      <p><strong>New Platform Balance:</strong> $${newBalance}</p>
                      <p><strong>ETH Deducted:</strong> ${paymentResult.amount} ETH</p>
                      <p><strong>Transaction Hash:</strong></p>
                      <p class="text-xs break-all font-mono">${paymentResult.txHash}</p>
                      <p class="text-sm text-green-600">✅ Real wallet integration!</p>
                    </div>
                  `,
                  confirmButtonColor: "#0f7a4a",
                });
              }
            } else {
              throw new Error(paymentResult.error || "Transaction failed");
            }

            // Refresh data
            fetchBalance();
            fetchTransactions();
          } catch (error) {
            console.error("❌ Wallet transaction failed:", error);
            Swal.fire({
              icon: "error",
              title: "Transaction Failed",
              text: error.message || "Failed to process wallet transaction",
              confirmButtonColor: "#0f7a4a",
            });
          }
        }
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      console.error("❌ Wallet balance fetch failed:", error);
      
      // Fallback to regular add balance
      Swal.fire({
        icon: "warning",
        title: "Wallet Error",
        text: "Could not fetch wallet balance. Use regular add balance instead.",
        confirmButtonColor: "#0f7a4a",
      });
    }
  };

  const handleWithdraw = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Withdraw Funds",
      html:
        '<input id="amount" class="swal2-input" placeholder="Amount" type="number">' +
        '<input id="wallet" class="swal2-input" placeholder="Wallet Address">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: "#0f7a4a",
      preConfirm: () => {
        return [
          document.getElementById("amount").value,
          document.getElementById("wallet").value,
        ];
      },
    });

    if (formValues) {
      const [amount, walletAddress] = formValues;
      if (!amount || !walletAddress) {
        Swal.fire("Error", "Please fill all fields", "error");
        return;
      }

      setLoading(true);
      try {
        await walletAPI.withdraw(parseFloat(amount), walletAddress);
        Swal.fire({
          icon: "success",
          title: "Withdrawal Requested",
          text: "Your request is pending admin approval",
          confirmButtonColor: "#0f7a4a",
        });
        fetchBalance();
        fetchProfit();
        fetchTransactions();
      } catch (error) {
        Swal.fire(
          "Error",
          error.response?.data?.message || "Withdrawal failed",
          "error",
        );
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            My Wallet
          </h2>
          <p className="text-gray-500 text-sm">Manage your funds securely</p>
        </div>
        <div className="bg-gradient-to-r from-[#0f7a4a] to-green-600 p-3 rounded-full">
          <FaWallet className="text-white" size={24} />
        </div>
      </div>

  

       <WalletStatus />

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={handleAddBalance}
          disabled={loading}
          className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 disabled:opacity-50"
        >
          <div className="bg-green-50 group-hover:bg-green-100 p-4 rounded-2xl w-fit mx-auto mb-4 transition-colors">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            ) : (
              <FaCoins className="text-green-600" size={24} />
            )}
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Add Balance</h3>
          <p className="text-gray-500 text-sm">Add money for NFT trading</p>
        </button>
        <button
          onClick={handleWithdraw}
          disabled={loading}
          className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="bg-red-50 group-hover:bg-red-100 p-4 rounded-2xl w-fit mx-auto mb-4 transition-colors">
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            ) : (
              <FaMinus className="text-red-600" size={24} />
            )}
          </div>
          <h3 className="font-semibold text-gray-800 mb-1">Withdraw</h3>
          <p className="text-gray-500 text-sm">Transfer to wallet</p>
        </button>


      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden -mx-4 sm:mx-0">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-[#0f7a4a] p-2 rounded-xl">
              <FaHistory className="text-white" size={16} />
            </div>
            <div>
              <h4 className="font-bold text-lg text-gray-800">
                Recent Transactions
              </h4>
              <p className="text-gray-500 text-sm">
                Your latest financial activity
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction, index) => {
                // Determine if money is added to wallet (credit) or withdrawn from company (debit)
                const isMoneyAdded = transaction.type === "credit" || transaction.type === "add" || transaction.description?.toLowerCase().includes("added") || transaction.description?.toLowerCase().includes("deposit");
                const isMoneyWithdrawn = transaction.type === "debit" || transaction.type === "withdraw" || transaction.description?.toLowerCase().includes("withdraw") || transaction.description?.toLowerCase().includes("sent");
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isMoneyAdded
                            ? "bg-green-100 border border-green-200"
                            : "bg-red-100 border border-red-200"
                        }`}
                      >
                        {isMoneyAdded ? (
                          <FaPlus className="text-green-600" size={14} />
                        ) : (
                          <FaMinus className="text-red-600" size={14} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      <p
                        className={`font-bold text-lg ${
                          isMoneyAdded
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {isMoneyAdded ? "+" : "-"}$
                        {transaction.amount}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaHistory className="mx-auto text-gray-300 mb-3" size={32} />
              <p className="text-gray-500 font-medium">No transactions yet</p>
              <p className="text-gray-400 text-sm">
                Your transactions will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
