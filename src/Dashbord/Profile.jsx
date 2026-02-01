import React, { useState, useEffect } from 'react';
import { FaUser, FaWallet, FaEnvelope, FaPhone, FaRocket, FaGlobe } from 'react-icons/fa';
import { userAPI, walletAPI, packageAPI } from '../services/api';
import useAuthCheck from '../utils/useAuthCheck';

const Profile = () => {
  const token = useAuthCheck();
  const [user, setUser] = useState({});
  const [balance, setBalance] = useState(0);
  const [currentPackage, setCurrentPackage] = useState('basic');
  const [loading, setLoading] = useState(true);

  if (!token) return null;

  useEffect(() => {
    fetchProfile();
    
    // Listen for package updates
    const handlePackageUpdate = (event) => {
      setCurrentPackage(event.detail.package);
    };
    
    window.addEventListener('packageUpdate', handlePackageUpdate);
    
    return () => {
      window.removeEventListener('packageUpdate', handlePackageUpdate);
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const profileRes = await userAPI.getProfile();
      setUser(profileRes.data.user);
      
      const balanceRes = await walletAPI.getBalance();
      setBalance(balanceRes.data.balance);
      
      // Try to get package from PackageUpgrade API first
      try {
        const packageRes = await packageAPI.getPlans();
        setCurrentPackage(packageRes.data.currentPlan || 'basic');
      } catch {
        // Fallback to user profile data
        setCurrentPackage(profileRes.data.user.currentPackage || profileRes.data.user.planType || 'basic');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f7a4a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Profile</h2>
        <FaUser className="text-[#0f7a4a]" size={20} />
      </div>

      <div className="bg-gradient-to-r from-[#0f7a4a] to-green-600 p-6 rounded-xl text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold">{user.name}</h3>
            <p className="text-sm opacity-90">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 p-4 rounded-xl text-center">
          <FaWallet className="mx-auto text-blue-600 mb-2" size={24} />
          <p className="text-sm text-gray-600">Balance</p>
          <p className="text-xl font-bold text-blue-600">${balance.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl text-center">
          <FaRocket className="mx-auto text-purple-600 mb-2" size={24} />
          <p className="text-sm text-gray-600">Package</p>
          <p className="text-xl font-bold text-purple-600">{currentPackage.toUpperCase()}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 space-y-4">
        <h3 className="font-semibold text-lg mb-4">Account Details</h3>
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <FaEnvelope className="text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <FaPhone className="text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">Mobile</p>
            <p className="font-medium">{user.mobile || 'Not provided'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <FaGlobe className="text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">Country</p>
            <p className="font-medium">{user.country || 'Not provided'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <FaWallet className="text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">Wallet Address</p>
            <p className="font-medium text-xs break-all">{user.walletAddress}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <FaUser className="text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">Referral Code</p>
            <p className="font-medium">{user.referralCode}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div>
            <p className="text-xs text-gray-500">Account Status</p>
            <p className="font-medium">{user.isActive ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
