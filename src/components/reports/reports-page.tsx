'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { 
  FileBarChart,
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Download,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface ReportData {
  title: string
  generatedAt: string
  year?: number
  data: any[]
  summary: any
}

const reportTypes = [
  { 
    id: 'membership', 
    name: 'Отчёт по членским взносам', 
    icon: Users,
    description: 'Состояние оплаты членских взносов по участкам'
  },
  { 
    id: 'finance', 
    name: 'Финансовый отчёт', 
    icon: TrendingUp,
    description: 'Доходы, расходы и баланс за период'
  },
  { 
    id: 'plots', 
    name: 'Отчёт по участкам', 
    icon: MapPin,
    description: 'Сводная информация по всем участкам'
  },
  { 
    id: 'debtors', 
    name: 'Отчёт по должникам', 
    icon: AlertTriangle,
    description: 'Список участков с задолженностью по взносам'
  },
]

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string>('membership')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  useEffect(() => {
    generateReport()
  }, [selectedReport, selectedYear])

  const generateReport = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('type', selectedReport)
      params.append('year', selectedYear)
      
      const response = await fetch(`/api/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Ошибка при формировании отчёта')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  const exportToCSV = () => {
    if (!reportData || !reportData.data) return

    let csvContent = ''
    
    // Headers based on report type
    if (selectedReport === 'membership') {
      csvContent = 'Номер участка;Площадь;Владелец;Телефон;Сумма взноса;Оплачено;Остаток;Статус\n'
      reportData.data.forEach((row: any) => {
        csvContent += `${row.plotNumber};${row.plotArea};${row.owner};${row.phone};${row.feeAmount};${row.paid};${row.remaining};${row.isPaid ? 'Оплачено' : 'Не оплачено'}\n`
      })
    } else if (selectedReport === 'debtors') {
      csvContent = 'Номер участка;Владелец;Телефон;Сумма взноса;Оплачено;Задолженность\n'
      reportData.data.forEach((row: any) => {
        csvContent += `${row.plotNumber};${row.owner};${row.phone};${row.feeAmount};${row.paid};${row.debt}\n`
      })
    } else if (selectedReport === 'finance') {
      csvContent = 'Дата;Тип;Категория;Описание;Сумма\n'
      reportData.transactions.forEach((row: any) => {
        csvContent += `${formatDate(row.transactionDate)};${row.type === 'income' ? 'Доход' : 'Расход'};${row.category};${row.description};${row.amount}\n`
      })
    } else if (selectedReport === 'plots') {
      csvContent = 'Номер участка;Площадь;Адрес;Статус;Владелец;Телефон;Электричество;Вода;Газ\n'
      reportData.data.forEach((row: any) => {
        csvContent += `${row.number};${row.area};${row.address || ''};${row.status};${row.owner || ''};${row.phone || ''};${row.electricity ? 'Да' : 'Нет'};${row.water ? 'Да' : 'Нет'};${row.gas ? 'Да' : 'Нет'}\n`
      })
    }

    // Download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${reportData.title.replace(/\s+/g, '_')}.csv`
    link.click()
  }

  const renderMembershipReport = () => {
    if (!reportData || !reportData.data) return null
    
    const summary = reportData.summary || {
      totalPlots: 0,
      paidPlots: 0,
      unpaidPlots: 0,
      collectionRate: 0
    }
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Всего участков</p>
              <p className="text-2xl font-bold">{summary.totalPlots}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Оплатили</p>
              <p className="text-2xl font-bold text-emerald-600">{summary.paidPlots}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Не оплатили</p>
              <p className="text-2xl font-bold text-red-600">{summary.unpaidPlots}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Процент сбора</p>
              <p className="text-2xl font-bold">{summary.collectionRate}%</p>
              <Progress value={summary.collectionRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Участок</TableHead>
                  <TableHead>Площадь</TableHead>
                  <TableHead>Владелец</TableHead>
                  <TableHead>Сумма взноса</TableHead>
                  <TableHead>Оплачено</TableHead>
                  <TableHead>Остаток</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.data && reportData.data.length > 0 ? (
                  reportData.data.map((row: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">№{row.plotNumber}</TableCell>
                      <TableCell>{row.plotArea} соток</TableCell>
                      <TableCell>{row.owner}</TableCell>
                      <TableCell>{formatCurrency(row.feeAmount)}</TableCell>
                      <TableCell className="text-emerald-600">{formatCurrency(row.paid)}</TableCell>
                      <TableCell className={row.remaining > 0 ? 'text-red-600' : 'text-gray-400'}>
                        {formatCurrency(row.remaining)}
                      </TableCell>
                      <TableCell>
                        <Badge className={row.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                          {row.isPaid ? 'Оплачено' : 'Не оплачено'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Нет данных
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderDebtorsReport = () => {
    if (!reportData || !reportData.data) return null
    
    const summary = reportData.summary || {
      totalDebtors: 0,
      totalDebt: 0
    }
    
    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Всего должников</p>
              <p className="text-2xl font-bold text-red-600">{summary.totalDebtors}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Общая задолженность</p>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.totalDebt)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Участок</TableHead>
                  <TableHead>Владелец</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Сумма взноса</TableHead>
                  <TableHead>Оплачено</TableHead>
                  <TableHead className="text-red-600">Задолженность</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!reportData.data || reportData.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Задолженности отсутствуют
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData.data.map((row: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">№{row.plotNumber}</TableCell>
                      <TableCell>{row.owner}</TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>{formatCurrency(row.feeAmount)}</TableCell>
                      <TableCell className="text-emerald-600">{formatCurrency(row.paid)}</TableCell>
                      <TableCell className="font-semibold text-red-600">{formatCurrency(row.debt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderFinanceReport = () => {
    if (!reportData) return null
    
    const summary = reportData.summary || {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0
    }
    
    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Доходы</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalIncome)}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Расходы</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Баланс</p>
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(summary.balance)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-500">
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Операций</p>
              <p className="text-2xl font-bold">{summary.transactionCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly breakdown */}
        {reportData.monthly && reportData.monthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Помесячная разбивка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {reportData.monthly.map((month: any) => (
                <div key={month.month} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <p className="text-xs text-gray-500 capitalize">{month.monthName}</p>
                  <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(month.income)}</p>
                  <p className="text-sm font-semibold text-red-600">-{formatCurrency(month.expense)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Операции за период</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.transactions && reportData.transactions.length > 0 ? (
                    reportData.transactions.map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell>{formatDate(row.transactionDate)}</TableCell>
                        <TableCell>
                          <Badge className={row.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                            {row.type === 'income' ? 'Доход' : 'Расход'}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell className="max-w-xs truncate">{row.description}</TableCell>
                        <TableCell className={`text-right font-semibold ${row.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.type === 'income' ? '+' : '-'}{formatCurrency(row.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Нет транзакций за выбранный период
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPlotsReport = () => {
    if (!reportData || !reportData.data) return null
    
    const summary = reportData.summary || {
      totalPlots: 0,
      activePlots: 0,
      totalArea: 0,
      withElectricity: 0
    }
    
    return (
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Всего участков</p>
              <p className="text-2xl font-bold">{summary.totalPlots}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Активных</p>
              <p className="text-2xl font-bold text-emerald-600">{summary.activePlots}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Общая площадь</p>
              <p className="text-2xl font-bold">{summary.totalArea} соток</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">С электричеством</p>
              <p className="text-2xl font-bold text-amber-600">{summary.withElectricity}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Участок</TableHead>
                  <TableHead>Площадь</TableHead>
                  <TableHead>Адрес</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Владелец</TableHead>
                  <TableHead>Коммуникации</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.data && reportData.data.length > 0 ? (
                  reportData.data.map((row: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">№{row.number}</TableCell>
                      <TableCell>{row.area} соток</TableCell>
                      <TableCell>{row.address || '-'}</TableCell>
                      <TableCell>
                        <Badge className={
                          row.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          row.status === 'vacant' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {row.status === 'active' ? 'Активен' : row.status === 'vacant' ? 'Пустой' : 'Неактивен'}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.owner || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {row.electricity && <Badge variant="outline">Электр.</Badge>}
                          {row.water && <Badge variant="outline">Вода</Badge>}
                          {row.gas && <Badge variant="outline">Газ</Badge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Нет данных
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderReport = () => {
    switch (selectedReport) {
      case 'membership':
        return renderMembershipReport()
      case 'debtors':
        return renderDebtorsReport()
      case 'finance':
        return renderFinanceReport()
      case 'plots':
        return renderPlotsReport()
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Отчёты
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Формирование аналитических отчётов
          </p>
        </div>
        <Button 
          onClick={exportToCSV}
          variant="outline"
          disabled={!reportData || loading}
        >
          <Download className="h-4 w-4 mr-2" />
          Экспорт в CSV
        </Button>
      </div>

      {/* Report Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((type) => (
          <Card 
            key={type.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedReport === type.id 
                ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                : ''
            }`}
            onClick={() => setSelectedReport(type.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  selectedReport === type.id 
                    ? 'bg-emerald-100 dark:bg-emerald-900/50' 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <type.icon className={`h-5 w-5 ${
                    selectedReport === type.id ? 'text-emerald-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <p className="font-medium">{type.name}</p>
                  <p className="text-xs text-gray-500">{type.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Year Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Год:</span>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="mt-4 text-gray-500">Формирование отчёта...</p>
          </CardContent>
        </Card>
      ) : reportData ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {reportData.title}
            </CardTitle>
            <CardDescription>
              Сформирован: {formatDate(reportData.generatedAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderReport()}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
