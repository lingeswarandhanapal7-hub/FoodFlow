import React, { useState } from 'react';
import { useFoodFlow, getDishImageUrl } from '../context/FoodFlowContext';
import { fetchGeminiAnalysis, generateLocalAnalysis } from '../services/gemini';
import { 
  Plus, Brain, MapPin, Clock, Tag, Handshake, CheckCircle2, Camera, PartyPopper,
  Image as ImageIcon, Upload, Utensils, ArrowRight, Package
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const PRESET_DISH_IMAGES = [
  { label: 'Masala Dosa', url: '/images/masala_dosa.png' },
  { label: 'Biryani', url: '/images/hyderabadi_chicken_biryani.png' },
  { label: 'Paneer Masala', url: '/images/paneer_butter_masala.png' },
  { label: 'Chettinad Curry', url: '/images/chettinad_chicken.png' },
  { label: 'Payasam', url: '/images/elaneer_payasam.png' },
  { label: 'Filter Coffee', url: '/images/madras_filter_coffee.png' },
  { label: 'Chole Bhature', url: '/images/chole_bhature.png' },
  { label: 'Butter Chicken', url: '/images/butter_chicken.png' },
  { label: 'Pav Bhaji', url: '/images/pav_bhaji.png' },
  { label: 'Mango Lassi', url: '/images/mango_lassi.png' }
];

const CUSTOM_DISH_OPTION = '__ADD_CUSTOM_DISH__';

export const RestaurantDashboard: React.FC = () => {
  const { 
    currentUser, 
    menuItems, 
    addMenuItem, 
    wasteLogs, 
    logWaste, 
    discountListings,
    publishDiscount, 
    createDonation, 
    donateUnsoldListing,
    users 
  } = useFoodFlow();

  // Active waste log form states
  const [selectedDishOption, setSelectedDishOption] = useState('');
  
  // Custom Dish inline creation states (when "+ Add Custom Dish" is selected)
  const [customDishName, setCustomDishName] = useState('');
  const [customCategory, setCustomCategory] = useState<'Veg' | 'Non-Veg' | 'Vegan' | 'Dessert' | 'Beverage'>('Veg');
  const [customPrice, setCustomPrice] = useState('180');
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Log quantities & parameters
  const [prepQty, setPrepQty] = useState('');
  const [soldQty, setSoldQty] = useState('');
  const [leftQty, setLeftQty] = useState('');
  const [wasteWeight, setWasteWeight] = useState('');
  const [wasteReason, setWasteReason] = useState('Overpreparation');
  const [expiryTime, setExpiryTime] = useState('22:00');
  const [imageVerified, setImageVerified] = useState(false);
  const [verifyingImage, setVerifyingImage] = useState(false);

  // Immediate Action choice directly inside log form
  const [immediateAction, setImmediateAction] = useState<'log_only' | 'publish_discount' | 'donate_ngo'>('log_only');
  const [inlineDiscountPercent, setInlineDiscountPercent] = useState('50');
  const [inlineNgoId, setInlineNgoId] = useState('');

  // Surplus Action Center section active tab
  const [actionCenterTab, setActionCenterTab] = useState<'leftovers' | 'marketplace'>('leftovers');

  // Discount publishing modal state
  const [publishingDiscountLogId, setPublishingDiscountLogId] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState('50');
  const [discountQuantity, setDiscountQuantity] = useState('');
  const [pickupTime, setPickupTime] = useState('21:00');

  // Donation listing states (for both leftovers and unsold marketplace deals)
  const [donatingTarget, setDonatingTarget] = useState<{ type: 'log' | 'listing'; id: string; dishName: string; quantity: number } | null>(null);
  const [selectedNgoId, setSelectedNgoId] = useState('');

  // AI assistant states
  const [aiApiKey, setAiApiKey] = useState(() => localStorage.getItem('ff_gemini_key') || '');
  const [aiReport, setAiReport] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Menu creation form states
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [menuName, setMenuName] = useState('');
  const [menuCategory, setMenuCategory] = useState<'Veg' | 'Non-Veg' | 'Vegan' | 'Dessert' | 'Beverage'>('Veg');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuDesc, setMenuDesc] = useState('');
  const [menuImageUrl, setMenuImageUrl] = useState('');

  // Verified NGO list
  const verifiedNgos = users.filter(u => u.role === 'ngo' && u.verified);

  // Save API key
  const saveApiKey = (key: string) => {
    setAiApiKey(key);
    localStorage.setItem('ff_gemini_key', key);
  };

  // Helper for image file uploads (converts file to Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger simulated image analysis/verification
  const triggerImageVerification = () => {
    setVerifyingImage(true);
    setTimeout(() => {
      setVerifyingImage(false);
      setImageVerified(true);
    }, 1500);
  };

  // Submit Waste Log (supports custom dishes & immediate discount / donation)
  const handleLogWasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalDishName = selectedDishOption;
    let finalCategory: 'Veg' | 'Non-Veg' | 'Vegan' | 'Dessert' | 'Beverage' = 'Veg';
    let finalImageUrl: string | undefined = undefined;

    if (selectedDishOption === CUSTOM_DISH_OPTION) {
      if (!customDishName || !customPrice) {
        alert('Please provide a dish name and price for your custom item.');
        return;
      }
      finalDishName = customDishName;
      finalCategory = customCategory;
      finalImageUrl = customImageUrl || getDishImageUrl(customDishName);

      // Automatically add new custom dish to standard menu
      addMenuItem({
        name: customDishName,
        category: customCategory,
        price: parseFloat(customPrice),
        description: 'Chef Special Signature Dish',
        imageUrl: finalImageUrl
      });
    } else {
      const matchedMenu = menuItems.find(m => m.name === selectedDishOption);
      if (matchedMenu) {
        finalCategory = matchedMenu.category;
        finalImageUrl = matchedMenu.imageUrl || getDishImageUrl(matchedMenu.name);
      }
    }

    if (!finalDishName || !prepQty || !soldQty || !leftQty || !wasteWeight) {
      alert('Please fill out all mandatory fields.');
      return;
    }

    const newLogId = `log-${Date.now()}`;

    logWaste({
      dishName: finalDishName,
      category: finalCategory,
      quantityPrepared: parseInt(prepQty),
      quantitySold: parseInt(soldQty),
      quantityLeft: parseInt(leftQty),
      weightOfWaste: parseFloat(wasteWeight),
      wasteReason,
      date: new Date().toISOString().split('T')[0],
      weather: 'Rainy',
      festival: 'None',
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      expiryTime,
      imageUrl: imageVerified ? 'verified_surplus_image.png' : finalImageUrl
    });

    // Handle immediate action if selected
    if (immediateAction === 'publish_discount' && parseInt(leftQty) > 0) {
      publishDiscount(
        newLogId,
        parseInt(inlineDiscountPercent),
        parseInt(leftQty),
        expiryTime
      );
    } else if (immediateAction === 'donate_ngo' && inlineNgoId && parseInt(leftQty) > 0) {
      createDonation(newLogId, inlineNgoId);
    }

    // Reset Form
    setSelectedDishOption('');
    setCustomDishName('');
    setCustomPrice('180');
    setCustomImageUrl('');
    setPrepQty('');
    setSoldQty('');
    setLeftQty('');
    setWasteWeight('');
    setImageVerified(false);
    setImmediateAction('log_only');
  };

  // Request AI insights
  const handleRequestAI = async () => {
    setLoadingAi(true);
    try {
      let result = '';
      if (aiApiKey.trim()) {
        result = await fetchGeminiAnalysis(wasteLogs, aiApiKey);
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        result = generateLocalAnalysis(wasteLogs);
      }
      setAiReport(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Filter logs & marketplace listings for this restaurant
  const myLogs = wasteLogs.filter(l => l.restaurantId === currentUser.id);
  const myMarketplaceListings = discountListings.filter(l => l.restaurantId === currentUser.id);
  
  // Analytics data
  const dates = Array.from(new Set(myLogs.map(l => l.date))).sort().slice(-8);
  const chartData = dates.map(d => {
    const dayLogs = myLogs.filter(l => l.date === d);
    const wasted = dayLogs.reduce((acc, curr) => acc + curr.weightOfWaste, 0);
    const displayDate = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { date: displayDate, wasted: parseFloat(wasted.toFixed(1)) };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 pb-32">
      
      {/* Overview Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 text-left">
        <div>
          <h2 className="text-2xl font-black text-white m-0">Restaurant Command Console</h2>
          <p className="text-xs text-slate-400">Add custom food items, log unsold portions, publish marketplace discounts, and donate unsold food to NGOs.</p>
        </div>
        
        {/* Gemini API Key drawer button */}
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setShowApiKey(!showApiKey)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white transition-all font-semibold"
          >
            <Brain size={14} className="text-purple-400 animate-pulse" />
            <span>AI Config</span>
          </button>
          {showApiKey && (
            <div className="absolute right-0 top-10 w-72 bg-slate-900 border border-slate-850 p-4 rounded-2xl shadow-2xl z-50 flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Gemini API Connection</span>
              <input
                type="password"
                placeholder="Enter Gemini API Key"
                value={aiApiKey}
                onChange={(e) => saveApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <p className="text-[9px] text-slate-500 leading-relaxed">
                If left blank, FoodFlow uses an in-browser local heuristics advisor to generate waste forecast insights.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Forms and Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">

        {/* Column Left (5 cols): Logging Form with Custom Food & Direct Actions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-100">Log Surplus Food & Action</h3>
              <span className="text-xs font-extrabold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                Custom Items Supported
              </span>
            </div>

            <form onSubmit={handleLogWasteSubmit} className="flex flex-col gap-4">
              
              {/* Dish Selection (Preset Menu Items or Custom Dish creation) */}
              <div>
                <label className="text-xs uppercase font-bold text-slate-300 tracking-wider">Select Dish or Create New</label>
                <select
                  value={selectedDishOption}
                  onChange={(e) => setSelectedDishOption(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-3 text-sm text-slate-100 focus:outline-none focus:border-brown-600 mt-1 font-medium"
                >
                  <option value="">-- Choose Food Item --</option>
                  <optgroup label="Restaurant Menu Items">
                    {menuItems.map(item => (
                      <option key={item.id} value={item.name}>{item.name} (₹{item.price})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Create Custom New Item">
                    <option value={CUSTOM_DISH_OPTION}>+ Add New Custom Food Dish...</option>
                  </optgroup>
                </select>
              </div>

              {/* Inline Custom Dish Creation Panel */}
              {selectedDishOption === CUSTOM_DISH_OPTION && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-3.5 animate-fade-in border-dashed">
                  <div className="flex items-center gap-2 text-sm font-black text-brown-400">
                    <Utensils size={16} />
                    <span>New Custom Food Specifications</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Food Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Malabar Fish Curry"
                        value={customDishName}
                        onChange={(e) => setCustomDishName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 mt-1 font-medium placeholder:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Price (₹)</label>
                      <input
                        type="number"
                        placeholder="₹"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 mt-1 font-medium placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Category</label>
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 mt-1 font-medium"
                      >
                        <option value="Veg">Veg</option>
                        <option value="Non-Veg">Non-Veg</option>
                        <option value="Vegan">Vegan</option>
                        <option value="Dessert">Dessert</option>
                        <option value="Beverage">Beverage</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Custom Image URL</label>
                      <input
                        type="text"
                        placeholder="https://... or upload below"
                        value={customImageUrl}
                        onChange={(e) => setCustomImageUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 mt-1 placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Preset thumbnails selector & file upload */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase block mb-1.5 tracking-wider">Pick Sample Photo or Upload</label>
                    <div className="flex flex-wrap gap-2 items-center">
                      {PRESET_DISH_IMAGES.slice(0, 5).map(img => (
                        <button
                          key={img.label}
                          type="button"
                          onClick={() => setCustomImageUrl(img.url)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            customImageUrl === img.url
                              ? 'border-brown-500 bg-brown-600/20 text-brown-400 shadow-sm'
                              : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
                          }`}
                        >
                          {img.label}
                        </button>
                      ))}

                      <label className="px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-800 bg-slate-900 text-slate-200 hover:text-white cursor-pointer flex items-center gap-1.5 active-press">
                        <Upload size={12} />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setCustomImageUrl)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Live preview */}
                  {customImageUrl && (
                    <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-900">
                      <img src={customImageUrl} alt="Preview" className="w-9 h-9 rounded-lg object-cover border border-slate-800" />
                      <span className="text-xs font-semibold text-slate-400 truncate">Image Preview Loaded Successfully</span>
                    </div>
                  )}
                </div>
              )}

              {/* Quantities (Prep, Sold, Left) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-300 tracking-wider">Prepared</label>
                  <input
                    type="number"
                    placeholder="Portions"
                    value={prepQty}
                    onChange={(e) => {
                      setPrepQty(e.target.value);
                      const prepared = parseInt(e.target.value) || 0;
                      const sold = parseInt(soldQty) || 0;
                      if (prepared >= sold) {
                        const left = prepared - sold;
                        setLeftQty(left.toString());
                        setWasteWeight((left * 0.35).toFixed(2));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 mt-1 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-300 tracking-wider">Sold</label>
                  <input
                    type="number"
                    placeholder="Portions"
                    value={soldQty}
                    onChange={(e) => {
                      setSoldQty(e.target.value);
                      const prepared = parseInt(prepQty) || 0;
                      const sold = parseInt(e.target.value) || 0;
                      if (prepared >= sold) {
                        const left = prepared - sold;
                        setLeftQty(left.toString());
                        setWasteWeight((left * 0.35).toFixed(2));
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 mt-1 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-300 tracking-wider">Surplus Left</label>
                  <input
                    type="number"
                    placeholder="Left"
                    value={leftQty}
                    disabled
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 mt-1 cursor-not-allowed font-extrabold"
                  />
                </div>
              </div>

              {/* Weight & Reason */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-300 tracking-wider">Est. Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="kg"
                    value={wasteWeight}
                    onChange={(e) => setWasteWeight(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 mt-1 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase font-bold text-slate-300 tracking-wider">Waste Reason</label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 mt-1 focus:outline-none focus:border-brown-600 font-medium"
                  >
                    <option value="Overpreparation">Overprepared</option>
                    <option value="Lower Walk-ins">Lower Walk-ins</option>
                    <option value="Sudden Rain/Weather">Weather Shift</option>
                    <option value="Menu Cancellation">Cancellation</option>
                    <option value="Spoiled Ingredients">Spoilage</option>
                  </select>
                </div>
              </div>

              {/* Expiry & Photo Verification */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-xs uppercase font-bold text-slate-300 tracking-wider">Expiry Time Today</label>
                  <input
                    type="time"
                    value={expiryTime}
                    onChange={(e) => setExpiryTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 mt-1 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={triggerImageVerification}
                    className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                      imageVerified 
                        ? 'bg-brown-600/10 border border-brown-600/20 text-brown-400'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-850'
                    }`}
                  >
                    {verifyingImage ? (
                      <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                    ) : imageVerified ? (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Photo Verified</span>
                      </>
                    ) : (
                      <>
                        <Camera size={14} />
                        <span>Food Verify</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Direct Next Action Selector */}
              <div className="pt-3 border-t border-slate-850">
                <label className="text-xs uppercase font-bold text-slate-300 block mb-2 tracking-wider">Direct Immediate Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setImmediateAction('log_only')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border flex flex-col items-center gap-1.5 transition-all ${
                      immediateAction === 'log_only'
                        ? 'bg-slate-800 border-slate-600 text-white shadow-md'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Package size={16} className="text-amber-400" />
                    <span>Save Log</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImmediateAction('publish_discount')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border flex flex-col items-center gap-1.5 transition-all ${
                      immediateAction === 'publish_discount'
                        ? 'bg-sky-950/80 border-sky-500/50 text-sky-300 shadow-md'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Tag size={16} className="text-sky-400" />
                    <span>Add Discount</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImmediateAction('donate_ngo')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border flex flex-col items-center gap-1.5 transition-all ${
                      immediateAction === 'donate_ngo'
                        ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-md'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Handshake size={16} className="text-rose-400" />
                    <span>Donate NGO</span>
                  </button>
                </div>

                {/* Conditional sub-controls based on immediate action choice */}
                {immediateAction === 'publish_discount' && (
                  <div className="mt-3 p-3 bg-sky-950/30 border border-sky-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <span className="text-xs font-bold text-sky-300">Discount Rate:</span>
                    <select
                      value={inlineDiscountPercent}
                      onChange={(e) => setInlineDiscountPercent(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-sky-200 font-bold"
                    >
                      <option value="30">30% Off</option>
                      <option value="50">50% Off (Half Price)</option>
                      <option value="70">70% Off</option>
                    </select>
                  </div>
                )}

                {immediateAction === 'donate_ngo' && (
                  <div className="mt-3 p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl flex flex-col gap-1.5 text-xs">
                    <span className="text-xs font-bold text-rose-300">Select Target NGO Shelter:</span>
                    <select
                      value={inlineNgoId}
                      onChange={(e) => setInlineNgoId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-rose-200 font-medium"
                    >
                      <option value="">-- Choose NGO --</option>
                      {verifiedNgos.map(n => (
                        <option key={n.id} value={n.id}>{n.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Log Submit Button */}
              <button
                type="submit"
                className="w-full mt-2 bg-brown-600 hover:bg-brown-500 text-white font-black text-sm py-3.5 rounded-xl transition-all shadow-lg shadow-brown-600/25 flex items-center justify-center gap-2"
              >
                <span>Process Entry & Dispatch Action</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          {/* Kitchen Waste Analytics Curve */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 flex flex-col gap-3 min-h-[220px]">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Kitchen Waste Curve</h4>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">Past 7 logs</span>
            </div>
            {chartData.length === 0 ? (
              <div className="text-center text-xs text-slate-500 my-auto">Log waste data above to visualize your kitchen curve.</div>
            ) : (
              <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: -25, right: 10, bottom: 0, top: 10 }}>
                    <defs>
                      <linearGradient id="wasteCurveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} unit="kg" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#34d399', fontSize: '11px', fontWeight: 'bold' }}
                      formatter={(val: any) => [`${val} kg`, 'Waste Logged']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="wasted" 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#wasteCurveGrad)" 
                      dot={{ r: 4, fill: '#34d399', strokeWidth: 2, stroke: '#0f172a' }}
                      activeDot={{ r: 6, fill: '#6ee7b7', stroke: '#0f172a', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Column Right (7 cols): AI Advisor & Action Center */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* AI Insights Board */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col gap-4 min-h-[300px]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-purple-400" />
                <h3 className="text-base font-bold text-slate-200">Gemini Optimization Advisor</h3>
              </div>
              <button
                onClick={handleRequestAI}
                disabled={loadingAi}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center gap-1.5 disabled:opacity-50"
              >
                {loadingAi ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Logs...</span>
                  </>
                ) : (
                  <>
                    <Brain size={12} />
                    <span>Run Gemini Audit</span>
                  </>
                )}
              </button>
            </div>

            {loadingAi ? (
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 skeleton-shimmer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800" />
                  <div className="w-1/2 h-5 bg-slate-800 rounded" />
                </div>
                <div className="w-full h-3 bg-slate-800 rounded" />
                <div className="w-5/6 h-3 bg-slate-800 rounded" />
                <div className="w-3/4 h-3 bg-slate-800 rounded" />
              </div>
            ) : aiReport ? (
              <div className="bg-slate-950/60 border border-slate-850 p-5 rounded-2xl max-h-[360px] overflow-y-auto text-slate-350 text-xs leading-relaxed font-sans prose prose-invert">
                {aiReport.split('\n').map((line, idx) => {
                  if (line.startsWith('## ')) {
                    const text = line.replace('## ', '');
                    const cleanText = text.replace(/[🧠📊💡🔮⚠️]/g, '').trim();
                    return (
                      <h3 key={idx} className="text-sm font-extrabold text-white mt-4 mb-2 flex items-center gap-2">
                        <Brain size={14} className="text-purple-400" />
                        <span>{cleanText}</span>
                      </h3>
                    );
                  }
                  if (line.startsWith('- ') || line.startsWith('* ')) {
                    return <div key={idx} className="pl-4 py-0.5 relative before:content-['•'] before:absolute before:left-1 before:text-purple-400">{line.substring(2)}</div>;
                  }
                  return <p key={idx} className="my-1.5">{line}</p>;
                })}
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-center items-center text-center p-6 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                <Brain size={36} className="text-slate-700 mb-2" />
                <span className="text-xs text-slate-400 font-bold">No Advice Generated Yet</span>
                <p className="text-[10px] text-slate-500 max-w-[320px] mt-1">
                  Click 'Run Gemini Audit' above. The AI will scan your 15-day waste logs, weather patterns, and menu structures to compile optimization policies.
                </p>
              </div>
            )}
          </div>

          {/* Active Actions & Unsold Food Donation Panel */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-200">Surplus & Unsold Action Center</h3>
              
              {/* Tabs selector */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActionCenterTab('leftovers')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    actionCenterTab === 'leftovers'
                      ? 'bg-brown-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Leftovers ({myLogs.filter(l => l.status === 'logged').length})
                </button>
                <button
                  onClick={() => setActionCenterTab('marketplace')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    actionCenterTab === 'marketplace'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Marketplace Deals ({myMarketplaceListings.length})
                </button>
              </div>
            </div>

            {/* TAB 1: Logged Leftovers awaiting discount or donation */}
            {actionCenterTab === 'leftovers' && (
              <div className="flex flex-col gap-3">
                {myLogs.filter(l => l.status === 'logged').length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/10 flex flex-col items-center justify-center gap-2">
                    <PartyPopper size={20} className="text-brown-400" />
                    <span>No leftover items waiting for action.</span>
                    <span className="block text-[10px] text-slate-600 mt-1">Log a surplus leftover above to activate marketplace discount and NGO donation options.</span>
                  </div>
                ) : (
                  myLogs.filter(l => l.status === 'logged').map((log) => {
                    const menuItem = menuItems.find(m => m.name === log.dishName);
                    return (
                      <div key={log.id} className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-750 transition-all text-left">
                        <div className="flex items-center gap-3">
                          <img 
                            src={log.imageUrl || menuItem?.imageUrl || getDishImageUrl(log.dishName)} 
                            alt={log.dishName} 
                            className="w-10 h-10 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200 text-xs">{log.dishName}</span>
                              <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500/10 text-amber-400 font-bold uppercase">
                                Surplus: {log.quantityLeft} portions
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-1.5 font-medium">
                              <span className="flex items-center gap-1"><Clock size={12} /> Expiry: {log.expiryTime}</span>
                              <span className="flex items-center gap-1"><MapPin size={12} /> Weight: {log.weightOfWaste} kg</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setPublishingDiscountLogId(log.id);
                              setDiscountQuantity(log.quantityLeft.toString());
                            }}
                            className="flex items-center gap-1 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                          >
                            <Tag size={12} />
                            <span>Discount</span>
                          </button>
                          <button
                            onClick={() => {
                              setDonatingTarget({ type: 'log', id: log.id, dishName: log.dishName, quantity: log.quantityLeft });
                              setSelectedNgoId(verifiedNgos[0]?.id || '');
                            }}
                            className="flex items-center gap-1 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                          >
                            <Handshake size={12} />
                            <span>Donate NGO</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: Marketplace Deals with option to Donate Unsold Portions */}
            {actionCenterTab === 'marketplace' && (
              <div className="flex flex-col gap-3">
                {myMarketplaceListings.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-950/10 flex flex-col items-center justify-center gap-2">
                    <Tag size={20} className="text-sky-400" />
                    <span>No active marketplace discount deals currently published.</span>
                  </div>
                ) : (
                  myMarketplaceListings.map((listing) => {
                    const unsoldQty = listing.quantityAvailable - listing.quantityReserved;
                    const isFullyReserved = unsoldQty <= 0;

                    return (
                      <div key={listing.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-left">
                        <div className="flex items-center gap-3">
                          <img 
                            src={listing.imageUrl || getDishImageUrl(listing.dishName)} 
                            alt={listing.dishName} 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200 text-xs">{listing.dishName}</span>
                              <span className="bg-sky-500/10 text-sky-400 text-[9px] px-2 py-0.5 rounded-full font-bold">
                                {listing.discountPercent}% OFF (₹{listing.discountedPrice})
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-semibold">
                              <span>Reserved: {listing.quantityReserved}</span>
                              <span>•</span>
                              <span className={unsoldQty > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                                Unsold Left: {unsoldQty} portions
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {isFullyReserved ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                              Sold Out Completely ✓
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setDonatingTarget({ type: 'listing', id: listing.id, dishName: listing.dishName, quantity: unsoldQty });
                                setSelectedNgoId(verifiedNgos[0]?.id || '');
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active-press"
                              title="Donate unsold food to a verified shelter"
                            >
                              <Handshake size={13} />
                              <span>Donate Unsold ({unsoldQty}) to NGO</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Menu Manager Section (Add Custom Dishes with Image Upload & Preset Selector) */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 text-left">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-200">Standard Restaurant Menu</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Define your dishes with custom prices and custom photos.</p>
          </div>
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white rounded-xl text-xs font-bold transition-all text-slate-350"
          >
            <Plus size={14} />
            <span>Add Menu Item</span>
          </button>
        </div>

        {showAddMenu && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if(!menuName || !menuPrice) return;
              addMenuItem({
                name: menuName,
                category: menuCategory,
                price: parseFloat(menuPrice),
                description: menuDesc || 'Specialty Dish',
                imageUrl: menuImageUrl || getDishImageUrl(menuName)
              });
              setMenuName('');
              setMenuPrice('');
              setMenuDesc('');
              setMenuImageUrl('');
              setShowAddMenu(false);
            }}
            className="p-4 bg-slate-950 border border-slate-850 rounded-2xl mb-6 flex flex-col gap-4"
          >
            <div className="flex items-center gap-2 text-sm font-black text-slate-100">
              <ImageIcon size={16} className="text-brown-400" />
              <span>Add New Food Item Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 items-end">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dish Name</label>
                <input
                  type="text"
                  placeholder="e.g. Malabar Fish Curry"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 mt-1 focus:outline-none font-medium placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Category</label>
                <select
                  value={menuCategory}
                  onChange={(e) => setMenuCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 mt-1 focus:outline-none font-medium"
                >
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Beverage">Beverage</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Custom Price (₹)</label>
                <input
                  type="number"
                  placeholder="₹"
                  value={menuPrice}
                  onChange={(e) => setMenuPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 mt-1 focus:outline-none font-medium placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Short Description</label>
                <input
                  type="text"
                  placeholder="Ingredients or description..."
                  value={menuDesc}
                  onChange={(e) => setMenuDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 mt-1 focus:outline-none font-medium placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Custom Image URL or Preset Thumbnails Selector */}
            <div className="pt-2.5 border-t border-slate-900 flex flex-col gap-2.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Set Food Photo (URL, Upload, or Pick Sample)</label>
              
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Paste Image URL..."
                  value={menuImageUrl}
                  onChange={(e) => setMenuImageUrl(e.target.value)}
                  className="flex-1 min-w-[200px] bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-medium placeholder:text-slate-500"
                />

                <label className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-200 hover:text-white cursor-pointer flex items-center gap-1.5 active-press">
                  <Upload size={14} />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setMenuImageUrl)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preset Sample Images */}
              <div className="flex flex-wrap gap-2 mt-1">
                {PRESET_DISH_IMAGES.map(img => (
                  <button
                    key={img.label}
                    type="button"
                    onClick={() => setMenuImageUrl(img.url)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      menuImageUrl === img.url
                        ? 'border-brown-500 bg-brown-600/20 text-brown-400 shadow-sm'
                        : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white'
                    }`}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMenu(false)}
                className="px-4 py-2 bg-slate-800 text-slate-400 text-xs rounded-xl hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-brown-600 hover:bg-brown-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                Save Food Dish
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => {
            const isSelected = selectedDishOption === item.name;
            return (
              <div 
                key={item.id} 
                onClick={() => {
                  setSelectedDishOption(item.name);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`p-3.5 rounded-2xl flex gap-3 cursor-pointer group transition-all duration-300 relative border-2 border-white/80 ${
                  isSelected
                    ? 'bg-amber-950/50 border-amber-400 shadow-2xl shadow-amber-500/30 ring-2 ring-amber-400 scale-[1.02]'
                    : 'bg-slate-900/90 border-white/80 hover:border-white hover:bg-slate-800 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-white/25'
                }`}
                title="Click to select this food item for waste logging"
              >
                <img 
                  src={item.imageUrl || getDishImageUrl(item.name)} 
                  alt={item.name} 
                  className="w-16 h-16 rounded-xl object-cover border border-white/40 flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                />
                <div className="flex flex-col justify-between flex-1 gap-1 min-w-0">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold text-xs text-white truncate group-hover:text-amber-300 transition-colors" title={item.name}>{item.name}</span>
                      <span className="text-[8px] bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded-full font-bold uppercase flex-shrink-0 border border-white/30">{item.category}</span>
                    </div>
                    <p className="text-[9px] text-slate-300 leading-normal line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-amber-400">₹{item.price}</span>
                    {isSelected && (
                      <span className="text-[9px] font-extrabold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400 animate-pulse">
                        Selected ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Modal 1: Discount Publisher */}
      {publishingDiscountLogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4 text-left">
            <div>
              <h3 className="text-base font-bold text-slate-200">Publish Surplus Discount</h3>
              <p className="text-[10px] text-slate-500">Unsold portions will be added to the live map at a discount.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Discount Percentage (%)</label>
                <select
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs mt-1 text-slate-200"
                >
                  <option value="20">20% Off</option>
                  <option value="30">30% Off</option>
                  <option value="40">40% Off</option>
                  <option value="50">50% Off (Half Price)</option>
                  <option value="60">60% Off</option>
                  <option value="75">75% Off</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Quantity to Sell</label>
                <input
                  type="number"
                  value={discountQuantity}
                  onChange={(e) => setDiscountQuantity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs mt-1 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Pickup Closing Time</label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs mt-1 text-slate-200"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button
                onClick={() => {
                  publishDiscount(
                    publishingDiscountLogId, 
                    parseInt(discountPercent), 
                    parseInt(discountQuantity) || 1, 
                    pickupTime
                  );
                  setPublishingDiscountLogId(null);
                }}
                className="flex-grow py-2.5 bg-sky-500 text-slate-950 hover:bg-sky-400 font-bold text-xs rounded-xl transition-all"
              >
                Publish Offer
              </button>
              <button
                onClick={() => setPublishingDiscountLogId(null)}
                className="px-4 py-2.5 bg-slate-800 text-slate-400 text-xs rounded-xl hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Modal 2: NGO Donation Sender (Handles Leftover Logs & Unsold Marketplace Deals) */}
      {donatingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4 text-left">
            <div>
              <h3 className="text-base font-bold text-slate-200">Select NGO Recipient</h3>
              <p className="text-[10px] text-slate-500">
                Dispatching <span className="text-rose-400 font-bold">{donatingTarget.quantity} portions</span> of {donatingTarget.dishName} to a verified shelter.
              </p>
            </div>

            {verifiedNgos.length === 0 ? (
              <div className="text-center text-xs text-slate-500 py-4">No verified NGOs available in the area. Ensure NGOs are verified by the Admin.</div>
            ) : (
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400">Verified Organization</label>
                <select
                  value={selectedNgoId}
                  onChange={(e) => setSelectedNgoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs mt-1 text-slate-200"
                >
                  {verifiedNgos.map(n => (
                    <option key={n.id} value={n.id}>{n.name} (Koramangala)</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2.5 mt-2">
              <button
                onClick={() => {
                  if(!selectedNgoId) return;
                  if (donatingTarget.type === 'log') {
                    createDonation(donatingTarget.id, selectedNgoId);
                  } else {
                    donateUnsoldListing(donatingTarget.id, selectedNgoId);
                  }
                  setDonatingTarget(null);
                }}
                disabled={!selectedNgoId}
                className="flex-grow py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-50"
              >
                Send Donation Request
              </button>
              <button
                onClick={() => setDonatingTarget(null)}
                className="px-4 py-2.5 bg-slate-800 text-slate-400 text-xs rounded-xl hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default RestaurantDashboard;
