import React, { useState, useEffect } from "react";
import { FaCheck, FaDollarSign, FaRocket, FaGem } from "react-icons/fa";
import Swal from "sweetalert2";
import { packageAPI } from "../services/api";
import useAuthCheck from "../utils/useAuthCheck";

const PackageUpgrade = () => {
  const token = useAuthCheck();
  const [packages, setPackages] = useState({});
  const [currentPackage, setCurrentPackage] = useState("basic");
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!token) return null;

  useEffect(() => {
    fetchPackages();

    const handleBalanceUpdate = (e) => {
      setUserBalance(e.detail.balance);
    };

    window.addEventListener("balanceUpdate", handleBalanceUpdate);
    window.addEventListener("walletBalanceUpdate", handleBalanceUpdate);

    return () => {
      window.removeEventListener("balanceUpdate", handleBalanceUpdate);
      window.removeEventListener("walletBalanceUpdate", handleBalanceUpdate);
    };
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await packageAPI.getPlans();
      const data = res.data;

      setPackages({
        basic: data.plans?.basic || {
          amount: 10,
          purchaseLimit: 500,
          unlimited: false,
        },
        premium: data.plans?.premium || {
          amount: 20,
          purchaseLimit: null,
          unlimited: true,
        },
      });

      setCurrentPackage(data.currentPlan || "basic");
      setUserBalance(data.userBalance || 0);
    } catch {
      setPackages({
        basic: { amount: 10, purchaseLimit: 500, unlimited: false },
        premium: { amount: 20, purchaseLimit: null, unlimited: true },
      });
      setCurrentPackage("basic");
      setUserBalance(0);
    }
  };

  const upgradePackage = async (type) => {
    const info = packages[type];

    if (userBalance < info.amount) {
      Swal.fire("Insufficient Balance", `You need $${info.amount}`, "error");
      return;
    }

    const result = await Swal.fire({
      title: `Upgrade to ${type.toUpperCase()}`,
      text: `Cost $${info.amount}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0f7a4a",
    });

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await packageAPI.upgrade();
        const newBalance = userBalance - info.amount;
        setUserBalance(newBalance);

        window.dispatchEvent(
          new CustomEvent("balanceUpdate", {
            detail: { balance: newBalance },
          }),
        );

        Swal.fire("Success", "Package upgraded!", "success");
        fetchPackages();
      } catch {
        Swal.fire("Error", "Upgrade failed", "error");
      }
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#0f7a4a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-semibold text-gray-900">
            Upgrade Your Plan
          </h2>
          <div className="flex justify-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <FaDollarSign className="text-green-600 text-xs" />
              Balance:
              <strong className="text-green-600">${userBalance}</strong>
            </span>
            <span className="flex items-center gap-1">
              <FaCheck className="text-blue-600 text-xs" />
              Current:
              <strong className="text-blue-600">
                {currentPackage.toUpperCase()}
              </strong>
            </span>
          </div>
        </div>

        {/* PLANS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(packages).map(([type, info]) => {
            const active = currentPackage === type;
            const afford = userBalance >= info.amount;

            return (
              <div
                key={type}
                className={`rounded-2xl border bg-white transition ${
                  active ? "border-[#0f7a4a] shadow-lg" : "border-gray-200"
                }`}
              >
                {/* CARD HEADER */}
                <div className="px-6 py-5 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 uppercase">
                        {type}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {info.unlimited
                          ? "Unlimited usage"
                          : `Limit $${info.purchaseLimit}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">
                        ${info.amount}
                      </p>
                      {active && (
                        <span className="text-xs text-green-600 font-medium">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* FEATURES */}
                <div className="px-6 py-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FaCheck className="text-green-500 text-xs" />
                    NFT Trading Access
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheck className="text-green-500 text-xs" />
                    GTN Token Rewards
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheck className="text-green-500 text-xs" />
                    MLM Earnings
                  </div>
                  <div className="flex items-center gap-2">
                    <FaCheck className="text-green-500 text-xs" />
                    {type === "premium"
                      ? "Priority Support"
                      : "Standard Support"}
                  </div>
                </div>

                {/* ACTION */}
                <div className="px-6 pb-6">
                  {!active ? (
                    <button
                      onClick={() => upgradePackage(type)}
                      disabled={!afford}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
                        afford
                          ? "bg-[#0f7a4a] text-white hover:bg-green-700"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {afford
                        ? `Upgrade for $${info.amount}`
                        : "Insufficient Balance"}
                    </button>
                  ) : (
                    <div className="w-full py-2.5 text-center rounded-xl bg-green-50 text-green-700 text-sm font-semibold">
                      ✓ Current Plan
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-1">
              <FaRocket />
              Level Unlock System
            </h4>
            <p className="text-sm text-blue-700">
              More direct members unlock higher MLM levels.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="font-semibold text-green-800 flex items-center gap-2 mb-1">
              <FaGem />
              Upgrade Benefits
            </h4>
            <p className="text-sm text-green-700">
              Higher plans unlock better earning potential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PackageUpgrade;
