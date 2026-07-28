import React, { useState, useEffect } from 'react';
import { useFoodFlow, type AppUser } from '../context/FoodFlowContext';
import { Leaf, Utensils, User, HeartHandshake, Shield, Sparkles, MapPin, Zap, CheckCircle2, Mail, RefreshCw, X } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

function createDemoIdToken(email: string, name: string, googleId: string): string {
  const payload = {
    googleId,
    email,
    name,
    avatar: '🌐',
    emailVerified: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  const jsonStr = JSON.stringify(payload);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  return `demo-gtoken-${base64}`;
}

export const AuthPortal: React.FC = () => {
  const { users, login, register, loginWithGoogle, sendOtp, verifyOtp } = useFoodFlow();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState<AppUser['role']>('restaurant');
  const [regAddress, setRegAddress] = useState('');
  const [regContact, setRegContact] = useState('');
  
  // OTP States
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpLoading, setOtpLoading] = useState(false);

  // Google Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleOtpSent, setGoogleOtpSent] = useState(false);
  const [googleOtpDigits, setGoogleOtpDigits] = useState(['', '', '', '', '', '']);
  const [googleOtpLoading, setGoogleOtpLoading] = useState(false);

  // OTP Countdown Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (otpSent && otpTimer > 0 && !isOtpVerified) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, otpTimer, isOtpVerified]);

  const handleSendOtp = async () => {
    if (!regContact.trim()) {
      alert('Please enter your mobile phone number or email address to receive OTP.');
      return;
    }
    setOtpLoading(true);
    const type = regContact.includes('@') ? 'email' : 'phone';
    const res = await sendOtp(regContact.trim(), type);
    setOtpLoading(false);
    
    if (res.success) {
      setOtpSent(true);
      setOtpTimer(60);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) {
      alert('Please enter the full 6-digit OTP code.');
      return;
    }
    setOtpLoading(true);
    const res = await verifyOtp(regContact.trim(), code);
    setOtpLoading(false);
    
    if (res.success) {
      setIsOtpVerified(true);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regAddress.trim()) {
      alert('Please fill out all fields.');
      return;
    }

    if (!isOtpVerified) {
      alert('Please complete 6-digit OTP verification before proceeding.');
      return;
    }

    const baseLat = 12.97;
    const baseLng = 77.59;
    const latOffset = (Math.random() - 0.5) * 0.08;
    const lngOffset = (Math.random() - 0.5) * 0.08;

    const email = regContact.includes('@') ? regContact.trim() : undefined;
    const phone = !regContact.includes('@') ? regContact.trim() : undefined;

    register(
      regName.trim(),
      regRole,
      regAddress.trim(),
      baseLat + latOffset,
      baseLng + lngOffset,
      email,
      phone
    );
  };

  // Google Identity Services (GIS) Official Button Init Effect
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response.credential) {
              setGoogleOtpLoading(true);
              await loginWithGoogle({
                idToken: response.credential,
                credential: response.credential,
                role: regRole || 'customer'
              });
              setGoogleOtpLoading(false);
            }
          }
        });

        const btnContainer = document.getElementById('google-official-btn');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: '100%'
          });
        }
      } catch (err) {
        console.warn('GIS initialization error:', err);
      }
    }
  }, [regRole]);

  const handleSendGoogleOtp = async () => {
    if (!googleEmailInput.trim() || !googleEmailInput.includes('@')) {
      alert('Please enter a valid Google Account email address to receive OTP.');
      return;
    }
    setGoogleOtpLoading(true);
    try {
      const res = await sendOtp(googleEmailInput.trim(), 'email');
      if (res.success) {
        setGoogleOtpSent(true);
      } else {
        alert(res.message || 'Failed to send OTP code. Please try again.');
      }
    } catch (err: any) {
      alert(err.message || 'OTP request timed out. Please try again.');
    } finally {
      setGoogleOtpLoading(false);
    }
  };

  const handleVerifyGoogleOtpAndLogin = async () => {
    const code = googleOtpDigits.join('');
    if (code.length < 6) {
      alert('Please enter the full 6-digit OTP code sent to your Google Account email.');
      return;
    }
    setGoogleOtpLoading(true);
    const otpRes = await verifyOtp(googleEmailInput.trim(), code);
    if (!otpRes.success) {
      setGoogleOtpLoading(false);
      alert(otpRes.message || 'Invalid verification code. Please check your inbox.');
      return;
    }

    const email = googleEmailInput.trim();
    const name = email.split('@')[0];
    const googleId = `g-${Date.now()}`;
    const demoToken = createDemoIdToken(email, name, googleId);

    await loginWithGoogle({
      idToken: demoToken,
      credential: demoToken,
      role: regRole || 'customer',
      fallbackProfile: {
        googleId,
        email,
        name,
        avatar: '🌐'
      }
    });

    setGoogleOtpLoading(false);
    setShowGoogleModal(false);
  };

  return (
    <div className="min-h-screen text-slate-100 flex items-center justify-center p-4 md:p-8 font-sans selection:bg-brown-600 selection:text-slate-950">
      
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brown-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden border-2 border-white/80 bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-white/10 relative z-10">
        
        {/* Left Side: Pitch */}
        <div className="md:col-span-5 p-8 md:p-12 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col justify-between text-left relative overflow-hidden">
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
                Connect restaurants, customers, and NGOs in real-time. Share surplus meals, secure CSR tax benefits, and reduce environmental impact with verified accounts.
              </p>
            </div>
          </div>

          <div className="mt-12 md:mt-0 relative z-10 flex flex-col gap-4 border-t border-slate-800/80 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brown-600/10 border border-brown-600/20 flex items-center justify-center text-brown-400 font-bold text-sm">
                <Shield size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">6-Digit OTP Verified</div>
                <div className="text-[10px] text-slate-500">Secure real-time SMS & email authentication</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-sm">
                <Zap size={14} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-200">Google OAuth 2.0</div>
                <div className="text-[10px] text-slate-500">One-tap instant account creation</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form & Google SSO */}
        <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center text-left">
          
          {/* Navigation Tab Pills */}
          <div className="flex gap-2 p-1 bg-slate-950/80 border border-slate-850 rounded-2xl w-fit mb-6">
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

          {/* Google Sign In Container & Button */}
          <div className="w-full mb-6">
            <div id="google-official-btn" className="w-full min-h-[40px]"></div>
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-center gap-3 transition-all group shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white">Continue with Google Account</span>
              </button>
            )}
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-slate-500 tracking-wider">or email / phone login</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {activeTab === 'login' ? (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Welcome Back</h3>
                <p className="text-xs text-slate-500 mt-1">Select one of our verified profiles or sign in via Google above.</p>
              </div>

              {/* Quick Login Profiles */}
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
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4 animate-fadeIn">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Get Started</h3>
                <p className="text-xs text-slate-500 mt-1">Register with mandatory 6-digit OTP verification.</p>
              </div>

              {/* Role Selection */}
              <div className="flex flex-col gap-1.5">
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
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Organization / User Name</label>
                <input
                  type="text"
                  placeholder="e.g. Green Leaf Cafe or Aarav Mehta"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brown-600 transition-all font-semibold"
                  required
                />
              </div>

              {/* Address input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Address Location</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 56, Residency Road, Bangalore"
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brown-600 transition-all font-semibold"
                    required
                  />
                  <MapPin className="absolute left-3 top-2.5 text-slate-600" size={13} />
                </div>
              </div>

              {/* Mobile / Email OTP Input Box */}
              <div className="flex flex-col gap-1.5 border border-slate-800/80 bg-slate-950/60 p-3 rounded-2xl">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                    <Shield size={11} className="text-brown-400" />
                    <span>Mobile / Email (6-Digit OTP Verification)</span>
                  </label>
                  {isOtpVerified && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter +91 Mobile or Email"
                    value={regContact}
                    disabled={isOtpVerified}
                    onChange={e => setRegContact(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brown-600 transition-all font-semibold disabled:opacity-60"
                    required
                  />
                  {!isOtpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={otpLoading || !regContact.trim()}
                      className="px-3 py-2 bg-brown-600/20 hover:bg-brown-600/30 border border-brown-600/40 text-brown-300 font-extrabold text-[11px] rounded-xl transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {otpLoading ? <RefreshCw size={12} className="animate-spin" /> : <Mail size={12} />}
                      <span>{otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                    </button>
                  )}
                </div>

                {/* 6-Digit Code Input Section */}
                {otpSent && !isOtpVerified && (
                  <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-slate-850">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-medium">Enter 6-Digit Verification Code:</span>
                      <span className="text-[10px] text-slate-500 font-mono">Expires in: {otpTimer}s</span>
                    </div>

                    <div className="flex gap-1.5 justify-between">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={e => {
                            const val = e.target.value;
                            const nextDigits = [...otpDigits];
                            nextDigits[idx] = val;
                            setOtpDigits(nextDigits);
                            // Auto focus next input box
                            if (val && idx < 5) {
                              const nextInput = document.getElementById(`otp-input-${idx + 1}`);
                              nextInput?.focus();
                            }
                          }}
                          id={`otp-input-${idx}`}
                          className="w-9 h-10 bg-slate-900 border border-slate-800 rounded-lg text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-brown-500"
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="w-full mt-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={13} />
                      <span>Verify 6-Digit OTP</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Register Action Button */}
              <button
                type="submit"
                disabled={!isOtpVerified}
                className="w-full mt-1 bg-brown-600 hover:bg-brown-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-lg shadow-brown-600/25 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={13} />
                <span>Create Verified Account</span>
              </button>
            </form>
          )}

        </div>

      </div>

      {/* Google Account Sign-In Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full text-left shadow-2xl relative animate-scaleUp">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-5 right-5 text-slate-500 hover:text-white transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <div>
                <h3 className="text-base font-bold text-white">Google Account Sign In</h3>
                <p className="text-[11px] text-slate-400">Enter your Google Account email to receive verification OTP</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Google Account Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="e.g. yourname@gmail.com"
                    value={googleEmailInput}
                    disabled={googleOtpSent}
                    onChange={e => setGoogleEmailInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-sky-500 font-semibold disabled:opacity-60"
                  />
                  {!googleOtpSent && (
                    <button
                      type="button"
                      onClick={handleSendGoogleOtp}
                      disabled={googleOtpLoading || !googleEmailInput.includes('@')}
                      className="px-3 py-2 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-600/40 text-sky-300 font-extrabold text-xs rounded-xl transition-all disabled:opacity-50 flex items-center gap-1"
                    >
                      {googleOtpLoading ? <RefreshCw size={12} className="animate-spin" /> : <Mail size={12} />}
                      <span>Send OTP</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 6-Digit OTP Code Verification Input for Google Account */}
              {googleOtpSent && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800 animate-fadeIn">
                  <div className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/40 p-2.5 rounded-xl">
                    ✉️ Real 6-Digit Verification OTP sent to <strong>{googleEmailInput}</strong>. Please check your Inbox & Spam folder.
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-slate-400 font-medium">Enter 6-Digit OTP Code:</span>
                  </div>
                  <div className="flex gap-1.5 justify-between">
                    {googleOtpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={e => {
                          const val = e.target.value;
                          const nextDigits = [...googleOtpDigits];
                          nextDigits[idx] = val;
                          setGoogleOtpDigits(nextDigits);
                          if (val && idx < 5) {
                            document.getElementById(`google-otp-input-${idx + 1}`)?.focus();
                          }
                        }}
                        id={`google-otp-input-${idx}`}
                        className="w-9 h-10 bg-slate-950 border border-slate-800 rounded-lg text-center font-mono font-bold text-sm text-white focus:outline-none focus:border-sky-500"
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyGoogleOtpAndLogin}
                    disabled={googleOtpLoading}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                  >
                    {googleOtpLoading ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    <span>Verify & Sign In with Google</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                FoodFlow Security • Real OTP Verified Authentication
              </span>
              <button
                type="button"
                onClick={() => setGoogleOtpSent(false)}
                className="text-[10px] text-slate-400 hover:text-white underline"
              >
                Change Email
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default AuthPortal;
