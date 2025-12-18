import React, { useState } from 'react';
import { Product } from '../types';
import { Search, Plus, Filter, AlertTriangle, Edit, Trash2, X, Image as ImageIcon } from 'lucide-react';

interface InventoryProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => p.category)));

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: '',
    totalQuantity: 0,
    availableQuantity: 0,
    rate: 0,
    description: '',
    image: ''
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: '',
        totalQuantity: 0,
        availableQuantity: 0,
        rate: 0,
        description: '',
        image: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...formData } as Product);
    } else {
      const newProduct: Product = {
        id: `p${Date.now()}`,
        ...formData
      } as Product;
      if (newProduct.availableQuantity === 0) newProduct.availableQuantity = newProduct.totalQuantity;
      
      onAddProduct(newProduct);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Product Inventory</h2>
          <p className="text-gray-500 text-sm">Manage goods, tools, and equipment</p>
        </div>
        <button 
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} /> Add Product
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select 
            className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => {
            const utilization = product.totalQuantity > 0 ? ((product.totalQuantity - product.availableQuantity) / product.totalQuantity) * 100 : 0;
            const isLowStock = product.availableQuantity < (product.totalQuantity * 0.2);

            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition group">
                <div className="h-48 overflow-hidden bg-gray-100 relative">
                    {product.image ? (
                       <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon size={40} />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2">
                        <span className="bg-white/90 backdrop-blur text-gray-800 text-xs font-bold px-2 py-1 rounded shadow-sm">
                            {product.category}
                        </span>
                    </div>
                   
                    <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(product); }} 
                            className="bg-white p-1.5 rounded-md shadow hover:text-blue-600"
                         >
                            <Edit size={14} />
                         </button>
                         <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if(confirm('Are you sure you want to delete this product?')) onDeleteProduct(product.id); 
                            }} 
                            className="bg-white p-1.5 rounded-md shadow hover:text-red-600"
                         >
                            <Trash2 size={14} />
                         </button>
                    </div>

                    {isLowStock && (
                        <div className="absolute bottom-2 left-2 flex items-center bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">
                            <AlertTriangle size={12} className="mr-1" /> Low Stock
                        </div>
                    )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{product.name}</h3>
                    <span className="text-blue-600 font-bold">Rs. {product.rate}<span className="text-gray-400 text-xs font-normal">/day</span></span>
                  </div>
                  <p className="text-gray-500 text-xs mb-4 line-clamp-2">{product.description}</p>
                  
                  <div className="mt-auto space-y-3">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full ${utilization > 80 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${utilization}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-500">Available: <span className="text-gray-900">{product.availableQuantity}</span></span>
                        <span className="text-gray-500">Total: <span className="text-gray-900">{product.totalQuantity}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input 
                            type="text" required 
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                         <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                         />
                         {formData.image && (
                           <img src={formData.image} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-md border" />
                         )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <input
                                list="categories"
                                type="text"
                                placeholder="e.g. Tools"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                            />
                            <datalist id="categories">
                                {categories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Daily Rate (Rs.)</label>
                             <input 
                                type="number" min="0" required 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                value={formData.rate} onChange={e => setFormData({...formData, rate: parseInt(e.target.value)})}
                             />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                             <input 
                                type="number" min="0" required 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                value={formData.totalQuantity} onChange={e => setFormData({...formData, totalQuantity: parseInt(e.target.value)})}
                             />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Available</label>
                             <input 
                                type="number" min="0" required 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                                value={formData.availableQuantity} onChange={e => setFormData({...formData, availableQuantity: parseInt(e.target.value)})}
                             />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea 
                            rows={3}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                        ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Save Product</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;