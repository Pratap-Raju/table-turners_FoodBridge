import { useState, useEffect, useRef } from 'react';
import { Shield, Search, MapPin, Clock, Phone, ArrowRight, Navigation, X, Heart, Package, AlertCircle, Loader2, ShoppingCart } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import DonorDashboard from './components/DonorDashboard';
import AdminPortal from './components/AdminPortal';
import ProtectedRoute from './components/ProtectedRoute';
import FinancialDonation from './components/FinancialDonation';
import { supabase, FoodItem } from './lib/supabase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- MATH UTILITY: Haversine Formula ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const HAMPER_LOCATIONS = [
  { id: 1, name: "Essential Kosher Food Hamper Basket", address: "17650 69 Avenue NW, Edmonton, AB", lat: 53.5057, lon: -113.6258, hours: "By Appointment", phone: "Contact via Yes Kosher Friendship" },
  { id: 2, name: "Community Market", address: "5102 Riverbend Road NW, Edmonton, AB", lat: 53.4885, lon: -113.5824, hours: "9 AM - 4 PM", phone: "Contact via Riverbend Reaching Out" },
  { id: 3, name: "Veterans Association Food Bank", address: "18504 111 Avenue NW, Edmonton, AB", lat: 53.5583, lon: -113.6406, hours: "24 Hour Hotline", phone: "1-833-422-8387" },
  { id: 4, name: "Campus Food Bank", address: "8900 114 Street, Edmonton, AB", lat: 53.5235, lon: -113.5255, hours: "9 AM - 6 PM", phone: "780-492-8677" },
  { id: 5, name: "C5 Northgate Hub & Market", address: "13530 97 Street NW, Edmonton, AB", lat: 53.5976, lon: -113.4932, hours: "9 AM - 4 PM", phone: "780-456-1484" },
  { id: 6, name: "Building Hope Ministry Centre", address: "3831 116 Avenue NW, Edmonton, AB", lat: 53.5694, lon: -113.4005, hours: "By Appointment", phone: "780-479-4504" },
  { id: 7, name: "Dickinsfield Amity House", address: "9213 146 Avenue NW, Edmonton, AB", lat: 53.6068, lon: -113.5135, hours: "8:30 AM - 4:30 PM", phone: "780-478-5022" },
  { id: 8, name: "The Mosaic Centre", address: "6504 132 Avenue NW, Edmonton, AB", lat: 53.5932, lon: -113.4398, hours: "Varies (Morning Focus)", phone: "825-222-4675" },
  { id: 9, name: "Mill Woods Care Closet", address: "8704 Mill Woods Road NW, Edmonton, AB", lat: 53.4542, lon: -113.4356, hours: "Thursdays (Call ahead)", phone: "587-566-4116" },
  { id: 10, name: "St. Theresa’s Catholic Church", address: "7508 29 Avenue NW, Edmonton, AB", lat: 53.4611, lon: -113.4475, hours: "Tues/Thurs Appointment", phone: "780-463-8646" },
  { id: 11, name: "Sikhs For Humanity", address: "4954 Roper Road NW, Edmonton, AB", lat: 53.4862, lon: -113.4154, hours: "Sundays 11 AM - 1 PM", phone: "780-988-2239" },
  { id: 12, name: "Jasper Place Wellness Centre", address: "15308 Stony Plain Road NW, Edmonton, AB", lat: 53.5405, lon: -113.5856, hours: "1 PM - 8 PM", phone: "780-757-5115" },
  { id: 13, name: "Church of Pentecost Food Pantry", address: "13143 156 Street NW, Edmonton, AB", lat: 53.5912, lon: -113.5898, hours: "Saturdays 11 AM", phone: "780-455-4478" },
  { id: 14, name: "The Mustard Seed (Drop-in Pantry)", address: "10535 96 Street NW, Edmonton, AB", lat: 53.5488, lon: -113.4872, hours: "9 AM - 4 PM", phone: "1-825-222-4816" },
  { id: 15, name: "Spirit of Hope United Church", address: "7909 82 Avenue NW, Edmonton, AB", lat: 53.5178, lon: -113.4602, hours: "Saturdays 8 AM - 9:30 AM", phone: "780-468-1418" },
  { id: 16, name: "St. Albert Food Bank", address: "50 Bellerose Drive, St. Albert, AB", lat: 53.6425, lon: -113.6212, hours: "9 AM - 3 PM", phone: "780-459-0599" },
  { id: 17, name: "Strathcona Food Bank", address: "255 Kaska Road, Sherwood Park, AB", lat: 53.5278, lon: -113.2985, hours: "9 AM - 12 PM", phone: "780-449-6413" },
  { id: 18, name: "Leduc & District Food Bank", address: "6051 47 Street, Leduc, AB", lat: 53.2556, lon: -113.5352, hours: "9 AM - 4 PM", phone: "780-986-5333" },
  { id: 19, name: "Ellerslie Gift of Hope", address: "1060 Ellerslie Road SW, Edmonton, AB", lat: 53.4258, lon: -113.5182, hours: "Tuesdays 10 AM - 2 PM", phone: "780-437-5433" },
  { id: 20, name: "Leduc & District Food Bank (Main)", address: "4810 49 Avenue, Leduc, AB", lat: 53.2594, lon: -113.5492, hours: "9 AM - 4 PM", phone: "780-986-5333" },
  { id: 21, name: "Beaumont Food Bank (FCSS)", address: "5817 RUE EWE, Beaumont, AB", lat: 53.3571, lon: -113.4145, hours: "8:30 AM - 4:30 PM", phone: "780-929-1006" },
  { id: 22, name: "Riverbend United Church (WECAN)", address: "14907 45 Avenue NW, Edmonton, AB", lat: 53.4832, lon: -113.5781, hours: "1st Friday 10 AM-12 PM", phone: "780-430-7275" },
  { id: 23, name: "Jasper Plaza Childcare (WECAN)", address: "10034 167 Street NW, Edmonton, AB", lat: 53.5412, lon: -113.6105, hours: "1st Friday 9 AM-5 PM", phone: "780-489-1008" },
  { id: 24, name: "West Edmonton Baptist Church", address: "17821 98 Avenue NW, Edmonton, AB", lat: 53.5368, lon: -113.6291, hours: "Wednesdays 3-5 PM", phone: "780-425-4190" },
  { id: 25, name: "Southside Church of The Nazarene", address: "10712 29 Avenue NW, Edmonton, AB", lat: 53.4615, lon: -113.5082, hours: "Sundays 9 AM", phone: "780-437-2217" },
  { id: 26, name: "ICNA Relief Edmonton", address: "3442 93 Street NW, Edmonton, AB", lat: 53.4685, lon: -113.4812, hours: "By Appointment", phone: "780-988-2239" },
  { id: 27, name: "Calvary Community Church", address: "8704 Mill Woods Road NW, Edmonton, AB", lat: 53.4542, lon: -113.4356, hours: "By Appointment", phone: "780-462-8444" },
  { id: 28, name: "Inglewood Christian Reformed Church", address: "12230 113 Avenue NW, Edmonton, AB", lat: 53.5628, lon: -113.5332, hours: "Varies", phone: "780-454-3254" },
  { id: 29, name: "St. Faith's Anglican Church", address: "11725 93 Street NW, Edmonton, AB", lat: 53.5712, lon: -113.4852, hours: "Wed-Sat 11:30 AM-1 PM", phone: "780-477-5931" },
  { id: 30, name: "Bethel Gospel Chapel", address: "11461 95 Street NW, Edmonton, AB", lat: 53.5661, lon: -113.4885, hours: "Mondays 3-5 PM", phone: "780-477-3341" },
  { id: 31, name: "Abbottsfield Recreation Centre", address: "3006 119 Avenue NW, Edmonton, AB", lat: 53.5752, lon: -113.3882, hours: "Thursdays 1-2 PM", phone: "780-479-1533" },
  { id: 32, name: "Beverly Daycare Society", address: "11005 34 Street NW, Edmonton, AB", lat: 53.5612, lon: -113.3985, hours: "Mon-Fri 6:30 AM-5:45 PM", phone: "780-477-1151" },
  { id: 33, name: "Fort Road Victory Church", address: "13415 Fort Road NW, Edmonton, AB", lat: 53.5962, lon: -113.4412, hours: "By Appointment", phone: "780-782-3875" },
  { id: 34, name: "Bon Accord & Gibbons Food Bank", address: "5016 50 Street, Gibbons, AB", lat: 53.8312, lon: -113.3325, hours: "Mon-Fri 10 AM-2 PM", phone: "780-923-2344" },
  { id: 35, name: "Families First Society (Fort Sask)", address: "9901 99 Street, Fort Saskatchewan, AB", lat: 53.7125, lon: -113.2142, hours: "Mon-Fri 9 AM-4 PM", phone: "780-998-5595" },
  { id: 36, name: "Stony Plain Family Connection", address: "5600 50 Street, Stony Plain, AB", lat: 53.5352, lon: -113.9852, hours: "Mon-Fri 9 AM-3 PM", phone: "780-963-0549" }
];

// --- Custom Colored Icons ---
const userIcon = new L.Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const nearestIcon = new L.Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const defaultIcon = new L.Icon({
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const NAVY_DARK = "#0a192f"; 
const NAVY_BRAND = "#1e3a8a";
const ORANGE_BRAND = "#f26522";

function AppContent() {
  const [view, setView] = useState<'home' | 'need' | 'donate' | 'admin' | 'donate-funds'>('home');
  const [address, setAddress] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortedHampers, setSortedHampers] = useState(HAMPER_LOCATIONS);
  const [mapCenter, setMapCenter] = useState({ lat: 53.5461, lon: -113.4938 });
  const [pledgingItem, setPledgingItem] = useState<FoodItem | null>(null);
  const [isPledging, setIsPledging] = useState(false); // To show a loading spinner on submit
  
  // Live Inventory State
  const [criticalItems, setCriticalItems] = useState<FoodItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const mapSectionRef = useRef<HTMLDivElement>(null);


  // --- SYNCED FETCH LOGIC ---
// --- SYNCED FETCH LOGIC (With Pledge Integration) ---
useEffect(() => {
  if (view !== 'donate') return;

  const fetchInventory = async () => {
    setLoadingItems(true);

    try {
      const [itemsResponse, pledgesResponse] = await Promise.all([
        supabase.from('food_items').select('*'),
        supabase
          .from('pledges')
          .select('item_id, quantity_pledged')
          .eq('status', 'pending')
      ]);

      if (itemsResponse.error) throw itemsResponse.error;

      if (itemsResponse.data) {
        const itemsWithPledges = itemsResponse.data.map(item => {
          const totalPledged =
            pledgesResponse.data
              ?.filter(p => p.item_id === item.id)
              .reduce((sum, p) => sum + p.quantity_pledged, 0) || 0;

          return { ...item, totalPledged };
        });

        const critical = itemsWithPledges
          .filter(item => {
            const percentage =
              (item.current_stock / item.minimum_threshold) * 100;
            return item.is_urgent === true || percentage < 50;
          })
          .sort(
            (a, b) =>
              a.current_stock / a.minimum_threshold -
              b.current_stock / b.minimum_threshold
          );

        setCriticalItems(critical as any);
      }
    } catch (err) {
      console.error("Inventory fetch error:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  fetchInventory();

  // 🔥 REAL-TIME SUBSCRIPTION (THIS FIXES GHOST BAR)
  const subscription = supabase
    .channel('pledge-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pledges' },
      () => {
        fetchInventory(); // refetch when pledge changes
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };

}, [view]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ", Edmonton, AB")}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const userLat = parseFloat(data[0].lat);
        const userLon = parseFloat(data[0].lon);
        setMapCenter({ lat: userLat, lon: userLon });
        const results = HAMPER_LOCATIONS.map(loc => {
          const d = calculateDistance(userLat, userLon, loc.lat, loc.lon);
          return { ...loc, distance: d.toFixed(1), distVal: d };
        }).sort((a, b) => (a.distVal || 0) - (b.distVal || 0));
        setSortedHampers(results as any);
        setSearched(true);
        setTimeout(() => { mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
      }
    } catch (error) { console.error("Geocoding failed", error); } finally { setLoading(false); }
  };

  const clearSearch = () => {
    setSearched(false);
    setAddress('');
    setSortedHampers(HAMPER_LOCATIONS);
    setMapCenter({ lat: 53.5461, lon: -113.4938 });
  };

  const openGoogleMaps = (locationName: string) => {
    const query = encodeURIComponent(`${locationName}, Edmonton, AB`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* HEADER */}
      {view !== 'donate-funds' && (
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold cursor-pointer text-[#1e3a8a]" onClick={() => setView('home')}>
              Community Food Bank
            </h1>
            <nav className="flex gap-8 font-bold text-sm uppercase tracking-wider text-gray-600">
              <button onClick={() => setView('home')} className={`hover:text-blue-800 transition ${view === 'home' ? 'text-[#1e3a8a] border-b-2 border-[#f26522]' : ''}`}>Home</button>
              <button onClick={() => setView('need')} className={`hover:text-blue-800 transition ${view === 'need' ? 'text-[#1e3a8a] border-b-2 border-[#f26522]' : ''}`}>Need Food?</button>
              <button onClick={() => setView('donate')} className={`hover:text-blue-800 transition ${view === 'donate' ? 'text-[#1e3a8a] border-b-2 border-[#f26522]' : ''}`}>Donate</button>
            </nav>
          </div>
        </header>
      )}

      <main className={`${view === 'donate-funds' ? '' : 'flex-grow w-full'}`}>
        {view === 'home' && <DonorDashboard />}
        {view === 'donate-funds' && <FinancialDonation onBack={() => setView('donate')} />}
        {view === 'admin' && (
          <ProtectedRoute>
            <AdminPortal />
          </ProtectedRoute>
        )}

        {view === 'need' && (
          <div className="animate-in fade-in duration-500">
            {/* HERO SECTION WITH CHECKLIST */}
            <section className="py-20 px-6" style={{ backgroundColor: NAVY_DARK }}>
              <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                {/* LEFT SIDE: SEARCH */}
                <div className="space-y-8">
                  <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">
                    FIND A FOOD <br />
                    <span className="text-white relative inline-block">
                      PANTRY
                      <span className="absolute -bottom-2 left-0 w-full h-2 rounded-full" style={{ backgroundColor: ORANGE_BRAND }}></span>
                    </span>
                    <span className="italic font-light ml-4 opacity-90">NEAR ME</span>
                  </h2>
                  <form onSubmit={handleSearch} className="relative max-w-lg">
                    <input 
                      type="text" 
                      placeholder="Enter street address..."
                      className="w-full py-5 px-8 rounded-full text-lg outline-none"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                    <button type="submit" className="absolute right-2 top-2 bottom-2 px-8 rounded-full text-white font-bold" style={{ backgroundColor: ORANGE_BRAND }}>
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                    </button>
                  </form>
                </div>

                {/* RIGHT SIDE: REQUIREMENT CHECKLIST */}
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[2.5rem] text-white shadow-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <AlertCircle className="text-[#f26522]" size={24} />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Requirement Checklist</h3>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="bg-[#f26522] h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-1 text-[10px] font-black shadow-lg shadow-orange-500/40">1</div>
                      <div>
                        <p className="font-bold text-white text-sm">Bring Photo ID & Proof of Address</p>
                        <p className="text-blue-100/60 text-xs mt-1">Most centers require ID for all household members to register for a hamper.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="bg-[#f26522] h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-1 text-[10px] font-black shadow-lg shadow-orange-500/40">2</div>
                      <div>
                        <p className="font-bold text-white text-sm">Call Before You Travel</p>
                        <p className="text-blue-100/60 text-xs mt-1">Check if the location is 'By Appointment' or 'Drop-in' to avoid a wasted trip.</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="bg-[#f26522] h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-1 text-[10px] font-black shadow-lg shadow-orange-500/40">3</div>
                      <div>
                        <p className="font-bold text-white text-sm">Public Transit Friendly</p>
                        <p className="text-blue-100/60 text-xs mt-1">All centers are ETS accessible. Use the 'Get Directions' button to see bus routes.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            <section ref={mapSectionRef} className="max-w-7xl mx-auto px-6 py-20">
              <div className="flex justify-between items-end mb-10">
                <h3 className="text-4xl font-bold text-[#1e3a8a]">Food Hampers Near You</h3>
                {searched && (
                  <button onClick={clearSearch} className="text-sm font-bold flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors">
                    <X size={16} /> Clear Search
                  </button>
                )}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 h-[600px] rounded-[2.5rem] border-8 border-white shadow-2xl relative overflow-hidden">
                    <MapContainer
                      center={[mapCenter.lat, mapCenter.lon]}
                      zoom={searched ? 13 : 11}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {searched && (
                        <Marker position={[mapCenter.lat, mapCenter.lon]} icon={userIcon}>
                          <Popup>Your Location</Popup>
                        </Marker>
                      )}
                      {sortedHampers.map((loc, index) => (
                        <Marker
                          key={loc.id}
                          position={[loc.lat, loc.lon]}
                          icon={searched && index === 0 ? nearestIcon : defaultIcon}
                        >
                          <Popup>
                            <div className="p-1">
                              <p className="font-bold m-0">{loc.name}</p>
                              <p className="text-xs m-0">{loc.address}</p>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                </div>

                <div className="space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {sortedHampers.map((loc, idx) => (
                    <div key={loc.id} className={`p-6 rounded-3xl border-2 transition-all duration-300 ${searched && idx === 0 ? 'bg-[#1e3a8a] text-white border-[#f26522] shadow-xl' : 'bg-white border-gray-100 text-gray-800 hover:border-blue-200'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xl font-bold leading-tight">{loc.name}</h4>
                        {searched && <span className="text-[10px] font-black uppercase bg-orange-500 text-white px-2 py-0.5 rounded-full">{(loc as any).distance}km</span>}
                      </div>
                      <p className="text-sm mb-4 opacity-70 flex items-center gap-2"><MapPin size={14} /> {loc.address}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mb-4 text-[11px] font-bold">
                        <div className="flex items-center gap-1.5 opacity-80"><Clock size={14} className="text-[#f26522]"/> {loc.hours}</div>
                        <div className="flex items-center gap-1.5 opacity-80"><Phone size={14} className="text-[#f26522]"/> {loc.phone}</div>
                      </div>

                      <button 
                        onClick={() => openGoogleMaps(loc.name)}
                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${searched && idx === 0 ? 'bg-white text-[#1e3a8a] hover:bg-orange-50' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                      >
                        <Navigation size={16} /> Get Directions
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
        
        {view === 'donate' && (
          <div className="max-w-6xl mx-auto space-y-16 py-16 px-6 animate-in fade-in">
             
             <section className="bg-[#1e3a8a] text-white p-12 rounded-[3rem] shadow-2xl text-center relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-4xl font-black mb-4">Support Your Community</h2>
                  <button onClick={() => setView('donate-funds')} className="bg-[#f26522] px-12 py-5 rounded-full font-black text-xl hover:scale-105 transition shadow-lg">
                    Donate Funds (1$ = 3 Meals)
                  </button>
                </div>
                <Heart className="absolute -bottom-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
             </section>

             <div className="grid md:grid-cols-3 gap-12 items-start">
               <div className="space-y-6">
                 <div className="flex items-center gap-2">
                   <AlertCircle className="text-[#f26522]" />
                   <h3 className="text-2xl font-black text-[#1e3a8a] uppercase tracking-tighter">Critical Needs</h3>
                 </div>
                 <p className="text-gray-600 font-medium text-lg">
                   These items are at critical levels. Click the depot location on any card to find directions for drop-off.
                 </p>
               </div>

               <div className="md:col-span-2 grid sm:grid-cols-2 gap-6">
                 {loadingItems ? (
                   <div className="col-span-2 flex justify-center py-12">
                     <Loader2 className="animate-spin text-[#1e3a8a]" size={40} />
                   </div>
                 ) : criticalItems.length > 0 ? (
                   criticalItems.map(item => (
                     <div key={item.id} className="bg-white p-8 rounded-[2.5rem] border-2 border-red-50 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">

                       <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-50 rounded-2xl group-hover:bg-[#f26522] transition-colors">
                          <Package className="text-[#f26522] group-hover:text-white" size={24} />
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase">Critical</span>
                          {item.is_urgent && (
                            <span className="text-[10px] font-black text-white bg-red-600 px-3 py-1 rounded-full uppercase">Urgent</span>
                          )}
                        </div>
                       </div>

                       <h4 className="font-black text-xl text-gray-900 mb-1">{item.name}</h4>
                       <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{item.category}</p>

                       <button 
                        onClick={() => openGoogleMaps(item.location || 'Main Depot')}
                        className="w-full flex items-center gap-2 mb-4 p-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-orange-50 hover:border-orange-200 transition-all text-left"
                       >
                         <MapPin size={14} className="text-[#f26522] shrink-0" />
                         <span className="text-[11px] font-bold text-gray-600 truncate">
                           {item.location || 'Main Depot'}
                         </span>
                       </button>

                       {/* 🔥 UPDATED GHOST PROGRESS BAR */}
                       <div className="space-y-2">
                         <div className="flex justify-between text-[10px] font-bold">
                           <span className="text-gray-500 uppercase">Stock Levels</span>
                           <span className="text-red-600 font-black">
                             {item.current_stock}
                             {(item as any).totalPledged > 0 && (
                               <span className="text-orange-500 ml-1">
                                 (+{(item as any).totalPledged} pledged)
                               </span>
                             )}
                             {' / '}
                             {item.minimum_threshold}
                           </span>
                         </div>
                         
                         <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden relative">
                           
                           {/* Pledged Ghost Layer */}
                           <div 
                             className="bg-orange-200 h-full absolute left-0 top-0 transition-all duration-1000" 
                             style={{ 
                               width: `${Math.min(
                                 100, 
                                 ((item.current_stock + ((item as any).totalPledged || 0)) 
                                 / item.minimum_threshold) * 100
                               )}%` 
                             }} 
                           />

                           {/* Actual Stock Layer */}
                           <div 
                             className="bg-red-500 h-full absolute left-0 top-0 transition-all duration-1000 z-10" 
                             style={{ 
                               width: `${Math.min(
                                 100, 
                                 (item.current_stock / item.minimum_threshold) * 100
                               )}%` 
                             }} 
                           />
                         </div>
                       </div>

                       {/* PLEDGE BUTTON */}
                       <button
                         onClick={() => setPledgingItem(item)}
                         className="w-full mt-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white transition-all flex items-center justify-center gap-2 group"
                       >
                         <Heart size={14} className="group-hover:fill-current" />
                         Pledge to Donate
                       </button>

                     </div>
                   ))
                 ) : (
                    <div className="col-span-2 bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-gray-200 text-center text-gray-400 font-bold">
                      All inventory levels are currently stable. <br />
                      You can still make a huge impact by donating online.
                    </div>
                 )}
               </div>
             </div>
          </div>
        )}
      </main>

       {/* --- PLEDGE MODAL TRIGGER --- */}
        {pledgingItem && (
          <PledgeModal 
            item={pledgingItem} 
            onClose={() => setPledgingItem(null)} 
            onSuccess={() => {
              // 1️⃣ Alert the user
              alert("Pledge successful! Thank you for your support.");

              // 2️⃣ Close the modal
              setPledgingItem(null);

              // 3️⃣ Force full donate page recalculation
              // This re-triggers the donate useEffect which
              // recalculates pending pledges and stock properly
              setView('home');
              setTimeout(() => {
                setView('donate');
              }, 10);
            }}
          />
        )}

      {view !== 'admin' && view !== 'donate-funds' && (
        <button onClick={() => setView('admin')} className="fixed bottom-6 right-6 z-50 bg-[#1e3a8a] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2 group border-2 border-white/20">
          <Shield className="w-5 h-5" />
          <span className="hidden group-hover:inline-block pr-1 font-bold">Admin Portal</span>
        </button>
      )}
    </div>
  );
}

function PledgeModal({ item, onClose, onSuccess }: { item: FoodItem, onClose: () => void, onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); 
  const [date, setDate] = useState('');   
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('pledges').insert([{ 
      item_id: item.id, 
      donor_name: name, 
      donor_email: email,      
      expected_arrival: date,   
      quantity_pledged: quantity, 
      status: 'pending' 
    }]);
    if (!error) onSuccess();
    else alert("Error saving pledge.");
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a192f]/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in">
        <div className="flex justify-between mb-6">
          <h3 className="text-2xl font-black text-[#1e3a8a]">Make a Pledge</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Your Name" className="w-full p-4 bg-gray-50 border-2 rounded-2xl" value={name} onChange={(e) => setName(e.target.value)} />
          <input required type="email" placeholder="Email Address" className="w-full p-4 bg-gray-50 border-2 rounded-2xl" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input required type="date" className="w-full p-4 bg-gray-50 border-2 rounded-2xl" value={date} onChange={(e) => setDate(e.target.value)} />
          <input required type="number" min="1" placeholder="Quantity" className="w-full p-4 bg-gray-50 border-2 rounded-2xl" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} />
          <button type="submit" disabled={loading} className="w-full py-5 bg-[#f26522] text-white rounded-2xl font-black">
            {loading ? "Saving..." : "Confirm Pledge"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}