export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'super_admin' | 'store_admin' | 'user';
  created_at: string;
  updated_at: string;
}