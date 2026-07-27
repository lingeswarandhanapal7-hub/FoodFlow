import type { 
  AppUser, 
  MenuItem, 
  WasteLog, 
  DiscountListing, 
  Order, 
  Donation, 
  CSRReceipt, 
  AppNotification 
} from '../context/FoodFlowContext';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('ff_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('ff_token', token);
  } else {
    localStorage.removeItem('ff_token');
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API Request Error [${res.status}]: ${errText}`);
    }

    return res.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Network request timed out. Please try again.');
    }
    throw err;
  }
}

export const api = {
  // Users / Auth
  getUsers: () => fetchJson<AppUser[]>('/users'),
  login: async (userId: string) => {
    const res = await fetchJson<{ user: AppUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    setStoredToken(res.token);
    return res.user;
  },
  register: async (user: { name: string; role: AppUser['role']; address: string; lat: number; lng: number; email?: string; phone?: string }) => {
    const res = await fetchJson<{ user: AppUser; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    setStoredToken(res.token);
    return res.user;
  },
  googleAuth: async (payload: { idToken?: string; credential?: string; role?: AppUser['role']; fallbackProfile?: { googleId: string; email: string; name: string; avatar?: string } }) => {
    const res = await fetchJson<{ user: AppUser; token: string; isNewUser: boolean }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.token);
    return { user: res.user, isNewUser: res.isNewUser };
  },
  sendOtp: (target: string, type: 'phone' | 'email' = 'phone') => fetchJson<{ success: boolean; provider?: string; message: string; expiresInSeconds: number; demoOtp?: string }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ target, type }),
  }),
  verifyOtp: (target: string, otp: string) => fetchJson<{ success: boolean; message: string; target: string }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ target, otp }),
  }),
  verifyUser: (userId: string, verified: boolean) => fetchJson<AppUser>(`/users/${userId}/verify`, {
    method: 'PUT',
    body: JSON.stringify({ verified }),
  }),

  // Menu Items
  getMenuItems: () => fetchJson<MenuItem[]>('/menu'),
  addMenuItem: (item: Omit<MenuItem, 'id'>) => fetchJson<MenuItem>('/menu', {
    method: 'POST',
    body: JSON.stringify(item),
  }),
  deleteMenuItem: (id: string) => fetchJson<{ success: boolean; id: string }>(`/menu/${id}`, {
    method: 'DELETE',
  }),

  // Waste Logs
  getWasteLogs: () => fetchJson<WasteLog[]>('/waste-logs'),
  logWaste: (log: Omit<WasteLog, 'id' | 'restaurantId' | 'restaurantName' | 'status'> & { restaurantId?: string; restaurantName?: string }) => fetchJson<WasteLog>('/waste-logs', {
    method: 'POST',
    body: JSON.stringify(log),
  }),

  // Discount Listings (Marketplace)
  getListings: () => fetchJson<DiscountListing[]>('/listings'),
  publishDiscount: (logId: string, discountPercent: number, quantity: number, pickupTime: string) => fetchJson<DiscountListing>('/listings', {
    method: 'POST',
    body: JSON.stringify({ logId, discountPercent, quantity, pickupTime }),
  }),

  // Orders
  getOrders: () => fetchJson<Order[]>('/orders'),
  reserveDiscount: (listingId: string, quantity: number, customerName?: string) => fetchJson<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify({ listingId, quantity, customerName }),
  }),
  completeOrder: (id: string) => fetchJson<Order>(`/orders/${id}/complete`, {
    method: 'PUT',
  }),

  // Donations
  getDonations: () => fetchJson<Donation[]>('/donations'),
  createDonation: (params: { logId?: string; listingId?: string; ngoId?: string }) => fetchJson<Donation>('/donations', {
    method: 'POST',
    body: JSON.stringify(params),
  }),
  updateDonationStatus: (donationId: string, status: Donation['status']) => fetchJson<Donation>(`/donations/${donationId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),

  // CSR Receipts
  getCsrReceipts: () => fetchJson<CSRReceipt[]>('/csr-receipts'),

  // Notifications
  getNotifications: (role?: string) => fetchJson<AppNotification[]>(`/notifications${role ? `?role=${role}` : ''}`),
  addNotification: (notification: { role: AppNotification['role']; title: string; message: string; type: AppNotification['type'] }) => fetchJson<AppNotification>('/notifications', {
    method: 'POST',
    body: JSON.stringify(notification),
  }),
  markNotificationRead: (id: string) => fetchJson<{ success: boolean; id: string }>(`/notifications/${id}/read`, {
    method: 'PUT',
  }),

  // AI Insights
  getAiInsights: () => fetchJson<{ analysis: string; isAiGenerated: boolean }>('/ai/insights', {
    method: 'POST',
  }),
};
