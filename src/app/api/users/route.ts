import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - получить всех пользователей
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    
    const where: any = {}
    
    if (role) where.role = role
    if (status) where.status = status
    
    const users = await db.user.findMany({
      where,
      include: {
        household: {
          include: { plot: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Убираем пароли
    const usersWithoutPasswords = users.map(({ password, ...user }) => user)
    
    return NextResponse.json(usersWithoutPasswords)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении пользователей' },
      { status: 500 }
    )
  }
}

// PUT - обновить пользователя
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const user = await db.user.update({
      where: { id: data.id },
      data: {
        role: data.role,
        status: data.status,
        name: data.name,
      },
      include: {
        household: {
          include: { plot: true }
        }
      }
    })
    
    const { password, ...userWithoutPassword } = user
    
    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении пользователя' },
      { status: 500 }
    )
  }
}

// DELETE - удалить пользователя
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID пользователя не указан' },
        { status: 400 }
      )
    }
    
    await db.user.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Пользователь удалён' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении пользователя' },
      { status: 500 }
    )
  }
}
