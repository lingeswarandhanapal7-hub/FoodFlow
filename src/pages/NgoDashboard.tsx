import React, { useState } from 'react';
import { useFoodFlow, getDishImageUrl, type Donation } from '../context/FoodFlowContext';
import { Clock, CheckCircle2, XCircle, Award, Compass, Utensils, Truck, FileText } from 'lucide-react';
import LiveMap from '../components/LiveMap';
import CSRReceipt from '../components/CSRReceipt';

export const NgoDashboard: React.FC = () => {
  const { currentUser, donations, updateDonationStatus, csrReceipts, menuItems } = useFoodFlow();

  // Active tracking state (for routes drawing)
  const [activeTrackingDonation, setActiveTrackingDonation] = useState<Donation | null>(null);

  // Selected CSR Receipt for modal preview
  const [previewReceiptId, setPreviewReceiptId] = useState<string | null>(null);

  // Filters relevant to this NGO
  const myDonations = donations.filter(d => d.ngoId === currentUser.id);
  const pendingDonations = myDonations.filter(d => d.status === 'pending');
  const acceptedDonations = myDonations.filter(d => d.status === 'accepted' || d.status === 'picked_up');
  const completedDonations = myDonations.filter(d => d.status === 'completed');

  // Find recipient receipt
  const activeReceipt = csrReceipts.find(r => r.id === previewReceiptId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 pb-32">
      
      {/* Overview Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 text-left">
        <div>
          <h2 className="text-2xl font-black text-white m-0">NGO & Shelter Dashboard</h2>
          <p className="text-xs text-slate-400">Manage surplus food donations, accept food drop-offs, track pickup couriers, and download tax-deductible CSR Receipts.</p>
        </div>

        {/* Verification indicator */}
        <div className="flex items-center gap-2">
          {currentUser.verified ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brown-600/10 border border-brown-600/20 text-brown-400 text-xs font-bold rounded-xl">
              <CheckCircle2 size={14} />
              <span>Verified Shelter</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-xl animate-pulse">
              <XCircle size={14} />
              <span>Verification Pending</span>
            </span>
          )}
        </div>
      </div>

      {/* Grid: Map and details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* Left Column (5 cols): Donation Requests */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Pending donations list */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-200">Incoming Surplus Requests</h3>
            
            <div className="flex flex-col gap-3">
              {pendingDonations.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50 flex flex-col items-center justify-center gap-2">
                  <Utensils size={16} className="text-slate-600" />
                  <span>No pending surplus food alerts.</span>
                  <span className="block text-[10px] text-slate-600 mt-1">When restaurants mark food for donation, it will show up here immediately for approval.</span>
                </div>
              ) : (
                pendingDonations.map((don) => {
                  const menuItem = menuItems.find(m => m.name === don.dishName);
                  return (
                    <div key={don.id} className="p-4 bg-slate-900/90 border-2 border-white/80 hover:border-white hover:shadow-xl hover:shadow-white/25 rounded-2xl flex flex-col gap-3 transition-all duration-300 text-left hover:-translate-y-1">
                      <div className="flex items-start gap-3">
                        <img 
                          src={menuItem?.imageUrl || getDishImageUrl(don.dishName)} 
                          alt={don.dishName} 
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white/80 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <span className="font-bold text-xs text-slate-200 truncate">{don.dishName}</span>
                            <span className="bg-rose-500/10 text-rose-400 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase flex-shrink-0">
                              {don.weight} kg
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">Donor: {don.restaurantName}</p>
                          
                          <div className="flex items-center gap-4 text-[9px] text-slate-400 mt-2 font-medium">
                            <span className="flex items-center gap-1"><Clock size={11} /> Expiry: {don.expiryTime}</span>
                            <span className="font-bold text-brown-400">{don.quantity} Portions</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          onClick={() => updateDonationStatus(don.id, 'accepted')}
                          className="py-2 bg-brown-600 hover:bg-brown-500 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1 shadow-md shadow-brown-600/25"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => updateDonationStatus(don.id, 'rejected')}
                          className="py-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Accepted Donations Tracker list */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-200">Scheduled Pickups</h3>

            <div className="flex flex-col gap-3">
              {acceptedDonations.length === 0 ? (
                <div className="text-center py-6 text-[11px] text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50 flex flex-col items-center justify-center gap-2">
                  <Truck size={16} className="text-slate-600" />
                  <span>No courier collections scheduled.</span>
                </div>
              ) : (
                acceptedDonations.map((don) => {
                  const menuItem = menuItems.find(m => m.name === don.dishName);
                  return (
                    <div key={don.id} className="p-3.5 bg-slate-900 border border-slate-850 rounded-2xl flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3">
                        <img 
                          src={menuItem?.imageUrl || getDishImageUrl(don.dishName)} 
                          alt={don.dishName} 
                          className="w-10 h-10 rounded-lg object-cover border border-slate-800 flex-shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">{don.dishName}</h4>
                          <p className="text-[10px] text-slate-500">From: {don.restaurantName} • {don.weight} kg</p>
                          
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              onClick={() => setActiveTrackingDonation(don)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[9px] font-bold text-rose-400 hover:text-rose-300 transition-all"
                            >
                              <Compass size={10} className="animate-spin" />
                              <span>Track Route</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          updateDonationStatus(don.id, 'completed');
                          if (activeTrackingDonation?.id === don.id) {
                            setActiveTrackingDonation(null);
                          }
                        }}
                        className="px-3 py-2 bg-brown-600 text-white hover:bg-brown-500 font-extrabold text-[10px] rounded-xl transition-all shadow-md flex-shrink-0"
                      >
                        Receive Food
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column (7 cols): Tracking Map */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="w-full">
            {activeTrackingDonation ? (
              <LiveMap 
                highlightRoute={{
                  from: [activeTrackingDonation.restaurantLat, activeTrackingDonation.restaurantLng],
                  to: [activeTrackingDonation.ngoLat, activeTrackingDonation.ngoLng]
                }}
                centerPosition={[
                  (activeTrackingDonation.restaurantLat + activeTrackingDonation.ngoLat) / 2,
                  (activeTrackingDonation.restaurantLng + activeTrackingDonation.ngoLng) / 2
                ]}
                zoomLevel={14}
              />
            ) : (
              <LiveMap zoomLevel={13} />
            )}
          </div>
        </div>

      </div>

      {/* CSR receipts download archive (Full Width Section - No Empty Gaps) */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col gap-4 text-left">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-200">Redistribution Ledger (CSR)</h3>
          <span className="text-[10px] text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded-full">
            {completedDonations.length} Receipts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[360px] overflow-y-auto pr-1">
          {completedDonations.length === 0 ? (
            <div className="col-span-full text-center py-8 text-[11px] text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50 flex flex-col items-center justify-center gap-2">
              <FileText size={18} className="text-slate-600" />
              <span>No historical deliveries recorded.</span>
            </div>
          ) : (
            completedDonations.map((don) => {
              const receipt = csrReceipts.find(r => r.donationId === don.id);
              if (!receipt) return null;
              const menuItem = menuItems.find(m => m.name === don.dishName);
              return (
                <div 
                  key={don.id} 
                  className="p-4 bg-slate-900 border border-slate-850 rounded-2xl flex flex-col justify-between gap-3.5 text-left hover:border-slate-750 transition-all"
                >
                  <div className="flex gap-3">
                    {menuItem?.imageUrl && (
                      <img 
                        src={menuItem.imageUrl} 
                        alt={don.dishName} 
                        className="w-12 h-12 rounded-xl object-cover border border-slate-800 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">{receipt.id}</span>
                      <h4 className="font-bold text-xs text-slate-200 mt-0.5 truncate">{don.dishName}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 font-semibold">
                        <span>Meals: {receipt.estimatedMeals}</span>
                        <span>CO₂: {receipt.carbonSaved} kg</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setPreviewReceiptId(receipt.id)}
                    className="w-full py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1 shadow-md shadow-teal-500/10"
                  >
                    <Award size={12} />
                    <span>CSR Certificate</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Preview CSR Certificate modal */}
      {previewReceiptId && activeReceipt && (
        <CSRReceipt 
          receipt={activeReceipt} 
          onClose={() => setPreviewReceiptId(null)} 
        />
      )}

    </div>
  );
};
export default NgoDashboard;
