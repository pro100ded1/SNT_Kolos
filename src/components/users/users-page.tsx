'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Shield,
  Calculator,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  Mail
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

interface User {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  householdId: string | null
  household?: {
    lastName: string
    firstName: string
    plot?: { number: string }
  }
  createdAt: string
}

interface PendingRegistration {
  id: string
  email: string
  name: string
  status: string
  householdId: string | null
  household?: {
    lastName: string
    firstName: string
    plot?: { number: string }
  }
  requestDate: string
  notes?: string
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionNotes, setActionNotes] = useState('')
  const [editFormData, setEditFormData] = useState({
    name: '',
    role: 'owner',
    status: 'approved'
  })

  const { user: currentUser, canManageUsers } = useAuthStore()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, pendingRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/pending-registrations')
      ])
      
      if (usersRes.ok) {
        setUsers(await usersRes.json())
      }
      if (pendingRes.ok) {
        setPendingRegistrations(await pendingRes.json())
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          ...editFormData
        })
      })

      if (response.ok) {
        toast.success('Пользователь обновлён')
        setEditDialogOpen(false)
        fetchData()
      } else {
        toast.error('Ошибка при обновлении')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Ошибка при обновлении')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users?id=${selectedUser.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Пользователь удалён')
        setDeleteDialogOpen(false)
        fetchData()
      } else {
        toast.error('Ошибка при удалении')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Ошибка при удалении')
    }
  }

  const handleRegistrationAction = async (action: 'approve' | 'reject') => {
    if (!selectedRegistration) return

    try {
      const response = await fetch('/api/pending-registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRegistration.id,
          action,
          processedBy: currentUser?.id,
          notes: actionNotes
        })
      })

      if (response.ok) {
        toast.success(action === 'approve' ? 'Заявка одобрена' : 'Заявка отклонена')
        setActionDialogOpen(false)
        setSelectedRegistration(null)
        setActionNotes('')
        fetchData()
      } else {
        toast.error('Ошибка при обработке заявки')
      }
    } catch (error) {
      console.error('Error processing registration:', error)
      toast.error('Ошибка при обработке заявки')
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-700"><Shield className="h-3 w-3 mr-1" />Администратор</Badge>
      case 'accountant':
        return <Badge className="bg-blue-100 text-blue-700"><Calculator className="h-3 w-3 mr-1" />Бухгалтер</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700"><User className="h-3 w-3 mr-1" />Владелец</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700">Активен</Badge>
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700">Ожидает</Badge>
      case 'disabled':
        return <Badge className="bg-gray-100 text-gray-700">Отключён</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700">Отклонён</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (!canManageUsers()) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">У вас нет прав для управления пользователями</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Управление пользователями
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Роли, права доступа и заявки на регистрацию
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Всего</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Администраторов</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Бухгалтеров</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'accountant').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Заявок</p>
                <p className="text-2xl font-bold">{pendingRegistrations.filter(r => r.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="pending">
            Заявки
            {pendingRegistrations.filter(r => r.status === 'pending').length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white">
                {pendingRegistrations.filter(r => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Пользователь</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Домохозяйство</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Загрузка...</TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Нет пользователей
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.household ? (
                            <span>{user.household.lastName} {user.household.firstName} {user.household.plot ? `(уч. ${user.household.plot.number})` : ''}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user)
                                setEditFormData({
                                  name: user.name || '',
                                  role: user.role,
                                  status: user.status
                                })
                                setEditDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user)
                                setDeleteDialogOpen(true)
                              }}
                              disabled={user.id === currentUser?.id}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ФИО</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Домохозяйство</TableHead>
                    <TableHead>Дата заявки</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Загрузка...</TableCell>
                    </TableRow>
                  ) : pendingRegistrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Нет заявок
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingRegistrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.name}</TableCell>
                        <TableCell>{reg.email}</TableCell>
                        <TableCell>
                          {reg.household ? (
                            <span>{reg.household.lastName} {reg.household.firstName}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>{new Date(reg.requestDate).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell>{getStatusBadge(reg.status)}</TableCell>
                        <TableCell className="text-right">
                          {reg.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-600"
                                onClick={() => {
                                  setSelectedRegistration(reg)
                                  setActionDialogOpen(true)
                                }}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Одобрить
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedRegistration(reg)
                                  setActionDialogOpen(true)
                                }}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Отклонить
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Имя</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="accountant">Бухгалтер</SelectItem>
                  <SelectItem value="owner">Владелец</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Активен</SelectItem>
                  <SelectItem value="disabled">Отключён</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleEditUser} className="bg-emerald-600 hover:bg-emerald-700">Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить пользователя {selectedUser?.name || selectedUser?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Action Dialog for Registration */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRegistration?.name} ({selectedRegistration?.email})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Комментарий (необязательно)</Label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Причина отклонения или комментарий..."
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => {
              setActionDialogOpen(false)
              setSelectedRegistration(null)
              setActionNotes('')
            }}>
              Отмена
            </Button>
            <Button 
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => handleRegistrationAction('reject')}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Отклонить
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleRegistrationAction('approve')}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Одобрить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
