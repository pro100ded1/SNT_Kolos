'use client'

import { Button } from '@/components/ui/button'
import { Menu, TreeDeciduous, Bell, LogOut, User, Shield, Calculator } from 'lucide-react'
import type { PageType } from '@/app/page'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'accountant' | 'owner'
  household?: {
    lastName: string
    firstName: string
    plot?: { number: string }
  } | null
}

interface HeaderProps {
  onMenuClick: () => void
  currentPage: PageType
  user?: User | null
  onLogout: () => void
}

const pageTitles: Record<PageType, string> = {
  dashboard: 'Панель управления',
  plots: 'Управление участками',
  households: 'Домохозяйства',
  payments: 'Взносы и платежи',
  finance: 'Доходы и расходы',
  reports: 'Отчёты',
  backup: 'Резервное копирование',
  announcements: 'Объявления',
  users: 'Пользователи',
}

const roleLabels: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Администратор', icon: Shield, color: 'text-red-600' },
  accountant: { label: 'Бухгалтер', icon: Calculator, color: 'text-blue-600' },
  owner: { label: 'Владелец', icon: User, color: 'text-gray-600' },
}

export function Header({ onMenuClick, currentPage, user, onLogout }: HeaderProps) {
  const roleInfo = user ? roleLabels[user.role] || roleLabels.owner : null
  const RoleIcon = roleInfo?.icon || User

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <TreeDeciduous className="h-6 w-6 text-emerald-600" />
            <span className="font-semibold text-emerald-700 hidden sm:block">СНТ Управление</span>
          </div>
        </div>
        
        <h1 className="text-lg font-semibold text-gray-700 dark:text-gray-200 hidden md:block">
          {pageTitles[currentPage]}
        </h1>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              0
            </span>
          </Button>

          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    {roleInfo && (
                      <p className={`text-xs ${roleInfo.color}`}>{roleInfo.label}</p>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name || 'Пользователь'}</span>
                    <span className="text-xs text-gray-500">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.household && (
                  <DropdownMenuLabel className="text-xs text-gray-500">
                    Уч. {user.household.plot?.number || 'N/A'} • {user.household.lastName} {user.household.firstName}
                  </DropdownMenuLabel>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
