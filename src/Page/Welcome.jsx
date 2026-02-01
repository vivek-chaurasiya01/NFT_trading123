import React from "react";
import { useNavigate } from "react-router-dom";

const WelcomeCard = () => {
  const navigate = useNavigate();

  return (
    <div className="w-screen h-screen bg-[#dff1e6] overflow-hidden">
      <div className="w-full h-full bg-[#ededed] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div
            className="rounded-full h-72 w-72 flex items-center justify-center 
                  border-8 border-green-600 shadow-lg bg-white"
          >
            <img
              src="/GTN Logo PNG (1).png"
              alt="GTN Logo"
              className="h-50 w-50 object-contain"
            />
          </div>
        </div>

        {/* ===== BOTTOM TEXT SECTION ===== */}
        <div className="bg-white px-6 pt-10 pb-6 rounded-t-3xl">
          <h1 className="text-[26px] font-bold text-gray-900 leading-tight">
            Welcome To <br /> GTN Token
          </h1>

          <p className="text-gray-400 text-[13px] mt-3 max-w-[260px]">
            Discover, trade, and manage next-generation NFT tokens powered by secure
            blockchain technology.
          </p>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => navigate("/login")}
              className="bg-green-600 text-white px-6 py-3 rounded-full text-sm font-semibold"
            >
              Explore NFTs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
