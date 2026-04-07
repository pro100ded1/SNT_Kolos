// Login API route
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email },
      include: {
        household: {
          include: { plot: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Неверный пароль' },
        { status: 401 }
      )
    }

    if (user.status === 'pending') {
      return NextResponse.json(
        { error: 'Ваш аккаунт ожидает подтверждения администратора' },
        { status: 403 }
      )
    }

    if (user.status === 'rejected') {
      return NextResponse.json(
        { error: 'Ваш запрос на регистрацию был отклонён' },
        { status: 403 }
      )
    }

    if (user.status === 'disabled') {
      return NextResponse.json(
        { error: 'Ваш аккаунт отключён' },
        { status: 403 }
      )
    }

    // Возвращаем пользователя без пароля
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Успешный вход'
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка при входе в систему' },
      { status: 500 }
    )
  }
}
