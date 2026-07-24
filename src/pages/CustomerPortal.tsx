import React, { useState } from 'react';
import { useFoodFlow, getDishImageUrl, type DiscountListing } from '../context/FoodFlowContext';
import { Search, Clock, ShieldCheck, ShoppingBag, CreditCard, Sparkles, QrCode, Flame } from 'lucide-react';
import LiveMap from '../components/LiveMap';
import confetti from 'canvas-confetti';

export const CustomerPortal: React.FC = () => {
  const { discountListings, reserveDiscount, orders, menuItems } = useFoodFlow();

  // Filter/search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isFiltering, setIsFiltering] = useState(false);

  // Trigger brief shimmer loading on category change
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setIsFiltering(true);
    setTimeout(() => setIsFiltering(false), 450);
  };

  // Checkout modal states
  const [activeCheckoutListing, setActiveCheckoutListing] = useState<DiscountListing | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [paying, setPaying] = useState(false);

  // Success QR code display modal state
  const [showSuccessCode, setShowSuccessCode] = useState<string | null>(null);

  // Filter listings
  const filteredListings = discountListings.filter(listing => {
    const available = listing.quantityAvailable - listing.quantityReserved;
    if (available <= 0) return false;

    const matchesSearch = listing.dishName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          listing.restaurantName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category check
    const menuItem = menuItems.find(m => m.name === listing.dishName);
    const dishCategory = menuItem ? menuItem.category : (
      listing.dishName.toLowerCase().includes('chicken') || listing.dishName.toLowerCase().includes('biryani') || listing.dishName.toLowerCase().includes('mutton') || listing.dishName.toLowerCase().includes('fish') || listing.dishName.toLowerCase().includes('chettinad') ? 'Non-Veg' :
      listing.dishName.toLowerCase().includes('vegan') || listing.dishName.toLowerCase().includes('idiyappam') ? 'Vegan' :
      listing.dishName.toLowerCase().includes('jamun') || listing.dishName.toLowerCase().includes('payasam') || listing.dishName.toLowerCase().includes('sweet') || listing.dishName.toLowerCase().includes('pak') ? 'Dessert' :
      listing.dishName.toLowerCase().includes('coffee') || listing.dishName.toLowerCase().includes('tea') || listing.dishName.toLowerCase().includes('beverage') ? 'Beverage' : 'Veg'
    );
    
    const matchesCategory = selectedCategory === 'All' || dishCategory === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Veg', 'Non-Veg', 'Vegan', 'Dessert', 'Beverage'];

  // Handle Checkout Reservation Submission
  const handleCheckoutSubmit = () => {
    if (!activeCheckoutListing) return;
    setPaying(true);

    setTimeout(() => {
      setPaying(false);
      reserveDiscount(activeCheckoutListing.id, checkoutQuantity);
      
      // Fire confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      // Clear modal, show pickup QR details
      const recentOrderCode = `FF-QR-${Math.floor(100000 + Math.random() * 900000)}`;
      setShowSuccessCode(recentOrderCode);
      setActiveCheckoutListing(null);
    }, 2000);
  };

  // Customer Reservations list (filtered to static customer name Aarav Mehta)
  const myOrders = orders.filter(o => o.customerName === 'Aarav Mehta');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 pb-32">
      
      {/* Overview Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 text-left">
        <div>
          <h2 className="text-2xl font-black text-white m-0">Surplus Discount Marketplace</h2>
          <p className="text-xs text-slate-400">Save up to 70% on fresh, unsold restaurant meals. Order online and pick up before closing.</p>
        </div>
      </div>

      {/* Grid: Map and Food items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">

        {/* Left Side (7 cols): Map & Listings */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Map display */}
          <div className="w-full flex-shrink-0">
            <LiveMap zoomLevel={13} />
          </div>

          {/* Listings list */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-200">Active Deals Around You</h3>
              <span className="text-[10px] text-brown-400 font-bold bg-brown-600/10 px-2.5 py-1 rounded-full border border-brown-600/20">
                {filteredListings.length} Deals Live
              </span>
            </div>

            {isFiltering ? (
              // Shimmer Skeleton Loader Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col gap-3 skeleton-shimmer">
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-xl bg-slate-800/80" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="w-3/4 h-4 bg-slate-800/80 rounded" />
                        <div className="w-1/2 h-3 bg-slate-800/60 rounded" />
                        <div className="w-1/3 h-5 bg-slate-800/80 rounded mt-1" />
                      </div>
                    </div>
                    <div className="w-full h-8 bg-slate-800/80 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="text-center py-16 text-sm text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-900/50 flex flex-col items-center justify-center gap-3">
                <Search size={20} className="text-slate-600" />
                <span>No active deals matching your filters are currently online.</span>
                <span className="block text-[10px] text-slate-600 mt-1">Try changing categories or search query. Or swap to the Restaurant role and publish a new discount!</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredListings.map((listing, index) => {
                  const available = listing.quantityAvailable - listing.quantityReserved;
                  // Dynamic Mock Urgency Calculation
                  const urgencyMinutes = 20 + (index * 15) % 45;
                  const isUrgent = urgencyMinutes <= 30;

                  return (
                    <div 
                      key={listing.id} 
                      className={`glass-card p-4 rounded-2xl border-2 flex flex-col justify-between gap-4 transition-all duration-300 relative ${
                        isUrgent 
                          ? 'border-rose-500/80 shadow-lg shadow-rose-950/20' 
                          : 'border-white/80 hover:border-white hover:shadow-xl hover:shadow-white/25 hover:-translate-y-1.5'
                      }`}
                    >
                      {/* Urgency Badge overlay */}
                      {isUrgent && (
                        <div className="absolute -top-2.5 right-3 bg-rose-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1.5 animate-pulse z-10">
                          <Flame size={11} className="text-white" />
                          <span>Expiring in {urgencyMinutes}m</span>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <img 
                          src={listing.imageUrl || getDishImageUrl(listing.dishName)} 
                          alt={listing.dishName} 
                          className="w-20 h-20 rounded-xl object-cover border-2 border-white/80 flex-shrink-0 hover:scale-105 transition-all duration-300"
                        />
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-sm text-slate-200 truncate" title={listing.dishName}>{listing.dishName}</span>
                            <span className="bg-brown-600/10 text-brown-400 text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                              {listing.discountPercent}% OFF
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold">{listing.restaurantName}</p>
                          
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-base font-extrabold text-white">₹{listing.discountedPrice}</span>
                            <span className="text-xs text-slate-500 line-through">₹{listing.originalPrice}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-400 mt-1">
                            <span className="flex items-center gap-1"><Clock size={11} /> Pickup: {listing.pickupTime}</span>
                            <span className="font-bold text-amber-400">{available} Left</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveCheckoutListing(listing);
                          setCheckoutQuantity(1);
                        }}
                        className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md active-press"
                      >
                        Reserve portions
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side (5 cols): Filters & History */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Search Box */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Filters</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search food or restaurant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
              <Search className="absolute left-3 top-3 text-slate-500" size={14} />
            </div>

            {/* Categories pill list */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => handleCategoryChange(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active-press ${
                    selectedCategory === c
                      ? 'bg-sky-500 text-slate-950 font-extrabold shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Pickup Orders Archive */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Reservations</h3>
            <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
              {myOrders.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50 flex flex-col items-center justify-center gap-2">
                  <ShoppingBag size={16} className="text-slate-600" />
                  <span>No active reserved meals yet.</span>
                  <span className="block text-[10px] text-slate-600 mt-1">Reserve a meal to generate your checkout barcode and secure food pick up.</span>
                </div>
              ) : (
                myOrders.map((o) => {
                  const menuItem = menuItems.find(m => m.name === o.dishName);
                  return (
                    <div key={o.id} className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3">
                        <img 
                          src={menuItem?.imageUrl || getDishImageUrl(o.dishName)} 
                          alt={o.dishName} 
                          className="w-10 h-10 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{o.dishName}</h4>
                          <p className="text-[10px] text-slate-500">{o.restaurantName} • {o.quantity} portions</p>
                          <span className="text-[10px] font-bold text-brown-400 block mt-1">Paid: ₹{o.pricePaid}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowSuccessCode(o.pickupCode)}
                        className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-brown-400 transition-all flex items-center justify-center gap-1.5 flex-shrink-0"
                        title="Show Pickup QR Code"
                      >
                        <QrCode size={16} />
                        <span className="text-[10px] font-bold">QR</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Checkout Modal (Simulating Razorpay/UPI Checkout) */}
      {activeCheckoutListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm flex flex-col gap-4 text-left">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-bold uppercase tracking-wider mb-1">
                <ShoppingBag size={12} />
                <span>Reserve Surplus Meal</span>
              </div>
              <h3 className="text-base font-bold text-slate-200">{activeCheckoutListing.dishName}</h3>
              <p className="text-[10px] text-slate-500">{activeCheckoutListing.restaurantName}</p>
            </div>

            <div className="border-t border-b border-slate-800 py-3 flex flex-col gap-3.5">
              
              {/* Quantity Select */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400 font-bold">Choose Portions</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={checkoutQuantity <= 1}
                    onClick={() => setCheckoutQuantity(prev => prev - 1)}
                    className="w-7 h-7 bg-slate-800 text-white rounded-lg flex items-center justify-center disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-slate-200 w-6 text-center">{checkoutQuantity}</span>
                  <button
                    disabled={checkoutQuantity >= (activeCheckoutListing.quantityAvailable - activeCheckoutListing.quantityReserved)}
                    onClick={() => setCheckoutQuantity(prev => prev + 1)}
                    className="w-7 h-7 bg-slate-800 text-white rounded-lg flex items-center justify-center disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Payment Gateway Toggle */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'upi'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <CreditCard size={12} />
                    <span>UPI/Razorpay</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'card'
                        ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                        : 'border-slate-800 bg-slate-950 text-slate-400'
                    }`}
                  >
                    <CreditCard size={12} />
                    <span>Debit/Credit Card</span>
                  </button>
                </div>
              </div>

              {/* Total calculations */}
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-400 font-bold">Total Bill</span>
                <span className="text-base font-black text-white">₹{activeCheckoutListing.discountedPrice * checkoutQuantity}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutSubmit}
              disabled={paying}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-1.5 disabled:opacity-70"
            >
              {paying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Razorpay Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles size={12} />
                  <span>Pay Now (₹{activeCheckoutListing.discountedPrice * checkoutQuantity})</span>
                </>
              )}
            </button>

            <button
              onClick={() => setActiveCheckoutListing(null)}
              className="w-full py-2 bg-transparent text-slate-500 hover:text-slate-300 text-xs font-bold text-center"
            >
              Cancel Reservation
            </button>
          </div>
        </div>
      )}

      {/* QR Code pickup voucher modal */}
      {showSuccessCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-brown-600/10 border border-brown-600/20 flex items-center justify-center text-brown-400">
              <ShieldCheck size={24} />
            </div>
            
            <div>
              <h3 className="text-base font-bold text-white">Pickup Voucher Generated</h3>
              <p className="text-[10px] text-slate-400 max-w-[280px] mt-1">Show this QR Code at the restaurant counter to collect your fresh surplus items.</p>
            </div>

            {/* Generated QR Display box */}
            <div className="w-48 h-48 bg-white p-4 rounded-2xl flex flex-col justify-center items-center shadow-xl border border-slate-200">
              {/* Draw a gorgeous mock QR graphic using simple styled grids */}
              <div className="w-full h-full border-4 border-slate-900 flex flex-wrap p-1 gap-1.5 opacity-80">
                {/* 4 corner alignment squares */}
                <div className="w-9 h-9 border-4 border-slate-900 bg-slate-900 rounded flex justify-center items-center p-1">
                  <div className="w-full h-full bg-white rounded-sm" />
                </div>
                <div className="flex-grow h-9 bg-slate-900 rounded" />
                <div className="w-9 h-9 border-4 border-slate-900 bg-slate-900 rounded flex justify-center items-center p-1">
                  <div className="w-full h-full bg-white rounded-sm" />
                </div>
                
                {/* Middle rows */}
                <div className="w-9 h-12 bg-slate-900 rounded" />
                <div className="flex-grow h-12 flex flex-col gap-1">
                  <div className="h-4 bg-slate-900 rounded" />
                  <div className="h-4 bg-slate-900 rounded" />
                </div>
                <div className="w-9 h-12 bg-slate-900 rounded" />

                {/* Bottom corners */}
                <div className="w-9 h-9 border-4 border-slate-900 bg-slate-900 rounded flex justify-center items-center p-1">
                  <div className="w-full h-full bg-white rounded-sm" />
                </div>
                <div className="flex-grow h-9 bg-slate-900 rounded" />
                <div className="w-9 h-9 bg-slate-900 rounded" />
              </div>
            </div>

            <div className="text-xs font-mono font-bold text-slate-200 bg-slate-950 px-4 py-1.5 rounded-full border border-slate-800 select-all">
              {showSuccessCode}
            </div>

            <button
              onClick={() => setShowSuccessCode(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
export default CustomerPortal;
