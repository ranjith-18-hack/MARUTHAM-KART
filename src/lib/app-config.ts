/**
 * MARUTHAM KART - Multi-App Target & Role Configuration
 * 
 * Supports separate Android builds for:
 * 1. Customer App (com.maruthamkart.customer)
 * 2. Farmer App (com.maruthamkart.farmer)
 * 3. Godown App (com.maruthamkart.godown)
 * 4. Transport App (com.maruthamkart.transport)
 * 5. Recruitment App (com.maruthamkart.recruitment)
 * 6. Driver App (com.maruthamkart.driver)
 * 7. Business App (com.maruthamkart.business)
 * 8. Office / Admin App (com.maruthamkart.office)
 */

export type AppTarget = 
  | 'customer'
  | 'farmer'
  | 'godown'
  | 'transport'
  | 'recruitment'
  | 'driver'
  | 'business'
  | 'office'
  | 'web_all';

export interface AppTargetConfig {
  target: AppTarget;
  appId: string;
  appName: string;
  allowedPrefixes: string[];
  requiredRole?: string;
  defaultRoute: string;
}

export const APP_TARGET_CONFIGS: Record<AppTarget, AppTargetConfig> = {
  customer: {
    target: 'customer',
    appId: 'com.maruthamkart.customer',
    appName: 'MARUTHAM KART',
    allowedPrefixes: [
      '/',
      '/home',
      '/onboarding',
      '/products',
      '/categories',
      '/cart',
      '/checkout',
      '/orders',
      '/account',
      '/profile',
      '/notifications',
      '/about',
      '/contact',
    ],
    requiredRole: 'CUSTOMER',
    defaultRoute: '/home',
  },
  farmer: {
    target: 'farmer',
    appId: 'com.maruthamkart.farmer',
    appName: 'MARUTHAM Farmer',
    allowedPrefixes: ['/farmer'],
    requiredRole: 'FARMER',
    defaultRoute: '/farmer/dashboard',
  },
  godown: {
    target: 'godown',
    appId: 'com.maruthamkart.godown',
    appName: 'MARUTHAM Godown',
    allowedPrefixes: ['/godown'],
    requiredRole: 'GODOWN_MANAGER',
    defaultRoute: '/godown/dashboard',
  },
  transport: {
    target: 'transport',
    appId: 'com.maruthamkart.transport',
    appName: 'MARUTHAM Transport',
    allowedPrefixes: ['/transport'],
    requiredRole: 'TRANSPORT_MANAGER',
    defaultRoute: '/transport/dashboard',
  },
  recruitment: {
    target: 'recruitment',
    appId: 'com.maruthamkart.recruitment',
    appName: 'MARUTHAM Recruitment',
    allowedPrefixes: ['/recruitment'],
    requiredRole: 'RECRUITMENT_OFFICER',
    defaultRoute: '/recruitment/dashboard',
  },
  driver: {
    target: 'driver',
    appId: 'com.maruthamkart.driver',
    appName: 'MARUTHAM Driver',
    allowedPrefixes: ['/driver'],
    requiredRole: 'DRIVER',
    defaultRoute: '/driver/dashboard',
  },
  business: {
    target: 'business',
    appId: 'com.maruthamkart.business',
    appName: 'MARUTHAM Business',
    allowedPrefixes: ['/business'],
    requiredRole: 'HOTEL_BUSINESS',
    defaultRoute: '/business/dashboard',
  },
  office: {
    target: 'office',
    appId: 'com.maruthamkart.office',
    appName: 'MARUTHAM Office',
    allowedPrefixes: ['/office'],
    requiredRole: 'ADMIN',
    defaultRoute: '/office/dashboard',
  },
  web_all: {
    target: 'web_all',
    appId: 'com.maruthamkart.web',
    appName: 'MARUTHAM KART Suite',
    allowedPrefixes: ['/'],
    defaultRoute: '/home',
  },
};

export function getCurrentAppTarget(): AppTargetConfig {
  const envTarget = (import.meta.env.VITE_APP_TARGET as AppTarget) || 'customer';
  return APP_TARGET_CONFIGS[envTarget] || APP_TARGET_CONFIGS.customer;
}

export function isRouteAllowedForCurrentApp(path: string): boolean {
  const target = getCurrentAppTarget();
  if (target.target === 'web_all') return true;

  // Root login is always allowed
  if (path === '/' || path === '') return true;

  return target.allowedPrefixes.some(prefix => {
    if (prefix === '/') return path === '/' || path === '';
    return path.startsWith(prefix);
  });
}
