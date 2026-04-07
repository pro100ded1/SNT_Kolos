import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Check if admin exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' }
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@snt.local',
        password: hashedPassword,
        name: 'Администратор СНТ',
        role: 'admin',
        status: 'approved'
      }
    })
    console.log('Admin created:', admin.email)

    // Create accountant
    const hashedBuchPassword = await bcrypt.hash('buch123', 10)
    const accountant = await prisma.user.create({
      data: {
        email: 'buch@snt.local',
        password: hashedBuchPassword,
        name: 'Бухгалтер Мария Петровна',
        role: 'accountant',
        status: 'approved'
      }
    })
    console.log('Accountant created:', accountant.email)
  } else {
    console.log('Admin already exists:', existingAdmin.email)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
