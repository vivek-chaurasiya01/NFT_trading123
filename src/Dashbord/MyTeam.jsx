import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserPlus, FaCopy, FaShare, FaCalendarAlt, FaChartLine, FaGift, FaLink } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { userAPI } from '../services/api';

const MyTeam = () => {
  const [team, setTeam] = useState([]);
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
    fetchProfile();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await userAPI.getTeam();
      console.log('✅ Team API Response:', response.data);
      
      // API returns teamMembers array
      const teamData = response.data.teamMembers || [];
      setTeam(teamData);
      setStats({
        total: teamData.length,
        active: teamData.filter(m => m.isActive).length
      });
      
      console.log('✅ Team Stats:', {
        total: teamData.length,
        active: teamData.filter(m => m.isActive).length,
        members: teamData
      });
    } catch (error) {
      console.error('❌ Error fetching team:', error);
      setTeam([]);
      setStats({ total: 0, active: 0 });
    }
    setLoading(false);
  };

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const userReferralCode = response.data.user.referralCode || 'LOADING';
      setReferralCode(userReferralCode);
      console.log('✅ Referral Code:', userReferralCode);
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      setReferralCode('ERROR');
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'Referral code copied to clipboard',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/SingUp?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    Swal.fire({
      icon: 'success',
      title: 'Link Copied!',
      text: 'Referral link copied to clipboard',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const shareReferralLink = async () => {
    const link = `${window.location.origin}/SingUp?ref=${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join our NFT Trading Platform',
          text: 'Start earning with NFT trading! Use my referral link to get started.',
          url: link
        });
      } catch (error) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f7a4a]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">My Team</h2>
          <p className="text-gray-500 text-sm">Manage and track your team members</p>
        </div>
        <div className="bg-[#0f7a4a] p-3 rounded-full">
          <FaUsers className="text-white" size={20} />
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-3 rounded-xl">
                <FaUsers className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Total Members</h3>
                <p className="text-xs text-gray-500">All team members</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-xl">
                <FaChartLine className="text-green-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Active Members</h3>
                <p className="text-xs text-gray-500">Currently active</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
        </div>
      </div>

      {/* Referral Section */}
      <div className="relative bg-gradient-to-br from-[#0f7a4a] via-green-500 to-emerald-600 p-5 rounded-2xl text-white shadow-xl overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-lg"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-10 -translate-x-10 blur-md"></div>
        
        <div className="relative z-10">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <FaGift className="text-white" size={18} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">
                  🎉 Invite & Earn
                </h3>
                <p className="text-white/80 text-xs">Build your network</p>
              </div>
            </div>
            <div className="bg-white/20 px-3 py-1 rounded-full">
              <span className="text-xs font-bold">10 Levels</span>
            </div>
          </div>
          
          {/* Compact Referral Code */}
          <div className="bg-white/15 backdrop-blur-sm p-4 rounded-xl mb-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white/90">Your Code</span>
              <button 
                onClick={copyReferralCode}
                className="bg-white/20 px-3 py-1 rounded-lg text-xs hover:bg-white/30 transition-all flex items-center gap-1 font-medium"
              >
                <FaCopy size={10} />
                Copy
              </button>
            </div>
            <div className="bg-white/10 p-3 rounded-lg border border-white/20">
              <div className="font-mono text-lg font-bold text-center text-white">
                {referralCode}
              </div>
            </div>
          </div>
          
          {/* Compact Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={copyReferralLink}
              className="bg-white/15 backdrop-blur-sm px-4 py-3 rounded-xl hover:bg-white/25 transition-all flex items-center justify-center gap-2 font-medium border border-white/20 text-sm"
            >
              <FaLink size={12} />
              Copy Link
            </button>
            <button 
              onClick={shareReferralLink}
              className="bg-white/15 backdrop-blur-sm px-4 py-3 rounded-xl hover:bg-white/25 transition-all flex items-center justify-center gap-2 font-medium border border-white/20 text-sm"
            >
              <FaShare size={12} />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <div className="bg-[#0f7a4a] p-2 rounded-lg">
              <FaUsers className="text-white" size={16} />
            </div>
            Team Members ({stats.total})
          </h3>
          {stats.total > 0 && (
            <div className="text-sm text-gray-500">
              {stats.active} active
            </div>
          )}
        </div>
        
        {team.length > 0 ? (
          <div className="space-y-3">
            {team.map((member, index) => (
              <div key={member._id || index} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all duration-200 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#0f7a4a] to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                      {member.name?.charAt(0).toUpperCase() || member.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{member.name || 'Team Member'}</h4>
                      <p className="text-sm text-gray-500 truncate">{member.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                          Level {member.level || 1}
                        </span>
                        {member.createdAt && (
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt className="text-xs text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {new Date(member.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {member.teamSize && (
                      <p className="text-xs text-gray-500 mt-1">Team: {member.teamSize}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-2xl p-8">
              <FaUserPlus className="mx-auto text-gray-400 mb-4" size={48} />
              <h4 className="font-bold text-gray-800 mb-2 text-lg">Build Your Team</h4>
              <p className="text-gray-600 mb-4">
                Share your referral code to invite new members and start earning
              </p>
              <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800">
                💡 <strong>Earn from 10 levels of referrals!</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeam;