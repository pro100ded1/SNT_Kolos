import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, householdId } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, пароль и имя обязательны' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли пользователь
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 400 }
      )
    }

    // Проверяем, есть ли уже заявка на регистрацию
    const existingRequest = await db.pendingRegistration.findFirst({
      where: { email, status: 'pending' }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Заявка на регистрацию уже подана. Ожидайте подтверждения администратора.' },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10)

    // Проверяем, есть ли администраторы в системе
    const adminCount = await db.user.count({
      where: { role: 'admin', status: 'approved' }
    })

    // Если это первый пользователь, делаем его администратором
    const isFirstUser = adminCount === 0

    if (isFirstUser) {
      // Создаём администратора сразу
      const user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'admin',
          status: 'approved',
          householdId: householdId || null
        },
        include: {
          household: {
            include: { plot: true }
          }
        }
      })

      const { password: _, ...userWithoutPassword } = user

      return NextResponse.json({
        user: userWithoutPassword,
        message: 'Администратор успешно создан. Вы можете войти в систему.'
      })
    } else {
      // Создаём заявку на регистрацию
      await db.pendingRegistration.create({
        data: {
          email,
          password: hashedPassword,
          name,
          householdId: householdId || null,
          status: 'pending'
        }
      })

      // Создаём уведомление для администраторов
      const admins = await db.user.findMany({
        where: { role: 'admin', status: 'approved' }
      })

      if (admins.length > 0) {
        await db.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            title: 'Новая заявка на регистрацию',
            content: `Пользователь ${name} (${email}) подал заявку на регистрацию`,
            type: 'info',
            link: '?page=users'
          }))
        })
      }

      return NextResponse.json({
        message: 'Заявка на регистрацию подана. Ожидайте подтверждения администратора.',
        pending: true
      })
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    )
  }
}
