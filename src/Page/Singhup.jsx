import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Swal from "sweetalert2";
import { FaRegCopy, FaWallet, FaEthereum, FaMobile } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { authAPI, walletAPI } from "../services/api";
import realWalletService from "../services/realWalletService";
import walletDebug from "../utils/walletDebug";
import networkChecker from "../utils/networkChecker";
import TrustWalletHelper from "../Componect/TrustWalletHelper";
import "../styles/modal-fix.css";
import { useLocation } from "react-router-dom";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const Signup = () => {
  const [isReferralLocked, setIsReferralLocked] = useState(false);

  const navigate = useNavigate();

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");

    if (ref) {
      setFormData((prev) => ({
        ...prev,
        referralCode: ref,
      }));
      setIsReferralLocked(true);
    }
  }, [location]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    country: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    selectedPlan: "basic",
    paymentMethod: "usdt",
  });
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState({
    checking: false,
    exists: false,
    message: "",
  });
  const [mobileError, setMobileError] = useState("");

  // Debug wallet on component mount
  useEffect(() => {
    // Show official notice on page load
    showOfficialNotice();
    
    walletDebug.logDebugInfo();
    networkChecker.logNetworkInfo(); // Show network info
  }, []);

  // const location = useLocation();

  // Email validation function
  const checkEmailExists = async (email) => {
    if (!email || !email.includes("@")) {
      setEmailStatus({ checking: false, exists: false, message: "" });
      return;
    }

    setEmailStatus({ checking: true, exists: false, message: "Checking..." });

    try {
      const response = await authAPI.checkEmail(email);

      if (response.data.exists) {
        setEmailStatus({
          checking: false,
          exists: true,
          message: "Email already registered",
        });
      } else {
        setEmailStatus({
          checking: false,
          exists: false,
          message: "Email available",
        });
      }
    } catch (error) {
      setEmailStatus({ checking: false, exists: false, message: "" });
    }
  };

  // Debounced email check
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email) {
        checkEmailExists(formData.email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Connect real wallet (MetaMask, TrustWallet, etc.) - Enhanced
  const connectWallet = async () => {
    try {
      setLoading(true);

      // Log debug info before connection attempt
      console.log("🔄 Starting wallet connection from signup...");
      const debugInfo = await walletDebug.logDebugInfo();

      // Check browser compatibility first
      if (!walletDebug.isWalletInstalled()) {
        const browserInfo = walletDebug.getBrowserInfo();

        Swal.fire({
          icon: "warning",
          title: "No Wallet Found",
          html: `
            <div class="text-left">
              <p>No cryptocurrency wallet detected on your ${browserInfo.isMobile ? "mobile device" : "browser"}.</p>
              <div class="mt-3 p-3 bg-blue-50 rounded">
                <p><strong>For ${browserInfo.isMobile ? "Mobile" : "Desktop"} Users:</strong></p>
                <ul class="mt-2 space-y-1">
                  ${
                    browserInfo.isMobile
                      ? `
                    <li>• <a href="https://metamask.app.link/dapp/${window.location.host}" target="_blank" class="text-blue-600 underline">Open in MetaMask App</a></li>
                    <li>• <a href="https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(window.location.href)}" target="_blank" class="text-blue-600 underline">Open in Trust Wallet</a></li>
                    <li>• <a href="https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}" target="_blank" class="text-blue-600 underline">Open in Coinbase Wallet</a></li>
                  `
                      : `
                    <li>• <a href="https://metamask.io/download/" target="_blank" class="text-blue-600 underline">Install MetaMask</a> (Recommended)</li>
                    <li>• <a href="https://trustwallet.com/browser-extension" target="_blank" class="text-blue-600 underline">Install Trust Wallet</a></li>
                    <li>• <a href="https://wallet.coinbase.com/" target="_blank" class="text-blue-600 underline">Install Coinbase Wallet</a></li>
                  `
                  }
                </ul>
                <p class="mt-2 text-sm text-gray-600">${browserInfo.isMobile ? "Use the wallet app's built-in browser to access this site." : "After installation, refresh this page and try again."}</p>
              </div>
            </div>
          `,
          confirmButtonColor: "#0f7a4a",
          confirmButtonText: browserInfo.isMobile
            ? "I'll use wallet app"
            : "I'll install a wallet",
        });
        setLoading(false);
        return;
      }

      // Show connection progress with environment info
      const isProduction = import.meta.env.VITE_APP_ENV === "production";
      Swal.fire({
        title: "Connecting Wallet...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Try to connect wallet with enhanced error handling
      const result = await realWalletService.connectWallet();

      if (result.success) {
        setConnectedWallet(result.account);

        // Get balance and network info
        const balanceResult = await realWalletService.getBalance();
        const networkInfo = realWalletService.getNetworkInfo();

        Swal.fire({
          icon: "success",
          title: "🎉 Wallet Connected!",
          confirmButtonColor: "#0f7a4a",
        });
      } else {
        throw new Error(result.error || "Failed to connect wallet");
      }
    } catch (error) {
      console.error("Wallet connection error:", error);

      let errorMessage =
        error.message || "Failed to connect wallet. Please try again.";
      let troubleshootingTips = [
        "• Install MetaMask, Trust Wallet, or Coinbase Wallet",
        "• Allow popups in your browser",
        "• Refresh the page and try again",
        "• Check if wallet is unlocked",
        "• Try switching networks if needed",
      ];

      // Specific error handling
      if (
        error.message.includes("timeout") ||
        error.message.includes("Connection timeout")
      ) {
        errorMessage =
          "Connection timed out. Please ensure your wallet is installed and unlocked.";
        troubleshootingTips = [
          "• Make sure MetaMask/Trust Wallet is installed and unlocked",
          "• Allow popups for this site",
          "• Try refreshing the page",
          "• Check your internet connection",
        ];
      } else if (
        error.message.includes("modal") ||
        error.message.includes("Modal")
      ) {
        errorMessage =
          "Wallet modal failed to open. This might be a popup blocker issue.";
        troubleshootingTips = [
          "• Disable popup blocker for this site",
          "• Try using a different browser",
          "• Clear browser cache and cookies",
          "• Disable browser extensions temporarily",
        ];
      } else if (
        error.message.includes("User rejected") ||
        error.message.includes("rejected")
      ) {
        errorMessage =
          "Connection was cancelled. Please try again and approve the connection.";
        troubleshootingTips = [
          "• Click 'Connect' when prompted by your wallet",
          "• Make sure you approve the connection request",
          "• Check if the correct account is selected",
        ];
      }

      Swal.fire({
        icon: "error",
        title: "Connection Failed",
        html: `
          <div class="text-left">
            <p class="mb-3">${errorMessage}</p>
            <div class="p-2 bg-blue-50 rounded text-sm">
              <p><strong>Troubleshooting:</strong></p>
              <ul class="mt-1 space-y-1">
                ${troubleshootingTips.map((tip) => `<li>${tip}</li>`).join("")}
              </ul>
            </div>
            <div class="mt-3 p-2 bg-gray-50 rounded text-xs">
              <p><strong>Technical Details:</strong></p>
              <p>Error: ${error.message}</p>
              <p>Time: ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        `,
        confirmButtonColor: "#0f7a4a",
        confirmButtonText: "Try Again",
      });
    } finally {
      setLoading(false);
    }
  };

  // Real-time BNB price fetcher
  const fetchCurrentBNBPrice = async () => {
    try {
      // Primary API - Binance
      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT",
      );
      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      try {
        // Fallback API - CoinGecko
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd",
        );
        const data = await response.json();
        return data.binancecoin.usd;
      } catch (fallbackError) {
        console.warn(
          "Failed to fetch BNB price, using fallback:",
          fallbackError,
        );
        return 774; // Fallback price
      }
    }
  };

  const copyWallet = () => {
    if (connectedWallet) {
      navigator.clipboard.writeText(connectedWallet);
      Swal.fire({
        icon: "success",
        title: "Copied!",
        text: "Wallet address copied",
        timer: 1200,
        showConfirmButton: false,
      });
    }
  };

  const showOfficialNotice = () => {
    setTimeout(() => {
        Swal.fire({
          title: '<strong style="color: #0f7a4a; font-size: 16px;">🎷 Official Notification 🎷</strong>',
          html: `
            <div style="text-align: left; line-height: 1.6;">
              <p style="font-size: 13px; font-weight: 600; color: #0f7a4a; margin-bottom: 10px;">
                Congratulations to all members for being a part of GTN Token Phase–1.
              </p>
              
              <p style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px;">
                Dear GTN Token Holders,
              </p>
              
              <p style="font-size: 12px; color: #374151; margin-bottom: 10px; line-height: 1.5;">
                We are pleased to announce the launch of <strong>Phase–2</strong>, which introduces the <strong>Buy & Sell Community Trading</strong> feature. In this phase, participants will have the opportunity to earn <strong>up to 40% profit</strong> on each trade. We are confident that Phase–2 will create significant earning potential and mark a new milestone for our growing community in the history of crypto market.
              </p>
              
              <div style="background: linear-gradient(135deg, #0f7a4a 0%, #059669 100%); padding: 12px; border-radius: 8px; margin: 12px 0; color: white;">
                <p style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0;">📅 Today Phase–2 Community Trading</p>
                <p style="font-size: 13px; font-weight: bold; margin: 0 0 4px 0;">🚀 Launch Date: 18/02/2026</p>
                <p style="font-size: 12px; margin: 0 0 4px 0;">⏰ Time: 2:00 PM (India Time)</p>
                <p style="font-size: 12px; margin: 0;">🎯 Buy Limit: Maximum 10 GTN Tokens per user</p>
              </div>
              
              <div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 12px; border-radius: 8px; margin: 12px 0;">
                <p style="font-size: 12px; font-weight: bold; color: #92400e; margin: 0 0 8px 0; text-align: center;">⏳ Countdown Timer</p>
                <div id="countdown" style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                  <div style="background: white; padding: 8px 12px; border-radius: 6px; text-align: center; min-width: 60px;">
                    <div id="hours" style="font-size: 20px; font-weight: bold; color: #0f7a4a;">00</div>
                    <div style="font-size: 10px; color: #92400e;">Hours</div>
                  </div>
                  <div style="background: white; padding: 8px 12px; border-radius: 6px; text-align: center; min-width: 60px;">
                    <div id="minutes" style="font-size: 20px; font-weight: bold; color: #0f7a4a;">00</div>
                    <div style="font-size: 10px; color: #92400e;">Minutes</div>
                  </div>
                  <div style="background: white; padding: 8px 12px; border-radius: 6px; text-align: center; min-width: 60px;">
                    <div id="seconds" style="font-size: 20px; font-weight: bold; color: #0f7a4a;">00</div>
                    <div style="font-size: 10px; color: #92400e;">Seconds</div>
                  </div>
                </div>
              </div>
              
              <p style="font-size: 12px; color: #374151; margin: 12px 0 8px 0; font-weight: 600;">
                Thank you for your Endless Support, Dedication, and Trust in the GTN Project.
              </p>
              
              <p style="font-size: 12px; font-weight: 600; color: #0f7a4a; margin-top: 12px; text-align: center;">
                Regards<br>
                <strong>GTN Project</strong>
              </p>
            </div>
          `,
          confirmButtonColor: '#0f7a4a',
          confirmButtonText: '✅ Got it, Let\'s Start!',
          width: window.innerWidth < 640 ? '96%' : '650px',
          padding: '10px',
          scrollbarWidth: 'thin',
          customClass: {
            popup: 'swal-no-padding',
            htmlContainer: 'swal-html-no-padding swal-scrollable'
          },
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          },
          didOpen: () => {
            // Countdown Timer Logic
            const countdownDate = new Date('2026-02-18T14:00:00+05:30').getTime(); // 2 PM India Time
            
            const updateCountdown = () => {
              const now = new Date().getTime();
              const distance = countdownDate - now;
              
              if (distance < 0) {
                document.getElementById('hours').textContent = '00';
                document.getElementById('minutes').textContent = '00';
                document.getElementById('seconds').textContent = '00';
                return;
              }
              
              const totalHours = Math.floor(distance / (1000 * 60 * 60));
              const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((distance % (1000 * 60)) / 1000);
              
              document.getElementById('hours').textContent = String(totalHours).padStart(2, '0');
              document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
              document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
            };
            
            updateCountdown();
            const interval = setInterval(updateCountdown, 1000);
            
            // Clear interval when modal closes
            const modal = document.querySelector('.swal2-container');
            if (modal) {
              modal.addEventListener('click', () => clearInterval(interval));
            }
          }
        });
      }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!connectedWallet) {
      Swal.fire({
        icon: "warning",
        title: "Wallet Required",
        text: "Please connect your crypto wallet first",
      });
      setLoading(false);
      return;
    }
    const phone = parsePhoneNumberFromString(
      `+${formData.mobile}`,
      formData.country, // IN, US, AE
    );

    if (!phone || !phone.isValid()) {
      Swal.fire({
        icon: "error",
        title: "Invalid Mobile Number",
        text: "Please enter a valid mobile number",
      });
      setLoading(false);
      return;
    }

    if (emailStatus.exists) {
      Swal.fire({
        icon: "error",
        title: "Email Already Exists",
        text: "This email is already registered. Please use a different email.",
      });
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Password Mismatch",
        text: "Password and Confirm Password must match",
      });
      setLoading(false);
      return;
    }

    // Step 1: Payment method selection
    const planAmount = formData.selectedPlan === "premium" ? 20 : 10;

    const paymentChoice = await Swal.fire({
      title: "Select Payment Method",
      html: `
        <div class="text-left space-y-3">
          <p><strong>Amount:</strong> $${planAmount} USD</p>
          <p><strong>Plan:</strong> ${formData.selectedPlan.toUpperCase()}</p>
          <div class="mt-4">
            <label class="block text-sm font-medium mb-2">Choose Payment:</label>
            <div class="space-y-2">
              <label class="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input type="radio" name="payment" value="usdt" checked class="mr-3">
                <div>
                  <div class="font-semibold">$${planAmount} USDT (Recommended)</div>
                 
                </div>
              </label>
              <label class="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input type="radio" name="payment" value="bnb" class="mr-3">
                <div>
                  <div class="font-semibold">BNB Payment</div>
                  
                </div>
              </label>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Continue Payment",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0f7a4a",
      preConfirm: () => {
        const selected = document.querySelector(
          'input[name="payment"]:checked',
        );
        return selected ? selected.value : "usdt";
      },
    });

    if (!paymentChoice.isConfirmed) {
      setLoading(false);
      return;
    }

    setTimeout(async () => {
      await handlePayment(paymentChoice.value);
    }, 500);
  };

  const handlePayment = async (paymentMethod = "usdt") => {
    try {
      setLoading(true);

      // Check wallet connection before payment
      if (!connectedWallet) {
        Swal.fire({
          icon: "error",
          title: "Wallet Not Connected",
          text: "Please connect your wallet first",
          confirmButtonColor: "#0f7a4a",
        });
        setLoading(false);
        return;
      }

      // Force switch to BSC network first
      try {
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        const currentChainId = parseInt(chainId, 16);

        if (currentChainId !== 56) {
          // Switch to BSC Mainnet
          try {
            await window.ethereum.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: "0x38" }], // BSC Mainnet
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              // Add BSC network if not exists
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: "0x38",
                    chainName: "BSC Mainnet",
                    rpcUrls: ["https://bsc-dataseed.binance.org/"],
                    blockExplorerUrls: ["https://bscscan.com"],
                    nativeCurrency: {
                      name: "BNB",
                      symbol: "BNB",
                      decimals: 18,
                    },
                  },
                ],
              });
            } else {
              throw switchError;
            }
          }

          // Wait for network switch
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (networkError) {
        Swal.fire({
          icon: "error",
          title: "Network Switch Required",
          text: "Please switch to BSC Mainnet in your wallet and try again",
          confirmButtonColor: "#0f7a4a",
        });
        setLoading(false);
        return;
      }

      const planAmount = formData.selectedPlan === "premium" ? 20 : 10;
      let paymentResult;

      if (paymentMethod === "usdt") {
        // USDT Payment Method
        const confirmResult = await Swal.fire({
          title: "Confirm USDT Payment",
          html: `
            <div class="text-left">
              <p><strong>Amount:</strong> $${planAmount} USDT</p>
              <p><strong>Network:</strong> BSC Mainnet</p>
              <p><strong>Token:</strong> USDT (BEP-20)</p>
              <div class="mt-3 p-3 bg-yellow-50 rounded">
                <p class="text-sm text-yellow-800">
                  ⚠️ Make sure you have USDT tokens and BNB for gas fees
                </p>
              </div>
            </div>
          `,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#0f7a4a",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Send USDT Payment",
          cancelButtonText: "Cancel",
        });

        if (!confirmResult.isConfirmed) {
          setLoading(false);
          return;
        }

        Swal.fire({
          title: "Processing USDT Payment...",
          text: "Please confirm the USDT transaction in your wallet",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        paymentResult = await realWalletService.sendUSDTPayment(planAmount);
      } else {
        // BNB Payment Method
        Swal.fire({
          title: "Converting to BNB...",
          text: `Converting $${planAmount} to BNB at current market price`,
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const currentBNBPrice = await fetchCurrentBNBPrice();
        const fixedBNBAmounts = {
          basic: "0.014",
          premium: "0.028",
        };
        const exactBNBAmount =
          fixedBNBAmounts[formData.selectedPlan] || fixedBNBAmounts.basic;

        const confirmResult = await Swal.fire({
          title: "Confirm BNB Payment",
          html: `
            <div class="text-left">
              <p><strong>Amount:</strong> $${planAmount} USD</p>
              <p><strong>Network:</strong> BSC Mainnet</p>
              <p><strong>Currency:</strong> BNB</p>
              <p><strong>Current BNB Price:</strong> $${currentBNBPrice.toFixed(2)}</p>
              <p><strong>BNB Amount:</strong> ${exactBNBAmount} BNB</p>
            </div>
          `,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#0f7a4a",
          cancelButtonColor: "#6b7280",
          confirmButtonText: "Send BNB Payment",
          cancelButtonText: "Cancel",
        });

        if (!confirmResult.isConfirmed) {
          setLoading(false);
          return;
        }

        Swal.fire({
          title: "Processing BNB Payment...",
          text: "Please confirm the BNB transaction in your wallet",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        paymentResult = await realWalletService.sendPayment(planAmount);
      }

      if (paymentResult.success) {
        // Show transaction pending
        Swal.fire({
          title: "Transaction Sent!",
          text: "Waiting for blockchain confirmation...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        // Simple validation - wait for actual confirmation
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Validate the transaction properly
        const validationResult = await realWalletService.validateTransaction(
          paymentResult.txHash,
        );

        if (!validationResult.success) {
          throw new Error("Transaction validation failed");
        }

        // Step 3: Now register user after successful payment
        try {
          console.log("💰 Payment successful, registering user...", {
            txHash: paymentResult.txHash,
            amount: paymentResult.amountUSD,
            from: connectedWallet,
            to: paymentResult.to,
          });

          const response = await authAPI.register({
            name: formData.name,
            email: formData.email,
            mobile: formData.mobile,
            country: formData.country,
            password: formData.password,
            walletAddress: connectedWallet,
            referralCode: formData.referralCode || undefined,
            planType: formData.selectedPlan,
          });

          localStorage.setItem("token", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));

          // Activate wallet on backend with payment details
          const activationData = {
            txHash: paymentResult.txHash,
            walletAddress: connectedWallet,
            amount: paymentResult.amount,
            amountUSD: paymentResult.amountUSD,
            paymentType: paymentResult.paymentType || paymentMethod,
            tokenSymbol: paymentResult.tokenSymbol,
            companyWallet: paymentResult.to,
            userWallet: paymentResult.from,
            chainId: paymentResult.chainId,
          };

          const activationResponse = await walletAPI.activate(activationData);

          Swal.fire({
            icon: "success",
            title: "Registration & Payment Successful! 🎉",
            html: `
              <div class="text-center">
                <p>Payment of $${paymentResult.amountUSD} ${paymentResult.tokenSymbol} completed!</p>
                <p>Account created successfully!</p>
                <div class="mt-3 p-3 bg-green-50 rounded">
                  <p class="text-sm text-green-800">
                    ✅ Transaction: ${paymentResult.txHash.slice(0, 10)}...
                  </p>
                  <p class="text-sm text-green-800">
                    💰 From: ${paymentResult.from.slice(0, 6)}...${paymentResult.from.slice(-4)}
                  </p>
                  <p class="text-sm text-green-800">
                    🏦 To: ${paymentResult.to.slice(0, 6)}...${paymentResult.to.slice(-4)}
                  </p>
                </div>
              </div>
            `,
            confirmButtonColor: "#0f7a4a",
            confirmButtonText: "Go to Dashboard",
          }).then(() => {
            navigate("/dashbord");
          });
        } catch (registrationError) {
          console.error("Registration error after payment:", registrationError);

          Swal.fire({
            icon: "error",
            title: "Registration Failed",
            text: "Payment successful but registration failed. Please contact support.",
            confirmButtonColor: "#0f7a4a",
          });
        }
      }
    } catch (error) {
      console.error("Payment error:", error);

      Swal.fire({
        icon: "error",
        title: "Payment Failed",
        text: error.message || "Transaction failed. Please try again.",
        confirmButtonColor: "#0f7a4a",
      });
    }
    setLoading(false);
  };

  return (
    <div className="w-screen h-screen bg-[#eaf4ee] flex justify-center items-start md:items-center">
      <div className="w-full max-w-[390px] h-full bg-white flex flex-col overflow-hidden md:max-w-[820px] md:h-[90vh] md:rounded-2xl md:shadow-2xl">
        {/* TOP */}
        <div className="relative h-[230px] shrink-0 overflow-hidden">
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
            <h1 className="text-[22px] font-bold">Create Account</h1>
            <p className="text-center text-lg font-semibold mt-4">Welcome to GTN Project</p>
          </div>
        </div>

        {/* FORM */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <div>
                  <label className="text-sm font-semibold">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 px-4 py-[14px] rounded-md bg-[#eef6f1] border"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`w-full mt-2 px-4 py-[14px] rounded-md border ${
                        emailStatus.exists
                          ? "bg-red-50 border-red-300"
                          : emailStatus.message === "Email available"
                            ? "bg-green-50 border-green-300"
                            : "bg-[#eef6f1] border-gray-300"
                      }`}
                    />
                    {emailStatus.checking && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0f7a4a]"></div>
                      </div>
                    )}
                  </div>
                  {emailStatus.message && (
                    <p
                      className={`text-xs mt-1 ${
                        emailStatus.exists ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {emailStatus.message}
                    </p>
                  )}
                </div>

                {/* mobile+counatary */}

                {/* <div className="mt-4 md:mt-0">
                  <label className="text-sm font-semibold">Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="Enter your 10-digit mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                    maxLength="10"
                    required
                    className={`w-full mt-2 px-4 py-[14px] rounded-md border ${
                      mobileError ? "bg-red-50 border-red-300" : "bg-[#eef6f1] border-gray-300"
                    }`}
                  />
                  {mobileError && (
                    <p className="text-xs mt-1 text-red-600">
                      {mobileError}
                    </p>
                  )}
                  {formData.mobile.length === 10 && !mobileError && (
                    <p className="text-xs mt-1 text-green-600">
                      ✓ Valid mobile number
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="text-sm font-semibold">Country</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 px-4 py-[14px] rounded-md bg-[#eef6f1] border h-[50px] overflow-y-auto"
                    style={{ maxHeight: "200px" }}
                  >
                    <option value="">Select your country</option>
                    <option value="Afghanistan">Afghanistan</option>
                    <option value="Albania">Albania</option>
                    <option value="Algeria">Algeria</option>
                    <option value="Andorra">Andorra</option>
                    <option value="Angola">Angola</option>
                    <option value="Antigua and Barbuda">
                      Antigua and Barbuda
                    </option>
                    <option value="Argentina">Argentina</option>
                    <option value="Armenia">Armenia</option>
                    <option value="Australia">Australia</option>
                    <option value="Austria">Austria</option>
                    <option value="Azerbaijan">Azerbaijan</option>
                    <option value="Bahamas">Bahamas</option>
                    <option value="Bahrain">Bahrain</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="Barbados">Barbados</option>
                    <option value="Belarus">Belarus</option>
                    <option value="Belgium">Belgium</option>
                    <option value="Belize">Belize</option>
                    <option value="Benin">Benin</option>
                    <option value="Bhutan">Bhutan</option>
                    <option value="Bolivia">Bolivia</option>
                    <option value="Bosnia and Herzegovina">
                      Bosnia and Herzegovina
                    </option>
                    <option value="Botswana">Botswana</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Brunei">Brunei</option>
                    <option value="Bulgaria">Bulgaria</option>
                    <option value="Burkina Faso">Burkina Faso</option>
                    <option value="Burundi">Burundi</option>
                    <option value="Cabo Verde">Cabo Verde</option>
                    <option value="Cambodia">Cambodia</option>
                    <option value="Cameroon">Cameroon</option>
                    <option value="Canada">Canada</option>
                    <option value="Central African Republic">
                      Central African Republic
                    </option>
                    <option value="Chad">Chad</option>
                    <option value="Chile">Chile</option>
                    <option value="China">China</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Comoros">Comoros</option>
                    <option value="Congo">Congo</option>
                    <option value="Costa Rica">Costa Rica</option>
                    <option value="Croatia">Croatia</option>
                    <option value="Cuba">Cuba</option>
                    <option value="Cyprus">Cyprus</option>
                    <option value="Czech Republic">Czech Republic</option>
                    <option value="Denmark">Denmark</option>
                    <option value="Djibouti">Djibouti</option>
                    <option value="Dominica">Dominica</option>
                    <option value="Dominican Republic">
                      Dominican Republic
                    </option>
                    <option value="Ecuador">Ecuador</option>
                    <option value="Egypt">Egypt</option>
                    <option value="El Salvador">El Salvador</option>
                    <option value="Equatorial Guinea">Equatorial Guinea</option>
                    <option value="Eritrea">Eritrea</option>
                    <option value="Estonia">Estonia</option>
                    <option value="Eswatini">Eswatini</option>
                    <option value="Ethiopia">Ethiopia</option>
                    <option value="Fiji">Fiji</option>
                    <option value="Finland">Finland</option>
                    <option value="France">France</option>
                    <option value="Gabon">Gabon</option>
                    <option value="Gambia">Gambia</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Germany">Germany</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Greece">Greece</option>
                    <option value="Grenada">Grenada</option>
                    <option value="Guatemala">Guatemala</option>
                    <option value="Guinea">Guinea</option>
                    <option value="Guinea-Bissau">Guinea-Bissau</option>
                    <option value="Guyana">Guyana</option>
                    <option value="Haiti">Haiti</option>
                    <option value="Honduras">Honduras</option>
                    <option value="Hungary">Hungary</option>
                    <option value="Iceland">Iceland</option>
                    <option value="India">India</option>
                    <option value="Indonesia">Indonesia</option>
                    <option value="Iran">Iran</option>
                    <option value="Iraq">Iraq</option>
                    <option value="Ireland">Ireland</option>
                    <option value="Israel">Israel</option>
                    <option value="Italy">Italy</option>
                    <option value="Jamaica">Jamaica</option>
                    <option value="Japan">Japan</option>
                    <option value="Jordan">Jordan</option>
                    <option value="Kazakhstan">Kazakhstan</option>
                    <option value="Kenya">Kenya</option>
                    <option value="Kiribati">Kiribati</option>
                    <option value="Kuwait">Kuwait</option>
                    <option value="Kyrgyzstan">Kyrgyzstan</option>
                    <option value="Laos">Laos</option>
                    <option value="Latvia">Latvia</option>
                    <option value="Lebanon">Lebanon</option>
                    <option value="Lesotho">Lesotho</option>
                    <option value="Liberia">Liberia</option>
                    <option value="Libya">Libya</option>
                    <option value="Liechtenstein">Liechtenstein</option>
                    <option value="Lithuania">Lithuania</option>
                    <option value="Luxembourg">Luxembourg</option>
                    <option value="Madagascar">Madagascar</option>
                    <option value="Malawi">Malawi</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Maldives">Maldives</option>
                    <option value="Mali">Mali</option>
                    <option value="Malta">Malta</option>
                    <option value="Marshall Islands">Marshall Islands</option>
                    <option value="Mauritania">Mauritania</option>
                    <option value="Mauritius">Mauritius</option>
                    <option value="Mexico">Mexico</option>
                    <option value="Micronesia">Micronesia</option>
                    <option value="Moldova">Moldova</option>
                    <option value="Monaco">Monaco</option>
                    <option value="Mongolia">Mongolia</option>
                    <option value="Montenegro">Montenegro</option>
                    <option value="Morocco">Morocco</option>
                    <option value="Mozambique">Mozambique</option>
                    <option value="Myanmar">Myanmar</option>
                    <option value="Namibia">Namibia</option>
                    <option value="Nauru">Nauru</option>
                    <option value="Nepal">Nepal</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="New Zealand">New Zealand</option>
                    <option value="Nicaragua">Nicaragua</option>
                    <option value="Niger">Niger</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="North Korea">North Korea</option>
                    <option value="North Macedonia">North Macedonia</option>
                    <option value="Norway">Norway</option>
                    <option value="Oman">Oman</option>
                    <option value="Pakistan">Pakistan</option>
                    <option value="Palau">Palau</option>
                    <option value="Palestine">Palestine</option>
                    <option value="Panama">Panama</option>
                    <option value="Papua New Guinea">Papua New Guinea</option>
                    <option value="Paraguay">Paraguay</option>
                    <option value="Peru">Peru</option>
                    <option value="Philippines">Philippines</option>
                    <option value="Poland">Poland</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Qatar">Qatar</option>
                    <option value="Romania">Romania</option>
                    <option value="Russia">Russia</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="Saint Kitts and Nevis">
                      Saint Kitts and Nevis
                    </option>
                    <option value="Saint Lucia">Saint Lucia</option>
                    <option value="Saint Vincent and the Grenadines">
                      Saint Vincent and the Grenadines
                    </option>
                    <option value="Samoa">Samoa</option>
                    <option value="San Marino">San Marino</option>
                    <option value="Sao Tome and Principe">
                      Sao Tome and Principe
                    </option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="Senegal">Senegal</option>
                    <option value="Serbia">Serbia</option>
                    <option value="Seychelles">Seychelles</option>
                    <option value="Sierra Leone">Sierra Leone</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Slovakia">Slovakia</option>
                    <option value="Slovenia">Slovenia</option>
                    <option value="Solomon Islands">Solomon Islands</option>
                    <option value="Somalia">Somalia</option>
                    <option value="South Africa">South Africa</option>
                    <option value="South Korea">South Korea</option>
                    <option value="South Sudan">South Sudan</option>
                    <option value="Spain">Spain</option>
                    <option value="Sri Lanka">Sri Lanka</option>
                    <option value="Sudan">Sudan</option>
                    <option value="Suriname">Suriname</option>
                    <option value="Sweden">Sweden</option>
                    <option value="Switzerland">Switzerland</option>
                    <option value="Syria">Syria</option>
                    <option value="Taiwan">Taiwan</option>
                    <option value="Tajikistan">Tajikistan</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Thailand">Thailand</option>
                    <option value="Timor-Leste">Timor-Leste</option>
                    <option value="Togo">Togo</option>
                    <option value="Tonga">Tonga</option>
                    <option value="Trinidad and Tobago">
                      Trinidad and Tobago
                    </option>
                    <option value="Tunisia">Tunisia</option>
                    <option value="Turkey">Turkey</option>
                    <option value="Turkmenistan">Turkmenistan</option>
                    <option value="Tuvalu">Tuvalu</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Ukraine">Ukraine</option>
                    <option value="United Arab Emirates">
                      United Arab Emirates
                    </option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="United States">United States</option>
                    <option value="Uruguay">Uruguay</option>
                    <option value="Uzbekistan">Uzbekistan</option>
                    <option value="Vanuatu">Vanuatu</option>
                    <option value="Vatican City">Vatican City</option>
                    <option value="Venezuela">Venezuela</option>
                    <option value="Vietnam">Vietnam</option>
                    <option value="Yemen">Yemen</option>
                    <option value="Zambia">Zambia</option>
                    <option value="Zimbabwe">Zimbabwe</option>
                  </select>
                </div> */}

                <div className="mt-4 md:mt-0">
                  <label className="text-sm font-semibold">Mobile Number</label>

                  <PhoneInput
                    country="in"
                    enableSearch
                    value={formData.mobile}
                    onChange={(value, country) => {
                      setFormData((prev) => ({
                        ...prev,
                        mobile: value,
                        country: country.countryCode.toUpperCase(),
                      }));
                    }}
                    isValid={(value, country) => {
                      if (!value) {
                        setMobileError("Mobile number is required");
                        return false;
                      }

                      const phone = parsePhoneNumberFromString(
                        `+${value}`,
                        country.countryCode.toUpperCase(),
                      );

                      if (!phone || !phone.isValid()) {
                        setMobileError("Please enter a valid mobile number");
                        return false;
                      }

                      setMobileError("");
                      return true;
                    }}
                    inputStyle={{
                      width: "100%",
                      height: "52px",
                      backgroundColor: "#eef6f1",
                      borderRadius: "6px",
                      border: mobileError
                        ? "1px solid #f87171"
                        : "1px solid #d1d5db",
                      fontSize: "14px",
                      paddingLeft: "58px",
                    }}
                    buttonStyle={{
                      border: "1px solid #d1d5db",
                      borderRadius: "6px 0 0 6px",
                      backgroundColor: "#eef6f1",
                    }}
                    dropdownStyle={{
                      borderRadius: "6px",
                    }}
                    containerStyle={{
                      marginTop: "8px",
                    }}
                  />

                  {mobileError && (
                    <p className="text-xs mt-1 text-red-600">{mobileError}</p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="text-sm font-semibold">Referral Code</label>
                  <input
                    type="text"
                    name="referralCode"
                    placeholder="Referral code "
                    value={formData.referralCode}
                    onChange={handleChange}
                    readOnly={isReferralLocked}
                    className={`w-full mt-2 px-4 py-[14px] rounded-md border ${
                      isReferralLocked
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-[#eef6f1]"
                    }`}
                    required
                  />
                </div>
              </div>

              {/* PLAN SELECTION */}
              <div className="mt-4">
                <label className="text-sm font-semibold">Select Plan</label>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        selectedPlan: "basic",
                      }))
                    }
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.selectedPlan === "basic"
                        ? "border-[#0f7a4a] bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-800">BASIC</h3>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          formData.selectedPlan === "basic"
                            ? "border-[#0f7a4a] bg-[#0f7a4a]"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.selectedPlan === "basic" && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-[#0f7a4a] mb-2">
                      $10
                    </div>
                    <div className="text-sm text-gray-600">
                      • $500 purchase limit
                      <br />
                      • Basic features
                      <br />• Standard support
                    </div>
                  </div>

                  <div
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        selectedPlan: "premium",
                      }))
                    }
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.selectedPlan === "premium"
                        ? "border-[#0f7a4a] bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-gray-800">PREMIUM</h3>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          formData.selectedPlan === "premium"
                            ? "border-[#0f7a4a] bg-[#0f7a4a]"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.selectedPlan === "premium" && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-[#0f7a4a] mb-2">
                      $20
                    </div>
                    <div className="text-sm text-gray-600">
                      • Unlimited purchases
                      <br />
                      • All premium features
                      <br />• Priority support
                    </div>
                  </div>
                </div>
              </div>

              {/* WALLET CONNECTION */}
              <div className="mt-4">
                <label className="text-sm font-semibold">
                  Crypto Wallet Address
                </label>
                <div className="mt-2">
                  {!connectedWallet ? (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={connectWallet}
                        disabled={loading}
                        aria-label="Connect cryptocurrency wallet"
                        className="w-full bg-[#0f7a4a] text-white py-3 px-4 rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaWallet />
                        {loading ? "Connecting..." : "Connect Real Wallet"}
                      </button>

                      <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FaEthereum className="text-orange-500" />
                          <span>BSC Network</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaMobile className="text-blue-500" />
                          <span>TrustWallet</span>
                        </div>
                        <span>+ More</span>
                      </div>

                      {/* Trust Wallet Helper */}
                      {/* <div className="mt-4">
                        <TrustWalletHelper onConnectionSuccess={(result) => {
                          setConnectedWallet(result.account);
                        }} />
                      </div> */}
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        readOnly
                        value={connectedWallet}
                        className="w-full px-4 py-[14px] pr-16 rounded-md bg-green-50 border border-green-200 text-xs"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <button type="button" onClick={copyWallet}>
                          <FaRegCopy className="text-green-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PASSWORD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 mt-4">
                <div>
                  <label className="text-sm font-semibold">Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    onChange={handleChange}
                    required
                    className="w-full mt-2 px-4 py-[14px] rounded-md bg-[#eef6f1] border"
                  />
                </div>
                <div className="mt-4 md:mt-0">
                  <label className="text-sm font-semibold">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    onChange={handleChange}
                    required
                    className="w-full mt-2 px-4 py-[14px] rounded-md bg-[#eef6f1] border"
                  />
                </div>
              </div>

              <div className="mt-5 p-3 bg-[#eef6f1] border rounded-md text-sm">
                💳{" "}
                <b>
                  ${formData.selectedPlan === "premium" ? "20" : "10"} Payment
                  Options
                </b>{" "}
                - Choose USDT or BNB payment to activate your{" "}
                {formData.selectedPlan} account
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0f7a4a] text-white py-4 rounded-md font-bold mt-6 disabled:opacity-50"
              >
                {loading
                  ? "Processing Registration & Payment..."
                  : `Register & Pay $${formData.selectedPlan === "premium" ? "20" : "10"}`}
              </button>

              <p className="text-center text-sm my-5">
                Already registered?{" "}
                <span
                  onClick={() => navigate("/login")}
                  className="text-[#0f7a4a] font-semibold cursor-pointer"
                >
                  Login here
                </span>
              </p>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <p className="text-blue-800">
                  💳 <b>Real BNB Wallet Integration:</b>
                </p>
                <ul className="text-blue-700 mt-2 space-y-1">
                  <li>
                    • <b>MetaMask:</b> Browser extension & mobile
                  </li>
                  <li>
                    • <b>Trust Wallet:</b> Mobile app with WalletConnect
                  </li>
                  <li>
                    • <b>Coinbase Wallet:</b> Mobile & browser support
                  </li>
                  <li>
                    • <b>300+ Wallets:</b> via WalletConnect protocol
                  </li>
                  <li>
                    • <b>Network:</b> BSC Mainnet (BNB payments only)
                  </li>
                </ul>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
