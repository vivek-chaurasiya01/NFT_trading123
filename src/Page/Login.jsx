import React, { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { authAPI, walletAPI } from "../services/api";
import realWalletService from "../services/realWalletService";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.email || !formData.password) {
      Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill all fields",
        confirmButtonColor: "#0f7a4a",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(formData);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userEmail', response.data.user.email);

      // Check if user needs activation
      if (response.data.needsActivation || !response.data.user.isActive) {
        Swal.fire({
          icon: "warning",
          title: "Account Not Activated",
          text: "Please complete $10 payment to activate",
          confirmButtonColor: "#0f7a4a",
        });
        navigate("/activate");
        return;
      }

      // ✅ needsTopUp flag check karo
      const needsTopUp = localStorage.getItem('needsTopUp');
      if (needsTopUp === 'true') {
        await handleTopUpAfterLogin();
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Login Successful 🎉",
        confirmButtonColor: "#0f7a4a",
      });
      navigate("/dashbord");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.response?.data?.message || "Something went wrong",
        confirmButtonColor: "#0f7a4a",
      });
    }
    setLoading(false);
  };

  // ✅ Login ke baad $20 add karne ka flow
  const handleTopUpAfterLogin = async () => {
    // Force popup
    const popupResult = await Swal.fire({
      icon: "warning",
      title: "💰 Add $20 Trading Balance",
      html: `
        <div class="text-left space-y-3">
          <div class="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p class="text-yellow-800 font-semibold">⚠️ Trading Balance Required</p>
            <p class="text-sm text-yellow-700 mt-1">Add $20 to start trading GTN Tokens.</p>
          </div>
          <div class="bg-blue-50 p-3 rounded-lg">
            <p class="text-xs text-blue-700">💡 Pay via BNB or USDT on BSC Network</p>
          </div>
        </div>
      `,
      confirmButtonColor: "#0f7a4a",
      confirmButtonText: "💰 Add $20 Now",
      allowOutsideClick: false,
      showCancelButton: false,
    });

    if (!popupResult.isConfirmed) return;

    try {
      setLoading(true);

      // BSC Network switch
      try {
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        if (parseInt(chainId, 16) !== 56) {
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x38" }],
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                  chainId: "0x38",
                  chainName: "BSC Mainnet",
                  rpcUrls: ["https://bsc-dataseed.binance.org/"],
                  blockExplorerUrls: ["https://bscscan.com"],
                  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
                }],
              });
            } else throw switchError;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch {
        Swal.fire({ icon: "error", title: "Switch to BSC Mainnet", confirmButtonColor: "#0f7a4a" });
        setLoading(false);
        return;
      }

      // Wallet connect karo agar connected nahi
      if (!realWalletService.isWalletConnected()) {
        const result = await realWalletService.connectWallet();
        if (!result.success) {
          Swal.fire({ icon: "error", title: "Wallet Connect Failed", text: result.error, confirmButtonColor: "#0f7a4a" });
          setLoading(false);
          return;
        }
      }

      // Payment method choose karo
      const { value: paymentMethod } = await Swal.fire({
        title: "Choose Payment Method",
        html: `
          <div class="text-left space-y-3">
            <p class="font-semibold">Amount: <span class="text-green-600">$20 USD</span></p>
            <div class="space-y-2">
              <label class="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input type="radio" name="loginpayment" value="usdt" checked class="mr-3">
                <div class="font-semibold">💚 USDT (Recommended)</div>
              </label>
              <label class="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input type="radio" name="loginpayment" value="bnb" class="mr-3">
                <div class="font-semibold">🟡 BNB Payment</div>
              </label>
            </div>
          </div>
        `,
        showCancelButton: false,
        confirmButtonText: "Continue",
        confirmButtonColor: "#0f7a4a",
        allowOutsideClick: false,
        preConfirm: () => {
          const selected = document.querySelector('input[name="loginpayment"]:checked');
          return selected ? selected.value : "usdt";
        },
      });

      if (!paymentMethod) { setLoading(false); return; }

      // Processing
      Swal.fire({
        title: `Processing ${paymentMethod.toUpperCase()} Payment...`,
        text: "Please confirm in your wallet",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // Blockchain transaction
      const paymentResult = paymentMethod === "usdt"
        ? await realWalletService.sendUSDTPayment(20)
        : await realWalletService.sendPayment(20);

      if (!paymentResult.success) throw new Error(paymentResult.error || "Transaction failed");

      // Wait for confirmation
      Swal.fire({
        title: "Transaction Sent!",
        text: "Waiting for blockchain confirmation...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });
      await new Promise((r) => setTimeout(r, 5000));
      await realWalletService.validateTransaction(paymentResult.txHash);

      // Backend update
      const response = await walletAPI.addBalance(20);
      if (!response.data.success) throw new Error("Failed to update balance");

      // ✅ Flag hatao
      localStorage.removeItem('needsTopUp');

      await Swal.fire({
        icon: "success",
        title: "$20 Added! 🎉",
        html: `<p>New Balance: <strong class="text-green-600">$${response.data.newBalance}</strong></p>`,
        confirmButtonColor: "#0f7a4a",
        confirmButtonText: "Go to Dashboard 🚀",
        allowOutsideClick: false,
      });

      navigate("/dashbord");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text: error.message || "Try again",
        confirmButtonColor: "#0f7a4a",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen bg-[#eaf4ee] flex justify-center items-start md:items-center">
      {/* CARD */}
      <div
        className="
          w-full max-w-[390px] h-full bg-white flex flex-col overflow-hidden
          md:max-w-[460px] md:h-auto md:rounded-2xl md:shadow-2xl
        "
      >
        {/* ===== TOP CURVE ===== */}
        <div className="relative h-[230px] overflow-hidden shrink-0">
          <svg
            viewBox="0 0 375 230"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            <path d="M0 0 H375 V140 C300 200 75 200 0 140 Z" fill="#0f7a4a" />
          </svg>

          <div className="absolute -top-16 right-[-60px] w-[180px] h-[180px] bg-[#7fc8a2] rounded-full"></div>

          <div className="relative z-10 px-6 pt-10 text-white">
            <p className="text-sm font-medium">Hi,</p>
            <h1 className="text-[22px] font-bold">Please Login</h1>
            <p className="text-center text-lg font-semibold mt-4">Welcome to GTN Project</p>
          </div>
        </div>

        {/* ===== FORM ===== */}
        <div className="flex-1 flex justify-center pt-10 md:pt-8">
          <form className="w-full px-6 pb-10 md:px-10" onSubmit={handleSubmit}>
            {/* EMAIL */}
            <label className="text-sm font-bold text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              placeholder="email@test.com"
              value={formData.email}
              onChange={handleChange}
              className="
                w-full mt-2 px-4 py-[14px] rounded-md
                bg-white border border-black text-sm
                focus:outline-none focus:border-black focus:ring-0
              "
            />

            {/* PASSWORD */}
            <label className="text-sm font-bold text-gray-700 mt-4 block">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="********"
              value={formData.password}
              onChange={handleChange}
              className="
                w-full mt-2 px-4 py-[14px] rounded-md
                bg-white border border-black text-sm
                focus:outline-none focus:border-black focus:ring-0
              "
            />

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f7a4a] text-white py-4 rounded-md font-bold mt-8 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* SIGNUP LINK */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Not registered yet?{" "}
              <span
                onClick={() => navigate("/SingUp")}
                className="text-[#0f7a4a] font-semibold cursor-pointer hover:underline"
              >
                Create an account
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
