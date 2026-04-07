import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - получить все домохозяйства
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const plotId = searchParams.get('plotId')
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (plotId) {
      where.plotId = plotId
    }
    
    if (search) {
      where.OR = [
        { lastName: { contains: search } },
        { firstName: { contains: search } },
        { middleName: { contains: search } },
        { phone: { contains: search } },
      ]
    }
    
    const households = await db.household.findMany({
      where,
      include: {
        plot: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 5,
        }
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    })
    
    return NextResponse.json(households)
  } catch (error) {
    console.error('Error fetching households:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении домохозяйств' },
      { status: 500 }
    )
  }
}

// POST - создать домохозяйство
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const household = await db.household.create({
      data: {
        plotId: data.plotId,
        lastName: data.lastName,
        firstName: data.firstName,
        middleName: data.middleName || null,
        phone: data.phone || null,
        email: data.email || null,
        passportSeries: data.passportSeries || null,
        passportNumber: data.passportNumber || null,
        addressReg: data.addressReg || null,
        ownershipType: data.ownershipType || 'owner',
        memberSince: data.memberSince ? new Date(data.memberSince) : new Date(),
        status: data.status || 'active',
        isBoardMember: data.isBoardMember || false,
        boardPosition: data.boardPosition || null,
        notes: data.notes || null,
      },
      include: { plot: true }
    })
    
    return NextResponse.json(household)
  } catch (error) {
    console.error('Error creating household:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании домохозяйства' },
      { status: 500 }
    )
  }
}

// PUT - обновить домохозяйство
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const household = await db.household.update({
      where: { id: data.id },
      data: {
        plotId: data.plotId,
        lastName: data.lastName,
        firstName: data.firstName,
        middleName: data.middleName || null,
        phone: data.phone || null,
        email: data.email || null,
        passportSeries: data.passportSeries || null,
        passportNumber: data.passportNumber || null,
        addressReg: data.addressReg || null,
        ownershipType: data.ownershipType,
        memberSince: data.memberSince ? new Date(data.memberSince) : null,
        status: data.status,
        isBoardMember: data.isBoardMember,
        boardPosition: data.boardPosition || null,
        notes: data.notes || null,
      },
      include: { plot: true }
    })
    
    return NextResponse.json(household)
  } catch (error) {
    console.error('Error updating household:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении домохозяйства' },
      { status: 500 }
    )
  }
}

// DELETE - удалить домохозяйство
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID домохозяйства не указан' },
        { status: 400 }
      )
    }
    
    await db.household.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Домохозяйство успешно удалено' })
  } catch (error) {
    console.error('Error deleting household:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении домохозяйства' },
      { status: 500 }
    )
  }
}
