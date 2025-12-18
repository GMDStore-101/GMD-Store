import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, Upload } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    alert('Settings saved successfully!');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
           <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Store Branding</h3>
           <p className="text-sm text-gray-500 mb-4">These details will appear on the thermal invoice printout.</p>
           
           <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                   <input 
                      type="text" required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.storeName}
                      onChange={e => setFormData({...formData, storeName: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                   <input 
                      type="text" required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="e.g. Shuttering & Scaffold"
                      value={formData.tagline}
                      onChange={e => setFormData({...formData, tagline: e.target.value})}
                   />
                </div>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                 <input 
                    type="text" required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.ownerName}
                    onChange={e => setFormData({...formData, ownerName: e.target.value})}
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Store Address</label>
                 <textarea 
                    required
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.storeAddress}
                    onChange={e => setFormData({...formData, storeAddress: e.target.value})}
                 />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Phone Numbers</label>
                 <p className="text-xs text-gray-500 mb-1">You can add multiple numbers separated by comma</p>
                 <input 
                    type="text" required
                    placeholder="0300-1234567, 0321-7654321"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.storePhone}
                    onChange={e => setFormData({...formData, storePhone: e.target.value})}
                 />
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Store Logo</label>
                 <div className="flex items-center gap-4">
                    {formData.logoUrl && (
                        <img src={formData.logoUrl} alt="Logo" className="h-16 w-16 object-contain border rounded" />
                    )}
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm text-gray-700 transition">
                        <Upload size={16} /> Upload Logo
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>
                 </div>
              </div>

              <div className="pt-4">
                <button 
                    type="submit" 
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 shadow-lg flex items-center gap-2 w-full justify-center"
                >
                    <Save size={20} /> Save Settings
                </button>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
};

export default Settings;