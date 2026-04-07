import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - получить все платежи
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const householdId = searchParams.get('householdId')
    const paymentType = searchParams.get('paymentType')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    
    const where: any = {}
    
    if (householdId) {
      where.householdId = householdId
    }
    
    if (paymentType && paymentType !== 'all') {
      where.paymentType = paymentType
    }
    
    if (year) {
      const yearNum = parseInt(year)
      const startDate = new Date(yearNum, 0, 1)
      const endDate = new Date(yearNum, 11, 31)
      
      if (month) {
        const monthNum = parseInt(month)
        startDate.setMonth(monthNum)
        startDate.setDate(1)
        endDate.setMonth(monthNum + 1)
        endDate.setDate(0)
      }
      
      where.paymentDate = {
        gte: startDate,
        lte: endDate
      }
    }
    
    const payments = await db.payment.findMany({
      where,
      include: {
        household: {
          include: { plot: true }
        },
        membershipFee: true
      },
      orderBy: { paymentDate: 'desc' }
    })
    
    // Подсчитываем общую сумму
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
    
    return NextResponse.json({
      payments,
      totalAmount,
      count: payments.length
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении платежей' },
      { status: 500 }
    )
  }
}

// POST - создать платёж
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const payment = await db.payment.create({
      data: {
        householdId: data.householdId,
        membershipFeeId: data.membershipFeeId || null,
        amount: parseFloat(data.amount),
        paymentType: data.paymentType,
        paymentMethod: data.paymentMethod || 'cash',
        referenceNumber: data.referenceNumber || null,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        periodFrom: data.periodFrom ? new Date(data.periodFrom) : null,
        periodTo: data.periodTo ? new Date(data.periodTo) : null,
        notes: data.notes || null,
      },
      include: {
        household: {
          include: { plot: true }
        }
      }
    })
    
    // Создаём соответствующую транзакцию (доход)
    await db.transaction.create({
      data: {
        type: 'income',
        category: data.paymentType === 'membership' ? 'membership' : 'other',
        amount: parseFloat(data.amount),
        description: `Платёж от ${payment.household.lastName} ${payment.household.firstName} (уч. ${payment.household.plot?.number || 'N/A'})`,
        transactionDate: payment.paymentDate,
        referenceNumber: payment.referenceNumber,
      }
    })
    
    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании платежа' },
      { status: 500 }
    )
  }
}

// PUT - обновить платёж
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const payment = await db.payment.update({
      where: { id: data.id },
      data: {
        householdId: data.householdId,
        membershipFeeId: data.membershipFeeId || null,
        amount: parseFloat(data.amount),
        paymentType: data.paymentType,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || null,
        paymentDate: new Date(data.paymentDate),
        periodFrom: data.periodFrom ? new Date(data.periodFrom) : null,
        periodTo: data.periodTo ? new Date(data.periodTo) : null,
        notes: data.notes || null,
      },
      include: {
        household: {
          include: { plot: true }
        }
      }
    })
    
    return NextResponse.json(payment)
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении платежа' },
      { status: 500 }
    )
  }
}

// DELETE - удалить платёж
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID платежа не указан' },
        { status: 400 }
      )
    }
    
    // Получаем информацию о платеже перед удалением
    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        household: {
          include: { plot: true }
        }
      }
    })
    
    await db.payment.delete({
      where: { id }
    })
    
    // Удаляем соответствующую транзакцию
    if (payment) {
      await db.transaction.deleteMany({
        where: {
          type: 'income',
          amount: payment.amount,
          transactionDate: payment.paymentDate,
          description: { contains: payment.household?.lastName || '' }
        }
      })
    }
    
    return NextResponse.json({ message: 'Платёж успешно удалён' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении платежа' },
      { status: 500 }
    )
  }
}
