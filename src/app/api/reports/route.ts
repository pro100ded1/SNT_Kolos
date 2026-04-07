import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const reportType = searchParams.get('type')
    const year = searchParams.get('year') || new Date().getFullYear().toString()
    const yearNum = parseInt(year)
    
    const startOfYear = new Date(yearNum, 0, 1)
    const endOfYear = new Date(yearNum, 11, 31)
    
    let reportData: any = {}
    
    switch (reportType) {
      case 'membership':
        // Отчёт по членским взносам
        const membershipFees = await db.membershipFee.findMany({
          where: { year: yearNum },
          include: {
            plot: {
              include: {
                households: {
                  where: { status: 'active' }
                }
              }
            },
            payments: {
              include: {
                household: {
                  select: { lastName: true, firstName: true }
                }
              }
            }
          },
          orderBy: { plot: { number: 'asc' } }
        })
        
        const membershipReport = membershipFees.map(fee => {
          const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0)
          const household = fee.plot?.households[0]
          
          return {
            plotNumber: fee.plot?.number,
            plotArea: fee.plot?.area,
            owner: household ? `${household.lastName} ${household.firstName}` : 'Не указан',
            phone: household?.phone || '-',
            feeAmount: fee.amount,
            paid: totalPaid,
            remaining: Math.max(0, fee.amount - totalPaid),
            paymentPercentage: fee.amount > 0 ? Math.round((totalPaid / fee.amount) * 100) : 0,
            isPaid: totalPaid >= fee.amount,
            payments: fee.payments
          }
        })
        
        const totalFees = membershipFees.reduce((sum, f) => sum + f.amount, 0)
        const totalPaid = membershipFees.reduce((sum, f) => sum + f.payments.reduce((s, p) => s + p.amount, 0), 0)
        
        reportData = {
          title: `Отчёт по членским взносам за ${year} год`,
          generatedAt: new Date().toISOString(),
          year: yearNum,
          data: membershipReport,
          summary: {
            totalPlots: membershipFees.length,
            paidPlots: membershipReport.filter((r: any) => r.isPaid).length,
            unpaidPlots: membershipReport.filter((r: any) => !r.isPaid).length,
            totalFees,
            totalPaid,
            totalRemaining: totalFees - totalPaid,
            collectionRate: totalFees > 0 ? Math.round((totalPaid / totalFees) * 100) : 0
          }
        }
        break
        
      case 'finance':
        // Финансовый отчёт
        const transactions = await db.transaction.findMany({
          where: {
            transactionDate: {
              gte: startOfYear,
              lte: endOfYear
            }
          },
          orderBy: { transactionDate: 'asc' }
        })
        
        const incomeByCategory: Record<string, number> = {}
        const expenseByCategory: Record<string, number> = {}
        
        transactions.forEach(t => {
          if (t.type === 'income') {
            incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount
          } else {
            expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
          }
        })
        
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const totalExpense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)
        
        // Месячная разбивка
        const monthlyData: Record<number, { income: number; expense: number }> = {}
        for (let i = 0; i < 12; i++) {
          monthlyData[i] = { income: 0, expense: 0 }
        }
        
        transactions.forEach(t => {
          const month = new Date(t.transactionDate).getMonth()
          if (t.type === 'income') {
            monthlyData[month].income += t.amount
          } else {
            monthlyData[month].expense += t.amount
          }
        })
        
        reportData = {
          title: `Финансовый отчёт за ${year} год`,
          generatedAt: new Date().toISOString(),
          year: yearNum,
          transactions,
          summary: {
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            transactionCount: transactions.length
          },
          byCategory: {
            income: incomeByCategory,
            expense: expenseByCategory
          },
          monthly: Object.entries(monthlyData).map(([month, data]) => ({
            month: parseInt(month),
            monthName: new Date(yearNum, parseInt(month)).toLocaleDateString('ru-RU', { month: 'long' }),
            ...data
          }))
        }
        break
        
      case 'plots':
        // Отчёт по участкам
        const plots = await db.plot.findMany({
          include: {
            households: {
              where: { status: 'active' }
            }
          },
          orderBy: { number: 'asc' }
        })
        
        const plotsReport = plots.map(plot => ({
          number: plot.number,
          area: plot.area,
          address: plot.address,
          status: plot.status,
          electricity: plot.electricity,
          water: plot.water,
          gas: plot.gas,
          owner: plot.households[0] 
            ? `${plot.households[0].lastName} ${plot.households[0].firstName} ${plot.households[0].middleName || ''}`.trim()
            : null,
          phone: plot.households[0]?.phone || null,
          notes: plot.notes
        }))
        
        const totalArea = plots.reduce((sum, p) => sum + p.area, 0)
        
        reportData = {
          title: 'Отчёт по участкам',
          generatedAt: new Date().toISOString(),
          data: plotsReport,
          summary: {
            totalPlots: plots.length,
            activePlots: plots.filter(p => p.status === 'active').length,
            inactivePlots: plots.filter(p => p.status === 'inactive').length,
            vacantPlots: plots.filter(p => p.status === 'vacant').length,
            totalArea,
            withElectricity: plots.filter(p => p.electricity).length,
            withWater: plots.filter(p => p.water).length,
            withGas: plots.filter(p => p.gas).length
          }
        }
        break
        
      case 'debtors':
        // Отчёт по должникам
        const fees = await db.membershipFee.findMany({
          where: { year: yearNum },
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
        
        const debtors = fees
          .filter(fee => {
            const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0)
            return totalPaid < fee.amount
          })
          .map(fee => {
            const totalPaid = fee.payments.reduce((sum, p) => sum + p.amount, 0)
            const household = fee.plot?.households[0]
            
            return {
              plotNumber: fee.plot?.number,
              owner: household ? `${household.lastName} ${household.firstName}` : 'Не указан',
              phone: household?.phone || '-',
              feeAmount: fee.amount,
              paid: totalPaid,
              debt: fee.amount - totalPaid
            }
          })
          .sort((a, b) => b.debt - a.debt)
        
        const totalDebt = debtors.reduce((sum, d) => sum + d.debt, 0)
        
        reportData = {
          title: `Отчёт по должникам за ${year} год`,
          generatedAt: new Date().toISOString(),
          year: yearNum,
          data: debtors,
          summary: {
            totalDebtors: debtors.length,
            totalDebt
          }
        }
        break
        
      default:
        return NextResponse.json(
          { error: 'Неизвестный тип отчёта' },
          { status: 400 }
        )
    }
    
    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Ошибка при формировании отчёта' },
      { status: 500 }
    )
  }
}
