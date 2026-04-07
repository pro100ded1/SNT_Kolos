'use client'

import { useState, useSyncExternalStore } from 'react'
import { Dashboard } from '@/components/dashboard'
import { PlotsPage } from '@/components/plots/plots-page'
import { HouseholdsPage } from '@/components/households/households-page'
import { PaymentsPage } from '@/components/payments/payments-page'
import { FinancePage } from '@/components/finance/finance-page'
import { ReportsPage } from '@/components/reports/reports-page'
import { BackupPage } from '@/components/backup/backup-page'
import { AnnouncementsPage } from '@/components/announcements/announcements-page'
import { UsersPage } from '@/components/users/users-page'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { AuthForms } from '@/components/auth/auth-forms'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'

export type PageType = 'dashboard' | 'plots' | 'households' | 'payments' | 'finance' | 'reports' | 'backup' | 'announcements' | 'users'

// Пустой store для синхронизации
const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuthStore()
  
  // Проверяем, что мы на клиенте (гидратация завершена)
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)

  const handleLogout = () => {
    logout()
    toast.info('Вы вышли из системы')
  }

  const handleAuthSuccess = () => {
    setCurrentPage('dashboard')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'plots':
        return <PlotsPage />
      case 'households':
        return <HouseholdsPage />
      case 'payments':
        return <PaymentsPage />
      case 'finance':
        return <FinancePage />
      case 'reports':
        return <ReportsPage />
      case 'backup':
        return <BackupPage />
      case 'announcements':
        return <AnnouncementsPage />
      case 'users':
        return <UsersPage />
      default:
        return <Dashboard />
    }
  }

  // Показываем форму авторизации если не авторизован
  if (mounted && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <AuthForms 
          onSuccess={handleAuthSuccess}
        />
      </div>
    )
  }

  // Показываем загрузку пока происходит гидратация
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        currentPage={currentPage}
        user={user}
        onLogout={handleLogout}
      />
      <div className="flex">
        <Sidebar 
          currentPage={currentPage} 
          onPageChange={setCurrentPage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 md:ml-64 mt-16">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
// force rebuild
