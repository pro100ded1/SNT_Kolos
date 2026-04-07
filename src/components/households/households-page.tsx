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
  Users,
  Phone,
  Mail,
  Crown,
  User
} from 'lucide-react'
import { toast } from 'sonner'

interface Household {
  id: string
  plotId: string
  lastName: string
  firstName: string
  middleName: string | null
  phone: string | null
  email: string | null
  ownershipType: string
  status: string
  isBoardMember: boolean
  boardPosition: string | null
  memberSince: string | null
  notes: string | null
  plot: {
    id: string
    number: string
    area: number
  } | null
}

interface Plot {
  id: string
  number: string
  area: number
  households: { id: string }[]
}

export function HouseholdsPage() {
  const [households, setHouseholds] = useState<Household[]>([])
  const [plots, setPlots] = useState<Plot[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)
  const [formData, setFormData] = useState({
    plotId: '',
    lastName: '',
    firstName: '',
    middleName: '',
    phone: '',
    email: '',
    ownershipType: 'owner',
    status: 'active',
    isBoardMember: false,
    boardPosition: '',
    memberSince: '',
    notes: '',
  })

  useEffect(() => {
    fetchHouseholds()
    fetchPlots()
  }, [statusFilter, search])

  const fetchHouseholds = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (search) params.append('search', search)
      
      const response = await fetch(`/api/households?${params}`)
      if (response.ok) {
        const data = await response.json()
        setHouseholds(data)
      }
    } catch (error) {
      console.error('Error fetching households:', error)
      toast.error('Ошибка при загрузке домохозяйств')
    } finally {
      setLoading(false)
    }
  }

  const fetchPlots = async () => {
    try {
      const response = await fetch('/api/plots')
      if (response.ok) {
        const data = await response.json()
        setPlots(data)
      }
    } catch (error) {
      console.error('Error fetching plots:', error)
    }
  }

  const handleOpenDialog = (household?: Household) => {
    if (household) {
      setSelectedHousehold(household)
      setFormData({
        plotId: household.plotId,
        lastName: household.lastName,
        firstName: household.firstName,
        middleName: household.middleName || '',
        phone: household.phone || '',
        email: household.email || '',
        ownershipType: household.ownershipType,
        status: household.status,
        isBoardMember: household.isBoardMember,
        boardPosition: household.boardPosition || '',
        memberSince: household.memberSince ? household.memberSince.split('T')[0] : '',
        notes: household.notes || '',
      })
    } else {
      setSelectedHousehold(null)
      setFormData({
        plotId: '',
        lastName: '',
        firstName: '',
        middleName: '',
        phone: '',
        email: '',
        ownershipType: 'owner',
        status: 'active',
        isBoardMember: false,
        boardPosition: '',
        memberSince: '',
        notes: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.plotId || !formData.lastName || !formData.firstName) {
      toast.error('Заполните обязательные поля')
      return
    }

    try {
      const url = '/api/households'
      const method = selectedHousehold ? 'PUT' : 'POST'
      const body = selectedHousehold 
        ? { ...formData, id: selectedHousehold.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(selectedHousehold ? 'Домохозяйство обновлено' : 'Домохозяйство создано')
        setDialogOpen(false)
        fetchHouseholds()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при сохранении')
      }
    } catch (error) {
      console.error('Error saving household:', error)
      toast.error('Ошибка при сохранении')
    }
  }

  const handleDelete = async () => {
    if (!selectedHousehold) return

    try {
      const response = await fetch(`/api/households?id=${selectedHousehold.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Домохозяйство удалено')
        setDeleteDialogOpen(false)
        setSelectedHousehold(null)
        fetchHouseholds()
      } else {
        toast.error('Ошибка при удалении')
      }
    } catch (error) {
      console.error('Error deleting household:', error)
      toast.error('Ошибка при удалении')
    }
  }

  const getAvailablePlots = () => {
    // Показываем участки без владельцев или текущий участок редактируемого домохозяйства
    return plots.filter(p => 
      p.households.length === 0 || 
      (selectedHousehold && p.id === selectedHousehold.plotId)
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Домохозяйства
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Карточки владельцев и арендаторов участков
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить домохозяйство
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Всего домохозяйств</p>
                <p className="text-2xl font-bold">{households.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Владельцев</p>
                <p className="text-2xl font-bold">
                  {households.filter(h => h.ownershipType === 'owner').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Членов правления</p>
                <p className="text-2xl font-bold">
                  {households.filter(h => h.isBoardMember).length}
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
                placeholder="Поиск по фамилии, имени, телефону..."
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
                  <TableHead>ФИО</TableHead>
                  <TableHead>Участок</TableHead>
                  <TableHead>Контакты</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Правление</TableHead>
                  <TableHead>Статус</TableHead>
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
                ) : households.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Домохозяйства не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  households.map((household) => (
                    <TableRow key={household.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {household.lastName} {household.firstName} {household.middleName || ''}
                          </p>
                          {household.isBoardMember && (
                            <Badge className="bg-amber-100 text-amber-700 text-xs mt-1">
                              <Crown className="h-3 w-3 mr-1" />
                              {household.boardPosition || 'Член правления'}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {household.plot ? (
                          <div>
                            <p className="font-medium">Участок №{household.plot.number}</p>
                            <p className="text-sm text-gray-500">{household.plot.area} соток</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">Не привязан</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {household.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {household.phone}
                            </div>
                          )}
                          {household.email && (
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {household.email}
                            </div>
                          )}
                          {!household.phone && !household.email && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={household.ownershipType === 'owner' ? 'default' : 'secondary'}>
                          {household.ownershipType === 'owner' ? 'Владелец' : 'Арендатор'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {household.isBoardMember ? (
                          <Badge className="bg-amber-100 text-amber-700">
                            {household.boardPosition || 'Да'}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          household.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
                        }>
                          {household.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(household)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedHousehold(household)
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedHousehold ? 'Редактировать домохозяйство' : 'Новое домохозяйство'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plotId">Участок *</Label>
              <Select
                value={formData.plotId}
                onValueChange={(value) => setFormData({ ...formData, plotId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите участок" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailablePlots().map((plot) => (
                    <SelectItem key={plot.id} value={plot.id}>
                      Участок №{plot.number} ({plot.area} соток)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="middleName">Отчество</Label>
                <Input
                  id="middleName"
                  value={formData.middleName}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7(900)123-45-67"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ownershipType">Тип владения</Label>
                <Select
                  value={formData.ownershipType}
                  onValueChange={(value) => setFormData({ ...formData, ownershipType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Владелец</SelectItem>
                    <SelectItem value="tenant">Арендатор</SelectItem>
                  </SelectContent>
                </Select>
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memberSince">Дата вступления в СНТ</Label>
              <Input
                id="memberSince"
                type="date"
                value={formData.memberSince}
                onChange={(e) => setFormData({ ...formData, memberSince: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isBoardMember"
                  checked={formData.isBoardMember}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isBoardMember: checked as boolean })
                  }
                />
                <Label htmlFor="isBoardMember" className="flex items-center gap-1">
                  <Crown className="h-4 w-4 text-amber-600" />
                  Член правления
                </Label>
              </div>
            </div>

            {formData.isBoardMember && (
              <div className="space-y-2">
                <Label htmlFor="boardPosition">Должность в правлении</Label>
                <Select
                  value={formData.boardPosition}
                  onValueChange={(value) => setFormData({ ...formData, boardPosition: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите должность" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Председатель">Председатель</SelectItem>
                    <SelectItem value="Заместитель председателя">Заместитель председателя</SelectItem>
                    <SelectItem value="Казначей">Казначей</SelectItem>
                    <SelectItem value="Секретарь">Секретарь</SelectItem>
                    <SelectItem value="Член правления">Член правления</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Примечания</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              {selectedHousehold ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить домохозяйство?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить домохозяйство {selectedHousehold?.lastName} {selectedHousehold?.firstName}?
              Это действие также удалит все связанные платежи.
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
