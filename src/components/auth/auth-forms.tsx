'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TreeDeciduous, Loader2, LogIn, UserPlus, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'

interface AuthFormsProps {
  onSuccess: () => void
}

export function AuthForms({ onSuccess }: AuthFormsProps) {
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [registrationPending, setRegistrationPending] = useState(false)
  
  const { setUser } = useAuthStore()
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginData.email || !loginData.password) {
      toast.error('Заполните все поля')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        toast.success('Вход выполнен успешно!')
        onSuccess()
      } else {
        toast.error(data.error || 'Ошибка при входе')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Ошибка при входе в систему')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!registerData.email || !registerData.password || !registerData.name) {
      toast.error('Заполните обязательные поля')
      return
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Пароли не совпадают')
      return
    }
    
    if (registerData.password.length < 6) {
      toast.error('Пароль должен быть не менее 6 символов')
      return
    }
    
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          name: registerData.name
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        if (data.pending) {
          setRegistrationPending(true)
          toast.success(data.message)
        } else {
          setUser(data.user)
          toast.success(data.message)
          onSuccess()
        }
      } else {
        toast.error(data.error || 'Ошибка при регистрации')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Ошибка при регистрации')
    } finally {
      setLoading(false)
    }
  }

  if (registrationPending) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Заявка отправлена</h3>
          <p className="text-gray-500 mb-4">
            Ваша заявка на регистрацию отправлена администратору. 
            После подтверждения вы получите уведомление на email.
          </p>
          <Button variant="outline" onClick={() => {
            setRegistrationPending(false)
            setActiveTab('login')
          }}>
            Вернуться к входу
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <TreeDeciduous className="h-8 w-8 text-emerald-600" />
        </div>
        <CardTitle className="text-2xl">СНТ Управление</CardTitle>
        <CardDescription>Войдите или зарегистрируйтесь</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Вход</TabsTrigger>
            <TabsTrigger value="register">Регистрация</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="email@example.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Вход...</>
                ) : (
                  <><LogIn className="h-4 w-4 mr-2" /> Войти</>
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">ФИО *</Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="Иванов Иван Иванович"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email *</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="email@example.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Пароль *</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Минимум 6 символов"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm">Подтвердите пароль *</Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  placeholder="Повторите пароль"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Регистрация...</>
                ) : (
                  <><UserPlus className="h-4 w-4 mr-2" /> Зарегистрироваться</>
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                После регистрации администратор должен подтвердить ваш аккаунт
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
