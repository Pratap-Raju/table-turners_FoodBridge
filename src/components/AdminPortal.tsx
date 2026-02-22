import { useEffect, useState } from 'react';
import {
  Plus,
  Minus,
  LogOut,
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  MapPin
} from 'lucide-react';
import { supabase, FoodItem } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const STOCK_GOAL = 50;

const FOOD_BANKS = [
  "Edmonton Food Bank",
  "Strathcona Food Bank",
  "St. Albert Food Bank & Community Village",
  "Parkland Food Bank",
  "Leduc and District Food Bank",
  "University of Alberta Campus Food Bank",
  "The Mustard Seed",
  "Veterans Association Food Bank",
  "Sikhs for Humanity"
];

function getStockStatus(item: FoodItem): 'critical' | 'low' | 'stable' {
  if (item.is_urgent) return 'critical';
  const percentage = (item.current_stock / item.minimum_threshold) * 100;
  if (percentage < 50) return 'critical';
  if (percentage < 100) return 'low';
  return 'stable';
}

export default function AdminPortal() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // NEW: Pledge State
const [pledges, setPledges] = useState<any[]>([]);
const [processingPledgeId, setProcessingPledgeId] = useState<string | null>(null);

  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    current_stock: 0,
    minimum_threshold: 10,
    location: FOOD_BANKS[0],
  });

  const NAVY = "#1a365d";
  const ORANGE = "#f6ad55";
  const COLORS = [NAVY, ORANGE, '#4a5568', '#718096', '#a0aec0'];

  const categoryData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    items.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [items]);
  
  const { signOut, user } = useAuth();

  useEffect(() => {
    loadItems();
    loadPledges(); // Load pledges on mount
  
    const subscription = supabase
      .channel('food_items_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'food_items' },
        () => loadItems()
      )
      .subscribe();
  
    return () => {
      subscription.unsubscribe();
    };
  }, []);

    // Load pledges
    const loadPledges = async () => {
      const { data, error } = await supabase
        .from('pledges')
        .select('*, food_items(name)')
        .eq('status', 'pending');
    
      console.log("PLEDGES:", data);
      console.log("ERROR:", error);
    
      setPledges(data || []);
    };

  const loadItems = async () => {
    const { data } = await supabase
      .from('food_items')
      .select('*')
      .order('name');
    setItems(data || []);
    setLoading(false);
  };

  const addNewItem = async () => {
    if (!newItem.name || !newItem.category) return;
    await supabase.from('food_items').insert([
      { ...newItem, is_urgent: false },
    ]);
    setNewItem({
      name: '',
      category: '',
      current_stock: 0,
      minimum_threshold: 10,
      location: FOOD_BANKS[0],
    });
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm('Delete this item?')) return;
    await supabase.from('food_items').delete().eq('id', id);
  };

  const updateStock = async (id: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    await supabase
      .from('food_items')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', id);
  };

  // NEW: Logic for direct number input saving
  const handleDirectStockUpdate = async (id: string, value: string) => {
    const newStock = Math.max(0, parseInt(value) || 0);
    await supabase
      .from('food_items')
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq('id', id);
  };

  const toggleUrgent = async (id: string, currentValue: boolean) => {
    await supabase
      .from('food_items')
      .update({ is_urgent: !currentValue, updated_at: new Date().toISOString() })
      .eq('id', id);
  };

  // NEW: Function to Receipt a Pledge
  const confirmPledge = async (
    pledgeId: string,
    itemId: string,
    quantity: number
  ) => {
    // Prevent double click
    if (processingPledgeId) return;
  
    setProcessingPledgeId(pledgeId);
  
    try {
      // 1️⃣ Mark pledge as received FIRST
      const { error: pledgeError } = await supabase
        .from('pledges')
        .update({ status: 'received' })
        .eq('id', pledgeId)
        .eq('status', 'pending'); // important safety check
  
      if (pledgeError) throw pledgeError;
  
      // 2️⃣ Increase stock
      const { data: item } = await supabase
        .from('food_items')
        .select('current_stock')
        .eq('id', itemId)
        .single();
  
      if (item) {
        await supabase
          .from('food_items')
          .update({
            current_stock: item.current_stock + quantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId);
      }
  
      // 3️⃣ Remove from UI instantly
      setPledges(prev => prev.filter(p => p.id !== pledgeId));
  
    } catch (err) {
      console.error("Failed to receipt pledge", err);
    } finally {
      setProcessingPledgeId(null);
    }
  };

  // NEW: Function to delete a pledge without updating inventory
  const deletePledge = async (pledgeId: string) => {
    if (!window.confirm('Are you sure you want to remove this pledge? This will not update stock.')) return;
    
    try {
      const { error } = await supabase
        .from('pledges')
        .delete()
        .eq('id', pledgeId);

      if (error) throw error;

      // Update UI instantly
      setPledges(prev => prev.filter(p => p.id !== pledgeId));
    } catch (err) {
      console.error("Failed to delete pledge", err);
      alert("Error deleting pledge");
    }
  };

  const saveInlineEdit = async (item: FoodItem) => {
    await supabase
      .from('food_items')
      .update({
        name: item.name,
        category: item.category,
        location: item.location, 
        minimum_threshold: item.minimum_threshold,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);
    setEditingId(null);
  };

  const filteredItems = showCriticalOnly
    ? items.filter((item) => getStockStatus(item) === 'critical')
    : items;

  const criticalCount = items.filter((item) => getStockStatus(item) === 'critical').length;
  const lowCount = items.filter((item) => getStockStatus(item) === 'low').length;
  const stableCount = items.filter((item) => getStockStatus(item) === 'stable').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-[#1a365d] mb-6 flex items-center gap-2">
              <TrendingDown size={18} /> Stock Levels by Item
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={items.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none'}} />
                  <Bar dataKey="current_stock" fill={NAVY} radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-[#1a365d] mb-6 flex items-center gap-2">
              <Shield size={18} className="text-orange-500" /> Inventory Categories
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                    {categoryData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* HEADER */}
        <div className="flex justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-navy" /> Admin Portal
            </h1>
            <p className="text-gray-600">Signed in as {user?.email}</p>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 bg-white border px-4 py-2 rounded-btn shadow-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* ANALYTICS */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-red-50 p-6 rounded-xl border border-red-100 text-red-600">
            <div className="flex items-center gap-2 uppercase text-xs font-bold"><AlertTriangle size={16}/> Critical</div>
            <div className="text-3xl font-bold">{criticalCount}</div>
          </div>
          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 text-yellow-600">
            <div className="flex items-center gap-2 uppercase text-xs font-bold"><TrendingDown size={16}/> Low</div>
            <div className="text-3xl font-bold">{lowCount}</div>
          </div>
          <div className="bg-green-50 p-6 rounded-xl border border-green-100 text-green-600">
            <div className="flex items-center gap-2 uppercase text-xs font-bold"><CheckCircle size={16}/> Stable</div>
            <div className="text-3xl font-bold">{stableCount}</div>
          </div>
        </div>

        {/* PENDING PLEDGES */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-navy uppercase tracking-wider">
              Pending Pledges
            </h2>
            <span className="text-xs font-bold text-gray-400">
              {pledges.length} Pending
            </span>
          </div>

          {pledges.length === 0 ? (
            <div className="text-gray-400 text-sm italic">
              No pending pledges.
            </div>
          ) : (
            <div className="space-y-4">
              {pledges.map((pledge) => (
                <div key={pledge.id} className="border rounded-lg p-4 flex justify-between items-center bg-gray-50">
                  <div>
                    <div className="font-semibold text-gray-700">
                      {pledge.food_items?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pledge.donor_name} (<span className="text-blue-600 underline">{pledge.donor_email}</span>) 
                      pledged <span className="font-bold">{pledge.quantity_pledged}</span> units
                    </div>
                    <div className="text-xs text-orange-600 font-bold uppercase mt-1">
                      Expected Arrival: {pledge.expected_arrival || "TBD"}
                    </div>
                  </div>
              
                  {/* Action Buttons Container - Moved to the right */}
                  <div className="flex items-center gap-2">
                    <button
                      disabled={processingPledgeId === pledge.id}
                      onClick={() => confirmPledge(pledge.id, pledge.item_id, pledge.quantity_pledged)}
                      className="bg-green-600 text-white px-4 py-2 rounded-btn text-xs font-bold uppercase hover:bg-green-700 transition"
                    >
                      {processingPledgeId === pledge.id ? "Processing..." : "Mark Received"}
                    </button>

                    <button
                      onClick={() => deletePledge(pledge.id)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                      title="Delete Pledge"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ADD PRODUCT */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-100">
          <h2 className="text-sm font-bold text-navy mb-4 uppercase tracking-wider">Add New Item</h2>
          <div className="grid md:grid-cols-5 gap-4">
            <input placeholder="Item Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="border p-2 rounded text-sm" />
            <input placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="border p-2 rounded text-sm" />
            
            <select 
              value={newItem.location} 
              onChange={(e) => setNewItem({ ...newItem, location: e.target.value })}
              className="border p-2 rounded text-sm bg-white"
            >
              {FOOD_BANKS.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>

            <input type="number" placeholder="Initial Stock" value={newItem.current_stock} onChange={(e) => setNewItem({ ...newItem, current_stock: Number(e.target.value) })} className="border p-2 rounded text-sm" />
            <button onClick={addNewItem} className="bg-navy text-white rounded-btn font-bold hover:bg-opacity-90 transition-all">Add to Inventory</button>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-navy">Inventory Management</h2>
            <button onClick={() => setShowCriticalOnly(!showCriticalOnly)} className="text-xs font-bold bg-navy text-white px-3 py-1 rounded-full uppercase tracking-tighter">
              {showCriticalOnly ? 'Show All' : 'Show Critical Only'}
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-400 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] uppercase font-bold tracking-widest">Item</th>
                <th className="px-6 py-3 text-left text-[10px] uppercase font-bold tracking-widest">Depot Location</th>
                <th className="px-6 py-3 text-left text-[10px] uppercase font-bold tracking-widest">Status</th>
                <th className="px-6 py-3 text-left text-[10px] uppercase font-bold tracking-widest">Stock / Goal</th>
                <th className="px-6 py-3 text-left text-[10px] uppercase font-bold tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const status = getStockStatus(item);
                const progress = Math.min((item.current_stock / item.minimum_threshold) * 100, 100);
                return (
                  <tr key={item.id} className={`border-b hover:bg-gray-50 transition-colors ${item.is_urgent ? 'bg-red-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      {editingId === item.id ? (
                        <input value={item.name} onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, name: e.target.value } : i))} className="border p-1 rounded text-sm" />
                      ) : (
                        <span className="font-semibold text-gray-700">{item.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === item.id ? (
                        <select 
                          value={item.location || FOOD_BANKS[0]} 
                          onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, location: e.target.value } : i))}
                          className="border p-1 rounded text-sm w-full bg-white"
                        >
                          {FOOD_BANKS.map(bank => (
                            <option key={bank} value={bank}>{bank}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-500 text-sm italic">
                          <MapPin size={12} className="text-orange-400" />
                          {item.location || 'Main Warehouse'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${status === 'critical' ? 'bg-red-100 text-red-700' : status === 'low' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          {/* DIRECT INPUT FIELD */}
                          <input
                            type="number"
                            value={item.current_stock}
                            onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, current_stock: parseInt(e.target.value) || 0 } : i))}
                            onBlur={(e) => handleDirectStockUpdate(item.id, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleDirectStockUpdate(item.id, (e.target as HTMLInputElement).value)}
                            className="w-16 text-center font-bold border rounded p-1 text-sm focus:ring-1 focus:ring-navy focus:border-navy outline-none"
                          />
                          <span className="text-xs text-gray-400">/ {item.minimum_threshold}</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden max-w-[100px]">
                          <div className={`h-full ${status === 'critical' ? 'bg-red-500' : status === 'low' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${progress}%` }} />
                        </div>
                        
                        {/* SMALL ADJUSTMENT BUTTONS UNDER INPUT */}
                        <div className="flex border rounded overflow-hidden w-16">
                          <button 
                            onClick={() => updateStock(item.id, item.current_stock, -1)} 
                            className="flex-1 py-0.5 bg-gray-50 hover:bg-gray-200 border-r flex justify-center text-gray-400"
                          >
                            <Minus size={10} />
                          </button>
                          <button 
                            onClick={() => updateStock(item.id, item.current_stock, 1)} 
                            className="flex-1 py-0.5 bg-gray-50 hover:bg-gray-200 flex justify-center text-gray-400"
                          >
                            <Plus size={10} />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => toggleUrgent(item.id, item.is_urgent)} className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${item.is_urgent ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>Urgent</button>
                      {editingId === item.id ? (
                        <button onClick={() => saveInlineEdit(item)} className="text-[10px] bg-green-500 text-white px-2 py-1 rounded font-bold uppercase">Save</button>
                      ) : (
                        <button onClick={() => setEditingId(item.id)} className="text-[10px] bg-blue-500 text-white px-2 py-1 rounded font-bold uppercase">Edit</button>
                      )}
                      <button onClick={() => deleteItem(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}