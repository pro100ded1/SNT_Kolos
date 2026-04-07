import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Проверяем, есть ли уже администратор
    const existingAdmin = await db.user.findFirst({
      where: { role: 'admin' }
    })

    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Администратор уже существует',
        credentials: {
          email: existingAdmin.email,
          password: null
        }
      })
    }

    // Создаём администратора
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    const admin = await db.user.create({
      data: {
        email: 'admin@snt.local',
        password: hashedPassword,
        name: 'Администратор СНТ',
        role: 'admin',
        status: 'approved'
      }
    })

    // Создаём тестовые данные если их нет
    const plotsCount = await db.plot.count()
    
    if (plotsCount === 0) {
      const currentYear = new Date().getFullYear()
      
      // Создаём тестовые участки
      const plots = await Promise.all([
        db.plot.create({
          data: {
            number: '1',
            cadastralNumber: '50:20:0010203:1234',
            area: 10,
            address: 'Центральная ул., д. 1',
            status: 'active',
            electricity: true,
            water: true,
          }
        }),
        db.plot.create({
          data: {
            number: '2',
            cadastralNumber: '50:20:0010203:1235',
            area: 12,
            address: 'Центральная ул., д. 2',
            status: 'active',
            electricity: true,
            water: true,
          }
        }),
        db.plot.create({
          data: {
            number: '3',
            cadastralNumber: '50:20:0010203:1236',
            area: 8,
            address: 'Центральная ул., д. 3',
            status: 'active',
            electricity: true,
            water: true,
          }
        }),
        db.plot.create({
          data: {
            number: '4',
            cadastralNumber: '50:20:0010203:1237',
            area: 15,
            address: 'Садовая ул., д. 1',
            status: 'active',
            electricity: true,
            water: true,
          }
        }),
        db.plot.create({
          data: {
            number: '5',
            cadastralNumber: '50:20:0010203:1238',
            area: 10,
            address: 'Садовая ул., д. 2',
            status: 'active',
            electricity: true,
            water: true,
          }
        }),
      ])

      // Создаём домохозяйства
      const householdsData = [
        { plotId: plots[0].id, lastName: 'Иванов', firstName: 'Иван', middleName: 'Иванович', phone: '+7(900)111-11-11', ownershipType: 'owner', isBoardMember: true, boardPosition: 'Председатель' },
        { plotId: plots[1].id, lastName: 'Петров', firstName: 'Пётр', middleName: 'Петрович', phone: '+7(900)222-22-22', ownershipType: 'owner' },
        { plotId: plots[2].id, lastName: 'Сидорова', firstName: 'Мария', middleName: 'Сидоровна', phone: '+7(900)333-33-33', ownershipType: 'owner', isBoardMember: true, boardPosition: 'Казначей' },
        { plotId: plots[3].id, lastName: 'Козлов', firstName: 'Александр', middleName: 'Николаевич', phone: '+7(900)444-44-44', ownershipType: 'owner' },
        { plotId: plots[4].id, lastName: 'Николаева', firstName: 'Елена', middleName: 'Владимировна', phone: '+7(900)555-55-55', ownershipType: 'owner' },
      ]

      const households = await Promise.all(
        householdsData.map(data => 
          db.household.create({
            data: {
              ...data,
              memberSince: new Date(2020, 0, 1),
              status: 'active',
            }
          })
        )
      )

      // Создаём членские взносы
      const feePerSotka = 500
      
      await Promise.all(
        plots.map(plot => 
          db.membershipFee.create({
            data: {
              plotId: plot.id,
              year: currentYear,
              amount: plot.area * feePerSotka,
              perSotka: true,
              description: `Членский взнос за ${currentYear} год`,
            }
          })
        )
      )

      // Создаём тестового бухгалтера
      const accountantPassword = await bcrypt.hash('buch123', 10)
      await db.user.create({
        data: {
          email: 'buch@snt.local',
          password: accountantPassword,
          name: 'Бухгалтер Мария Петровна',
          role: 'accountant',
          status: 'approved',
          householdId: households[2].id
        }
      })

      // Создаём несколько платежей
      await Promise.all([
        db.payment.create({
          data: {
            householdId: households[0].id,
            amount: plots[0].area * feePerSotka,
            paymentType: 'membership',
            paymentMethod: 'card',
            paymentDate: new Date(currentYear, 0, 15),
          }
        }),
        db.payment.create({
          data: {
            householdId: households[1].id,
            amount: plots[1].area * feePerSotka,
            paymentType: 'membership',
            paymentMethod: 'cash',
            paymentDate: new Date(currentYear, 1, 10),
          }
        }),
        db.payment.create({
          data: {
            householdId: households[2].id,
            amount: plots[2].area * feePerSotka,
            paymentType: 'membership',
            paymentMethod: 'transfer',
            paymentDate: new Date(currentYear, 2, 5),
          }
        }),
      ])

      // Создаём финансовые операции
      await Promise.all([
        db.transaction.create({
          data: {
            type: 'income',
            category: 'membership',
            amount: 25000,
            description: 'Членские взносы за Q1',
            transactionDate: new Date(currentYear, 2, 31),
          }
        }),
        db.transaction.create({
          data: {
            type: 'expense',
            category: 'electricity',
            amount: 15000,
            description: 'Оплата электроэнергии за общие нужды',
            transactionDate: new Date(currentYear, 0, 15),
          }
        }),
        db.transaction.create({
          data: {
            type: 'expense',
            category: 'maintenance',
            amount: 10000,
            description: 'Ремонт дороги',
            transactionDate: new Date(currentYear, 1, 20),
          }
        }),
      ])

      // Создаём объявления
      await Promise.all([
        db.announcement.create({
          data: {
            title: 'Важное собрание членов СНТ',
            content: 'Приглашаем всех членов СНТ на годовое собрание, которое состоится 15 апреля в 14:00 на территории товарищества.',
            important: true,
            publishDate: new Date(),
            status: 'published',
          }
        }),
        db.announcement.create({
          data: {
            title: 'Напоминание об оплате взносов',
            content: 'Напоминаем о необходимости оплаты членских взносов за текущий год до 1 июня.',
            important: false,
            publishDate: new Date(Date.now() - 86400000),
            status: 'published',
          }
        }),
      ])
    }

    const { password: _, ...adminWithoutPassword } = admin

    return NextResponse.json({
      message: 'Администратор и тестовые данные созданы',
      credentials: {
        email: 'admin@snt.local',
        password: 'admin123'
      },
      accountant: {
        email: 'buch@snt.local',
        password: 'buch123'
      },
      admin: adminWithoutPassword
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании администратора' },
      { status: 500 }
    )
  }
}
