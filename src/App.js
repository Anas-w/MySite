import React, { useState, useEffect, useRef } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import './App.css';
import { 
  Recycle, 
  Truck, 
  IndianRupee, 
  ChevronRight, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle, 
  LogOut, 
  MapPin, 
  Phone,
  Search,
  Menu,
  X,
  ShieldCheck,
  Package,
  Camera,
  Sparkles,
  Leaf,
  Loader2,
  AlertCircle,
  Lock,
  ThumbsUp,
  RotateCcw,
 AlertTriangle,
  Mail,
  MessageCircle,
  PhoneCall
} from 'lucide-react';

// --- AI Configuration ---
const geminiApiKey = ""; 

// --- Gemini API Logic ---
const callGemini = async (prompt, systemPrompt = "You are an expert scrap recycling assistant for S4 Traders in Hyderabad.") => {
  if (!geminiApiKey) return "AI Features require a Gemini API Key.";
  let retries = 0;
  const maxRetries = 5;
  while (retries < maxRetries) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (err) {
      retries++;
      await new Promise(r => setTimeout(r, Math.pow(2, retries) * 1000));
    }
  }
  return "AI Service temporarily unavailable.";
};

const analyzeScrapImage = async (base64Data) => {
  if (!geminiApiKey) return [];
  const systemPrompt = `You are the S4 Traders AI scrap analyzer. Identify recyclable materials from images. Return ONLY a valid JSON array: [{"name": "Item Name", "qty": number, "category": "Category"}].`;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: "Identify scrap quantities." }, { inlineData: { mimeType: "image/png", data: base64Data } }]
        }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    const result = await response.json();
    return JSON.parse(result.candidates?.[0]?.content?.parts?.[0]?.text);
  } catch (err) {
    return [];
  }
};

const DEFAULT_PRICES = [
  { id: 'p1', category: 'Paper', name: 'Newspaper', price: 16, unit: 'kg' },
  { id: 'p2', category: 'Paper', name: 'Office Paper / Books', price: 14, unit: 'kg' },
  { id: 'p3', category: 'Paper', name: 'Cardboard / Carton', price: 9, unit: 'kg' },
  { id: 'm1', category: 'Metal', name: 'Iron / Loha', price: 30, unit: 'kg' },
  { id: 'm2', category: 'Metal', name: 'Copper / Tamba', price: 460, unit: 'kg' },
  { id: 'm3', category: 'Metal', name: 'Aluminium', price: 115, unit: 'kg' },
  { id: 'm4', category: 'Metal', name: 'Brass / Peetal', price: 340, unit: 'kg' },
  { id: 'pl1', category: 'Plastic', name: 'Soft Plastic', price: 10, unit: 'kg' },
  { id: 'pl2', category: 'Plastic', name: 'Hard Plastic', price: 14, unit: 'kg' },
  { id: 'e1', category: 'E-Waste', name: 'Laptop / Desktop', price: 350, unit: 'pc' },
  { id: 'e2', category: 'E-Waste', name: 'Mobile Phones', price: 60, unit: 'pc' },
  { id: 'a1', category: 'Appliances', name: 'Air Conditioner', price: 4800, unit: 'pc' },
  { id: 'a2', category: 'Appliances', name: 'Refrigerator', price: 900, unit: 'pc' },
  { id: 'a3', category: 'Appliances', name: 'Washing Machine', price: 750, unit: 'pc' },
];

// --- Components ---

const Logo = ({ className = "h-8", onClick }) => (
  <div 
    onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
    className={`flex items-center gap-3 transition-all duration-500 hover:scale-105 group cursor-pointer active:scale-95 ${className}`}
  >
    <div className="relative flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-200 via-slate-400 to-slate-200 rounded-lg shadow-lg overflow-hidden">
      <span className="text-slate-900 font-black text-xl italic tracking-tighter">S4</span>
    </div>
    <div className="flex flex-col -space-y-1 text-left">
      <span className="text-xl font-black tracking-tighter text-slate-100 uppercase leading-none">S4 TRADERS</span>
      <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Scrap Buyers</span>
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState('home'); 
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [orders, setOrders] = useState([]); 
  const [cart, setCart] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [notification, setNotification] = useState(null);
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimerRef = useRef(null);

  const CONTACT = {
    email: 'mohammedsameeruddinm@gmail.com',
    primaryPhone: '8121118629',
    phones: ['9959009283', '8121118629'],
    location: 'Hyderabad, Telangana'
  };

  const showNotify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    setLogoClicks(newCount);
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (newCount >= 5) {
      setIsAdminModalOpen(true);
      setLogoClicks(0);
      setIsMenuOpen(false);
    } else {
      clickTimerRef.current = setTimeout(() => setLogoClicks(0), 2000);
    }
  };

  const handleAdminAuth = (e) => {
    e.preventDefault();
    if (pinInput === "S4ADMIN") {
      setIsAdminModalOpen(false);
      setView('admin');
      setPinInput('');
      setPinError('');
      showNotify("Authorized.");
    } else {
      setPinError('Invalid PIN.');
    }
  };

  const handleImageScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsAiLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1];
        const results = await analyzeScrapImage(base64Data);
        let count = 0;
        results.forEach(res => {
          const match = prices.find(p => p.name.toLowerCase().includes(res.name.toLowerCase()));
          if (match) { addToCart({ ...match, qty: res.qty }); count++; }
        });
        showNotify(`AI added ${count} items!`);
        setView('prices');
        setIsAiLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showNotify("AI Scan failed.", "error");
      setIsAiLoading(false);
    }
  };

  const totalEstimate = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 transition-all duration-300">
        <Helmet>
          <title>S4 Traders | Hyderabad Scrap Buyers</title>
        </Helmet>

        {/* Floating Icons */}
        <div className="fixed bottom-24 left-4 z-[100] md:bottom-8 md:left-8">
           <a href={`tel:${CONTACT.primaryPhone}`} className="flex items-center justify-center w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/20">
             <PhoneCall size={24} />
           </a>
        </div>
        <div className="fixed bottom-24 right-4 z-[100] md:bottom-8 md:right-8">
           <a href={`https://wa.me/91${CONTACT.primaryPhone}?text=Hello S4 Traders, I want to sell some scrap.`} target="_blank" rel="noreferrer" className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all border border-white/20">
             <MessageCircle size={28} />
           </a>
        </div>

        {notification && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 bg-slate-900 text-white">
            {notification.type === 'error' ? <AlertCircle size={20} className="text-red-500" /> : <CheckCircle size={20} className="text-emerald-500" />}
            <span className="font-bold text-sm uppercase tracking-widest italic">{notification.msg}</span>
          </div>
        )}

        {isAdminModalOpen && (
          <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-8">
                <div className="bg-slate-950 text-white p-4 rounded-2xl shadow-xl"><Lock size={32} /></div>
                <button onClick={() => setIsAdminModalOpen(false)} className="p-2 text-slate-300 hover:text-slate-900"><X size={24} /></button>
              </div>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-950 mb-2">Command Access</h3>
              <form onSubmit={handleAdminAuth} className="space-y-6">
                <input type="password" autoFocus value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full p-5 bg-slate-50 border-2 rounded-2xl outline-none font-black text-2xl tracking-[0.5em] text-center focus:border-slate-950" placeholder="••••" />
                {pinError && <p className="text-red-500 text-[10px] font-black uppercase text-center">{pinError}</p>}
                <button type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black italic uppercase tracking-[0.2em] shadow-xl">Unlock</button>
              </form>
            </div>
          </div>
        )}

        <nav className="sticky top-0 z-[100] bg-slate-900 text-white border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              <Logo onClick={handleLogoClick} />
              <div className="hidden md:flex items-center gap-8">
                {['home', 'prices', 'schedule'].map(v => (
                  <button key={v} onClick={() => setView(v)} className={`relative text-xs font-black tracking-[0.2em] uppercase transition-all py-2 group ${view === v ? 'text-white' : 'text-slate-500 hover:text-slate-200'}`}>
                    {v === 'home' ? 'Home' : v === 'prices' ? 'Rates' : 'Book'}
                    <span className={`absolute bottom-0 left-0 h-[2px] bg-slate-200 transition-all duration-300 ${view === v ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                  </button>
                ))}
              </div>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden text-white p-2">
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
          {isMenuOpen && (
            <div className="md:hidden absolute top-20 left-0 w-full bg-slate-900 border-t border-white/5 shadow-2xl z-[110] animate-in slide-in-from-top duration-300">
              <div className="flex flex-col p-6 space-y-4">
                {['home', 'prices', 'schedule'].map(v => (
                  <button key={v} onClick={() => { setView(v); setIsMenuOpen(false); }} className={`text-left text-2xl font-black italic rounded-xl transition-all ${view === v ? 'text-white' : 'text-slate-500'}`}>
                    {v.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8 min-h-[70vh]">
          {view === 'home' && <HomeView setView={setView} contact={CONTACT} onScan={handleImageScan} />}
          {view === 'prices' && <PriceListView prices={prices} addToCart={addToCart} cart={cart} updateQty={updateQty} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onScan={handleImageScan} />}
          {view === 'schedule' && <ScheduleView cart={cart} totalEstimate={totalEstimate} contact={CONTACT} onSuccess={(data) => { setOrders(o => [data, ...o]); setView('success'); }} onNotify={showNotify} />}
          {view === 'admin' && <AdminView prices={prices} setPrices={setPrices} orders={orders} setOrders={setOrders} onExit={() => setView('home')} onNotify={showNotify} />}
          {view === 'success' && <SuccessView onHome={() => { setCart([]); setView('home'); }} />}
        </main>

        <footer className="bg-slate-950 text-slate-500 py-20 px-4 mt-20 border-t border-white/5 pb-32 md:pb-20">
          <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 text-center md:text-left">
            <div><Logo onClick={handleLogoClick} className="mb-8 flex justify-center md:justify-start" /></div>
            <div>
              <h4 className="text-white font-black uppercase text-[10px] mb-8">Contact S4</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-400">
                {CONTACT.phones.map(p => <li key={p}>+91 {p}</li>)}
                <li className="break-all">{CONTACT.email}</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-black uppercase text-[10px] mb-8">Region</h4>
              <p className="text-sm font-medium italic">Hyderabad, Telangana</p>
            </div>
          </div>
        </footer>
      </div>
    </HelmetProvider>
  );
}

// --- Views ---

function HomeView({ setView, contact, onScan }) {
  const fileInputRef = useRef();
  return (
    <div className="space-y-16 animate-in fade-in duration-1000">
      <section className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 text-white px-6 py-16 md:py-32 text-center border border-white/10 shadow-2xl">
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-black uppercase mb-8 text-slate-400 tracking-widest">Hyd's Trusted Buyers</div>
          <h1 className="text-4xl md:text-[8rem] font-black mb-10 tracking-tighter italic uppercase leading-tight">SELL YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-400 to-slate-100">SCRAP</span></h1>
          <p className="text-sm md:text-xl text-slate-400 mb-12 font-medium italic opacity-80">Digital weighing & instant payouts on receipt across Hyderabad.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button onClick={() => setView('schedule')} className="w-full sm:w-auto bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-all">BOOK PICKUP</button>
            <button onClick={() => fileInputRef.current.click()} className="w-full sm:w-auto bg-slate-800/50 backdrop-blur-md text-white px-10 py-5 rounded-2xl font-black text-xl border border-white/10 flex items-center justify-center gap-3">
              <Sparkles size={20} /> ✨ AI SCAN
            </button>
            <input type="file" ref={fileInputRef} onChange={onScan} accept="image/*" className="hidden" />
          </div>
        </div>
      </section>
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: <ShieldCheck />, title: 'Certified Weight', desc: '100% accurate measurement.' },
          { icon: <Camera />, title: 'AI Quotes', desc: 'Price estimation via photo.' },
          { icon: <IndianRupee />, title: 'Instant Payout', desc: 'Instant UPI/Cash upon receipt.' },
        ].map((f, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-left">
            <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg">{f.icon}</div>
            <h3 className="text-lg font-black uppercase italic mb-2 tracking-tight">{f.title}</h3>
            <p className="text-slate-500 font-bold leading-relaxed text-xs">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PriceListView({ prices, addToCart, cart, updateQty, searchQuery, setSearchQuery, onScan }) {
  const fileInputRef = useRef();
  const categories = [...new Set(prices.map(p => p.category))];
  const filteredPrices = prices.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-700 text-left">
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-slate-200 pb-12">
        <div className="max-w-xl w-full">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-6">Market Rates</h1>
          <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-xl font-black text-xs hover:bg-slate-700 w-full sm:w-auto justify-center uppercase tracking-widest">
            <Sparkles size={16} /> ✨ AI SCAN
          </button>
          <input type="file" ref={fileInputRef} onChange={onScan} accept="image/*" className="hidden" />
        </div>
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Search..." className="w-full pl-14 pr-6 py-5 rounded-3xl bg-white border-2 border-slate-100 font-black italic outline-none focus:border-slate-900 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-16">
        {categories.map(cat => {
          const items = filteredPrices.filter(p => p.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} className="space-y-8">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-4">{cat} <div className="h-[1px] flex-1 bg-slate-200"></div></h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map(item => {
                  const cartItem = cart.find(c => c.id === item.id);
                  return (
                    <div key={item.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-between shadow-sm hover:border-slate-900 transition-all">
                      <div>
                        <h4 className="font-black italic text-xl text-slate-900 uppercase tracking-tighter mb-4">{item.name}</h4>
                        <p className="text-slate-950 font-black text-3xl mb-8 italic">₹{item.price}<span className="text-[10px] text-slate-400 ml-1">/{item.unit}</span></p>
                      </div>
                      {cartItem ? (
                        <div className="flex items-center justify-between bg-slate-950 p-2 rounded-2xl text-white shadow-xl">
                          <button onClick={() => updateQty(item.id, -1)} className="w-10 h-10 flex items-center justify-center active:scale-75 transition-all"><Minus size={18} /></button>
                          <span className="font-black text-lg w-8 text-center italic">{cartItem.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="w-10 h-10 flex items-center justify-center active:scale-75 transition-all"><Plus size={18} /></button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(item)} className="w-full py-4 bg-slate-50 text-slate-400 font-black text-[10px] uppercase rounded-2xl hover:bg-slate-950 hover:text-white transition-all">Add to Estimate</button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScheduleView({ cart, totalEstimate, onSuccess, onNotify }) {
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', date: '', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const orderData = { 
      id: Math.random().toString(36).substr(2, 9),
      items: [...cart], totalEstimate, status: 'Pending', 
      customer: {...formData}, createdAt: new Date().toISOString() 
    };
    setTimeout(() => {
      onSuccess(orderData);
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto animate-in zoom-in-95 duration-700 text-left">
      <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
        <div className="md:w-[40%] bg-slate-950 text-white p-8 md:p-16 flex flex-col justify-between">
          <div>
            <Logo className="mb-12" />
            <h2 className="text-3xl font-black italic uppercase mb-8 tracking-tighter">Summary</h2>
            <div className="space-y-4 mb-10 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 text-xs font-black italic uppercase">
                  <span>{item.name} x {item.qty}</span>
                  <span className="text-slate-300">₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex justify-between items-end">
            <span className="text-[10px] uppercase font-black text-slate-500">Payload Total</span>
            <span className="text-5xl font-black italic tracking-tighter">₹{totalEstimate}</span>
          </div>
        </div>
        <div className="md:w-[60%] p-8 md:p-24 bg-white">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-slate-950 outline-none font-bold italic" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Contact</label>
                <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-slate-950 outline-none font-bold italic" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Pickup Address</label>
              <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-slate-950 outline-none font-bold italic h-32" placeholder="Hyderabad Hub Location"></textarea>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Scheduled Date</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-slate-950 outline-none font-bold italic" />
            </div>
            <button disabled={isSubmitting} type="submit" className="w-full bg-slate-950 text-white py-5 rounded-2xl font-black italic text-xl uppercase shadow-xl active:scale-95 transition-all">
              {isSubmitting ? 'Confirming...' : 'Dispatch Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AdminView({ prices, setPrices, orders, setOrders, onExit, onNotify }) {
  const [tab, setTab] = useState('orders');
  const [editingItem, setEditingItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const updatePrice = (id, newPrice) => {
    setPrices(prev => prev.map(p => p.id === id ? {...p, price: Number(newPrice)} : p));
    setEditingItem(null);
    onNotify("Market Rate Updated.");
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Command</h1>
          <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.5em] mt-2">S4 Traders Local Console</p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 bg-slate-100 p-2 rounded-2xl border border-slate-200 w-full lg:w-auto">
           <button onClick={() => setTab('pricing')} className={`px-6 md:px-8 py-3 rounded-xl font-black text-xs uppercase ${tab === 'pricing' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400'}`}>Rates</button>
           <button onClick={() => setTab('orders')} className={`px-6 md:px-8 py-3 rounded-xl font-black text-xs uppercase ${tab === 'orders' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-400'}`}>Dispatches</button>
           <button onClick={onExit} className="p-3 text-slate-400 hover:text-red-600 transition-all hover:rotate-180 duration-500"><LogOut/></button>
        </div>
      </div>
      
      {tab === 'pricing' ? (
        <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-x-auto shadow-2xl">
           <table className="w-full text-left min-w-[400px]">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                <tr><th className="px-6 py-6 md:px-10 md:py-8">Asset</th><th className="px-6 py-6 md:px-10 md:py-8">Rate</th><th className="px-6 py-6 md:px-10 md:py-8 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {prices.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-6 md:px-10 md:py-8 font-black uppercase text-sm md:text-lg italic tracking-tight">{item.name}</td>
                    <td className="px-6 py-6 md:px-10 md:py-8">
                      {editingItem === item.id ? (
                        <input 
                          type="number" 
                          defaultValue={item.price} 
                          autoFocus 
                          onBlur={(e) => updatePrice(item.id, e.target.value)} 
                          onKeyDown={(e) => e.key === 'Enter' && updatePrice(item.id, e.target.value)} 
                          className="w-24 p-3 border-2 border-slate-950 rounded-xl font-black text-lg focus:ring-0 outline-none" 
                        />
                      ) : (
                        <span className="font-black text-slate-950 italic text-lg md:text-2xl">₹{item.price} / {item.unit}</span>
                      )}
                    </td>
                    <td className="px-6 py-6 md:px-10 md:py-8 text-right">
                      <button 
                        onClick={() => setEditingItem(item.id)} 
                        className="bg-slate-100 p-2 md:px-4 md:py-2 rounded-xl text-slate-400 hover:text-slate-950 transition-all font-black text-[10px] uppercase"
                      >
                        {editingItem === item.id ? 'Save' : 'Modify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      ) : (
        <div className="grid gap-8 pb-10">
           {orders.map(order => (
             <div key={order.id} className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row gap-8">
                <div className="xl:w-1/3">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-3">{new Date(order.createdAt).toLocaleString()}</p>
                   <div className="flex items-center gap-3 mb-4">
                      <h4 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{order.customer.name}</h4>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${order.status === 'Accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{order.status}</span>
                   </div>
                   <p className="text-slate-900 font-black italic text-lg mb-4 bg-slate-100 px-4 py-2 rounded-xl inline-block transition-all hover:bg-slate-950 hover:text-white cursor-pointer">+91 {order.customer.phone}</p>
                   <div className="p-4 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-500 uppercase leading-relaxed">{order.customer.address}</div>
                </div>
                <div className="xl:w-2/3 flex flex-col justify-between gap-8">
                   <div className="bg-slate-50/50 p-6 rounded-[1.5rem]">
                      <div className="flex justify-between items-end border-b border-slate-200 pb-4 mb-4">
                         <span className="text-[10px] font-black uppercase text-slate-400">Value</span>
                         <span className="text-3xl font-black italic text-slate-950">₹{order.totalEstimate}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {order.items.map((it, idx) => <span key={idx} className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-black italic uppercase tracking-widest">{it.name} ({it.qty} {it.unit})</span>)}
                      </div>
                   </div>
                   <div className="flex flex-wrap gap-4">
                      {order.status !== 'Accepted' ? (
                        <button onClick={() => { setOrders(prev => prev.map(o => o.id === order.id ? {...o, status: 'Accepted'} : o)); onNotify("Accepted."); }} className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black italic uppercase text-xs hover:bg-emerald-700 flex items-center justify-center gap-2"><ThumbsUp size={16} /> Accept</button>
                      ) : (
                        <button onClick={() => { setOrders(prev => prev.map(o => o.id === order.id ? {...o, status: 'Pending'} : o)); onNotify("Reverted."); }} className="flex-1 border-2 border-slate-200 text-slate-400 py-4 rounded-2xl font-black italic uppercase text-xs hover:bg-slate-50 flex items-center justify-center gap-2"><RotateCcw size={16} /> Revert</button>
                      )}
                      {deletingId === order.id ? (
                        <button onClick={() => { setOrders(o => o.filter(x => x.id !== order.id)); setDeletingId(null); onNotify("Deleted."); }} className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-black italic uppercase text-xs animate-pulse flex items-center justify-center gap-2"><AlertTriangle size={16} /> Confirm</button>
                      ) : (
                        <button onClick={() => setDeletingId(order.id)} className="flex-1 bg-red-100 text-red-600 py-4 rounded-2xl font-black italic uppercase text-xs hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"><Trash2 size={16} /> Delete</button>
                      )}
                      {deletingId === order.id && <button onClick={() => setDeletingId(null)} className="px-6 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase">X</button>}
                   </div>
                </div>
             </div>
           ))}
           {orders.length === 0 && <div className="text-center py-20 bg-white border-2 border-dashed rounded-[2rem] text-slate-300 font-black italic text-xl uppercase tracking-widest">No Pickup Dispatches</div>}
        </div>
      )}
    </div>
  );
}

function SuccessView({ onHome }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 max-w-3xl mx-auto animate-in zoom-in-90 duration-500">
      <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-950 text-white rounded-full flex items-center justify-center mb-10 shadow-2xl animate-bounce border border-white/20">
        <CheckCircle size={80} />
      </div>
      <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-slate-950 mb-6 leading-none">ORDER SECURED</h1>
      <p className="text-lg md:text-xl font-bold italic mb-12 text-slate-500">Payout processed via UPI or Cash as soon as scrap is received.</p>
      <button onClick={onHome} className="w-full sm:w-auto bg-slate-950 text-white px-12 py-5 rounded-[1.5rem] font-black italic text-xl uppercase hover:scale-110 shadow-xl transition-all active:scale-95 tracking-widest border border-white/10">DASHBOARD</button>
    </div>
  );
}

const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  html { scroll-behavior: smooth; }
  * { transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
  input[type="date"]::-webkit-inner-spin-button, input[type="date"]::-webkit-calendar-picker-indicator { display: block; -webkit-appearance: none; }
`;
document.head.appendChild(style);