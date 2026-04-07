'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  CreditCard,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner'

interface Payment {
  id: string
  householdId: string
  membershipFeeId: string | null
  amount: number
  paymentType: string
  paymentMethod: string
  referenceNumber: string | null
  paymentDate: string
  periodFrom: string | null
  periodTo: string | null
  notes: string | null
  household: {
    id: string
    lastName: string
    firstName: string
    plot: { number: string } | null
  }
}

interface Household {
  id: string
  lastName: string
  firstName: string
  plot: { number: string } | null
}

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [households, setHouseholds] = useState<Household[]>([])
  const [loading, setLoading] = useState(true)
  const [totalAmount, setTotalAmount] = useState(0)
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [formData, setFormData] = useState({
    householdId: '',
    amount: '',
    paymentType: 'membership',
    paymentMethod: 'cash',
    referenceNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    periodFrom: '',
    periodTo: '',
    notes: '',
  })

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  useEffect(() => {
    fetchPayments()
    fetchHouseholds()
  }, [paymentTypeFilter, yearFilter])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (paymentTypeFilter !== 'all') params.append('paymentType', paymentTypeFilter)
      params.append('year', yearFilter)
      
      const response = await fetch(`/api/payments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments)
        setTotalAmount(data.totalAmount)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Ошибка при загрузке платежей')
    } finally {
      setLoading(false)
    }
  }

  const fetchHouseholds = async () => {
    try {
      const response = await fetch('/api/households')
      if (response.ok) {
        const data = await response.json()
        setHouseholds(data)
      }
    } catch (error) {
      console.error('Error fetching households:', error)
    }
  }

  const handleOpenDialog = (payment?: Payment) => {
    if (payment) {
      setSelectedPayment(payment)
      setFormData({
        householdId: payment.householdId,
        amount: payment.amount.toString(),
        paymentType: payment.paymentType,
        paymentMethod: payment.paymentMethod,
        referenceNumber: payment.referenceNumber || '',
        paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
        periodFrom: payment.periodFrom ? new Date(payment.periodFrom).toISOString().split('T')[0] : '',
        periodTo: payment.periodTo ? new Date(payment.periodTo).toISOString().split('T')[0] : '',
        notes: payment.notes || '',
      })
    } else {
      setSelectedPayment(null)
      setFormData({
        householdId: '',
        amount: '',
        paymentType: 'membership',
        paymentMethod: 'cash',
        referenceNumber: '',
        paymentDate: new Date().toISOString().split('T')[0],
        periodFrom: '',
        periodTo: '',
        notes: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.householdId || !formData.amount) {
      toast.error('Заполните обязательные поля')
      return
    }

    try {
      const url = '/api/payments'
      const method = selectedPayment ? 'PUT' : 'POST'
      const body = selectedPayment 
        ? { ...formData, id: selectedPayment.id, amount: parseFloat(formData.amount) }
        : { ...formData, amount: parseFloat(formData.amount) }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(selectedPayment ? 'Платёж обновлён' : 'Платёж создан')
        setDialogOpen(false)
        fetchPayments()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при сохранении')
      }
    } catch (error) {
      console.error('Error saving payment:', error)
      toast.error('Ошибка при сохранении')
    }
  }

  const handleDelete = async () => {
    if (!selectedPayment) return

    try {
      const response = await fetch(`/api/payments?id=${selectedPayment.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Платёж удалён')
        setDeleteDialogOpen(false)
        setSelectedPayment(null)
        fetchPayments()
      } else {
        toast.error('Ошибка при удалении')
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      toast.error('Ошибка при удалении')
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
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'membership': return 'Членский взнос'
      case 'electricity': return 'Электричество'
      case 'water': return 'Вода'
      case 'gas': return 'Газ'
      default: return type
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Наличные'
      case 'card': return 'Карта'
      case 'transfer': return 'Перевод'
      default: return method
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Взносы и платежи
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Учёт членских взносов и других платежей
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить платёж
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Всего платежей</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Общая сумма</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Членских взносов</p>
                <p className="text-2xl font-bold">
                  {payments.filter(p => p.paymentType === 'membership').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={paymentTypeFilter} onValueChange={setPaymentTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Тип платежа" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="membership">Членский взнос</SelectItem>
                <SelectItem value="electricity">Электричество</SelectItem>
                <SelectItem value="water">Вода</SelectItem>
                <SelectItem value="gas">Газ</SelectItem>
                <SelectItem value="other">Прочее</SelectItem>
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Плательщик</TableHead>
                  <TableHead>Участок</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Способ</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Загрузка...
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Платежи не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(payment.paymentDate)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.household.lastName} {payment.household.firstName}
                      </TableCell>
                      <TableCell>
                        {payment.household.plot ? (
                          <Badge variant="outline">№{payment.household.plot.number}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          payment.paymentType === 'membership' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }>
                          {getPaymentTypeLabel(payment.paymentType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(payment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPayment(payment)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedPayment ? 'Редактировать платёж' : 'Новый платёж'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="householdId">Плательщик *</Label>
              <Select
                value={formData.householdId}
                onValueChange={(value) => setFormData({ ...formData, householdId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите плательщика" />
                </SelectTrigger>
                <SelectContent>
                  {households.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.lastName} {h.firstName} {h.plot ? `(уч. ${h.plot.number})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Сумма *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Дата платежа</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentType">Тип платежа</Label>
                <Select
                  value={formData.paymentType}
                  onValueChange={(value) => setFormData({ ...formData, paymentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membership">Членский взнос</SelectItem>
                    <SelectItem value="electricity">Электричество</SelectItem>
                    <SelectItem value="water">Вода</SelectItem>
                    <SelectItem value="gas">Газ</SelectItem>
                    <SelectItem value="other">Прочее</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Способ оплаты</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Наличные</SelectItem>
                    <SelectItem value="card">Карта</SelectItem>
                    <SelectItem value="transfer">Перевод</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Номер квитанции/документа</Label>
              <Input
                id="referenceNumber"
                value={formData.referenceNumber}
                onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                placeholder="№12345"
              />
            </div>

            {formData.paymentType === 'membership' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="periodFrom">Период с</Label>
                  <Input
                    id="periodFrom"
                    type="date"
                    value={formData.periodFrom}
                    onChange={(e) => setFormData({ ...formData, periodFrom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="periodTo">Период по</Label>
                  <Input
                    id="periodTo"
                    type="date"
                    value={formData.periodTo}
                    onChange={(e) => setFormData({ ...formData, periodTo: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              {selectedPayment ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить платёж?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить этот платёж на сумму {selectedPayment ? formatCurrency(selectedPayment.amount) : ''}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
