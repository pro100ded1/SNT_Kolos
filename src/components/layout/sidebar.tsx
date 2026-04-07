'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  CreditCard, 
  Wallet, 
  FileBarChart, 
  Database, 
  Megaphone,
  X,
  TreeDeciduous,
  Shield,
  UserCog
} from 'lucide-react'
import type { PageType } from '@/app/page'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'accountant' | 'owner'
}

interface SidebarProps {
  currentPage: PageType
  onPageChange: (page: PageType) => void
  isOpen: boolean
  onClose: () => void
  user?: User | null
}

interface MenuItem {
  id: PageType
  label: string
  icon: React.ElementType
  roles?: ('admin' | 'accountant' | 'owner')[] // Если не указано, доступно всем
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
  { id: 'plots', label: 'Участки', icon: MapPin, roles: ['admin'] },
  { id: 'households', label: 'Домохозяйства', icon: Users },
  { id: 'payments', label: 'Взносы и платежи', icon: CreditCard, roles: ['admin', 'accountant'] },
  { id: 'finance', label: 'Доходы и расходы', icon: Wallet, roles: ['admin', 'accountant'] },
  { id: 'reports', label: 'Отчёты', icon: FileBarChart, roles: ['admin', 'accountant'] },
  { id: 'announcements', label: 'Объявления', icon: Megaphone },
  { id: 'users', label: 'Пользователи', icon: UserCog, roles: ['admin'] },
  { id: 'backup', label: 'Резерв. копирование', icon: Database, roles: ['admin'] },
]

export function Sidebar({ currentPage, onPageChange, isOpen, onClose, user }: SidebarProps) {
  const userRole = user?.role || 'owner'
  
  // Фильтруем пункты меню по роли
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(userRole as 'admin' | 'accountant' | 'owner')
  })

  const getRoleBadge = () => {
    switch (userRole) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-700 text-xs"><Shield className="h-3 w-3 mr-1" />Админ</Badge>
      case 'accountant':
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Бухгалтер</Badge>
      default:
        return null
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={cn(
        "fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 md:hidden">
          <div className="flex items-center gap-2">
            <TreeDeciduous className="h-6 w-6 text-emerald-600" />
            <span className="font-semibold text-emerald-700">СНТ Управление</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* User info */}
        {user && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || user.email}</p>
                <div className="mt-1">
                  {getRoleBadge()}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <ScrollArea className="flex-1 h-[calc(100%-8rem)]">
          <nav className="space-y-1 p-3">
            {filteredMenuItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 font-medium",
                  currentPage === item.id 
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
                )}
                onClick={() => {
                  onPageChange(item.id)
                  onClose()
                }}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Button>
            ))}
          </nav>
        </ScrollArea>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            © 2024 СНТ Управление
          </div>
        </div>
      </aside>
    </>
  )
}
