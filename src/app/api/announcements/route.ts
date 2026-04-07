import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - получить все объявления
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    const announcements = await db.announcement.findMany({
      where,
      orderBy: [
        { important: 'desc' },
        { publishDate: 'desc' }
      ]
    })
    
    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении объявлений' },
      { status: 500 }
    )
  }
}

// POST - создать объявление
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const announcement = await db.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        important: data.important || false,
        publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status: data.status || 'published',
      }
    })
    
    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании объявления' },
      { status: 500 }
    )
  }
}

// PUT - обновить объявление
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const announcement = await db.announcement.update({
      where: { id: data.id },
      data: {
        title: data.title,
        content: data.content,
        important: data.important,
        publishDate: data.publishDate ? new Date(data.publishDate) : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status: data.status,
      }
    })
    
    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении объявления' },
      { status: 500 }
    )
  }
}

// DELETE - удалить объявление
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID объявления не указан' },
        { status: 400 }
      )
    }
    
    await db.announcement.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Объявление успешно удалено' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении объявления' },
      { status: 500 }
    )
  }
}
