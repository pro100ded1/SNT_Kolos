'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
  Edit, 
  Trash2, 
  Megaphone,
  AlertCircle,
  Calendar,
  Clock,
  Pin
} from 'lucide-react'
import { toast } from 'sonner'

interface Announcement {
  id: string
  title: string
  content: string
  important: boolean
  publishDate: string
  expiryDate: string | null
  status: string
  createdAt: string
}

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    important: false,
    publishDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    status: 'published',
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/announcements')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      toast.error('Ошибка при загрузке объявлений')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (announcement?: Announcement) => {
    if (announcement) {
      setSelectedAnnouncement(announcement)
      setFormData({
        title: announcement.title,
        content: announcement.content,
        important: announcement.important,
        publishDate: new Date(announcement.publishDate).toISOString().split('T')[0],
        expiryDate: announcement.expiryDate ? new Date(announcement.expiryDate).toISOString().split('T')[0] : '',
        status: announcement.status,
      })
    } else {
      setSelectedAnnouncement(null)
      setFormData({
        title: '',
        content: '',
        important: false,
        publishDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        status: 'published',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Заполните обязательные поля')
      return
    }

    try {
      const url = '/api/announcements'
      const method = selectedAnnouncement ? 'PUT' : 'POST'
      const body = selectedAnnouncement 
        ? { ...formData, id: selectedAnnouncement.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        toast.success(selectedAnnouncement ? 'Объявление обновлено' : 'Объявление создано')
        setDialogOpen(false)
        fetchAnnouncements()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при сохранении')
      }
    } catch (error) {
      console.error('Error saving announcement:', error)
      toast.error('Ошибка при сохранении')
    }
  }

  const handleDelete = async () => {
    if (!selectedAnnouncement) return

    try {
      const response = await fetch(`/api/announcements?id=${selectedAnnouncement.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Объявление удалено')
        setDeleteDialogOpen(false)
        setSelectedAnnouncement(null)
        fetchAnnouncements()
      } else {
        toast.error('Ошибка при удалении')
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Ошибка при удалении')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const activeAnnouncements = announcements.filter(a => a.status === 'published')
  const draftAnnouncements = announcements.filter(a => a.status === 'draft')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Объявления
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Управление объявлениями для членов СНТ
          </p>
        </div>
        <Button 
          onClick={() => handleOpenDialog()}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Создать объявление
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Всего объявлений</p>
                <p className="text-2xl font-bold">{announcements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Pin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Опубликованных</p>
                <p className="text-2xl font-bold text-blue-600">{activeAnnouncements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Важных</p>
                <p className="text-2xl font-bold text-amber-600">
                  {announcements.filter(a => a.important).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-16 text-center text-gray-500">
              Загрузка...
            </CardContent>
          </Card>
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Объявлений пока нет</p>
              <Button 
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleOpenDialog()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Создать первое объявление
              </Button>
            </CardContent>
          </Card>
        ) : (
          announcements.map((announcement) => (
            <Card 
              key={announcement.id} 
              className={`${announcement.important ? 'border-l-4 border-l-red-500' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.important && (
                        <Badge className="bg-red-100 text-red-700">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Важно
                        </Badge>
                      )}
                      <Badge variant="outline">
                        {announcement.status === 'published' ? 'Опубликовано' : 'Черновик'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{announcement.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Опубликовано: {formatDate(announcement.publishDate)}
                      </div>
                      {announcement.expiryDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          До: {formatDate(announcement.expiryDate)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(announcement)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAnnouncement(announcement)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              {selectedAnnouncement ? 'Редактировать объявление' : 'Новое объявление'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Заголовок *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Заголовок объявления"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Текст объявления *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Текст объявления..."
                rows={5}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="important"
                checked={formData.important}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, important: checked as boolean })
                }
              />
              <Label htmlFor="important" className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Важное объявление
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publishDate">Дата публикации</Label>
                <Input
                  id="publishDate"
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Дата окончания</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
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
                  <SelectItem value="published">Опубликовать</SelectItem>
                  <SelectItem value="draft">Черновик</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
              {selectedAnnouncement ? 'Сохранить' : 'Опубликовать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить объявление "{selectedAnnouncement?.title}"?
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
