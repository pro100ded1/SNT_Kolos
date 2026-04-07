import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - получить все транзакции
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    
    const where: any = {}
    
    if (type && type !== 'all') {
      where.type = type
    }
    
    if (category && category !== 'all') {
      where.category = category
    }
    
    if (year) {
      const yearNum = parseInt(year)
      const startDate = new Date(yearNum, 0, 1)
      const endDate = new Date(yearNum, 11, 31)
      
      if (month && month !== 'all') {
        const monthNum = parseInt(month)
        startDate.setMonth(monthNum)
        startDate.setDate(1)
        endDate.setMonth(monthNum + 1)
        endDate.setDate(0)
      }
      
      where.transactionDate = {
        gte: startDate,
        lte: endDate
      }
    }
    
    const transactions = await db.transaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' }
    })
    
    // Подсчитываем итоги
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return NextResponse.json({
      transactions,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        count: transactions.length
      }
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении транзакций' },
      { status: 500 }
    )
  }
}

// POST - создать транзакцию
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const transaction = await db.transaction.create({
      data: {
        type: data.type,
        category: data.category,
        amount: parseFloat(data.amount),
        description: data.description,
        referenceNumber: data.referenceNumber || null,
        transactionDate: data.transactionDate ? new Date(data.transactionDate) : new Date(),
        counterparty: data.counterparty || null,
        notes: data.notes || null,
      }
    })
    
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании транзакции' },
      { status: 500 }
    )
  }
}

// PUT - обновить транзакцию
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const transaction = await db.transaction.update({
      where: { id: data.id },
      data: {
        type: data.type,
        category: data.category,
        amount: parseFloat(data.amount),
        description: data.description,
        referenceNumber: data.referenceNumber || null,
        transactionDate: new Date(data.transactionDate),
        counterparty: data.counterparty || null,
        notes: data.notes || null,
      }
    })
    
    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении транзакции' },
      { status: 500 }
    )
  }
}

// DELETE - удалить транзакцию
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID транзакции не указан' },
        { status: 400 }
      )
    }
    
    await db.transaction.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Транзакция успешно удалена' })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении транзакции' },
      { status: 500 }
    )
  }
}
