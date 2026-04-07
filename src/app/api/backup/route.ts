import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs'
import { join } from 'path'

const BACKUP_DIR = join(process.cwd(), 'backups')

// Убедимся, что директория для бэкапов существует
function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

// GET - получить список бэкапов
export async function GET() {
  try {
    ensureBackupDir()
    
    const backups = await db.backup.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // Проверяем файлы на диске
    const files = existsSync(BACKUP_DIR) ? readdirSync(BACKUP_DIR) : []
    
    return NextResponse.json({
      backups: backups.map(b => ({
        ...b,
        exists: files.includes(b.filename)
      })),
      totalSize: backups.reduce((sum, b) => sum + b.size, 0)
    })
  } catch (error) {
    console.error('Error fetching backups:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении списка резервных копий' },
      { status: 500 }
    )
  }
}

// POST - создать резервную копию
export async function POST(request: NextRequest) {
  try {
    ensureBackupDir()
    
    const data = await request.json()
    const type = data.type || 'manual'
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup-${timestamp}.json`
    const filepath = join(BACKUP_DIR, filename)
    
    // Собираем все данные
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        plots: await db.plot.findMany(),
        households: await db.household.findMany(),
        membershipFees: await db.membershipFee.findMany(),
        payments: await db.payment.findMany(),
        transactions: await db.transaction.findMany(),
        announcements: await db.announcement.findMany(),
        documents: await db.document.findMany(),
        meterReadings: await db.meterReading.findMany(),
        settings: await db.settings.findMany(),
      }
    }
    
    // Записываем файл
    const content = JSON.stringify(backupData, null, 2)
    writeFileSync(filepath, content, 'utf-8')
    
    // Получаем размер файла
    const stats = statSync(filepath)
    
    // Сохраняем запись в БД
    const backup = await db.backup.create({
      data: {
        filename,
        size: stats.size,
        type,
        status: 'completed',
        notes: data.notes || null
      }
    })
    
    // Удаляем старые автоматические бэкапы (оставляем последние 10)
    const oldAutoBackups = await db.backup.findMany({
      where: { type: 'auto' },
      orderBy: { createdAt: 'desc' },
      skip: 10
    })
    
    for (const old of oldAutoBackups) {
      const oldPath = join(BACKUP_DIR, old.filename)
      if (existsSync(oldPath)) {
        unlinkSync(oldPath)
      }
      await db.backup.delete({ where: { id: old.id } })
    }
    
    return NextResponse.json({
      message: 'Резервная копия успешно создана',
      backup: {
        ...backup,
        filepath: filename
      }
    })
  } catch (error) {
    console.error('Error creating backup:', error)
    
    // Записываем ошибку в БД
    await db.backup.create({
      data: {
        filename: `failed-${Date.now()}.json`,
        size: 0,
        type: 'manual',
        status: 'failed',
        notes: String(error)
      }
    })
    
    return NextResponse.json(
      { error: 'Ошибка при создании резервной копии' },
      { status: 500 }
    )
  }
}

// DELETE - удалить резервную копию
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID резервной копии не указан' },
        { status: 400 }
      )
    }
    
    const backup = await db.backup.findUnique({ where: { id } })
    
    if (backup) {
      const filepath = join(BACKUP_DIR, backup.filename)
      if (existsSync(filepath)) {
        unlinkSync(filepath)
      }
      await db.backup.delete({ where: { id } })
    }
    
    return NextResponse.json({ message: 'Резервная копия успешно удалена' })
  } catch (error) {
    console.error('Error deleting backup:', error)
    return NextResponse.json(
      { error: 'Ошибка при удалении резервной копии' },
      { status: 500 }
    )
  }
}
