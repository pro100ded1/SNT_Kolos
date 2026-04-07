import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    const currentYear = new Date().getFullYear()
    
    // Проверяем, есть ли уже данные
    const existingPlots = await db.plot.count()
    const existingAdmin = await db.user.findFirst({ where: { role: 'admin' } })
    
    if (existingPlots > 0 && existingAdmin) {
      return NextResponse.json({ 
        message: 'Данные уже инициализированы',
        credentials: {
          admin: { email: existingAdmin.email, password: null }
        }
      })
    }
    
    // Создаём тестовые участки
    const plots = await Promise.all([
      db.plot.create({
        data: {
          number: '1',
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
          area: 12,
          address: 'Центральная ул., д. 2',
          status: 'active',
          electricity: true,
          water: false,
        }
      }),
      db.plot.create({
        data: {
          number: '3',
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
          area: 15,
          address: 'Садовая ул., д. 1',
          status: 'active',
          electricity: true,
          water: true,
          gas: true,
        }
      }),
      db.plot.create({
        data: {
          number: '5',
          area: 10,
          address: 'Садовая ул., д. 2',
          status: 'active',
          electricity: true,
          water: true,
        }
      }),
      db.plot.create({
        data: {
          number: '6',
          area: 6,
          address: 'Садовая ул., д. 3',
          status: 'inactive',
          electricity: false,
          water: false,
        }
      }),
      db.plot.create({
        data: {
          number: '7',
          area: 12,
          address: 'Лесная ул., д. 1',
          status: 'active',
          electricity: true,
          water: true,
        }
      }),
      db.plot.create({
        data: {
          number: '8',
          area: 10,
          address: 'Лесная ул., д. 2',
          status: 'vacant',
          electricity: false,
          water: false,
        }
      }),
      db.plot.create({
        data: {
          number: '9',
          area: 14,
          address: 'Лесная ул., д. 3',
          status: 'active',
          electricity: true,
          water: true,
          gas: true,
        }
      }),
      db.plot.create({
        data: {
          number: '10',
          area: 10,
          address: 'Озёрная ул., д. 1',
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
      { plotId: plots[6].id, lastName: 'Смирнов', firstName: 'Дмитрий', middleName: 'Александрович', phone: '+7(900)777-77-77', ownershipType: 'tenant' },
      { plotId: plots[8].id, lastName: 'Попова', firstName: 'Анна', middleName: 'Сергеевна', phone: '+7(900)999-99-99', ownershipType: 'owner', isBoardMember: true, boardPosition: 'Секретарь' },
      { plotId: plots[9].id, lastName: 'Волков', firstName: 'Сергей', middleName: 'Иванович', phone: '+7(900)101-01-01', ownershipType: 'owner' },
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
    const feePerSotka = 500 // 500 руб за сотку
    
    await Promise.all(
      plots.slice(0, 10).map(plot => 
        db.membershipFee.create({
          data: {
            plotId: plot.id,
            year: currentYear,
            amount: plot.area * feePerSotka,
            perSotka: true,
            description: `Членский взнос за ${currentYear} год (${plot.area} соток × ${feePerSotka} руб.)`,
          }
        })
      )
    )
    
    // Создаём некоторые платежи
    await Promise.all([
      db.payment.create({
        data: {
          householdId: households[0].id,
          amount: plots[0].area * feePerSotka,
          paymentType: 'membership',
          paymentMethod: 'card',
          paymentDate: new Date(currentYear, 0, 15),
          periodFrom: new Date(currentYear, 0, 1),
          periodTo: new Date(currentYear, 11, 31),
        }
      }),
      db.payment.create({
        data: {
          householdId: households[1].id,
          amount: plots[1].area * feePerSotka,
          paymentType: 'membership',
          paymentMethod: 'cash',
          paymentDate: new Date(currentYear, 1, 10),
          periodFrom: new Date(currentYear, 0, 1),
          periodTo: new Date(currentYear, 11, 31),
        }
      }),
      db.payment.create({
        data: {
          householdId: households[2].id,
          amount: plots[2].area * feePerSotka,
          paymentType: 'membership',
          paymentMethod: 'transfer',
          paymentDate: new Date(currentYear, 2, 5),
          periodFrom: new Date(currentYear, 0, 1),
          periodTo: new Date(currentYear, 11, 31),
        }
      }),
      db.payment.create({
        data: {
          householdId: households[3].id,
          amount: plots[3].area * feePerSotka,
          paymentType: 'membership',
          paymentMethod: 'card',
          paymentDate: new Date(currentYear, 0, 20),
          periodFrom: new Date(currentYear, 0, 1),
          periodTo: new Date(currentYear, 11, 31),
        }
      }),
      db.payment.create({
        data: {
          householdId: households[4].id,
          amount: plots[4].area * feePerSotka,
          paymentType: 'membership',
          paymentMethod: 'cash',
          paymentDate: new Date(currentYear, 3, 1),
          periodFrom: new Date(currentYear, 0, 1),
          periodTo: new Date(currentYear, 11, 31),
        }
      }),
    ])
    
    // Создаём транзакции (доходы/расходы)
    await Promise.all([
      // Доходы
      db.transaction.create({
        data: {
          type: 'income',
          category: 'membership',
          amount: plots[0].area * feePerSotka + plots[1].area * feePerSotka + plots[2].area * feePerSotka + plots[3].area * feePerSotka + plots[4].area * feePerSotka,
          description: 'Членские взносы за год',
          transactionDate: new Date(currentYear, 0, 1),
        }
      }),
      // Расходы
      db.transaction.create({
        data: {
          type: 'expense',
          category: 'electricity',
          amount: 45000,
          description: 'Оплата электроэнергии за общие нужды',
          transactionDate: new Date(currentYear, 0, 15),
        }
      }),
      db.transaction.create({
        data: {
          type: 'expense',
          category: 'maintenance',
          amount: 30000,
          description: 'Ремонт дороги по Центральной улице',
          transactionDate: new Date(currentYear, 1, 10),
        }
      }),
      db.transaction.create({
        data: {
          type: 'expense',
          category: 'salary',
          amount: 15000,
          description: 'Зарплата сторожа',
          transactionDate: new Date(currentYear, 0, 28),
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
          title: 'Отключение электричества',
          content: 'Плановое отключение электричества 20 марта с 10:00 до 14:00 в связи с ремонтными работами.',
          important: true,
          publishDate: new Date(Date.now() - 86400000),
          expiryDate: new Date(Date.now() + 7 * 86400000),
          status: 'published',
        }
      }),
      db.announcement.create({
        data: {
          title: 'Сбор членских взносов',
          content: 'Напоминаем о необходимости оплаты членских взносов за текущий год до 1 июня.',
          important: false,
          publishDate: new Date(Date.now() - 2 * 86400000),
          status: 'published',
        }
      }),
    ])
    
    // Создаём настройки
    await Promise.all([
      db.settings.create({
        data: {
          key: 'snt_name',
          value: 'СНТ "Ромашка"',
          description: 'Название СНТ',
        }
      }),
      db.settings.create({
        data: {
          key: 'fee_per_sotka',
          value: '500',
          description: 'Ставка членского взноса за сотку',
        }
      }),
      db.settings.create({
        data: {
          key: 'current_year',
          value: currentYear.toString(),
          description: 'Текущий учётный год',
        }
      }),
    ])
    
    // Создаём администратора и бухгалтера
    let adminCredentials = { email: 'admin@snt.local', password: 'admin123' }
    let accountantCredentials = { email: 'buch@snt.local', password: 'buch123' }
    
    if (!existingAdmin) {
      const hashedAdminPassword = await bcrypt.hash(adminCredentials.password, 10)
      await db.user.create({
        data: {
          email: adminCredentials.email,
          password: hashedAdminPassword,
          name: 'Администратор СНТ',
          role: 'admin',
          status: 'approved'
        }
      })
      
      // Создаём бухгалтера
      const hashedBuchPassword = await bcrypt.hash(accountantCredentials.password, 10)
      await db.user.create({
        data: {
          email: accountantCredentials.email,
          password: hashedBuchPassword,
          name: 'Бухгалтер Мария Петровна',
          role: 'accountant',
          status: 'approved',
          householdId: households[2]?.id
        }
      })
    } else {
      adminCredentials = { email: existingAdmin.email, password: '(уже создан)' }
      accountantCredentials = { email: 'buch@snt.local', password: '(уже создан)' }
    }
    
    return NextResponse.json({ 
      message: 'Данные успешно инициализированы',
      plots: plots.length,
      households: households.length,
      credentials: {
        admin: adminCredentials,
        accountant: accountantCredentials
      }
    })
  } catch (error) {
    console.error('Error initializing data:', error)
    return NextResponse.json(
      { error: 'Ошибка при инициализации данных' },
      { status: 500 }
    )
  }
}
