import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const currentYear = new Date().getFullYear()
    
    // Получаем общее количество участков
    const totalPlots = await db.plot.count()
    const activePlots = await db.plot.count({
      where: { status: 'active' }
    })
    
    // Получаем количество домохозяйств
    const totalHouseholds = await db.household.count({
      where: { status: 'active' }
    })
    
    // Получаем финансовые данные за текущий год
    const startOfYear = new Date(currentYear, 0, 1)
    const endOfYear = new Date(currentYear, 11, 31)
    
    const incomeResult = await db.transaction.aggregate({
      where: {
        type: 'income',
        transactionDate: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      _sum: { amount: true }
    })
    
    const expenseResult = await db.transaction.aggregate({
      where: {
        type: 'expense',
        transactionDate: {
          gte: startOfYear,
          lte: endOfYear
        }
      },
      _sum: { amount: true }
    })
    
    const totalIncome = incomeResult._sum.amount || 0
    const totalExpense = expenseResult._sum.amount || 0
    
    // Получаем данные о взносах
    const membershipFees = await db.membershipFee.findMany({
      where: { year: currentYear },
      include: {
        plot: {
          include: {
            households: {
              where: { status: 'active' }
            }
          }
        },
        payments: true
      }
    })
    
    // Подсчитываем оплаченные и неоплаченные
    const paidPlots = new Set<string>()
    membershipFees.forEach(fee => {
      const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0)
      if (totalPaid >= fee.amount) {
        paidPlots.add(fee.plotId)
      }
    })
    
    const paidMembers = paidPlots.size
    const unpaidMembers = Math.max(0, activePlots - paidMembers)
    const collectionRate = activePlots > 0 ? Math.round((paidMembers / activePlots) * 100) : 0
    
    // Последние платежи
    const recentPayments = await db.payment.findMany({
      take: 5,
      orderBy: { paymentDate: 'desc' },
      include: {
        household: {
          include: { plot: true }
        }
      }
    })
    
    // Объявления
    const announcements = await db.announcement.findMany({
      where: {
        status: 'published',
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: new Date() } }
        ]
      },
      take: 5,
      orderBy: { publishDate: 'desc' }
    })
    
    return NextResponse.json({
      totalPlots,
      activePlots,
      totalHouseholds,
      totalPayments: await db.payment.count(),
      paidMembers,
      unpaidMembers,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      collectionRate,
      recentPayments: recentPayments.map(p => ({
        id: p.id,
        amount: p.amount,
        householdName: `${p.household.lastName} ${p.household.firstName} (уч. ${p.household.plot?.number || 'N/A'})`,
        date: p.paymentDate.toISOString(),
        type: p.paymentType
      })),
      announcements: announcements.map(a => ({
        id: a.id,
        title: a.title,
        date: a.publishDate.toISOString(),
        important: a.important
      }))
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении данных' },
      { status: 500 }
    )
  }
}
