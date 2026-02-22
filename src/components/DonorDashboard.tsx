import { useEffect, useState, useMemo } from 'react';
import {
  Heart,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  Package,
  Milk,
  Wheat,
  Cookie,
  Apple,
  Utensils,
  MapPin,
  LucideIcon,
  ShoppingBag,
  X
} from 'lucide-react';
import { supabase, FoodItem } from '../lib/supabase';

const STOCK_GOAL = 50;
const NAVY = "#1e3a8a";
const ORANGE = "#f26522";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'canned goods': Package,
  grains: Wheat,
  protein: Milk,
  breakfast: Cookie,
  dairy: Milk,
  produce: Apple,
  'fresh produce': Apple,
  vegetables: Apple,
  default: Utensils,
};

function getCategoryIcon(category: string): LucideIcon {
  const key = category.toLowerCase().trim();
  return CATEGORY_ICONS[key] ?? CATEGORY_ICONS.default;
}

function getStockStatus(item: FoodItem): 'critical' | 'low' | 'stable' {
  if (item.is_urgent) return 'critical';
  const percentage = (item.current_stock / item.minimum_threshold) * 100;
  if (percentage < 50) return 'critical';
  if (percentage < 100) return 'low';
  return 'stable';
}

function StockProgressBar({ current, goal = STOCK_GOAL }: { current: number; goal?: number }) {
  const pct = Math.min(100, (current / goal) * 100);
  const isCritical = pct < 50;
  
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Inventory Level</span>
        <span className="text-xs font-bold" style={{ color: isCritical ? ORANGE : NAVY }}>
          {current} <span className="text-gray-300 font-normal">/ {goal}</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ 
            width: `${pct}%`, 
            backgroundColor: isCritical ? ORANGE : NAVY 
          }}
        />
      </div>
    </div>
  );
}

export default function DonorDashboard() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('All');
  // New State for Status Filtering
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'critical' | 'low'>('all');

  useEffect(() => {
    loadItems();
    const subscription = supabase
      .channel('food_items_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'food_items' }, () => loadItems())
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, []);

  const loadItems = async () => {
    const { data } = await supabase.from('food_items').select('*').order('name');
    setItems(data || []);
    setLoading(false);
  };

  const locations = useMemo(() => ['All', ...new Set(items.map(i => i.location || 'Main Warehouse'))], [items]);

  // COMBINED FILTER LOGIC
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesLocation = selectedLocation === 'All' || (item.location || 'Main Warehouse') === selectedLocation;
      const status = getStockStatus(item);
      const matchesStatus = selectedStatus === 'all' || status === selectedStatus;
      return matchesLocation && matchesStatus;
    });
  }, [selectedLocation, selectedStatus, items]);

  const criticalCount = items.filter(item => getStockStatus(item) === 'critical').length;
  const lowCount = items.filter(item => getStockStatus(item) === 'low').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse font-bold text-xl" style={{ color: NAVY }}>Loading Impact...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* --- HERO SECTION --- */}
      <section
        className="relative w-full min-h-[500px] flex items-center justify-center bg-cover bg-fixed bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2000)' }}
      >
        <div className="absolute inset-0 bg-[#1e3a8a]/60 backdrop-blur-[2px]" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold uppercase tracking-[0.2em] bg-white text-navy rounded-full shadow-xl">
            Community Support Portal
          </span>
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            Nourishing <span style={{ color: '#f6ad55' }}>Hope</span>, <br />One Meal at a Time.
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed font-light">
            Click on a card below to filter items and see exactly where your help is needed.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 pb-20">
        
        {/* --- INTERACTIVE STAT CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <button 
            onClick={() => setSelectedStatus(selectedStatus === 'critical' ? 'all' : 'critical')}
            className={`text-left bg-white rounded-3xl shadow-xl border-b-4 p-8 transform transition-all hover:-translate-y-1 active:scale-95 ${selectedStatus === 'critical' ? 'border-red-600 ring-2 ring-red-200' : 'border-red-500'}`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-50 rounded-2xl text-red-500">
                <AlertTriangle size={28} />
              </div>
              <h3 className="font-bold text-gray-500 uppercase text-xs tracking-widest">Immediate Needs</h3>
            </div>
            <p className="text-5xl font-black text-gray-800">{criticalCount}</p>
          </button>

          <button 
            onClick={() => setSelectedStatus(selectedStatus === 'low' ? 'all' : 'low')}
            className={`text-left bg-white rounded-3xl shadow-xl border-b-4 p-8 transform transition-all hover:-translate-y-1 active:scale-95 ${selectedStatus === 'low' ? 'border-orange-500 ring-2 ring-orange-100' : 'border-orange-400'}`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-50 rounded-2xl text-orange-400">
                <TrendingDown size={28} />
              </div>
              <h3 className="font-bold text-gray-500 uppercase text-xs tracking-widest">Running Low</h3>
            </div>
            <p className="text-5xl font-black text-gray-800">{lowCount}</p>
          </button>

          <button 
            onClick={() => setSelectedStatus('all')}
            className={`text-left bg-[#1e3a8a] rounded-3xl shadow-xl p-8 transform transition-all hover:-translate-y-1 active:scale-95 text-white ${selectedStatus === 'all' ? 'ring-4 ring-blue-300' : ''}`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 rounded-2xl text-orange-400">
                <Heart size={28} fill="#f26522" className="border-none" />
              </div>
              <h3 className="font-bold text-white/70 uppercase text-xs tracking-widest">Total Items Tracked</h3>
            </div>
            <p className="text-5xl font-black">{items.length}</p>
          </button>
        </div>

        {/* --- FILTER BAR --- */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex flex-col">
            <h2 className="text-3xl font-bold text-navy flex items-center gap-3" style={{ color: NAVY }}>
              <ShoppingBag className="text-orange-500" /> {selectedStatus === 'all' ? 'Live Inventory' : selectedStatus === 'critical' ? 'Urgent Needs' : 'Low Stock Items'}
            </h2>
            {selectedStatus !== 'all' && (
              <button 
                onClick={() => setSelectedStatus('all')}
                className="flex items-center gap-1 text-xs font-bold text-red-500 mt-2 hover:underline uppercase tracking-tighter"
              >
                <X size={12} /> Clear status filter
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedLocation === loc 
                  ? 'text-white shadow-lg' 
                  : 'text-gray-400 hover:bg-gray-50'
                }`}
                style={{ backgroundColor: selectedLocation === loc ? NAVY : '' }}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* --- ITEM GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-300">
              <Package size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No items match the selected filters for this location.</p>
            </div>
          ) : filteredItems.map((item) => {
            const status = getStockStatus(item);
            const isCritical = status === 'critical';
            const CategoryIcon = getCategoryIcon(item.category);
            
            return (
              <article
                key={item.id}
                className="group bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden"
              >
                <div className="p-6 flex-grow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors" style={{ color: NAVY }}>
                      <CategoryIcon size={28} />
                    </div>
                    {isCritical && (
                      <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-tighter px-3 py-1 rounded-full border border-red-100 animate-pulse">
                        Critical Need
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-navy transition-colors" style={{ color: NAVY }}>
                    {item.name}
                  </h3>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">
                    {item.category}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 bg-gray-50 py-2 px-3 rounded-lg w-fit">
                    <MapPin size={14} className="text-gray-300" />
                    <span className="font-medium">{item.location || 'Main Warehouse'}</span>
                  </div>

                  <StockProgressBar current={item.current_stock} goal={item.minimum_threshold} />
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-20 p-12 bg-white rounded-[3rem] shadow-xl text-center border border-gray-100">
           <Heart size={40} className="mx-auto mb-6" style={{ color: ORANGE, fill: ORANGE }} />
           <h2 className="text-3xl font-bold mb-4" style={{ color: NAVY }}>Thank you for your generosity</h2>
           <p className="max-w-2xl mx-auto text-gray-500 leading-relaxed italic">
             "No one has ever become poor by giving." - Anne Frank
           </p>
        </div>
      </div>
    </div>
  );
}