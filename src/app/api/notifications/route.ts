import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - получить уведомления пользователя
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId обязателен' },
        { status: 400 }
      )
    }
    
    const where: any = { userId }
    if (unreadOnly === 'true') where.read = false
    
    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    
    const unreadCount = await db.notification.count({
      where: { userId, read: false }
    })
    
    return NextResponse.json({
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении уведомлений' },
      { status: 500 }
    )
  }
}

// PUT - отметить уведомление как прочитанное
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (data.markAllRead && data.userId) {
      // Отметить все как прочитанные
      await db.notification.updateMany({
        where: { userId: data.userId, read: false },
        data: { read: true }
      })
      return NextResponse.json({ message: 'Все уведомления прочитаны' })
    }
    
    if (data.id) {
      // Отметить одно уведомление
      await db.notification.update({
        where: { id: data.id },
        data: { read: true }
      })
      return NextResponse.json({ message: 'Уведомление прочитано' })
    }
    
    return NextResponse.json(
      { error: 'Не указаны параметры' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении уведомления' },
      { status: 500 }
    )
  }
}

// POST - создать уведомление
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const notification = await db.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        content: data.content,
        type: data.type || 'info',
        link: data.link
      }
    })
    
    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании уведомления' },
      { status: 500 }
    )
  }
}
