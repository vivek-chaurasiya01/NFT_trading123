import React, { useState, useEffect } from 'react';
import { FaBell, FaClock } from 'react-icons/fa';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/all`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
    setLoading(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f7a4a]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#0f7a4a] p-2 rounded-lg">
            <FaBell className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
            <p className="text-sm text-gray-600">{notifications.length} total notifications</p>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification._id} 
              className="bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow"
            >
              {/* Notification Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-1">
                    {notification.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaClock size={12} />
                    <span>{formatDate(notification.createdAt)}</span>
                    <span>•</span>
                    <span>{formatTime(notification.createdAt)}</span>
                  </div>
                </div>
                {notification.isActive && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>

              {/* Notification Message */}
              <div className="text-sm text-gray-700 whitespace-pre-line mb-3">
                {notification.message}
              </div>

              {/* Notification Footer */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    notification.type === 'announcement' ? 'bg-blue-100 text-blue-800' :
                    notification.type === 'success' ? 'bg-green-100 text-green-800' :
                    notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {notification.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    Priority: {notification.priority}
                  </span>
                </div>
                {notification.createdBy && (
                  <div className="text-xs text-gray-500">
                    By: {notification.createdBy.name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 text-center">
          <FaBell className="mx-auto text-gray-400 mb-3" size={48} />
          <h3 className="font-bold text-gray-800 mb-2">No Notifications</h3>
          <p className="text-gray-600 text-sm">You don't have any notifications yet</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
