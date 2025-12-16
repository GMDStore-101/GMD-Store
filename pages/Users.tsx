import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Plus, Trash2, Shield, User as UserIcon, Camera, Save } from 'lucide-react';

interface UsersPageProps {
  users: User[];
  currentUser: User | null;
  onAddUser: (user: Omit<User, 'id'>) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (user: User) => void; // New Prop
}

const UsersPage: React.FC<UsersPageProps> = ({ users, currentUser, onAddUser, onDeleteUser, onUpdateUser }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Profile Edit State
  const [profileData, setProfileData] = useState<User>(currentUser || {
      id: '', name: '', username: '', password: '', role: UserRole.STAFF
  });
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: UserRole.ADMIN
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser(formData);
    setShowModal(false);
    setFormData({ username: '', password: '', name: '', role: UserRole.ADMIN });
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdateUser(profileData);
      alert('Profile updated successfully!');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          setProfileData({ ...profileData, photo: url });
      }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* My Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
          </div>
          <div className="p-6">
              <form onSubmit={handleProfileUpdate} className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center gap-4">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-200 relative group">
                          {profileData.photo ? (
                              <img src={profileData.photo} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                                  {profileData.name.charAt(0)}
                              </div>
                          )}
                          <label className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition">
                              <Camera size={24} />
                              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                          </label>
                      </div>
                      <span className="text-sm text-gray-500">Click to change photo</span>
                  </div>
                  
                  <div className="flex-1 space-y-4 max-w-lg">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          <input 
                              type="text" required 
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                          <input 
                              type="text" required 
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              value={profileData.username} onChange={e => setProfileData({...profileData, username: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                          <input 
                              type="text" required 
                              className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})}
                          />
                      </div>
                      <div className="pt-2">
                          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
                              <Save size={18} /> Update Profile
                          </button>
                      </div>
                  </div>
              </form>
          </div>
      </div>

      {/* User Management Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
            <h2 className="text-2xl font-bold text-gray-800">System Users</h2>
            <p className="text-gray-500 text-sm">Manage access to the dashboard</p>
            </div>
            <button 
            onClick={() => setShowModal(true)}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-800 transition"
            >
            <Plus size={18} /> Add User
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
            <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
                <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    {user.photo ? (
                        <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center text-white font-bold ${user.role === UserRole.ADMIN ? 'bg-orange-500' : 'bg-blue-500'}`}>
                            {user.role === UserRole.ADMIN ? <Shield size={20} /> : <UserIcon size={20} />}
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mt-1 inline-block">{user.role}</span>
                </div>
                </div>
                {user.username !== 'sajjad900' && user.id !== currentUser?.id && (
                <button 
                    onClick={() => {
                    if(confirm('Are you sure you want to delete this user?')) onDeleteUser(user.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition"
                >
                    <Trash2 size={18} />
                </button>
                )}
            </div>
            ))}
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Admin User</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;