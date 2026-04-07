import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - получить список заявок на регистрацию
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    
    const where: any = {}
    if (status) where.status = status
    
    const registrations = await db.pendingRegistration.findMany({
      where,
      include: {
        household: {
          include: { plot: true }
        }
      },
      orderBy: { requestDate: 'desc' }
    })
    
    // Убираем пароли из ответа
    const registrationsWithoutPasswords = registrations.map(({ password, ...reg }) => reg)
    
    return NextResponse.json(registrationsWithoutPasswords)
  } catch (error) {
    console.error('Error fetching pending registrations:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении заявок' },
      { status: 500 }
    )
  }
}

// PUT - одобрить или отклонить заявку
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, action, processedBy, notes } = data
    
    const registration = await db.pendingRegistration.findUnique({
      where: { id }
    })
    
    if (!registration) {
      return NextResponse.json(
        { error: 'Заявка не найдена' },
        { status: 404 }
      )
    }
    
    if (action === 'approve') {
      // Создаём пользователя
      const user = await db.user.create({
        data: {
          email: registration.email,
          password: registration.password,
          name: registration.name,
          householdId: registration.householdId,
          role: 'owner',
          status: 'approved'
        }
      })
      
      // Обновляем статус заявки
      await db.pendingRegistration.update({
        where: { id },
        data: {
          status: 'approved',
          processedDate: new Date(),
          processedBy,
          notes
        }
      })
      
      // Создаём уведомление для нового пользователя
      await db.notification.create({
        data: {
          userId: user.id,
          title: 'Добро пожаловать!',
          content: 'Ваш аккаунт активирован. Добро пожаловать в систему управления СНТ!',
          type: 'info'
        }
      })
      
      return NextResponse.json({ message: 'Заявка одобрена', userId: user.id })
    } else if (action === 'reject') {
      // Отклоняем заявку
      await db.pendingRegistration.update({
        where: { id },
        data: {
          status: 'rejected',
          processedDate: new Date(),
          processedBy,
          notes
        }
      })
      
      return NextResponse.json({ message: 'Заявка отклонена' })
    }
    
    return NextResponse.json(
      { error: 'Неизвестное действие' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing registration:', error)
    return NextResponse.json(
      { error: 'Ошибка при обработке заявки' },
      { status: 500 }
    )
  }
}
