import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaUsers,
  FaWallet,
  FaHistory,
  FaUser,
  FaImage,
  FaBars,
  FaCog,
  FaSignOutAlt,
  FaChartBar,
  FaEnvelope,
  FaLock,
  FaShoppingCart,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";

export default function MainDashBord() {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      Swal.fire({
        title:
          '<strong style="color: #0f7a4a; font-size: 16px;">🎷 Official Notification 🎷</strong>',
        html: `
          <div style="text-align: left; line-height: 1.6;">
            <p style="font-size: 13px; font-weight: 600; color: #0f7a4a; margin-bottom: 10px;">
              Dear GTN Project Members,
            </p>
            
            <p style="font-size: 12px; color: #374151; margin-bottom: 12px; line-height: 1.6;">
              Thank you for being a valued part of GTN Project Phase–1 and Phase–2. We sincerely appreciate your continuous dedication, effort, and trust. While you are actively contributing at the forefront of the GTN Project, our team is diligently working behind the scenes to build a strong, secure, and sustainable future system for our entire community.
            </p>
            
            <p style="font-size: 12px; color: #374151; margin-bottom: 12px; line-height: 1.6;">
              Our goals are clearly defined, and we remain fully committed to achieving them. By 2027, we aim to launch our crypto token on the BNB Blockchain and build a global community of over 200,000 members. Together, GTN Token holders will celebrate this significant achievement and set a new milestone in the history of the crypto market.
            </p>
            
            <div style="background: #f0fdf4; border: 2px solid #0f7a4a; padding: 12px; border-radius: 8px; margin: 12px 0;">
              <p style="font-size: 12px; font-weight: bold; color: #0f7a4a; margin: 0 0 10px 0;">Now is the time to strengthen and expand your personal community within the GTN Project and take advantage of 3 key earning opportunities:</p>
              <ul style="font-size: 12px; color: #374151; margin: 0; padding-left: 20px; line-height: 1.8;">
                <li>👉 GTN Token Sales Income</li>
                <li>👉 Referral Bonus up to 10 Levels</li>
                <li>👉 Token Trading Income up to 10 Levels</li>
              </ul>
            </div>
            
            <p style="font-size: 12px; color: #374151; margin: 12px 0 8px 0; font-weight: 600; text-align: center;">
              Together, we move forward toward growth and success.
            </p>
            
            <p style="font-size: 12px; font-weight: 600; color: #0f7a4a; margin-top: 12px; text-align: center;">
              Regards,<br>
              <strong>GTN Project</strong>
            </p>
          </div>
        `,
        confirmButtonColor: "#0f7a4a",
        confirmButtonText: "✅ Got it, Thanks!",
        width: window.innerWidth < 640 ? "96%" : "600px",
        padding: "10px",
        scrollbarWidth: "thin",
        customClass: {
          popup: "swal-no-padding",
          htmlContainer: "swal-html-no-padding swal-scrollable",
        },
        showClass: {
          popup: "animate__animated animate__fadeInDown",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp",
        },
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const bottomNavItems = [
    { to: "/dashbord/my-team", label: "Team", icon: <FaUsers size={18} /> },
    { to: "/dashbord/wallet", label: "Wallet", icon: <FaWallet size={18} /> },
    {
      to: "/dashbord",
      label: "Dashboard",
      icon: <MdDashboard size={22} />,
      exact: true,
    },
    {
      to: "/dashbord/history",
      label: "History",
      icon: <FaHistory size={18} />,
    },
    { to: "/dashbord/profile", label: "Profile", icon: <FaUser size={18} /> },
  ];

  const menuItems = [
    {
      to: "/dashbord/nft-dashboard",
      label: "MY Deshboard,",
      icon: <FaChartBar />,
    },
    {
      to: "/dashbord/nft-marketplace",
      label: "GTN Token Buy & Sell",
      icon: <FaImage />,
    },
    { to: "/dashbord/my-nfts", label: "MY Portfolio ", icon: <FaImage /> },
    {
      to: "/dashbord/nft-management",
      label: "Token Managment ",
      icon: <FaCog />,
    },
    // { to: "/dashbord/nft-status", label: "NFT Status", icon: <FaCog /> },
    { to: "/dashbord/mlm-tree", label: "My Community", icon: <FaUsers /> },
    {
      to: "/dashbord/package-upgrade",
      label: "Package Upgrade",
      icon: <FaChartBar />,
    },
    { to: "/dashbord/nft-history", label: "Token History", icon: <FaImage /> },
    { to: "/dashbord/my-sold-nfts", label: "My Sold NFTs", icon: <FaShoppingCart /> },
    { to: "/dashbord/change-password", label: "Change Password", icon: <FaLock /> },
    { to: "/dashbord/contact-us", label: "Contact Us", icon: <FaEnvelope /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 max-w-md mx-auto relative">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur shadow-sm px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMenu(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <FaBars />
          </button>
          <h1 className="font-semibold text-lg text-gray-800">Dashboard</h1>
        </div>

        <div
          onClick={() => navigate("/dashbord/profile")}
          className="w-9 h-9 rounded-full bg-[#0f7a4a] text-white flex items-center justify-center font-bold cursor-pointer hover:bg-[#0d6b3f] transition-colors"
        >
          A
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <Outlet />
      </main>

      {/* ===== BOTTOM NAV (MODERN) ===== */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-md bg-white shadow-xl rounded-2xl px-3 py-2 z-40">
        <div className="flex justify-between items-center">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? "bg-[#0f7a4a] text-white shadow-md"
                    : "text-gray-400 hover:bg-gray-100"
                }`
              }
            >
              {item.icon}
              <span className="text-[11px] mt-1 font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ===== SIDE DRAWER ===== */}
      {showMenu && (
        <div className="fixed inset-0 z-50 flex bg-black/40">
          <aside className="w-72 bg-white h-full p-6 shadow-xl">
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-lg">Menu</h3>
              <button onClick={() => setShowMenu(false)}>✕</button>
            </div>

            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setShowMenu(false)}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl mb-2 transition
                  ${
                    isActive
                      ? "bg-[#0f7a4a]/10 text-[#0f7a4a] font-semibold"
                      : "hover:bg-gray-100 text-gray-700"
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}

            <button
              onClick={() => {
                // Clear all localStorage data
                localStorage.clear();
                // Navigate to login
                navigate("/login");
              }}
              className="flex items-center gap-4 px-4 py-3 text-red-600 mt-6 hover:bg-red-50 rounded-xl"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </aside>

          <div className="flex-1" onClick={() => setShowMenu(false)} />
        </div>
      )}
    </div>
  );
}
