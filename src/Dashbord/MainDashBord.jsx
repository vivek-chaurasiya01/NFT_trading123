import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";

export default function MainDashBord() {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

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
      label: "GTN Dashboard",
      icon: <FaChartBar />,
    },
    {
      to: "/dashbord/nft-marketplace",
      label: "GTN Marketplace",
      icon: <FaImage />,
    },
    { to: "/dashbord/my-nfts", label: "My GTN", icon: <FaImage /> },
    {
      to: "/dashbord/nft-management",
      label: "GTN Management",
      icon: <FaCog />,
    },
    // { to: "/dashbord/nft-status", label: "NFT Status", icon: <FaCog /> },
    { to: "/dashbord/mlm-tree", label: "MY TEAM", icon: <FaUsers /> },
    {
      to: "/dashbord/package-upgrade",
      label: "Package Upgrade",
      icon: <FaChartBar />,
    },
    { to: "/dashbord/nft-history", label: "GTN History", icon: <FaImage /> },
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
