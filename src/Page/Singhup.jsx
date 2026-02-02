import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FaRegCopy, FaWallet, FaEthereum, FaMobile } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { authAPI, walletAPI } from "../services/api";
import realWalletService from "../services/realWalletService";
import walletDebug from "../utils/walletDebug";
import networkChecker from "../utils/networkChecker";
import "../styles/modal-fix.css";

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    country: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    selectedPlan: "basic",
  });
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [loading, setLoading] = useState(false);

  // Debug wallet on component mount
  useEffect(() => {
    walletDebug.logDebugInfo();
    networkChecker.logNetworkInfo(); // Show network info
  }, []);

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
        html: `
          <div class="text-left">
            <p><strong>Environment:</strong> ${isProduction ? "Production" : "Development"}</p>
            <p><strong>Network:</strong> BSC Mainnet</p>
            <hr class="my-3">
            <p>Please follow these steps:</p>
            <ol class="mt-2 space-y-1">
              <li>1. Select your wallet from the popup</li>
              <li>2. Approve the connection request</li>
              <li>3. Switch to BSC Mainnet if needed</li>
              <li>4. Wait for confirmation</li>
            </ol>
            <p class="mt-3 text-sm text-gray-600">If popup doesn't appear, check if it's blocked by your browser</p>
          </div>
        `,
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

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Password Mismatch",
        text: "Password and Confirm Password must match",
      });
      setLoading(false);
      return;
    }

    try {
      // Step 1: Register user
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

      // Show registration success and start payment
      const planAmount = formData.selectedPlan === "premium" ? 20 : 10;
      Swal.fire({
        icon: "success",
        title: "Registration Successful!",
        text: `Now processing $${planAmount} payment to activate your ${formData.selectedPlan} account...`,
        timer: 2000,
        showConfirmButton: false,
      });

      // Step 2: Automatically start payment process after 2 seconds
      setTimeout(async () => {
        await handlePayment();
      }, 2000);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.response?.data?.message || "Something went wrong",
      });
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);

      if (!connectedWallet || !realWalletService.isWalletConnected()) {
        Swal.fire({
          icon: "error",
          title: "Wallet Not Connected",
          text: "Please connect your wallet first",
          confirmButtonColor: "#0f7a4a",
        });
        setLoading(false);
        return;
      }

      const planAmount = formData.selectedPlan === "premium" ? 20 : 10;
      const networkInfo = networkChecker.getCurrentNetwork();
      const paymentWarning = networkChecker.showPaymentWarning();

      // Show payment confirmation
      const confirmResult = await Swal.fire({
        title: "Confirm Payment",
        text: `Send $${planAmount} USD payment in BNB?`,
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

      // Show processing
      Swal.fire({
        title: "Processing Payment...",
        text: "Please confirm the transaction in your wallet",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      // Send real payment
      const paymentResult = await realWalletService.sendPayment(planAmount);

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

        // Validate transaction
        const validationResult = await realWalletService.validateTransaction(
          paymentResult.txHash,
        );

        if (
          validationResult.success &&
          validationResult.status === "confirmed"
        ) {
          // Activate wallet on backend
          await walletAPI.activate({
            txHash: paymentResult.txHash,
            walletAddress: connectedWallet,
            amount: paymentResult.amount,
            amountUSD: paymentResult.amountUSD,
          });

          Swal.fire({
            icon: "success",
            title: "Payment Successful! 🎉",
            text: `Payment of $${paymentResult.amountUSD} completed successfully!`,
            confirmButtonColor: "#0f7a4a",
            confirmButtonText: "Go to Dashboard",
          }).then(() => {
            navigate("/dashbord");
          });
        } else {
          throw new Error("Transaction failed or not confirmed");
        }
      } else {
        throw new Error(paymentResult.error || "Payment failed");
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
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 px-4 py-[14px] rounded-md bg-[#eef6f1] border"
                  />
                </div>

                <div className="mt-4 md:mt-0">
                  <label className="text-sm font-semibold">Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="Enter your mobile number"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    className="w-full mt-2 px-4 py-[14px] rounded-md bg-[#eef6f1] border"
                  />
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
                </div>

                <div className="mt-4">
                  <label className="text-sm font-semibold">
                    Referral Code (Optional)
                  </label>
                  <input
                    type="text"
                    name="referralCode"
                    placeholder="Enter referral code if you have one"
                    value={formData.referralCode}
                    onChange={handleChange}
                    className="w-full mt-2 px-4 py-[14px] rounded-md bg-[#eef6f1] border"
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
                          <span>BNB Network</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaMobile className="text-blue-500" />
                          <span>TrustWallet</span>
                        </div>
                        <span>+ More</span>
                      </div>
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
                  ${formData.selectedPlan === "premium" ? "20" : "10"} One-Time
                  Payment
                </b>{" "}
                required to activate your {formData.selectedPlan} account
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
                    • <b>Real Payments:</b> ETH sent to company wallet
                  </li>
                  <li>
                    • Get test ETH:{" "}
                    <a
                      href="https://sepoliafaucet.com"
                      target="_blank"
                      className="text-[#0f7a4a] underline"
                    >
                      Sepolia Faucet
                    </a>
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
