import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - получить все участки
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { address: { contains: search } },
        { cadastralNumber: { contains: search } },
      ]
    }
    
    const plots = await db.plot.findMany({
      where,
      include: {
        households: {
          where: { status: 'active' },
          select: {
            id: true,
            lastName: true,
            firstName: true,
            middleName: true,
            phone: true,
            ownershipType: true,
            isBoardMember: true,
            boardPosition: true,
          }
        },
        membershipFees: {
          where: { year: new Date().getFullYear() },
          include: {
            payments: {
              include: {
                household: {
                  select: { lastName: true, firstName: true }
                }
              }
            }
          }
        }
      },
      orderBy: { number: 'asc' }
    })
    
    // Добавляем информацию об оплате
    const currentYear = new Date().getFullYear()
    const plotsWithPaymentStatus = plots.map(plot => {
      const currentFee = plot.membershipFees.find(f => f.year === currentYear)
      const totalPaid = currentFee?.payments.reduce((sum, p) => sum + p.amount, 0) || 0
      const feeAmount = currentFee?.amount || 0
      
      return {
        ...plot,
        currentYearFee: currentFee ? {
          amount: feeAmount,
          paid: totalPaid,
          remaining: Math.max(0, feeAmount - totalPaid),
          isPaid: totalPaid >= feeAmount,
          paymentPercentage: feeAmount > 0 ? Math.round((totalPaid / feeAmount) * 100) : 0,
        } : null,
      }
    })
    
    return NextResponse.json(plotsWithPaymentStatus)
  } catch (error) {
    console.error('Error fetching plots:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении участков' },
      { status: 500 }
    )
  }
}

// POST - создать новый участок
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const plot = await db.plot.create({
      data: {
        number: data.number,
        cadastralNumber: data.cadastralNumber || null,
        area: parseFloat(data.area),
        address: data.address || null,
        status: data.status || 'active',
        electricity: data.electricity || false,
        water: data.water || false,
        gas: data.gas || false,
        notes: data.notes || null,
      }
    })
    
    // Если указана ставка взноса за сотку, создаём членский взнос
    if (data.createFee && data.feePerSotka) {
      const currentYear = new Date().getFullYear()
      await db.membershipFee.create({
        data: {
          plotId: plot.id,
          year: currentYear,
          amount: plot.area * parseFloat(data.feePerSotka),
          perSotka: true,
          description: `Членский взнос за ${currentYear} год`,
        }
      })
    }
    
    return NextResponse.json(plot)
  } catch (error: any) {
    console.error('Error creating plot:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Участок с таким номером уже существует' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Ошибка при создании участка' },
      { status: 500 }
    )
  }
}

// PUT - обновить участок
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    
    const plot = await db.plot.update({
      where: { id: data.id },
      data: {
        number: data.number,
        cadastralNumber: data.cadastralNumber || null,
        area: parseFloat(data.area),
        address: data.address || null,
        status: data.status,
        electricity: data.electricity,
        water: data.water,
        gas: data.gas,
        notes: data.notes || null,
      }
    })
    
    return NextResponse.json(plot)
  } catch (error: any) {
    console.error('Error updating plot:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Участок с таким номером уже существует' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Ошибка при обновлении участка' },
      { status: 500 }
    )
  }
}

// DELETE - удалить участок
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID участка не указан' },
        { status: 400 }
      )
    }
    
    await db.plot.delete({
      where: { id }
    })
    
    return NextResponse.json({ message: 'Участок успешно удалён' })
  } catch (error) {
    console.error('Error deleting plot:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении участка' },
      { status: 500 }
    )
  }
}
