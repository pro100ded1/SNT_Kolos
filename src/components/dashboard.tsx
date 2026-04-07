'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Users, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  AlertCircle,
  Calendar,
  ArrowRight,
  Database,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface DashboardStats {
  totalPlots: number
  activePlots: number
  totalHouseholds: number
  totalPayments: number
  paidMembers: number
  unpaidMembers: number
  totalIncome: number
  totalExpense: number
  balance: number
  collectionRate: number
  recentPayments: Array<{
    id: string
    amount: number
    householdName: string
    date: string
    type: string
  }>
  announcements: Array<{
    id: string
    title: string
    date: string
    important: boolean
  }>
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInitialize = async () => {
    try {
      setInitializing(true)
      const response = await fetch('/api/init', {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        toast.success(`Данные инициализированы: ${data.plots} участков, ${data.households} домохозяйств`)
        fetchDashboardStats()
      } else {
        toast.error('Ошибка при инициализации данных')
      }
    } catch (error) {
      console.error('Error initializing data:', error)
      toast.error('Ошибка при инициализации данных')
    } finally {
      setInitializing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Show initialization screen if no data
  if (stats && stats.totalPlots === 0) {
    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Добро пожаловать в систему управления СНТ!</h2>
          <p className="text-emerald-100">
            Сегодня {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CardContent className="py-16 flex flex-col items-center justify-center">
            <Database className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">База данных пуста</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
              Для начала работы необходимо добавить данные. Вы можете инициализировать систему тестовыми данными для демонстрации или начать добавлять данные вручную.
            </p>
            <div className="flex gap-4">
              <Button 
                onClick={handleInitialize}
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={initializing}
              >
                {initializing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Инициализация...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Инициализировать тестовыми данными
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Добро пожаловать в систему управления СНТ!</h2>
        <p className="text-emerald-100">
          Сегодня {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Всего участков</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalPlots || 0}</p>
                <p className="text-xs text-emerald-600 mt-1">
                  Активных: {stats?.activePlots || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <MapPin className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Домохозяйства</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalHouseholds || 0}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Членов СНТ
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Сбор взносов</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.collectionRate || 0}%</p>
                <Progress value={stats?.collectionRate || 0} className="mt-2 h-2" />
              </div>
              <div className="h-12 w-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Баланс</p>
                <p className={cn(
                  "text-2xl font-bold",
                  (stats?.balance || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                )}>
                  {formatCurrency(stats?.balance || 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Finance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Финансовая сводка
            </CardTitle>
            <CardDescription>Доходы и расходы за текущий год</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Доходы</p>
                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(stats?.totalIncome || 0)}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Расходы</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(stats?.totalExpense || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Чистый баланс</p>
                  <p className={cn(
                    "text-xl font-bold",
                    (stats?.balance || 0) >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {formatCurrency(stats?.balance || 0)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-500" />
              Статус оплаты взносов
            </CardTitle>
            <CardDescription>Текущий год</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">Оплатили</span>
                </div>
                <span className="font-semibold text-emerald-600">{stats?.paidMembers || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Не оплатили</span>
                </div>
                <span className="font-semibold text-red-600">{stats?.unpaidMembers || 0}</span>
              </div>

              <Progress value={stats?.collectionRate || 0} className="h-3" />
              
              {(stats?.unpaidMembers || 0) > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{stats?.unpaidMembers} участков имеют задолженность</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                Последние платежи
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-emerald-600">
                Все платежи
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.recentPayments && stats.recentPayments.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {stats.recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium">{payment.householdName}</p>
                      <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">{formatCurrency(payment.amount)}</p>
                      <Badge variant="outline" className="text-xs">
                        {payment.type === 'membership' ? 'Членский взнос' : payment.type}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Платежей пока нет</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-gray-500" />
                Объявления
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-emerald-600">
                Все объявления
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.announcements && stats.announcements.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {stats.announcements.map((announcement) => (
                  <div key={announcement.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      {announcement.important && (
                        <Badge variant="destructive" className="text-xs shrink-0">Важно</Badge>
                      )}
                      <div>
                        <p className="font-medium">{announcement.title}</p>
                        <p className="text-sm text-gray-500">{formatDate(announcement.date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Объявлений пока нет</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
