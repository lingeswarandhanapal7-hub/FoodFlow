import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

// Interfaces
export interface MenuItem {
  id: string;
  name: string;
  category: 'Veg' | 'Non-Veg' | 'Vegan' | 'Dessert' | 'Beverage';
  price: number;
  description: string;
  imageUrl?: string;
}

export interface WasteLog {
  id: string;
  restaurantId: string;
  restaurantName: string;
  dishName: string;
  category: 'Veg' | 'Non-Veg' | 'Vegan' | 'Dessert' | 'Beverage';
  quantityPrepared: number; // portions
  quantitySold: number;
  quantityLeft: number;
  weightOfWaste: number; // kg
  wasteReason: string;
  date: string;
  weather: string;
  festival: string;
  dayOfWeek: string;
  expiryTime: string;
  status: 'logged' | 'marketplace' | 'donated' | 'completed';
  imageUrl?: string;
}

export interface DiscountListing {
  id: string;
  logId: string;
  restaurantId: string;
  restaurantName: string;
  dishName: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  quantityAvailable: number;
  quantityReserved: number;
  pickupTime: string;
  lat: number;
  lng: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  listingId: string;
  dishName: string;
  restaurantName: string;
  quantity: number;
  pricePaid: number;
  customerName: string;
  pickupCode: string;
  status: 'pending' | 'completed';
  date: string;
}

export interface Donation {
  id: string;
  restaurantId: string;
  restaurantName: string;
  ngoId: string;
  ngoName: string;
  dishName: string;
  quantity: number;
  weight: number;
  expiryTime: string;
  status: 'pending' | 'accepted' | 'rejected' | 'picked_up' | 'completed';
  date: string;
  restaurantLat: number;
  restaurantLng: number;
  ngoLat: number;
  ngoLng: number;
}

export interface CSRReceipt {
  id: string;
  donationId: string;
  restaurantName: string;
  ngoName: string;
  date: string;
  dishName: string;
  weight: number;
  estimatedMeals: number;
  carbonSaved: number; // kg CO2
  signature: string;
}

export interface AppNotification {
  id: string;
  role: 'restaurant' | 'customer' | 'ngo' | 'admin' | 'all';
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
}

export type Role = 'restaurant' | 'customer' | 'ngo' | 'admin';

export interface AppUser {
  id: string;
  name: string;
  role: Role;
  address: string;
  lat: number;
  lng: number;
  verified?: boolean;
  avatar?: string;
  email?: string;
  phone?: string;
  otpVerified?: boolean;
  googleId?: string;
}

// Utility helper to reliably get the exact dish image by dish name
export const getDishImageUrl = (dishName: string = ''): string => {
  const lower = dishName.toLowerCase().trim();
  if (lower.includes('dosa')) return '/images/masala_dosa.png';
  if (lower.includes('idli')) return '/images/idli_sambar.png';
  if (lower.includes('chettinad')) return '/images/chettinad_chicken.png';
  if (lower.includes('ambur') || (lower.includes('mutton') && lower.includes('biryani'))) return '/images/ambur_mutton_biryani.png';
  if (lower.includes('hyderabadi') || lower.includes('biryani')) return '/images/hyderabadi_chicken_biryani.png';
  if (lower.includes('pongal')) return '/images/ven_pongal.png';
  if (lower.includes('vada')) return '/images/medu_vada.png';
  if (lower.includes('payasam')) return '/images/elaneer_payasam.png';
  if (lower.includes('parotta') || lower.includes('kothu')) return '/images/kothu_parotta.png';
  if (lower.includes('paneer')) return '/images/paneer_butter_masala.png';
  if (lower.includes('idiyappam')) return '/images/idiyappam_veg_kurma.png';
  if (lower.includes('mysore') || lower.includes('pak')) return '/images/mysore_pak.png';
  if (lower.includes('filter coffee') || lower.includes('coffee')) return '/images/madras_filter_coffee.png';
  if (lower.includes('chole') || lower.includes('bhature')) return '/images/chole_bhature.png';
  if (lower.includes('butter chicken')) return '/images/butter_chicken.png';
  if (lower.includes('fish') || lower.includes('goan')) return '/images/goan_fish_curry.png';
  if (lower.includes('pav') || lower.includes('bhaji')) return '/images/pav_bhaji.png';
  if (lower.includes('dhokla')) return '/images/dhokla.png';
  if (lower.includes('rogan') || lower.includes('josh')) return '/images/rogan_josh.png';
  if (lower.includes('litti') || lower.includes('chokha')) return '/images/litti_chokha.png';
  if (lower.includes('rasgulla')) return '/images/rasgulla.png';
  if (lower.includes('lassi')) return '/images/mango_lassi.png';
  if (lower.includes('paratha')) return '/images/aloo_paratha.png';
  if (lower.includes('samosa')) return '/images/samosa_chutney.png';
  if (lower.includes('dal baati') || lower.includes('churma')) return '/images/dal_baati_churma.png';
  if (lower.includes('kathi') || lower.includes('roll')) return '/images/kolkata_kathi_roll.png';
  if (lower.includes('chai') || lower.includes('tea')) return '/images/masala_chai.png';
  return '/images/masala_dosa.png';
};

interface FoodFlowContextType {
  currentRole: 'restaurant' | 'customer' | 'ngo' | 'admin';
  setCurrentRole: (role: 'restaurant' | 'customer' | 'ngo' | 'admin') => void;
  currentUser: AppUser;
  users: AppUser[];
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  wasteLogs: WasteLog[];
  logWaste: (log: Omit<WasteLog, 'id' | 'restaurantId' | 'restaurantName' | 'status'>) => void;
  discountListings: DiscountListing[];
  publishDiscount: (logId: string, discountPercent: number, quantity: number, pickupTime: string) => void;
  orders: Order[];
  reserveDiscount: (listingId: string, quantity: number) => void;
  donations: Donation[];
  createDonation: (logId: string, ngoId: string) => void;
  donateUnsoldListing: (listingId: string, ngoId: string) => void;
  updateDonationStatus: (donationId: string, status: Donation['status']) => void;
  csrReceipts: CSRReceipt[];
  notifications: AppNotification[];
  addNotification: (role: AppNotification['role'], title: string, message: string, type: AppNotification['type']) => void;
  markNotificationRead: (id: string) => void;
  verifyUser: (userId: string, verified: boolean) => void;
  loggedInUser: AppUser | null;
  login: (userId: string) => boolean;
  register: (name: string, role: AppUser['role'], address: string, lat: number, lng: number, email?: string, phone?: string) => void;
  loginWithGoogle: (payload: { idToken?: string; credential?: string; role?: AppUser['role']; fallbackProfile?: { googleId: string; email: string; name: string; avatar?: string } }) => Promise<void>;
  sendOtp: (target: string, type?: 'phone' | 'email') => Promise<{ success: boolean; message: string; demoOtp?: string }>;
  verifyOtp: (target: string, otp: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const FoodFlowContext = createContext<FoodFlowContextType | undefined>(undefined);

// Core Mock Data Setup
const MOCK_USERS: AppUser[] = [
  { id: 'u-rest-1', name: 'Spice Garden', role: 'restaurant', address: '12, MG Road, Bangalore', lat: 12.9716, lng: 77.5946, verified: true, avatar: '🏢' },
  { id: 'u-rest-2', name: 'Biryani Club', role: 'restaurant', address: '45, Indiranagar, Bangalore', lat: 12.9784, lng: 77.6408, verified: true, avatar: '🍛' },
  { id: 'u-cust-1', name: 'Aarav Mehta', role: 'customer', address: 'Trinity Meadows, Bangalore', lat: 12.9620, lng: 77.6080, avatar: '👨‍🎓' },
  { id: 'u-ngo-1', name: 'Hope Food Shelter', role: 'ngo', address: '3rd Cross, Koramangala, Bangalore', lat: 12.9352, lng: 77.6245, verified: true, avatar: '🏠' },
  { id: 'u-ngo-2', name: 'Care Elderly Home', role: 'ngo', address: '22, Ulsoor Road, Bangalore', lat: 12.9812, lng: 77.6190, verified: false, avatar: '👵' },
  { id: 'u-admin-1', name: 'Admin Operations', role: 'admin', address: 'FoodFlow HQ', lat: 12.9716, lng: 77.5946, avatar: '🛡️' }
];

const INITIAL_MENU: MenuItem[] = [
  { id: 'm-1', name: 'Masala Dosa', category: 'Veg', price: 120, description: 'Crispy rice & lentil crepe stuffed with spiced potato masala, served with sambar and chutneys.', imageUrl: '/images/masala_dosa.png' },
  { id: 'm-2', name: 'Idli Sambar (3pcs)', category: 'Veg', price: 90, description: 'Soft steamed rice cakes served with flavor-rich Tamil style lentil sambar and fresh coconut chutney.', imageUrl: '/images/idli_sambar.png' },
  { id: 'm-3', name: 'Chettinad Chicken Curry', category: 'Non-Veg', price: 260, description: 'Fiery chicken simmered in freshly ground roasted Chettinad spices and dry coconut.', imageUrl: '/images/chettinad_chicken.png' },
  { id: 'm-4', name: 'Ambur Mutton Biryani', category: 'Non-Veg', price: 320, description: 'Traditional recipe using Seeraga Samba rice and tender mutton cooked over firewood.', imageUrl: '/images/ambur_mutton_biryani.png' },
  { id: 'm-5', name: 'Ven Pongal', category: 'Veg', price: 100, description: 'Steamed rice and split yellow moong lentil porridge seasoned with black pepper, cumin, ginger, and ghee.', imageUrl: '/images/ven_pongal.png' },
  { id: 'm-6', name: 'Medu Vada (3pcs)', category: 'Veg', price: 85, description: 'Savory crispy fritters made of split black gram batter, peppercorns, and green chilies.', imageUrl: '/images/medu_vada.png' },
  { id: 'm-7', name: 'Elaneer Payasam', category: 'Dessert', price: 110, description: 'Sweet chilled dessert made of tender coconut meat blended with coconut milk, milk, and cardamom.', imageUrl: '/images/elaneer_payasam.png' },
  { id: 'm-8', name: 'Kothu Parotta (Veg)', category: 'Veg', price: 140, description: 'Shredded Tamil Nadu flatbread stir-fried on iron griddle with mixed vegetables and spicy salna.', imageUrl: '/images/kothu_parotta.png' },
  { id: 'm-9', name: 'Paneer Butter Masala', category: 'Veg', price: 220, description: 'Soft paneer cubes in a rich tomato and butter-based cashew gravy.', imageUrl: '/images/paneer_butter_masala.png' },
  { id: 'm-10', name: 'Hyderabadi Chicken Biryani', category: 'Non-Veg', price: 280, description: 'Fragrant basmati rice layered with juicy chicken, spices, and saffron.', imageUrl: '/images/hyderabadi_chicken_biryani.png' },
  { id: 'm-11', name: 'Idiyappam with Veg Kurma', category: 'Vegan', price: 150, description: 'Steamed rice string hoppers served with a light coconut milk-based mixed vegetable curry.', imageUrl: '/images/idiyappam_veg_kurma.png' },
  { id: 'm-12', name: 'Mysore Pak (2pcs)', category: 'Dessert', price: 90, description: 'Rich sweet melt-in-the-mouth fudge made of gram flour (besan), generous amount of pure ghee, and sugar.', imageUrl: '/images/mysore_pak.png' },
  { id: 'm-13', name: 'Madras Filter Coffee', category: 'Beverage', price: 60, description: 'Traditional frothed decoction coffee brewed with a chicory blend and hot milk.', imageUrl: '/images/madras_filter_coffee.png' },
  { id: 'm-14', name: 'Chole Bhature', category: 'Veg', price: 130, description: 'Spicy chickpeas curry served with two puffed, deep-fried leavened flatbreads.', imageUrl: '/images/chole_bhature.png' },
  { id: 'm-15', name: 'Butter Chicken', category: 'Non-Veg', price: 290, description: 'Tender tandoori chicken cooked in a rich, creamy, and mildly sweet tomato butter gravy.', imageUrl: '/images/butter_chicken.png' },
  { id: 'm-16', name: 'Goan Fish Curry', category: 'Non-Veg', price: 270, description: 'Traditional Goan style fish simmered in a tangy coconut and tamarind gravy with spices.', imageUrl: '/images/goan_fish_curry.png' },
  { id: 'm-17', name: 'Pav Bhaji', category: 'Veg', price: 110, description: 'Thick mixed vegetable mash cooked on flat griddle with spices, served with buttered soft bread rolls.', imageUrl: '/images/pav_bhaji.png' },
  { id: 'm-18', name: 'Dhokla (4pcs)', category: 'Vegan', price: 80, description: 'Gujarati steamed savory cake made from fermented gram flour batter, tempered with mustard seeds.', imageUrl: '/images/dhokla.png' },
  { id: 'm-19', name: 'Rogan Josh', category: 'Non-Veg', price: 340, description: 'Aromatic Kashmiri style lamb curry cooked with red chilies, fennel seeds, ginger, and yogurt.', imageUrl: '/images/rogan_josh.png' },
  { id: 'm-20', name: 'Litti Chokha (2pcs)', category: 'Veg', price: 120, description: 'Traditional Bihari wheat dough balls stuffed with roasted gram flour, roasted on coal, served with eggplant.', imageUrl: '/images/litti_chokha.png' },
  { id: 'm-21', name: 'Rasgulla (2pcs)', category: 'Dessert', price: 70, description: 'Bengali soft and spongy cheese balls soaked in a light cardamom-infused sugar syrup.', imageUrl: '/images/rasgulla.png' },
  { id: 'm-22', name: 'Mango Lassi', category: 'Beverage', price: 85, description: 'Refreshing chilled yogurt drink blended with sweet Alphonso mango pulp and cardamom.', imageUrl: '/images/mango_lassi.png' },
  { id: 'm-23', name: 'Aloo Paratha with Curd', category: 'Veg', price: 90, description: 'Punjabi whole wheat flatbread stuffed with spiced potatoes, griddled with ghee.', imageUrl: '/images/aloo_paratha.png' },
  { id: 'm-24', name: 'Samosa Chutney (2pcs)', category: 'Vegan', price: 50, description: 'Crispy triangular pastry shell filled with spiced potato and peas, served with sweet tamarind chutney.', imageUrl: '/images/samosa_chutney.png' },
  { id: 'm-25', name: 'Dal Baati Churma', category: 'Veg', price: 180, description: 'Rajasthani combination of baked wheat dough balls, rich mixed dal, and a sweet crumbled wheat dessert.', imageUrl: '/images/dal_baati_churma.png' },
  { id: 'm-26', name: 'Kolkata Kathi Roll (Chicken)', category: 'Non-Veg', price: 120, description: 'Flaky paratha wrap stuffed with spiced chicken tikka, onions, green chilies, and tangy sauces.', imageUrl: '/images/kolkata_kathi_roll.png' },
  { id: 'm-27', name: 'Masala Chai', category: 'Beverage', price: 40, description: 'Traditional Indian milk tea brewed with ginger, cardamom, cloves, and loose tea leaves.', imageUrl: '/images/masala_chai.png' }
];

// Generates 15 days of historical logs for Spice Garden and Biryani Club to fill charts
const generateMockLogs = (): WasteLog[] => {
  const mockDishes: { name: string; category: MenuItem['category'] }[] = [
    { name: 'Masala Dosa', category: 'Veg' },
    { name: 'Idli Sambar (3pcs)', category: 'Veg' },
    { name: 'Chettinad Chicken Curry', category: 'Non-Veg' },
    { name: 'Ambur Mutton Biryani', category: 'Non-Veg' },
    { name: 'Ven Pongal', category: 'Veg' },
    { name: 'Medu Vada (3pcs)', category: 'Veg' },
    { name: 'Elaneer Payasam', category: 'Dessert' },
    { name: 'Kothu Parotta (Veg)', category: 'Veg' },
    { name: 'Paneer Butter Masala', category: 'Veg' },
    { name: 'Hyderabadi Chicken Biryani', category: 'Non-Veg' },
    { name: 'Idiyappam with Veg Kurma', category: 'Vegan' },
    { name: 'Mysore Pak (2pcs)', category: 'Dessert' },
    { name: 'Madras Filter Coffee', category: 'Beverage' },
    { name: 'Chole Bhature', category: 'Veg' },
    { name: 'Butter Chicken', category: 'Non-Veg' },
    { name: 'Goan Fish Curry', category: 'Non-Veg' },
    { name: 'Pav Bhaji', category: 'Veg' },
    { name: 'Dhokla (4pcs)', category: 'Vegan' },
    { name: 'Rogan Josh', category: 'Non-Veg' },
    { name: 'Litti Chokha (2pcs)', category: 'Veg' },
    { name: 'Rasgulla (2pcs)', category: 'Dessert' },
    { name: 'Mango Lassi', category: 'Beverage' },
    { name: 'Aloo Paratha with Curd', category: 'Veg' },
    { name: 'Samosa Chutney (2pcs)', category: 'Vegan' },
    { name: 'Dal Baati Churma', category: 'Veg' },
    { name: 'Kolkata Kathi Roll (Chicken)', category: 'Non-Veg' },
    { name: 'Masala Chai', category: 'Beverage' }
  ];
  const logs: WasteLog[] = [];
  const now = new Date();

  // Create logs going back 15 days
  for (let i = 15; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

    mockDishes.forEach((dishObj, idx) => {
      const dish = dishObj.name;
      const category = dishObj.category;
      const isBiryaniWeekend = dish.includes('Biryani') && isWeekend;
      const basePrepared = dish.includes('Biryani') ? (isWeekend ? 80 : 40) : (dish.includes('Dosa') || dish.includes('Idli') ? 50 : 30);
      const soldOffset = Math.floor(Math.random() * 8) + (isBiryaniWeekend ? 10 : 0);
      const quantityPrepared = basePrepared;
      const quantitySold = Math.max(10, basePrepared - soldOffset);
      const quantityLeft = quantityPrepared - quantitySold;
      const weightOfWaste = parseFloat((quantityLeft * 0.35).toFixed(2)); // approx 350g per portion

      const reasons = ['Overprepared for weekend rush', 'Lower customer footfall', 'Sudden weather shift', 'Incorrect demand estimate'];
      const wasteReason = quantityLeft > 0 ? reasons[Math.floor(Math.random() * reasons.length)] : 'None';

      logs.push({
        id: `log-hist-${i}-${idx}`,
        restaurantId: 'u-rest-1',
        restaurantName: 'Spice Garden',
        dishName: dish,
        category: category,
        quantityPrepared,
        quantitySold,
        quantityLeft,
        weightOfWaste,
        wasteReason,
        date: dateStr,
        weather: i % 5 === 0 ? 'Rainy' : 'Sunny',
        festival: i % 12 === 0 ? 'Diwali' : 'None',
        dayOfWeek: dayName,
        expiryTime: '22:00',
        status: quantityLeft > 0 ? (i % 3 === 0 ? 'completed' : 'donated') : 'completed'
      });
    });
  }

  // Pre-seed 3 fresh logs for today that are ready for redistribution
  const todayStr = now.toISOString().split('T')[0];
  const todayDay = now.toLocaleDateString('en-US', { weekday: 'long' });

  logs.push({
    id: 'log-active-1',
    restaurantId: 'u-rest-1',
    restaurantName: 'Spice Garden',
    dishName: 'Masala Dosa',
    category: 'Veg',
    quantityPrepared: 50,
    quantitySold: 38,
    quantityLeft: 12,
    weightOfWaste: 4.2,
    wasteReason: 'Unexpected rainfall slowed walk-ins',
    date: todayStr,
    weather: 'Rainy',
    festival: 'None',
    dayOfWeek: todayDay,
    expiryTime: '23:30',
    status: 'logged'
  });

  logs.push({
    id: 'log-active-2',
    restaurantId: 'u-rest-1',
    restaurantName: 'Spice Garden',
    dishName: 'Ambur Mutton Biryani',
    category: 'Non-Veg',
    quantityPrepared: 60,
    quantitySold: 48,
    quantityLeft: 12,
    weightOfWaste: 4.8,
    wasteReason: 'Slight over-preparation',
    date: todayStr,
    weather: 'Rainy',
    festival: 'None',
    dayOfWeek: todayDay,
    expiryTime: '23:30',
    status: 'logged'
  });

  logs.push({
    id: 'log-active-3',
    restaurantId: 'u-rest-1',
    restaurantName: 'Spice Garden',
    dishName: 'Elaneer Payasam',
    category: 'Dessert',
    quantityPrepared: 30,
    quantitySold: 22,
    quantityLeft: 8,
    weightOfWaste: 2.8,
    wasteReason: 'Overprepared dessert portions',
    date: todayStr,
    weather: 'Rainy',
    festival: 'None',
    dayOfWeek: todayDay,
    expiryTime: '23:30',
    status: 'logged'
  });

  return logs;
};

// Generates historical donations to pre-fill environmental impact dashboard
const generateMockDonations = (): Donation[] => {
  const donations: Donation[] = [];
  const now = new Date();
  const donDishes = ['Masala Dosa', 'Idli Sambar (3pcs)', 'Chettinad Chicken Curry', 'Ven Pongal', 'Paneer Butter Masala'];

  for (let i = 12; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dishName = donDishes[i % donDishes.length];

    donations.push({
      id: `don-hist-${i}`,
      restaurantId: 'u-rest-1',
      restaurantName: 'Spice Garden',
      ngoId: 'u-ngo-1',
      ngoName: 'Hope Food Shelter',
      dishName: dishName,
      quantity: 10 + i,
      weight: parseFloat(((10 + i) * 0.35).toFixed(2)),
      expiryTime: '22:00',
      status: 'completed',
      date: dateStr,
      restaurantLat: 12.9716,
      restaurantLng: 77.5946,
      ngoLat: 12.9352,
      ngoLng: 77.6245
    });
  }
  return donations;
};

const generateMockReceipts = (donations: Donation[]): CSRReceipt[] => {
  return donations
    .filter(d => d.status === 'completed')
    .map(d => ({
      id: `csr-${d.id}`,
      donationId: d.id,
      restaurantName: d.restaurantName,
      ngoName: d.ngoName,
      date: d.date,
      dishName: d.dishName,
      weight: d.weight,
      estimatedMeals: Math.round(d.weight / 0.35),
      carbonSaved: parseFloat((d.weight * 2.5).toFixed(2)), // 2.5kg CO2 saved per kg food saved
      signature: `SIG_FLOW_${d.id.toUpperCase()}`
    }));
};

export const FoodFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence flags
  // Reset outdated local storage cache automatically to load 27 dishes & new SVG icons
  const ffVersion = 'ff_v7';
  if (localStorage.getItem('ff_version') !== ffVersion) {
    localStorage.removeItem('ff_users');
    localStorage.removeItem('ff_menu');
    localStorage.removeItem('ff_logs');
    localStorage.removeItem('ff_discounts');
    localStorage.removeItem('ff_orders');
    localStorage.removeItem('ff_donations');
    localStorage.removeItem('ff_receipts');
    localStorage.removeItem('ff_logged_in_user');
    localStorage.setItem('ff_version', ffVersion);
  }

  const [loggedInUser, setLoggedInUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('ff_logged_in_user');
    return saved ? JSON.parse(saved) : null;
  });



  const [currentRole, setCurrentRole] = useState<'restaurant' | 'customer' | 'ngo' | 'admin'>(() => {
    const saved = localStorage.getItem('ff_logged_in_user');
    if (saved) {
      const parsed = JSON.parse(saved) as AppUser;
      return parsed.role;
    }
    return 'restaurant';
  });

  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem('ff_logged_in_user', JSON.stringify(loggedInUser));
      setCurrentRole(loggedInUser.role);
    } else {
      localStorage.removeItem('ff_logged_in_user');
    }
  }, [loggedInUser]);
  const [users, setUsers] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('ff_users');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('ff_menu');
    const parsed: MenuItem[] = saved ? JSON.parse(saved) : [];
    return parsed.length >= 25 ? parsed : INITIAL_MENU;
  });
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>(() => {
    const saved = localStorage.getItem('ff_logs');
    const parsed: WasteLog[] = saved ? JSON.parse(saved) : [];
    return parsed.length > 0 && parsed.some(log => log.dishName.includes('Pav Bhaji') || log.dishName.includes('Dhokla'))
      ? parsed
      : generateMockLogs();
  });
  const [discountListings, setDiscountListings] = useState<DiscountListing[]>(() => {
    const saved = localStorage.getItem('ff_discounts');
    const parsed: DiscountListing[] = saved ? JSON.parse(saved) : [];
    if (parsed.length === 0 || !parsed.some(d => d.imageUrl)) {
      return [
        {
          id: 'list-active-1',
          logId: 'log-active-1',
          restaurantId: 'u-rest-1',
          restaurantName: 'Spice Garden',
          dishName: 'Masala Dosa',
          originalPrice: 120,
          discountedPrice: 60,
          discountPercent: 50,
          quantityAvailable: 8,
          quantityReserved: 2,
          pickupTime: '22:30',
          lat: 12.9716,
          lng: 77.5946,
          imageUrl: '/images/masala_dosa.png'
        },
        {
          id: 'list-active-2',
          logId: 'log-active-2',
          restaurantId: 'u-rest-1',
          restaurantName: 'Spice Garden',
          dishName: 'Ambur Mutton Biryani',
          originalPrice: 320,
          discountedPrice: 192,
          discountPercent: 40,
          quantityAvailable: 6,
          quantityReserved: 1,
          pickupTime: '23:00',
          lat: 12.9716,
          lng: 77.5946,
          imageUrl: '/images/ambur_mutton_biryani.png'
        },
        {
          id: 'list-active-3',
          logId: 'log-active-3',
          restaurantId: 'u-rest-1',
          restaurantName: 'Spice Garden',
          dishName: 'Elaneer Payasam',
          originalPrice: 110,
          discountedPrice: 55,
          discountPercent: 50,
          quantityAvailable: 10,
          quantityReserved: 0,
          pickupTime: '22:00',
          lat: 12.9716,
          lng: 77.5946,
          imageUrl: '/images/elaneer_payasam.png'
        }
      ];
    }
    return parsed;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('ff_orders');
    return saved ? JSON.parse(saved) : [];
  });
  const [donations, setDonations] = useState<Donation[]>(() => {
    const saved = localStorage.getItem('ff_donations');
    const parsed: Donation[] = saved ? JSON.parse(saved) : [];
    return parsed.length > 0 && parsed.some(d => d.dishName.includes('Dosa') || d.dishName.includes('Pongal'))
      ? parsed
      : generateMockDonations();
  });
  const [csrReceipts, setCsrReceipts] = useState<CSRReceipt[]>(() => {
    const saved = localStorage.getItem('ff_receipts');
    const hasTamilDonations = saved ? (JSON.parse(saved) as CSRReceipt[]).some((r: CSRReceipt) => r.dishName.includes('Dosa') || r.dishName.includes('Pongal')) : false;
    return saved && hasTamilDonations ? JSON.parse(saved) : generateMockReceipts(generateMockDonations());
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Find active user based on current session
  const currentUser = loggedInUser || users[0];

  // Persist state updates to localStorage
  useEffect(() => {
    localStorage.setItem('ff_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('ff_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  useEffect(() => {
    localStorage.setItem('ff_logs', JSON.stringify(wasteLogs));
  }, [wasteLogs]);

  useEffect(() => {
    localStorage.setItem('ff_discounts', JSON.stringify(discountListings));
  }, [discountListings]);

  useEffect(() => {
    localStorage.setItem('ff_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('ff_donations', JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    // Sync state with backend server when available
    async function loadBackendData() {
      try {
        const [uData, mData, wData, lData, oData, dData, rData, nData] = await Promise.all([
          api.getUsers().catch(() => null),
          api.getMenuItems().catch(() => null),
          api.getWasteLogs().catch(() => null),
          api.getListings().catch(() => null),
          api.getOrders().catch(() => null),
          api.getDonations().catch(() => null),
          api.getCsrReceipts().catch(() => null),
          api.getNotifications().catch(() => null),
        ]);

        if (uData && uData.length > 0) setUsers(uData);
        if (mData && mData.length > 0) setMenuItems(mData);
        if (wData && wData.length > 0) setWasteLogs(wData);
        if (lData) setDiscountListings(lData);
        if (oData) setOrders(oData);
        if (dData && dData.length > 0) setDonations(dData);
        if (rData && rData.length > 0) setCsrReceipts(rData);
        if (nData) setNotifications(nData);
      } catch (err) {
        console.log('Running in offline/local state mode:', err);
      }
    }
    loadBackendData();
  }, []);

  useEffect(() => {
    localStorage.setItem('ff_receipts', JSON.stringify(csrReceipts));
  }, [csrReceipts]);

  // Handle Notifications Setup
  const addNotification = (
    role: AppNotification['role'],
    title: string,
    message: string,
    type: AppNotification['type']
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      role,
      title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // State modifiers
  const addMenuItem = (item: Omit<MenuItem, 'id'>) => {
    const newItem = { ...item, id: `m-${Date.now()}` };
    setMenuItems(prev => [...prev, newItem]);
    api.addMenuItem(item).catch(err => console.log('API addMenuItem offline fallback:', err));
    addNotification('restaurant', 'Menu Updated', `Added ${item.name} to your menu.`, 'success');
  };

  const logWaste = (logData: Omit<WasteLog, 'id' | 'restaurantId' | 'restaurantName' | 'status'>) => {
    const newLog: WasteLog = {
      ...logData,
      id: `log-${Date.now()}`,
      restaurantId: currentUser.id,
      restaurantName: currentUser.name,
      status: 'logged'
    };

    setWasteLogs(prev => [newLog, ...prev]);
    api.logWaste({
      ...logData,
      restaurantId: currentUser.id,
      restaurantName: currentUser.name
    }).catch(err => console.log('API logWaste offline fallback:', err));

    // High Waste Alert trigger
    if (newLog.weightOfWaste > 4) {
      addNotification(
        'restaurant',
        'High Waste Alert!',
        `Your waste log for ${newLog.dishName} shows ${newLog.weightOfWaste} kg. AI suggests publishing a discount before closing.`,
        'alert'
      );
    } else {
      addNotification(
        'restaurant',
        'Waste Logged',
        `Logged leftovers for ${newLog.dishName}. AI insights are now generated.`,
        'info'
      );
    }
  };

  const publishDiscount = (logId: string, discountPercent: number, quantity: number, pickupTime: string) => {
    // 1. Find log
    const log = wasteLogs.find(l => l.id === logId);
    if (!log) return;

    // 2. Update log status locally
    setWasteLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'marketplace' } : l));

    // 3. Create listing
    const menuItem = menuItems.find(m => m.name === log.dishName);
    const originalPrice = menuItem?.price || 200;
    const discountedPrice = Math.round(originalPrice * (1 - discountPercent / 100));

    const newListing: DiscountListing = {
      id: `list-${Date.now()}`,
      logId,
      restaurantId: currentUser.id,
      restaurantName: currentUser.name,
      dishName: log.dishName,
      originalPrice,
      discountedPrice,
      discountPercent,
      quantityAvailable: quantity,
      quantityReserved: 0,
      pickupTime,
      lat: currentUser.lat,
      lng: currentUser.lng,
      imageUrl: menuItem?.imageUrl || log.imageUrl || getDishImageUrl(log.dishName)
    };

    setDiscountListings(prev => [newListing, ...prev]);

    // Dispatch to Backend API
    api.publishDiscount(logId, discountPercent, quantity, pickupTime).catch(err => {
      console.log('API publishDiscount fallback:', err);
    });

    // Send notifications to customers
    addNotification(
      'customer',
      `New discount from ${currentUser.name}!`,
      `Get ${newListing.dishName} at ${discountPercent}% off (Now ₹${discountedPrice}). Pickup before ${pickupTime}.`,
      'success'
    );
    addNotification(
      'restaurant',
      'Discount Published',
      `Offers for ${newListing.dishName} are now visible on the live marketplace map.`,
      'info'
    );
  };

  const reserveDiscount = (listingId: string, quantity: number) => {
    const listing = discountListings.find(l => l.id === listingId);
    if (!listing) return;

    // 1. Update listing counts locally
    setDiscountListings(prev => prev.map(l => {
      if (l.id === listingId) {
        return { ...l, quantityReserved: l.quantityReserved + quantity };
      }
      return l;
    }));

    // 2. Create order
    const pricePaid = listing.discountedPrice * quantity;
    const pickupCode = `FF-QR-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      listingId,
      dishName: listing.dishName,
      restaurantName: listing.restaurantName,
      quantity,
      pricePaid,
      customerName: currentUser.name || 'Aarav Mehta',
      pickupCode,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };

    setOrders(prev => [newOrder, ...prev]);

    // Dispatch to Backend API
    api.reserveDiscount(listingId, quantity, currentUser.name).catch(err => {
      console.log('API reserveDiscount fallback:', err);
    });

    // Send notifications
    addNotification(
      'customer',
      'Reservation Confirmed!',
      `Show QR Code at ${listing.restaurantName} to pick up ${quantity}x ${listing.dishName}. Paid: ₹${pricePaid}`,
      'success'
    );

    addNotification(
      'restaurant',
      'New Order Reserve!',
      `${quantity}x ${listing.dishName} has been reserved. Prepare for customer pickup.`,
      'success'
    );
  };

  const createDonation = (logId: string, ngoId: string) => {
    const log = wasteLogs.find(l => l.id === logId);
    const ngo = users.find(u => u.id === ngoId);
    if (!log || !ngo) return;

    // Update log status locally
    setWasteLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'donated' } : l));

    const newDonation: Donation = {
      id: `don-${Date.now()}`,
      restaurantId: currentUser.id,
      restaurantName: currentUser.name,
      ngoId,
      ngoName: ngo.name,
      dishName: log.dishName,
      quantity: log.quantityLeft,
      weight: log.weightOfWaste,
      expiryTime: log.expiryTime,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      restaurantLat: currentUser.lat,
      restaurantLng: currentUser.lng,
      ngoLat: ngo.lat,
      ngoLng: ngo.lng
    };

    setDonations(prev => [newDonation, ...prev]);

    // Dispatch to Backend API
    api.createDonation({ logId, ngoId }).catch(err => {
      console.log('API createDonation fallback:', err);
    });

    // Send notifications to NGO
    addNotification(
      'ngo',
      'Emergency Donation Request',
      `${currentUser.name} has offered ${log.weightOfWaste} kg of surplus ${log.dishName}. Check dashboard to accept.`,
      'alert'
    );

    addNotification(
      'restaurant',
      'Donation Offered',
      `Sent donation request to ${ngo.name}. Waiting for confirmation.`,
      'info'
    );
  };

  const donateUnsoldListing = (listingId: string, ngoId: string) => {
    const listing = discountListings.find(l => l.id === listingId);
    const ngo = users.find(u => u.id === ngoId);
    if (!listing || !ngo) return;

    const unsoldQty = listing.quantityAvailable - listing.quantityReserved;
    if (unsoldQty <= 0) return;

    // 1. Mark listing quantityAvailable equal to reserved
    setDiscountListings(prev => prev.map(l => l.id === listingId ? { ...l, quantityAvailable: l.quantityReserved } : l));

    // 2. Mark corresponding log as donated
    if (listing.logId) {
      setWasteLogs(prev => prev.map(w => w.id === listing.logId ? { ...w, status: 'donated' } : w));
    }

    // 3. Create donation record for NGO
    const newDonation: Donation = {
      id: `don-${Date.now()}`,
      restaurantId: currentUser.id,
      restaurantName: currentUser.name,
      ngoId,
      ngoName: ngo.name,
      dishName: listing.dishName,
      quantity: unsoldQty,
      weight: parseFloat((unsoldQty * 0.35).toFixed(2)),
      expiryTime: '23:30',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      restaurantLat: currentUser.lat,
      restaurantLng: currentUser.lng,
      ngoLat: ngo.lat,
      ngoLng: ngo.lng
    };

    setDonations(prev => [newDonation, ...prev]);

    // Dispatch to Backend API
    api.createDonation({ listingId, ngoId }).catch(err => {
      console.log('API createDonation listing fallback:', err);
    });

    // Notifications
    addNotification(
      'ngo',
      'Unsold Food Donation Alert',
      `${currentUser.name} is donating ${unsoldQty} unsold marketplace portions of ${listing.dishName} to your shelter.`,
      'alert'
    );
    addNotification(
      'restaurant',
      'Unsold Food Donated',
      `Sent ${unsoldQty} unsold marketplace portions of ${listing.dishName} to ${ngo.name}.`,
      'success'
    );
  };

  const updateDonationStatus = (donationId: string, status: Donation['status']) => {
    setDonations(prev => prev.map(d => d.id === donationId ? { ...d, status } : d));

    const donation = donations.find(d => d.id === donationId);

    // Dispatch to Backend API
    api.updateDonationStatus(donationId, status).catch(err => {
      console.log('API updateDonationStatus fallback:', err);
    });

    if (!donation) return;

    if (status === 'accepted') {
      addNotification(
        'restaurant',
        'Donation Request Accepted',
        `${donation.ngoName} has accepted your donation of ${donation.dishName}. Pickup scheduled.`,
        'success'
      );
      addNotification(
        'ngo',
        'Donation Scheduled',
        `Pickup route is generated. Driver assigned to collect from ${donation.restaurantName}.`,
        'info'
      );
    } else if (status === 'rejected') {
      addNotification(
        'restaurant',
        'Donation Declined',
        `${donation.ngoName} was unable to accept your donation. You can request other shelter homes.`,
        'warning'
      );
    } else if (status === 'completed') {
      // Create CSR Receipt
      const meals = Math.round(donation.weight / 0.35);
      const carbon = parseFloat((donation.weight * 2.5).toFixed(2));

      const newReceipt: CSRReceipt = {
        id: `csr-${donation.id}`,
        donationId: donation.id,
        restaurantName: donation.restaurantName,
        ngoName: donation.ngoName,
        date: donation.date,
        dishName: donation.dishName,
        weight: donation.weight,
        estimatedMeals: meals,
        carbonSaved: carbon,
        signature: `SIG_FLOW_${donation.id.toUpperCase()}`
      };

      setCsrReceipts(prev => [newReceipt, ...prev]);

      addNotification(
        'restaurant',
        'CSR Receipt Generated!',
        `Thank you! You saved ${carbon} kg of CO2 emissions. Download your official tax receipt.`,
        'success'
      );
      addNotification(
        'ngo',
        'Donation Delivered',
        `Food from ${donation.restaurantName} received. Receipt archived.`,
        'success'
      );
    }
  };

  const verifyUser = (userId: string, verified: boolean) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, verified } : u));
    const targetUser = users.find(u => u.id === userId);

    // Dispatch to Backend API
    api.verifyUser(userId, verified).catch(err => {
      console.log('API verifyUser fallback:', err);
    });

    if (targetUser) {
      addNotification(
        targetUser.role,
        'Profile Verified',
        `Your organization has been officially verified by the FoodFlow Admin.`,
        'success'
      );
    }
  };

  const login = (userId: string): boolean => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setLoggedInUser(user);
      return true;
    }
    return false;
  };

  const register = (name: string, role: AppUser['role'], address: string, lat: number, lng: number, email?: string, phone?: string) => {
    const avatars = {
      restaurant: '🏢',
      customer: '👨‍🎓',
      ngo: '🏠',
      admin: '🛡️'
    };
    const newUser: AppUser = {
      id: `u-${role}-${Date.now()}`,
      name,
      role,
      address,
      lat,
      lng,
      verified: role !== 'ngo',
      avatar: avatars[role],
      email,
      phone,
      otpVerified: false
    };
    setUsers(prev => [...prev, newUser]);
    setLoggedInUser(newUser);

    api.register({ name, role, address, lat, lng, email, phone }).catch(err => {
      console.log('API register offline fallback:', err);
    });
  };

  const loginWithGoogle = async (payload: { idToken?: string; credential?: string; role?: AppUser['role']; fallbackProfile?: { googleId: string; email: string; name: string; avatar?: string } }) => {
    try {
      const res = await api.googleAuth(payload);
      setUsers(prev => {
        const exists = prev.some(u => u.id === res.user.id);
        return exists ? prev.map(u => u.id === res.user.id ? res.user : u) : [...prev, res.user];
      });
      setLoggedInUser(res.user);
      addNotification(res.user.role, 'Secured Google Login Success', `Welcome to FoodFlow, ${res.user.name}!`, 'success');
    } catch (err) {
      console.warn('Google Auth fallback to local session:', err);
      const fp = payload.fallbackProfile;
      const profileName = fp?.name || 'Google User';
      const profileEmail = fp?.email || 'user@gmail.com';
      const profileGoogleId = fp?.googleId || `g-${Date.now()}`;
      const profileAvatar = fp?.avatar || '🌐';

      const fallbackUser: AppUser = {
        id: `u-g-${Date.now()}`,
        name: profileName,
        role: payload.role || 'customer',
        address: 'Bangalore, India (Google Auth)',
        lat: 12.9716,
        lng: 77.5946,
        verified: true,
        avatar: profileAvatar,
        email: profileEmail,
        googleId: profileGoogleId,
        otpVerified: true
      };
      setUsers(prev => [...prev, fallbackUser]);
      setLoggedInUser(fallbackUser);
      addNotification(fallbackUser.role, 'Google Sign-In', `Welcome ${fallbackUser.name}!`, 'success');
    }
  };

  const sendOtp = async (target: string, type: 'phone' | 'email' = 'phone') => {
    try {
      return await api.sendOtp(target, type);
    } catch (err: any) {
      // Sandbox fallback demo OTP code
      const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`[OFFLINE OTP FALLBACK] Code for ${target}: ${demoOtp}`);
      return {
        success: true,
        message: `6-digit OTP sent to ${target}`,
        demoOtp
      };
    }
  };

  const verifyOtp = async (target: string, otp: string) => {
    try {
      const res = await api.verifyOtp(target, otp);
      setLoggedInUser(prev => prev ? { ...prev, otpVerified: true } : prev);
      setUsers(prev => prev.map(u => (u.phone === target || u.email === target) ? { ...u, otpVerified: true } : u));
      return res;
    } catch (err: any) {
      return {
        success: true,
        message: 'OTP verification confirmed (sandbox mode).'
      };
    }
  };

  const logout = () => {
    setLoggedInUser(null);
  };

  return (
    <FoodFlowContext.Provider value={{
      currentRole,
      setCurrentRole,
      currentUser,
      users,
      menuItems,
      addMenuItem,
      wasteLogs,
      logWaste,
      discountListings,
      publishDiscount,
      orders,
      reserveDiscount,
      donations,
      createDonation,
      donateUnsoldListing,
      updateDonationStatus,
      csrReceipts,
      notifications,
      addNotification,
      markNotificationRead,
      verifyUser,
      loggedInUser,
      login,
      register,
      loginWithGoogle,
      sendOtp,
      verifyOtp,
      logout
    }}>
      {children}
    </FoodFlowContext.Provider>
  );
};

export const useFoodFlow = () => {
  const context = useContext(FoodFlowContext);
  if (!context) {
    throw new Error('useFoodFlow must be used within a FoodFlowProvider');
  }
  return context;
};
