
import { useContext } from 'react';
import { useAuth } from './useAuth';

export function useRole() {
  const { user, loading } = useAuth();
  return {
    userRole: user?.role || null,
    loading,
  };
}
