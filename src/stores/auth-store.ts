import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'accountant' | 'owner'
  status: 'pending' | 'approved' | 'rejected' | 'disabled'
  householdId: string | null
  household?: {
    id: string
    lastName: string
    firstName: string
    plot?: {
      id: string
      number: string
      area: number
    }
  } | null
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  
  // Permissions
  isAdmin: () => boolean
  isAccountant: () => boolean
  canManageUsers: () => boolean
  canManageFinance: () => boolean
  canManagePlots: () => boolean
  canViewReports: () => boolean
  canMakePayments: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false 
      }),
      
      // Permission helpers
      isAdmin: () => get().user?.role === 'admin',
      
      isAccountant: () => get().user?.role === 'accountant',
      
      canManageUsers: () => {
        const user = get().user
        return user?.role === 'admin'
      },
      
      canManageFinance: () => {
        const user = get().user
        return user?.role === 'admin' || user?.role === 'accountant'
      },
      
      canManagePlots: () => {
        const user = get().user
        return user?.role === 'admin'
      },
      
      canViewReports: () => {
        const user = get().user
        return user?.role === 'admin' || user?.role === 'accountant'
      },
      
      canMakePayments: () => {
        const user = get().user
        return user?.role === 'admin' || user?.role === 'accountant'
      },
    }),
    {
      name: 'snt-auth',
    }
  )
)
