'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { Checkbox } from '@/components/ui/checkbox'
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
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Zap, 
  Droplets, 
  Flame,
  MapPin,
  Users,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Plot {
  id: string
  number: string
  cadastralNumber: string | null
  area: number
  address: string | null
  status: string
  electricity: boolean
  water: boolean
  gas: boolean
  notes: string | null
  households: Array<{
    id: string
    lastName: string
    firstName: string
    phone: string | null
    ownershipType: string
  }>
  currentYearFee: {
    amount: number
    paid: number
    remaining: number
    isPaid: boolean
    paymentPercentage: number
  } | null
}

export function PlotsPage() {
  const [plots, setPlots] = useState<Plot[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null)
  const [formData, setFormData] = useState({
    number: '',
    cadastralNumber: '',
    area: '',
    address: '',
    status: 'active',
    electricity: false,
    water: false,
    gas: false,
    notes: '',
  })

  useEffect(() => {
    fetchPlots()
  }, [statusFilter, search])

  const fetchPlots = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/plots?${params}`)
      if (response.ok) {
        const data = await response.json()
        setPlots(data)
      }
    } catch (error) {
      console.error('Error fetching plots:', error)
      toast.error('Ошибка при загрузке участков')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (plot?: Plot) => {
    if (plot) {
      setSelectedPlot(plot)
      setFormData({
        number: plot.number,
        cadastralNumber: plot.cadastralNumber || '',
        area: plot.area.toString(),
        address: plot.address || '',
        status: plot.status,
        electricity: plot.electricity,
        water: plot.water,
        gas: plot.gas,
        notes: plot.notes || '',
      })
    } else {
      setSelectedPlot(null)
      setFormData({
        number: '',
        cadastralNumber: '',
        area: '',
        address: '',
        status: 'active',
        electricity: false,
        water: false,
        gas: false,
        notes: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      const url = selectedPlot ? '/api/plots' : '/api/plots'
      const method = selectedPlot ? 'PUT' : 'POST'
      const body = selectedPlot 
        ? { ...formData, id: selectedPlot.id }
        : { ...formData, createFee: true, feePerSotka: '500' }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(selectedPlot ? 'Участок обновлён' : 'Участок создан')
        setDialogOpen(false)
        fetchPlots()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при сохранении')
      }
    } catch (error) {
      console.error('Error saving plot:', error)
      toast.error('Ошибка при сохранении')
    }
  }

  const handleDelete = async () => {
    if (!selectedPlot) return

    try {
      const response = await fetch(`/api/plots?id=${selectedPlot.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Участок удалён')
        setDeleteDialogOpen(false)
        setSelectedPlot(null)
        fetchPlots()
      } else {
        toast.error('Ошибка при удалении')
      }
    } catch (error) {
      console.error('Error deleting plot:', error)
      toast.error('Ошибка при удалении')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-700">Активен</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-700">Неактивен</Badge>
      case 'vacant':
        return <Badge className="bg-amber-100 text-amber-700">Пустой</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Управление участками
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Карточки дачных участков
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить участок
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Всего участков</p>
                <p className="text-2xl font-bold">{plots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Заселённых</p>
                <p className="text-2xl font-bold">
                  {plots.filter(p => p.households.length > 0).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Оплатили взносы</p>
                <p className="text-2xl font-bold">
                  {plots.filter(p => p.currentYearFee?.isPaid).length}
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
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск по номеру или адресу..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="inactive">Неактивные</SelectItem>
                <SelectItem value="vacant">Пустые</SelectItem>
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
                  <TableHead>№ участка</TableHead>
                  <TableHead>Кадастр. номер</TableHead>
                  <TableHead>Площадь</TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead>Владелец</TableHead>
                  <TableHead>Коммуникации</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Оплата взноса</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Загрузка...
                    </TableCell>
                  </TableRow>
                ) : plots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Участки не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  plots.map((plot) => (
                    <TableRow key={plot.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-emerald-600" />
                          {plot.number}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-gray-600">
                        {plot.cadastralNumber || '-'}
                      </TableCell>
                      <TableCell>{plot.area} соток</TableCell>
                      <TableCell>{plot.address || '-'}</TableCell>
                      <TableCell>
                        {plot.households.length > 0 ? (
                          <div>
                            <p className="font-medium">
                              {plot.households[0].lastName} {plot.households[0].firstName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {plot.households[0].phone || '-'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">Не указан</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {plot.electricity && (
                            <div className="p-1 bg-yellow-100 rounded" title="Электричество">
                              <Zap className="h-4 w-4 text-yellow-600" />
                            </div>
                          )}
                          {plot.water && (
                            <div className="p-1 bg-blue-100 rounded" title="Вода">
                              <Droplets className="h-4 w-4 text-blue-600" />
                            </div>
                          )}
                          {plot.gas && (
                            <div className="p-1 bg-orange-100 rounded" title="Газ">
                              <Flame className="h-4 w-4 text-orange-600" />
                            </div>
                          )}
                          {!plot.electricity && !plot.water && !plot.gas && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(plot.status)}</TableCell>
                      <TableCell>
                        {plot.currentYearFee ? (
                          <div className="min-w-32">
                            <div className="flex items-center gap-2 mb-1">
                              {plot.currentYearFee.isPaid ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm">
                                {plot.currentYearFee.paymentPercentage}%
                              </span>
                            </div>
                            <Progress value={plot.currentYearFee.paymentPercentage} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">
                              {formatCurrency(plot.currentYearFee.paid)} / {formatCurrency(plot.currentYearFee.amount)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(plot)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPlot(plot)
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
              {selectedPlot ? 'Редактировать участок' : 'Новый участок'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="number">Номер участка *</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="Например: 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Площадь (соток) *</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cadastralNumber">Кадастровый номер</Label>
              <Input
                id="cadastralNumber"
                value={formData.cadastralNumber}
                onChange={(e) => setFormData({ ...formData, cadastralNumber: e.target.value })}
                placeholder="XX:XX:XXXXXXX:XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Центральная ул., д. 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активен</SelectItem>
                  <SelectItem value="inactive">Неактивен</SelectItem>
                  <SelectItem value="vacant">Пустой</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Коммуникации</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="electricity"
                    checked={formData.electricity}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, electricity: checked as boolean })
                    }
                  />
                  <Label htmlFor="electricity" className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    Электричество
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="water"
                    checked={formData.water}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, water: checked as boolean })
                    }
                  />
                  <Label htmlFor="water" className="flex items-center gap-1">
                    <Droplets className="h-4 w-4 text-blue-600" />
                    Вода
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="gas"
                    checked={formData.gas}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, gas: checked as boolean })
                    }
                  />
                  <Label htmlFor="gas" className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-orange-600" />
                    Газ
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Дополнительная информация..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              {selectedPlot ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить участок?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить участок №{selectedPlot?.number}? 
              Это действие также удалит все связанные данные (домохозяйства, платежи).
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
