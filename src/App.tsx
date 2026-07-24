import React from 'react';
import { FoodFlowProvider, useFoodFlow } from './context/FoodFlowContext';
import { Navbar } from './components/Navbar';
import { AuthPortal } from './pages/AuthPortal';
import RestaurantDashboard from './pages/RestaurantDashboard';
import CustomerPortal from './pages/CustomerPortal';
import NgoDashboard from './pages/NgoDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { MobileNav } from './components/MobileNav';
import './App.css';

const AppContent: React.FC = () => {
  const { currentRole, loggedInUser } = useFoodFlow();

  // Render the current view according to the active role
  const renderDashboard = () => {
    switch (currentRole) {
      case 'restaurant':
        return <RestaurantDashboard />;
      case 'customer':
        return <CustomerPortal />;
      case 'ngo':
        return <NgoDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <RestaurantDashboard />;
    }
  };

  // If no user session is active, force the central Login/Register portal
  if (!loggedInUser) {
    return <AuthPortal />;
  }

  return (
    <div className="min-h-screen text-slate-100 flex flex-col animate-fadeIn pb-16 sm:pb-0">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Dashboard Workspace */}
      <main className="flex-grow">
        {renderDashboard()}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />
    </div>
  );
};

function App() {
  return (
    <FoodFlowProvider>
      <AppContent />
    </FoodFlowProvider>
  );
}

export default App;
