import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaChartLine,
  FaUsers,
  FaWallet,
  FaImage,
  FaRocket,
  FaLayerGroup,
} from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { userAPI, walletAPI, nftAPI, packageAPI } from "../services/api";
import LevelEarningsModal from "../Componect/LevelEarningsModal";
import WalletStatus from "../Componect/WalletStatus";
import useAuthCheck from "../utils/useAuthCheck";

const Dashboard = () => {
  const token = useAuthCheck();
  // const navigate = useNavigate();
  const [stats, setStats] = useState({
    balance: 0,
    totalEarnings: 0,
    teamSize: 0,
    activeTeamMembers: 0,
    totalTransactions: 0,
    recentTransactions: [],
    nftCount: 0,
  });
  const [nftStats, setNftStats] = useState({
    total: 0,
    holding: 0,
    sold: 0,
    totalProfit: 0,
  });
  const [currentPackage, setCurrentPackage] = useState("basic");
  const [loading, setLoading] = useState(true);
  const [balanceLoaded, setBalanceLoaded] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [levelEarnings, setLevelEarnings] = useState([]);

  if (!token) return null;

  useEffect(() => {
    // Show official notice on dashboard load
    showOfficialNotice();
    
    fetchDashboardData();
    fetchNFTStats();
    fetchPackageInfo();
    fetchLevelEarnings();

    const handleBalanceUpdate = (event) => {
      setStats((prev) => ({ ...prev, balance: event.detail.balance }));
    };

    // Listen for package updates
    const handlePackageUpdate = (event) => {
      setCurrentPackage(event.detail.package);
    };

    window.addEventListener("balanceUpdate", handleBalanceUpdate);
    window.addEventListener("walletBalanceUpdate", handleBalanceUpdate);
    window.addEventListener("packageUpdate", handlePackageUpdate);

    return () => {
      window.removeEventListener("balanceUpdate", handleBalanceUpdate);
      window.removeEventListener("walletBalanceUpdate", handleBalanceUpdate);
      window.removeEventListener("packageUpdate", handlePackageUpdate);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard data and balance like NFTDashboard
      const [dashboardRes, balanceRes] = await Promise.allSettled([
        userAPI.getDashboard(),
        walletAPI.getBalance()
      ]);
      
      const dashboardData = dashboardRes.status === 'fulfilled' ? dashboardRes.value.data.stats || {} : {};
      const balanceData = balanceRes.status === 'fulfilled' ? balanceRes.value.data : { balance: 0 };
      
      // Use same balance logic as NFTDashboard
      const balance = balanceData.balance || parseFloat(localStorage.getItem('demoBalance') || '0');

      let recentTransactions = [];
      try {
        const userTransRes = await userAPI.getTransactions();
        recentTransactions = (userTransRes.data.transactions || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
      } catch {
        recentTransactions = [];
      }

      setStats({
        balance,
        teamSize: dashboardData.teamSize || 0,
        activeTeamMembers: dashboardData.activeTeamMembers || 0,
        recentTransactions,
        totalEarnings: dashboardData.totalEarnings || 0,
        nftCount: dashboardData.nftCount || 0,
        totalInvestment: dashboardData.totalInvestment || 0,
        currentPlan: dashboardData.currentPlan || "basic",
      });
      setBalanceLoaded(true);
    } catch {
      try {
        const localBalance =
          localStorage.getItem("demoBalance") ||
          localStorage.getItem("userBalance");
        let balance = localBalance ? parseFloat(localBalance) : 0;

        if (!localBalance) {
          const balanceRes = await walletAPI.getBalance();
          balance = balanceRes.data.balance || 0;
        }

        setStats((prev) => ({ ...prev, balance }));
        setBalanceLoaded(true);

        const teamRes = await userAPI.getTeam();
        const team = teamRes.data.team || [];

        setStats((prev) => ({
          ...prev,
          teamSize: team.length,
          activeTeamMembers: team.filter((m) => m.isActive).length,
          recentTransactions: [],
        }));
      } catch {
        setBalanceLoaded(true);
      }
    }
  };

  const fetchNFTStats = async () => {
    try {
      const response = await nftAPI.getMyNFTs();
      setNftStats(response.data.stats);
    } catch {}
  };

  const fetchPackageInfo = async () => {
    try {
      // Try to get package from PackageUpgrade API first
      const packageRes = await packageAPI.getPlans();
      const userPackage = packageRes.data.currentPlan || "basic";
      setCurrentPackage(userPackage);
    } catch {
      // Fallback to user profile API
      try {
        const response = await userAPI.getProfile();
        const userPackage = response.data.user.currentPackage || response.data.user.planType || "basic";
        setCurrentPackage(userPackage);
      } catch {
        setCurrentPackage("basic");
      }
    }
    setLoading(false);
  };

  const fetchLevelEarnings = async () => {
    try {
      // Replace with actual API call
      const mockData = [
        {
          level: 1,
          amount: 150,
          description: "Direct referral commission",
          date: "2024-01-15",
          members: 5,
          commission: 10,
          transactions: [
            { from: "User123", amount: 50 },
            { from: "User456", amount: 100 }
          ]
        },
        {
          level: 2,
          amount: 75,
          description: "Second level commission",
          date: "2024-01-14",
          members: 3,
          commission: 5,
          transactions: [
            { from: "User789", amount: 75 }
          ]
        },
        {
          level: 3,
          amount: 25,
          description: "Third level commission",
          date: "2024-01-13",
          members: 1,
          commission: 2.5,
          transactions: [
            { from: "User101", amount: 25 }
          ]
        }
      ];
      setLevelEarnings(mockData);
    } catch {
      setLevelEarnings([]);
    }
  };

  const showOfficialNotice = () => {
    // Check if user has already seen the notice
    const hasSeenNotice = localStorage.getItem('hasSeenPhase2Notice');
    
    if (hasSeenNotice) {
      return; // Don't show if already seen
    }
    
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
              
              <div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 12px; border-radius: 8px; margin: 12px 0;">
                <p style="font-size: 12px; color: #92400e; margin: 0 0 8px 0; line-height: 1.5;">
                  Due to some technical errors, there has been a slight delay in launching Phase–2. Our technical team is actively working to resolve the issue as quickly as possible.
                </p>
                <p style="font-size: 12px; color: #92400e; margin: 0; line-height: 1.5;">
                  We kindly request an additional <strong>3 hours</strong> to ensure that GTN Token Phase–2 is launched smoothly and operates without any disruptions.
                </p>
              </div>
              
              <div style="background: linear-gradient(135deg, #0f7a4a 0%, #059669 100%); padding: 12px; border-radius: 8px; margin: 12px 0; color: white;">
                <p style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0;">📅 Phase–2 Community Trading</p>
                <p style="font-size: 13px; font-weight: bold; margin: 0 0 4px 0;">🚀 Revised Launch Time</p>
                <p style="font-size: 12px; margin: 0;">⏰ Expected in: 3 Hours</p>
              </div>
              
              <div style="background: #dbeafe; border: 2px solid #3b82f6; padding: 12px; border-radius: 8px; margin: 12px 0;">
                <p style="font-size: 12px; font-weight: bold; color: #1e40af; margin: 0 0 8px 0; text-align: center;">⏳ Countdown Timer</p>
                <div id="countdown" style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                  <div style="background: white; padding: 8px 12px; border-radius: 6px; text-align: center; min-width: 60px;">
                    <div id="hours" style="font-size: 20px; font-weight: bold; color: #0f7a4a;">03</div>
                    <div style="font-size: 10px; color: #1e40af;">Hours</div>
                  </div>
                  <div style="background: white; padding: 8px 12px; border-radius: 6px; text-align: center; min-width: 60px;">
                    <div id="minutes" style="font-size: 20px; font-weight: bold; color: #0f7a4a;">00</div>
                    <div style="font-size: 10px; color: #1e40af;">Minutes</div>
                  </div>
                  <div style="background: white; padding: 8px 12px; border-radius: 6px; text-align: center; min-width: 60px;">
                    <div id="seconds" style="font-size: 20px; font-weight: bold; color: #0f7a4a;">00</div>
                    <div style="font-size: 10px; color: #1e40af;">Seconds</div>
                  </div>
                </div>
              </div>
              
              <p style="font-size: 12px; color: #374151; margin: 12px 0 8px 0; font-weight: 600;">
                We sincerely apologize for the inconvenience caused and appreciate your patience, understanding, and continued support.
              </p>
              
              <p style="font-size: 12px; font-weight: 600; color: #0f7a4a; margin-top: 12px; text-align: center;">
                Regards<br>
                <strong>GTN Project</strong>
              </p>
            </div>
          `,
          confirmButtonColor: '#0f7a4a',
          confirmButtonText: '✅ Got it, Thanks!',
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
            // Countdown Timer Logic - 3 hours from now
            const now = new Date().getTime();
            const countdownDate = now + (3 * 60 * 60 * 1000); // 3 hours from now
            
            const updateCountdown = () => {
              const currentTime = new Date().getTime();
              const distance = countdownDate - currentTime;
              
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
        }).then(() => {
          // Mark as seen when user closes the modal
          localStorage.setItem('hasSeenPhase2Notice', 'true');
        });
      }, 500);
  };

  if (loading || !balanceLoaded) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#f4f7f6]">
        <div className="animate-spin h-10 w-10 border-b-2 border-[#0f7a4a] rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f4f7f6]">
      {/* Header */}

      {/* Wallet Status */}
      <div className="mb-4">
        <WalletStatus />
      </div>

      {/* Balance + Team */}
      <div className="grid grid-cols-1 gap-3  py-4">
        <div className="bg-gradient-to-r from-[#0f7a4a] to-green-600 p-4 rounded-xl text-white">
          <FaWallet size={22} />
          <p className="text-sm text-white/80 mt-2">Balance</p>
          <p className="text-2xl font-bold">${stats.balance.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-xl text-white">
          <FaUsers size={22} />
          <p className="text-sm text-white/80 mt-2">Team Size</p>
          <p className="text-2xl font-bold">{stats.teamSize}</p>
        </div>
      </div>

      {/* NFT + Package + Level Earnings */}
      <div className="grid grid-cols-2 gap-3 ">
        {[
          ["Total GTN Token", nftStats.total, <FaImage />, false],
          ["Holding", nftStats.holding, <FaImage />, false],
          ["GTN Profit", `$${nftStats.totalProfit}`, <FaChartLine />, false],
          ["Package", currentPackage.toUpperCase(), <FaRocket />, false],
        ].map((item, i) => (
          <div key={i} className="bg-white p-3 rounded-xl shadow-sm">
            <div className="text-[#0f7a4a] mb-1">{item[2]}</div>
            <p className="text-xs text-gray-500">{item[0]}</p>
            <p className="font-bold text-lg text-gray-800">{item[1]}</p>
          </div>
        ))}
      </div>

      {/* Level Earnings Card */}


      {/* Recent Activity */}
      <div className="bg-white mt-4  rounded-xl">
        <div className="px-4 py-3 border-b font-semibold text-gray-800">
          Recent Activity
        </div>
        <div className="p-4 space-y-3">
          {stats.recentTransactions.length ? (
            stats.recentTransactions.map((t, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="truncate">{t.description || t.type}</span>
                <span className="font-semibold">${t.amount}</span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 text-sm">No activity</p>
          )}
        </div>
      </div>

      {/* Level Earnings Modal */}
      <LevelEarningsModal 
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        levelEarnings={levelEarnings}
      />
    </div>
  );
};

export default Dashboard;
