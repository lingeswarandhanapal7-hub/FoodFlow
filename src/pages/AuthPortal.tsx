import React, { useState } from 'react';
import { useFoodFlow, type AppUser } from '../context/FoodFlowContext';
import { Leaf, Utensils, User, HeartHandshake, Shield, Sparkles, MapPin, Zap } from 'lucide-react';

export const AuthPortal: React.FC = () => {
  const { users, login, register } = useFoodFlow();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState<AppUser['role']>('restaurant');
  const [regAddress, setRegAddress] = useState('');

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regAddress.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    // Seed realistic coordinates near Bangalore center
    const baseLat = 12.97;
    const baseLng = 77.59;
    const latOffset = (Math.random() - 0.5) * 0.08;
    const lngOffset = (Math.random() - 0.5) * 0.08;

    register(
      regName.trim(),
      regRole,
      regAddress.trim(),
      baseLat + latOffset,
      baseLng + lngOffset
    );
  };

  return (
    <div className="min-h-screen text-slate-100 flex items-center justify-center p-4 md:p-8 font-sans selection:bg-brown-600 selection:text-slate-950">
      
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brown-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden border-2 border-white/80 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-white/10 relative z-10">
        
        {/* Left Side: Brand & Environmental Impact Pitch */}
        <div className="md:col-span-5 p-8 md:p-12 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col justify-between text-left relative overflow-hidden">
          
          {/* Subtle logo vector outline behind text */}
          <div className="absolute -bottom-10 -left-10 text-slate-800/15 pointer-events-none">
            <Leaf size={240} strokeWidth={1} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brown-600 to-brown-400 flex items-center justify-center shadow-lg shadow-brown-600/20">
                <Leaf className="text-slate-950" size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white m-0">FoodFlow</h1>
            </div>

            <div className="mt-8 md:mt-12">
              <h2 className="text-2xl font-black text-white leading-tight">
                AI-Powered Food Waste Reduction & Donation Portal
              </h2>
              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                Connect restaurants, customers, and NGOs in real-time. Share surplus meals, secure CSR tax benefits, and reduce environmental impact.
              </p>
            </div>
          </div>

          <div className="mt-12 md:mt-0 relative z-10 flex flex-col gap-4 border-t border-slate-800/80 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brown-600/10 border border-brown-600/20 flex items-center justify-center text-brown-400 font-bold text-sm">
                <Leaf size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">12,450+ Meals Saved</div>
                <div className="text-[10px] text-slate-500">Redirected to shelters and families</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                <Zap size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">31.1 Tons of CO₂ Saved</div>
                <div className="text-[10px] text-slate-500">Redirected organic landfill waste</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Auth Inputs & Forms */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center text-left">
          
          {/* Navigation Tab Pills */}
          <div className="flex gap-2 p-1 bg-slate-950/80 border border-slate-850 rounded-2xl w-fit mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'login'
                  ? 'bg-slate-900 text-white border border-slate-800 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`px-5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === 'register'
                  ? 'bg-slate-900 text-white border border-slate-800 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {activeTab === 'login' ? (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Welcome Back</h3>
                <p className="text-xs text-slate-500 mt-1">Select one of our pre-configured profiles for immediate sandbox testing.</p>
              </div>

              {/* Sandbox Quick login Accounts list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => login(user.id)}
                    className="p-3.5 bg-slate-950/80 hover:bg-slate-900 border-2 border-white/80 hover:border-white hover:shadow-xl hover:shadow-white/25 rounded-2xl flex items-center gap-3 text-left transition-all duration-300 group hover:-translate-y-1"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-base flex-shrink-0 group-hover:scale-105 transition-all">
                      {user.role === 'restaurant' && <Utensils size={14} className="text-brown-400" />}
                      {user.role === 'customer' && <User size={14} className="text-sky-400" />}
                      {user.role === 'ngo' && <HeartHandshake size={14} className="text-rose-400" />}
                      {user.role === 'admin' && <Shield size={14} className="text-violet-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 group-hover:text-white truncate">{user.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize tracking-wide font-semibold mt-0.5">
                        {user.role === 'ngo' ? 'Shelter NGO' : user.role}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-800/80 pt-4 text-center">
                <span className="text-[10px] text-slate-600 block">
                  Quick Access accounts simulate different stakeholder modules locally.
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-5 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Get Started</h3>
                <p className="text-xs text-slate-500 mt-1">Register a new profile to test the localized platform flows.</p>
              </div>

              {/* Role Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Account Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['restaurant', 'customer', 'ngo'] as const).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRegRole(role)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all flex items-center justify-center gap-1.5 ${
                        regRole === role
                          ? 'bg-brown-600/10 border-brown-600 text-brown-400'
                          : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {role === 'restaurant' && <Utensils size={12} />}
                      {role === 'customer' && <User size={12} />}
                      {role === 'ngo' && <HeartHandshake size={12} />}
                      <span>{role === 'ngo' ? 'NGO' : role}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Organization / User Name</label>
                <input
                  type="text"
                  placeholder="e.g. Green Leaf Cafe or Aarav Mehta"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brown-600 transition-all font-semibold"
                  required
                />
              </div>

              {/* Address input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Address Location</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 56, Residency Road, Bangalore"
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brown-600 transition-all font-semibold"
                    required
                  />
                  <MapPin className="absolute left-3.5 top-3 text-slate-600" size={13} />
                </div>
              </div>

              {/* Register Action Button */}
              <button
                type="submit"
                className="w-full mt-2 bg-brown-600 hover:bg-brown-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-lg shadow-brown-600/25 flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} />
                <span>Create Account & Log In</span>
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
export default AuthPortal;
