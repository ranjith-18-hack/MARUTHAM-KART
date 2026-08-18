import { ManagedAccount } from "@/data/mockData";

export const DEPARTMENT_PORTAL_MAP: Record<string, string> = {
  'Godown': '/godown',
  'Transport': '/transport',
  'Recruitment': '/recruitment',
  'Office': '/office/dashboard',
  'Accounts': '/recruitment/analytics', // Placeholder for accounts
  'Sales': '/business',
  'Business': '/business',
};

export const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  'Godown Manager': ['manage_products', 'manage_inventory', 'process_orders', 'ready_dispatch', 'view_reports'],
  'Godown Employee': ['manage_inventory', 'process_orders'],
  'Driver': ['view_deliveries', 'update_status', 'otp_entry', 'complete_delivery'],
  'Transport Manager': ['manage_vehicles', 'manage_drivers', 'confirm_assignments', 'monitor_deliveries'],
  'Recruitment Employee': ['create_accounts', 'verify_accounts', 'approve_accounts', 'manage_directory'],
  'Office Employee': ['monitor_org', 'view_reports', 'manage_settings', 'audit_logs'],
};

export const getPortalFromDepartment = (department: string, role: string): string => {
  if (role === 'Driver') return '/driver/dashboard';
  return DEPARTMENT_PORTAL_MAP[department] || '/home';
};

export const getPermissionsFromRole = (role: string): string[] => {
  return ROLE_PERMISSIONS_MAP[role] || [];
};

export const determineEmployeeId = (category: string, count: number): string => {
  const prefix = category === 'Driver' ? 'MK-DRI' : 
                 category.includes('Partner') ? 'MK-VPT' : 
                 category.includes('Business') ? 'MK-BUS' : 'MK-EMP';
  return `${prefix}-${(count + 1).toString().padStart(3, '0')}`;
};
