import React from 'react';
import { useFoodFlow } from '../context/FoodFlowContext';
import { ShieldCheck, UserCheck, FileText, CheckCircle2, Shield, Utensils, User, HeartHandshake } from 'lucide-react';
import EnvironmentalDashboard from '../components/EnvironmentalDashboard';

export const AdminDashboard: React.FC = () => {
  const { users, verifyUser, wasteLogs, csrReceipts } = useFoodFlow();

  // Find users pending verification (verified === false)
  const pendingUsers = users.filter(u => u.verified === false);

  // Platform Audit Logs (recent 10 waste logs logged across the platform)
  const sortedLogs = [...wasteLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 pb-32">
      
      {/* Overview Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 text-left">
        <div>
          <h2 className="text-2xl font-black text-white m-0">Admin Control Center</h2>
          <p className="text-xs text-slate-400">Verify new restaurants & NGOs, review platform audit trails, monitor waste indices, and audit global CSR emissions logs.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold rounded-xl">
            <ShieldCheck size={14} />
            <span>HQ Operations Control</span>
          </span>
        </div>
      </div>

      {/* Grid: Metrics Dashboard & Verification Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">

        {/* Left Column (8 cols): Environmental Metrics */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Reuse the gorgeous Recharts environmental visualizer */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800">
            <EnvironmentalDashboard />
          </div>

          {/* Platform Audit Trail Table */}
          <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-200">System Waste Audit Log</h3>
              <span className="text-[10px] text-violet-400 font-bold bg-violet-500/10 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                <FileText size={10} />
                <span>Live Feed</span>
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="text-[10px] uppercase font-bold text-slate-500 bg-slate-900/60 border-b border-slate-850">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Restaurant</th>
                    <th className="py-2.5 px-3">Dish Name</th>
                    <th className="py-2.5 px-3">Prepared/Sold</th>
                    <th className="py-2.5 px-3">Waste (kg)</th>
                    <th className="py-2.5 px-3">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50">
                  {sortedLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-[11px] text-slate-400">{log.date}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">{log.restaurantName}</td>
                      <td className="py-2.5 px-3 text-slate-300">{log.dishName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-450">{log.quantityPrepared} / {log.quantitySold}</td>
                      <td className="py-2.5 px-3 font-bold text-brown-400">{log.weightOfWaste} kg</td>
                      <td className="py-2.5 px-3 text-slate-450 truncate max-w-[120px]">{log.wasteReason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (4 cols): Pending Verifications & System Health */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Verifications Card */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Approvals</h3>
            
            <div className="flex flex-col gap-3">
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-slate-850 rounded-2xl bg-slate-950/10 flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 size={16} className="text-brown-400" />
                  <span>All partner organizations are verified.</span>
                </div>
              ) : (
                pendingUsers.map((user) => (
                  <div key={user.id} className="p-4 bg-slate-900 border border-slate-850 rounded-2xl flex flex-col gap-3 hover:border-slate-800 transition-all">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700/50 flex items-center justify-center flex-shrink-0">
                          {user.role === 'restaurant' && <Utensils size={12} className="text-brown-400" />}
                          {user.role === 'customer' && <User size={12} className="text-sky-400" />}
                          {user.role === 'ngo' && <HeartHandshake size={12} className="text-rose-400" />}
                          {user.role === 'admin' && <Shield size={12} className="text-violet-400" />}
                        </div>
                        <span className="font-bold text-xs text-slate-200">{user.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 capitalize">Role: {user.role}</p>
                      <span className="text-[9px] text-slate-600 block truncate">{user.address}</span>
                    </div>

                    <button
                      onClick={() => verifyUser(user.id, true)}
                      className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1"
                    >
                      <UserCheck size={13} />
                      <span>Approve Profile</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Live System Diagnostics */}
          <div className="glass-card p-5 rounded-3xl border border-slate-800 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Health</h3>
            
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-850/50">
                <span className="text-slate-400">Database Collections</span>
                <span className="font-bold text-slate-200">15 Active</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-850/50">
                <span className="text-slate-400">Total Registered Users</span>
                <span className="font-bold text-slate-200">{users.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-850/50">
                <span className="text-slate-400">CSR Receipts Audited</span>
                <span className="font-bold text-slate-200">{csrReceipts.length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">API Status</span>
                <span className="font-bold text-brown-400 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="animate-pulse" />
                  <span>Healthy</span>
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
export default AdminDashboard;
