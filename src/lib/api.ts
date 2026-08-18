/**
 * MARUTHAM KART — Centralized REST API Client
 * Connects the React/TSX frontend to the Python FastAPI backend.
 */

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const isNative = (window as any)?.Capacitor?.isNativePlatform?.();
    if (isNative) {
      return (import.meta.env.VITE_ANDROID_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://10.0.2.2:8000/api/v1').replace(/\/$/, '');
    }
    if (import.meta.env.VITE_API_BASE_URL) {
      return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
    }
    // Web in production without hardcoded localhost
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `${window.location.origin}/api/v1`;
    }
  }
  return (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
}

export const API_BASE_URL = getApiBaseUrl();

export interface ApiErrorResponse {
  detail?: string | Array<{ msg: string; loc: string[] }>;
  message?: string;
  error?: string;
}

export class ApiError extends Error {
  status: number;
  data: ApiErrorResponse;

  constructor(status: number, data: ApiErrorResponse) {
    let msg = 'An unexpected error occurred';
    if (typeof data.detail === 'string') {
      msg = data.detail;
    } else if (Array.isArray(data.detail) && data.detail.length > 0) {
      msg = data.detail.map(d => d.msg).join(', ');
    } else if (data.message) {
      msg = data.message;
    } else if (data.error) {
      msg = data.error;
    }
    super(msg);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Token storage helpers
const TOKEN_KEY = 'mk_access_token';
const REFRESH_KEY = 'mk_refresh_token';
const USER_KEY = 'mk_user_profile';

export const tokenStorage = {
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  getRefreshToken: (): string | null => {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  setRefreshToken: (token: string): void => {
    try {
      localStorage.setItem(REFRESH_KEY, token);
    } catch {}
  },
  getUser: <T = any>(): T | null => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: any): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
  },
  clear: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  },
};

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  requiresAuth?: boolean;
  cacheTtlMs?: number; // Optional memory cache TTL in ms
  forceRefresh?: boolean;
}

const inFlightRequests = new Map<string, Promise<any>>();
const memoryCache = new Map<string, { data: any; expiry: number }>();

export function clearApiCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, requiresAuth = true, headers: customHeaders, cacheTtlMs, forceRefresh, ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();

  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // If mutation, invalidate related caches
  if (method !== 'GET') {
    if (endpoint.includes('/cart')) clearApiCache('/cart');
    if (endpoint.includes('/customer')) clearApiCache('/customer');
    if (endpoint.includes('/products')) clearApiCache('/products');
  }

  // Memory Cache Check for GET requests
  const cacheKey = `${method}:${url}:${tokenStorage.getToken() || 'guest'}`;
  const now = Date.now();
  if (method === 'GET' && !forceRefresh) {
    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiry > now) {
      return cached.data as T;
    }
  }

  // In-flight deduplication for concurrent GET requests
  if (method === 'GET' && inFlightRequests.has(cacheKey) && !forceRefresh) {
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  const execRequest = async (): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(customHeaders as Record<string, string>),
    };

    if (requiresAuth) {
      const token = tokenStorage.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        let errorData: ApiErrorResponse = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: response.statusText };
        }

        if (response.status === 401 && requiresAuth) {
          tokenStorage.clear();
        }

        throw new ApiError(response.status, errorData);
      }

      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();

      // Cache safe GET responses (default 15 seconds for product/category/customer)
      if (method === 'GET') {
        const ttl = cacheTtlMs ?? (endpoint.includes('/products') || endpoint.includes('/categories') ? 30000 : 15000);
        memoryCache.set(cacheKey, { data, expiry: now + ttl });
      }

      return data as T;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  };

  if (method === 'GET') {
    const promise = execRequest();
    inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  return execRequest();
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

// ══════════════════════════════════════════════════════════════════════════════
// DOMAIN-SPECIFIC TYPED API MODULES
// ══════════════════════════════════════════════════════════════════════════════

export interface CustomerAddress {
  id: string;
  customer_id: string;
  recipient_name: string;
  phone: string;
  address_label: string;
  door_no?: string;
  street_address: string;
  area: string;
  city: string;
  state: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerProfile {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  customer_code: string;
  status: string;
  created_at: string;
  default_address?: CustomerAddress;
  addresses_count: number;
}

// 1. Auth API
export const authApi = {
  login: (data: { identifier: string; password?: string; email?: string }) => {
    const payload = {
      identifier: data.identifier || data.email || '',
      password: data.password || '',
    };
    return api.post<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      user: {
        id: string;
        email?: string;
        phone?: string;
        name: string;
        role: string;
        status: string;
        portal_redirect?: string;
      };
    }>('/auth/login', payload, { requiresAuth: false });
  },

  sendOtp: (data: { phone: string; purpose?: string; channel?: string }) =>
    api.post<{ message: string; phone: string; expires_in_seconds: number; purpose: string; channel?: string }>(
      '/auth/otp/send',
      { phone: data.phone, purpose: data.purpose || 'login', channel: data.channel || 'auto' },
      { requiresAuth: false }
    ),

  verifyOtp: (data: { phone: string; otp: string; purpose?: string; name?: string }) =>
    api.post<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      user: {
        id: string;
        email?: string;
        phone?: string;
        name: string;
        role: string;
        status: string;
        portal_redirect?: string;
      };
    }>('/auth/otp/verify', data, { requiresAuth: false }),

  googleLogin: (data: { email: string; name: string; id_token?: string; access_token?: string; google_id?: string; avatar_url?: string }) =>
    api.post<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      user: {
        id: string;
        email?: string;
        phone?: string;
        name: string;
        role: string;
        status: string;
        portal_redirect?: string;
      };
    }>('/auth/google', data, { requiresAuth: false }),

  registerCustomer: (data: { name: string; email?: string; phone?: string; password: string }) =>
    api.post<{
      access_token: string;
      refresh_token: string;
      token_type: string;
      expires_in: number;
      user: {
        id: string;
        email?: string;
        phone?: string;
        name: string;
        role: string;
        status: string;
        portal_redirect?: string;
      };
    }>('/auth/register/customer', data, { requiresAuth: false }),

  getMe: () =>
    api.get<{
      id: string;
      email?: string;
      phone?: string;
      name: string;
      role: string;
      status: string;
      created_at: string;
      portal_redirect?: string;
    }>('/auth/me'),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post<{ message: string }>('/auth/change-password', data),

  logout: () => api.post('/auth/logout', {}),
  refreshToken: (refresh_token: string) =>
    api.post<{ access_token: string; token_type: string }>('/auth/refresh', { refresh_token }, { requiresAuth: false }),
};

// 2. Customer & Address API
export const customerApi = {
  getProfile: () => api.get<CustomerProfile>('/customer/profile'),

  updateProfile: (data: { name?: string; phone?: string; email?: string }) =>
    api.patch<CustomerProfile>('/customer/profile', data),

  getAddresses: () => api.get<CustomerAddress[]>('/customer/addresses'),

  createAddress: (data: {
    recipient_name: string;
    phone: string;
    address_label?: string;
    door_no?: string;
    street_address: string;
    area: string;
    city: string;
    state?: string;
    postal_code: string;
    latitude?: number;
    longitude?: number;
    is_default?: boolean;
  }) => api.post<CustomerAddress>('/customer/addresses', data),

  updateAddress: (id: string, data: Partial<CustomerAddress>) =>
    api.put<CustomerAddress>(`/customer/addresses/${id}`, data),

  deleteAddress: (id: string) =>
    api.delete<{ message: string }>(`/customer/addresses/${id}`),

  setDefaultAddress: (id: string) =>
    api.put<CustomerAddress>(`/customer/addresses/${id}/default`),

  completeOnboarding: (data: {
    name: string;
    phone?: string;
    email?: string;
    door_no?: string;
    street_address: string;
    area: string;
    city: string;
    state?: string;
    postal_code: string;
    latitude?: number;
    longitude?: number;
    address_label?: string;
  }) => api.post<CustomerProfile>('/customer/onboarding', data),
};

// 3. Catalog API
export const catalogApi = {
  getProducts: (params?: {
    category?: string;
    search?: string;
    skip?: number;
    limit?: number;
    sort_by?: string;
    min_price?: number;
    max_price?: number;
  }) =>
    api.get<{ items: any[]; total: number; skip: number; limit: number }>('/products', { params, requiresAuth: false }),

  getCategories: () => api.get<string[]>('/products/categories', { requiresAuth: false }),

  getProductDetail: (id: string) => api.get<any>(`/products/${id}`, { requiresAuth: false }),
};

// 4. Cart & Order API
export const cartApi = {
  getCart: () =>
    api.get<{
      items: Array<{
        id: string;
        product_id: string;
        name: string;
        price: number;
        quantity: number;
        unit: string;
        image_url?: string;
        category?: string;
        line_total: number;
      }>;
      item_count: number;
      subtotal: number;
      delivery_charge: number;
      total: number;
    }>('/cart'),

  addItem: (product_id: string, quantity: number = 1) =>
    api.post<any>('/cart/items', { product_id, quantity }),

  updateItem: (itemId: string, quantity: number) =>
    api.patch<any>(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: string) => api.delete<any>(`/cart/items/${itemId}`),

  clearCart: () => api.delete<any>('/cart'),
};

export const ordersApi = {
  createOrder: (data: { delivery_address: string; delivery_phone: string; payment_method?: string; notes?: string }) =>
    api.post<any>('/orders', data),

  getOrders: (params?: { status?: string; skip?: number; limit?: number }) =>
    api.get<{ items: any[]; total: number }>('/orders', { params }),

  getOrderDetail: (orderId: string) => api.get<any>(`/orders/${orderId}`),

  trackOrder: (orderId: string) => api.get<any>(`/transport/tracking/${orderId}`),

  getTracking: (orderId: string) => api.get<any>(`/orders/${orderId}/tracking`),
};

export const paymentsApi = {
  getDiagnostic: () => api.get<{
    primary_gateway: string;
    gateway_configured: boolean;
    key_id_configured: boolean;
    key_secret_configured: boolean;
    webhook_secret_configured: boolean;
    test_mode: boolean;
    gateway_connectivity: string;
    supported_methods: string[];
    status_message: string;
  }>('/payments/diagnostic', { requiresAuth: false }),

  createIntent: (data: {
    delivery_address: string;
    delivery_phone?: string;
    payment_method: string;
    notes?: string;
    idempotency_key?: string;
  }) => api.post<{
    order_id: string;
    order_code: string;
    payment_id?: string;
    gateway: string;
    payment_method: string;
    payment_status: string;
    order_status: string;
    total_amount: number;
    delivery_charge: number;
    currency: string;
    razorpay_order_id?: string;
    razorpay_key_id?: string;
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    assigned_godown?: any;
    message: string;
  }>('/payments/create-intent', data),

  verifyPayment: (data: {
    order_id: string;
    payment_id?: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => api.post<{
    success: boolean;
    order_id: string;
    order_code: string;
    payment_status: string;
    order_status: string;
    amount: number;
    payment_method: string;
    transaction_id: string;
    verified_at: string;
    message: string;
  }>('/payments/verify', data),

  getReceipt: (orderId: string) => api.get<any>(`/payments/${orderId}/receipt`),
};

// 4. Farmer API
export const farmerApi = {
  getProfile: () => api.get<any>('/farmer/profile'),
  updateProfile: (data: { location?: string; bank_account_name?: string; bank_account_no?: string; bank_ifsc?: string }) =>
    api.put<any>('/farmer/profile', data),
  getDashboard: () => api.get<any>('/farmer/dashboard'),
  getBatches: (params?: { skip?: number; limit?: number }) => api.get<any>('/farmer/batches', { params }),
  createBatch: (data: {
    product_name: string;
    category: string;
    quantity: number;
    unit?: string;
    price: number;
    harvest_date?: string;
    organic_certified?: boolean;
    storage_type?: string;
    godown_id?: string;
  }) => api.post<any>('/farmer/batches', data),
  getPickups: () => api.get<any[]>('/farmer/pickups'),
  createPickup: (data: {
    crop_type: string;
    quantity_kg: number;
    pickup_address: string;
    contact_phone: string;
    scheduled_date?: string;
    notes?: string;
  }) => api.post<any>('/farmer/pickups', data),
  getPayouts: () => api.get<any[]>('/farmer/payouts'),
};

// 5. Godown / Warehouse API
export const godownApi = {
  getDashboard: () => api.get<any>('/godown/dashboard'),
  getInventory: (params?: { category?: string; availability?: string; search?: string; skip?: number; limit?: number }) =>
    api.get<{ items: any[]; total: number }>('/godown/inventory', { params: { limit: 500, ...params } }),
  getInventoryItem: (productId: string) => api.get<any>(`/godown/inventory/${productId}`),
  updateLocation: (productId: string, data: { rack?: string; shelf?: string; bin?: string; notes?: string }) =>
    api.patch<any>(`/godown/inventory/${productId}/location`, data),
  adjustStock: (data: { product_id: string; movement_type: string; quantity: number; reason: string; reference?: string }) =>
    api.post<any>('/godown/stock-adjustments', data),
  getStockMovements: (params?: { product_id?: string; skip?: number; limit?: number }) =>
    api.get<any[]>('/godown/stock-movements', { params }),
  getOrders: (params?: { status?: string; skip?: number; limit?: number }) =>
    api.get<{ items: any[]; total: number }>('/godown/orders', { params }),
  getOrderDetail: (orderId: string) => api.get<any>(`/godown/orders/${orderId}`),
  pickOrder: (orderId: string, items: Array<{ order_item_id: string; picked_qty: number; location?: string }>) =>
    api.post<any>(`/godown/orders/${orderId}/pick`, { items }),
  packOrder: (orderId: string, package_count: number = 1, package_weight_kg?: number, notes?: string) =>
    api.post<any>(`/godown/orders/${orderId}/pack`, { package_count, package_weight_kg, notes }),
  markReady: (orderId: string) => api.post<any>(`/godown/orders/${orderId}/ready`, {}),
  getAlerts: (params?: { is_resolved?: boolean }) => api.get<any[]>('/godown/alerts', { params }),
  resolveAlert: (alertId: string) => api.patch<any>(`/godown/alerts/${alertId}/resolve`, {}),
};

// 6. Transport & Fleet API
export const transportApi = {
  getDashboard: () => api.get<any>('/transport/dashboard'),
  getQueue: (params?: { status?: string }) => api.get<any[]>('/transport/queue', { params }),
  getQueueItem: (orderId: string) => api.get<any>(`/transport/queue/${orderId}`),
  getVehicles: (params?: { status?: string }) => api.get<any[]>('/transport/vehicles', { params }),
  createVehicle: (data: { vehicle_number: string; type: string; capacity_kg: number; fuel_type?: string }) =>
    api.post<any>('/transport/vehicles', data),
  getDrivers: (params?: { is_available?: boolean }) => api.get<any[]>('/transport/drivers', { params }),
  createDriver: (data: { user_id: string; license_number: string; phone: string; experience_years?: number }) =>
    api.post<any>('/transport/drivers', data),
  assignOrder: (orderId: string, vehicle_id: string, driver_id: string) =>
    api.post<any>(`/transport/orders/${orderId}/assign`, { vehicle_id, driver_id }),
  autoAllocate: (orderId: string) => api.post<any>(`/transport/orders/${orderId}/auto-allocate`, {}),
  dispatchOrder: (orderId: string) => api.post<any>(`/transport/orders/${orderId}/dispatch`, {}),
  outForDelivery: (orderId: string) => api.post<any>(`/transport/orders/${orderId}/out-for-delivery`, {}),
  deliverOrder: (orderId: string, otp_code?: string) =>
    api.post<any>(`/transport/orders/${orderId}/deliver`, { otp_code }),
  getTracking: (orderId: string) => api.get<any>(`/transport/tracking/${orderId}`),
  getLogs: (params?: { skip?: number; limit?: number }) => api.get<any[]>('/transport/logs', { params }),
  getSlaDashboard: (params?: { timeframe_hours?: number }) => api.get<any>('/transport/sla-dashboard', { params }),
  triggerSlaAssignment: (orderId: string) => api.post<any>(`/transport/orders/${orderId}/trigger-sla-assignment`, {}),
  retryUnassigned: () => api.post<any>('/transport/retry-unassigned', {}),
};

// 7. Driver Companion API
export const driverApi = {
  getDashboard: () => api.get<any>('/driver/dashboard'),
  getDeliveries: (params?: { status?: string }) => api.get<any[]>('/driver/deliveries', { params }),
  startDelivery: (deliveryId: string) => api.post<any>(`/driver/deliveries/${deliveryId}/start`, {}),
  updateLocation: (deliveryId: string, latitude: number, longitude: number) =>
    api.post<any>(`/driver/deliveries/${deliveryId}/location`, { latitude, longitude }),
  verifyOtp: (deliveryId: string, otp_code: string) =>
    api.post<any>(`/driver/deliveries/${deliveryId}/verify-otp`, { otp_code }),
};

// 8. Recruitment & Staff API
export const recruitmentApi = {
  getDashboard: () => api.get<any>('/recruitment/dashboard'),
  getApplications: (params?: { status?: string; role_applied?: string }) =>
    api.get<any[]>('/recruitment/applications', { params }),
  getApplicationDetail: (id: string) => api.get<any>(`/recruitment/applications/${id}`),
  submitApplication: (data: { full_name: string; email: string; phone: string; role_applied: string; department: string; experience_years?: number }) =>
    api.post<any>('/recruitment/applications', data),
  provisionAccount: (applicantId: string, temp_password?: string) =>
    api.post<any>(`/recruitment/applications/${applicantId}/provision`, { temp_password }),
  updateApplicationStatus: (applicantId: string, status: string, notes?: string) =>
    api.patch<any>(`/recruitment/applications/${applicantId}/status`, { status, notes }),
  getEmployees: (params?: { department?: string; status?: string }) =>
    api.get<any[]>('/recruitment/employees', { params }),
  createEmployee: (data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: string;
    department: string;
    designation: string;
    salary?: number;
    godown_id?: string;
  }) => api.post<any>('/recruitment/employees', data),
  getDepartments: () => api.get<any[]>('/recruitment/departments'),
  createDepartment: (data: { name: string; description?: string }) => api.post<any>('/recruitment/departments', data),
  getDirectory: (params?: { department?: string; search?: string }) =>
    api.get<any[]>('/recruitment/directory', { params }),
  getChecklists: (params?: { employee_id?: string }) => api.get<any[]>('/recruitment/onboarding/checklists', { params }),
  updateTask: (taskId: string, status: string, notes?: string) =>
    api.patch<any>(`/recruitment/onboarding/checklists/${taskId}`, { status, notes }),
  suspendAccount: (userId: string, reason?: string) =>
    api.post<any>(`/recruitment/accounts/${userId}/suspend`, { reason }),
  activateAccount: (userId: string) => api.post<any>(`/recruitment/accounts/${userId}/activate`, {}),
  getLogs: () => api.get<any[]>('/recruitment/logs'),
};

// 9. Business / B2B Partner API
export const businessApi = {
  getProfile: () => api.get<any>('/business/profile'),
  updateProfile: (data: { business_name?: string; business_type?: string; gst_number?: string; address?: string }) =>
    api.put<any>('/business/profile', data),
  getDashboard: () => api.get<any>('/business/dashboard'),
  getCatalog: (params?: { category?: string; search?: string }) => api.get<any[]>('/business/catalog', { params }),
  getQuotes: () => api.get<any[]>('/business/quotes'),
  requestQuote: (data: { notes?: string; items: Array<{ product_id: string; product_name?: string; quantity_kg: number; target_price?: number }> }) =>
    api.post<any>('/business/quotes', data),
  acceptQuote: (quoteId: string) => api.post<any>(`/business/quotes/${quoteId}/accept`, {}),
  getInvoices: (params?: { status?: string }) => api.get<any[]>('/business/invoices', { params }),
  payInvoice: (invoiceId: string, payment_method: string = 'Credit Ledger', transaction_ref?: string) =>
    api.post<any>(`/business/invoices/${invoiceId}/pay`, { payment_method, transaction_ref }),
  getRecurring: () => api.get<any[]>('/business/recurring'),
  createRecurring: (data: { title: string; frequency: string; delivery_day?: string; items: Array<{ product_id: string; quantity: number }> }) =>
    api.post<any>('/business/recurring', data),
  updateRecurringStatus: (recurringId: string, status: string) =>
    api.patch<any>(`/business/recurring/${recurringId}/status`, { status }),
};

// 10. Office / Finance / Admin API
export const officeApi = {
  getDashboard: () => api.get<any>('/office/dashboard'),
  getReports: () => api.get<any[]>('/office/reports'),
  generateReport: (month: string, department: string) =>
    api.post<any>('/office/reports/generate', { month, department }),
  getReportDetail: (reportId: string) => api.get<any>(`/office/reports/${reportId}`),
  approveReport: (reportId: string) => api.post<any>(`/office/reports/${reportId}/approve`, {}),
  getExpenses: (params?: { department?: string; status?: string }) =>
    api.get<any[]>('/office/expenses', { params }),
  createExpense: (data: { title: string; department: string; amount: number; category: string; description?: string }) =>
    api.post<any>('/office/expenses', data),
  updateExpenseStatus: (expenseId: string, status: string) =>
    api.patch<any>(`/office/expenses/${expenseId}/status`, { status }),
  getReconciliation: () => api.get<any>('/office/reconciliation'),
  getCompliance: () => api.get<any>('/office/compliance'),
  getSlaMetrics: (params?: { timeframe_hours?: number }) => api.get<any>('/office/sla-metrics', { params }),
};

// 11. Universal Notifications API
export const notificationsApi = {
  getNotifications: (params?: { is_read?: boolean; skip?: number; limit?: number }) =>
    api.get<{ items: any[]; unread_count: number }>('/notifications', { params }),
  getUnreadCount: () => api.get<{ unread_count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<any>(`/notifications/${id}/read`, {}),
  markAllRead: () => api.post<any>('/notifications/read-all', {}),
};
