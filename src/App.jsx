import { useMemo, useState } from 'react'
import {
  UploadCloud,
  FileArchive,
  ShieldCheck,
  FileText,
  Users,
  Building2,
  CircleAlert,
  ArrowRight,
  CheckCircle2,
  Download,
  RefreshCw,
  Search,
  Landmark,
  BriefcaseBusiness,
  Handshake,
  LayoutDashboard,
  X,
  FileJson,
  Layers,
  Table as TableIcon,
  Copy,
  Check,
} from 'lucide-react'

const WEBHOOK_URL =
  'https://n8n-production-6f31d.up.railway.app/webhook/12f73dab-52bb-4a5c-b884-81a857c8b490'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'directors', label: 'Directors', icon: Users },
  { id: 'shareholders', label: 'Shareholders', icon: Landmark },
  { id: 'auditor', label: 'Auditor', icon: ShieldCheck },
  { id: 'related', label: 'Related Parties', icon: Handshake },
  { id: 'activities', label: 'Business Activities', icon: BriefcaseBusiness },
]

function valueOf(value, fallback = 'Not Found') {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function numberOf(value) {
  if (value === null || value === undefined || value === '') return '—'
  const n = Number(value)
  return Number.isFinite(n)
    ? new Intl.NumberFormat('en-IN').format(n)
    : String(value)
}

function moneyOf(value) {
  if (value === null || value === undefined || value === '' || value === 'Not Found') {
    return 'Not Found'
  }

  const n = Number(value)
  return Number.isFinite(n)
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(n)
    : String(value)
}

function objectOf(value) {
  if (Array.isArray(value)) return value[0] || {}
  return value && typeof value === 'object' ? value : {}
}

function normalizeReport(input) {
  let result = input

  if (Array.isArray(result)) result = result[0] || {}

  if (result?.data && !result.companyDetails) {
    result = result.data
  }

  if (result?.output && !result.companyDetails) {
    if (typeof result.output === 'string') {
      try {
        result = JSON.parse(result.output)
      } catch {
        result = { rawResult: result.output }
      }
    } else {
      result = result.output
    }
  }

  return result && typeof result === 'object'
    ? result
    : { rawResult: result }
}

function downloadJSON(report) {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json;charset=utf-8',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = 'company-filing-report.json'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Reusable CopyButton that displays a clean Copy icon,
 * and turns into a green Check with "Copied!" for 2 seconds.
 */
function CopyButton({ text, label = 'value', className = '' }) {
  const [copied, setCopied] = useState(false)

  if (
    text === null ||
    text === undefined ||
    text === '' ||
    text === 'Not Found' ||
    text === '—' ||
    text === 'Unknown'
  ) {
    return null
  }

  const handleCopy = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    const str = typeof text === 'object' ? JSON.stringify(text) : String(text)

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(str)
      } else {
        throw new Error('Clipboard API not available')
      }
    } catch {
      // Fallback for older browsers or non-secure contexts
      const textarea = document.createElement('textarea')
      textarea.value = str
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      try {
        document.execCommand('copy')
      } catch (err) {
        console.error('Copy fallback failed:', err)
      }
      textarea.remove()
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied to clipboard!' : `Copy ${label}`}
      aria-label={copied ? 'Copied' : `Copy ${label}`}
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium transition-all active:scale-95 ${
        copied
          ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check size={12} className="text-emerald-700 stroke-[2.5]" />
          <span className="text-[10px] font-bold text-emerald-700">Copied!</span>
        </>
      ) : (
        <Copy size={12} className="stroke-[2]" />
      )}
    </button>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs transition hover:shadow-sm">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs sm:text-sm font-medium text-slate-500">{label}</p>
          <div className="flex items-center gap-1.5 mt-1 sm:mt-2">
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950">{value}</p>
            <CopyButton text={value} label={label} />
          </div>
        </div>
        <div className="shrink-0 rounded-xl bg-blue-50 p-2 sm:p-3 text-blue-700">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, wide = false }) {
  const displayVal = valueOf(value)

  return (
    <div
      className={`group rounded-xl border border-transparent p-2 transition hover:border-slate-200 hover:bg-slate-50/70 ${
        wide ? 'sm:col-span-2' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <CopyButton text={displayVal} label={label} />
      </div>
      <p className="mt-1 break-words text-xs sm:text-sm leading-relaxed text-slate-800 font-medium">
        {displayVal}
      </p>
    </div>
  )
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || 'Search records...'}
        className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm outline-none transition focus:border-blue-500 focus:ring-3 focus:ring-blue-100"
      />
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 sm:p-10 text-center">
      <FileText size={28} className="mx-auto text-slate-400" />
      <p className="mt-2.5 font-semibold text-slate-700 text-sm sm:text-base">No records found</p>
      <p className="mt-1 text-xs sm:text-sm text-slate-500">{message}</p>
    </div>
  )
}

function getCopyText(row, column) {
  if (column.copyValue) return column.copyValue(row[column.key], row)
  const val = row[column.key]
  if (val === null || val === undefined || val === '') return ''
  if (column.render && typeof column.render === 'function') {
    const rendered = column.render(val, row)
    if (typeof rendered === 'string' || typeof rendered === 'number') {
      return String(rendered)
    }
  }
  return typeof val === 'object' ? JSON.stringify(val) : String(val)
}

function DataTable({ rows, columns, emptyMessage, renderMobileCard }) {
  const [mobileView, setMobileView] = useState('cards') // 'cards' | 'table'

  if (!rows.length) {
    return <EmptyState message={emptyMessage || 'No data available.'} />
  }

  return (
    <div className="space-y-3">
      {/* Mobile view toggle */}
      <div className="flex items-center justify-between sm:hidden">
        <span className="text-xs text-slate-500 font-medium">
          {rows.length} {rows.length === 1 ? 'record' : 'records'}
        </span>
        <div className="inline-flex items-center rounded-lg bg-slate-100 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMobileView('cards')}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
              mobileView === 'cards'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers size={13} />
            Cards
          </button>
          <button
            type="button"
            onClick={() => setMobileView('table')}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
              mobileView === 'table'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TableIcon size={13} />
            Table
          </button>
        </div>
      </div>

      {/* Mobile Cards (when mobileView === 'cards') */}
      {mobileView === 'cards' && (
        <div className="space-y-2.5 sm:hidden">
          {rows.map((row, index) =>
            renderMobileCard ? (
              renderMobileCard(row, index)
            ) : (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2"
              >
                {columns.map((column) => {
                  const val = column.render
                    ? column.render(row[column.key], row)
                    : valueOf(row[column.key], '—')
                  const copyVal = getCopyText(row, column)
                  return (
                    <div key={column.key} className="flex flex-col text-xs">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-semibold uppercase text-slate-400">
                          {column.label}
                        </span>
                        <CopyButton text={copyVal} label={column.label} />
                      </div>
                      <span className="mt-0.5 text-slate-800 break-words font-medium">
                        {val}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* Table view with per-cell CopyButton */}
      <div
        className={`${
          mobileView === 'cards' ? 'hidden sm:block' : 'block'
        } overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs`}
      >
        {/* Mobile swipe hint */}
        <div className="sm:hidden flex items-center justify-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-3 py-1.5 text-[11px] text-slate-500">
          <span>←</span>
          <span>Swipe horizontally to view all columns</span>
          <span>→</span>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-nowrap px-3.5 py-2.5 sm:px-4 sm:py-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row, index) => (
                <tr key={index} className="align-top hover:bg-slate-50/80 transition-colors">
                  {columns.map((column) => {
                    const copyVal = getCopyText(row, column)
                    return (
                      <td
                        key={column.key}
                        className="max-w-xs px-3.5 py-2.5 sm:px-4 sm:py-3 leading-relaxed text-slate-700"
                      >
                        <div className="flex items-center justify-between gap-1.5 group/cell">
                          <span className="min-w-0 break-words">
                            {column.render
                              ? column.render(row[column.key], row)
                              : valueOf(row[column.key], '—')}
                          </span>
                          <CopyButton
                            text={copyVal}
                            label={column.label}
                            className="opacity-70 group-hover/cell:opacity-100 sm:opacity-0 sm:group-hover/cell:opacity-100 transition-opacity"
                          />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [search, setSearch] = useState('')

  const data = useMemo(
    () => (report ? normalizeReport(report) : null),
    [report]
  )

  const company = objectOf(data?.companyDetails)
  const auditor = objectOf(data?.auditor)
  const excelData = objectOf(data?.excelData)

  const directors = Array.isArray(data?.directors) ? data.directors : []
  const shareholders = Array.isArray(data?.shareholders) ? data.shareholders : []
  const relatedParties = Array.isArray(data?.relatedParties)
    ? data.relatedParties
    : []
  const activities = Array.isArray(data?.businessActivities)
    ? data.businessActivities
    : []
  const transactions = Array.isArray(excelData.transactions)
    ? excelData.transactions
    : []

  function chooseFile(selectedFile) {
    if (!selectedFile) return

    if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
      setError('Please select a ZIP file.')
      setFile(null)
      return
    }

    setFile(selectedFile)
    setError('')
    setReport(null)
    setSearch('')
  }

  async function analyzeFile() {
    if (!file || loading) return

    setLoading(true)
    setError('')
    setReport(null)
    setActiveTab('overview')

    try {
      const formData = new FormData()
      formData.append('data', file)

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        body: formData,
      })

      const responseText = await response.text()

      if (!response.ok) {
        throw new Error(`Workflow failed: HTTP ${response.status}`)
      }

      let result

      try {
        result = JSON.parse(responseText)
      } catch {
        throw new Error(
          'The n8n response is not valid JSON. Check Respond to Webhook.'
        )
      }

      const normalized = normalizeReport(result)

      if (
        normalized.headers ||
        normalized.webhookUrl ||
        (normalized.body && !normalized.companyDetails)
      ) {
        throw new Error(
          'Webhook request details were returned instead of the report. Connect Respond to Webhook after Validation.'
        )
      }

      setReport(normalized)
    } catch (err) {
      setError(err.message || 'Unable to analyze this ZIP file.')
    } finally {
      setLoading(false)
    }
  }

  const filterRows = (rows) => {
    const term = search.trim().toLowerCase()
    if (!term) return rows

    return rows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(term)
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="rounded-xl bg-blue-700 p-2 text-white sm:p-2.5 shadow-xs">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold leading-tight tracking-tight">
                FileScope AI
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Company Filing Analyzer
              </p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-emerald-700 sm:px-3 sm:py-1.5">
            <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden xs:inline">Filing</span> Analysis
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl w-full flex-1 px-3.5 py-5 sm:px-6 sm:py-8 lg:py-10">
        {!report && (
          <>
            <section className="max-w-3xl">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Corporate Intelligence
              </p>
              <h2 className="mt-2 sm:mt-3 text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-950">
                Company filings,{' '}
                <span className="text-blue-700">made clear.</span>
              </h2>
              <p className="mt-2.5 sm:mt-4 text-xs sm:text-base leading-relaxed sm:leading-7 text-slate-600">
                Upload a company filing ZIP to review company details,
                directors, shareholders, auditor information, related parties
                and business activity records.
              </p>
            </section>

            <section className="mt-6 sm:mt-8 grid gap-5 sm:gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-7 shadow-xs">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5 sm:p-3 text-blue-700">
                    <UploadCloud className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base">Upload company filing</h3>
                    <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                      ZIP containing PDF, XML or Excel documents
                    </p>
                  </div>
                </div>

                <label
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setDragging(false)
                    chooseFile(event.dataTransfer.files?.[0])
                  }}
                  className={`mt-4 sm:mt-6 flex min-h-48 sm:min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 sm:p-6 text-center transition ${
                    dragging
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-300 bg-slate-50/70 hover:border-blue-500 hover:bg-blue-50/50'
                  }`}
                >
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    className="hidden"
                    onChange={(event) =>
                      chooseFile(event.target.files?.[0])
                    }
                  />

                  <FileArchive className="h-8 w-8 sm:h-11 sm:w-11 text-blue-700" />
                  <p className="mt-3 break-all font-semibold text-xs sm:text-base px-2">
                    {file ? file.name : 'Drop your ZIP file here'}
                  </p>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB selected`
                      : 'or click to browse your files'}
                  </p>
                  <span className="mt-3 sm:mt-4 rounded-xl bg-white px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-blue-700 shadow-xs border border-slate-200">
                    Choose ZIP file
                  </span>
                </label>

                {file && (
                  <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 sm:p-3 text-xs sm:text-sm">
                    <span className="truncate font-medium text-slate-800">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setError('')
                        setReport(null)
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/70 hover:text-red-600 transition"
                      aria-label="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="mt-3.5 sm:mt-4 flex items-start gap-2 text-[11px] sm:text-xs leading-5 text-slate-500">
                  <ShieldCheck
                    size={15}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  <span>
                    The ZIP is sent to your configured n8n production webhook.
                    Upload only documents you are authorized to process.
                  </span>
                </div>

                <button
                  type="button"
                  disabled={!file || loading}
                  onClick={analyzeFile}
                  className="mt-4 sm:mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-blue-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      Analyzing filing...
                    </>
                  ) : (
                    <>
                      Analyze company filing
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                {loading && (
                  <p className="mt-2.5 text-center text-xs sm:text-sm text-blue-700 animate-pulse font-medium">
                    Processing documents. Larger ZIP files may take longer.
                  </p>
                )}

                {error && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-700">
                    <CircleAlert size={18} className="mt-0.5 shrink-0" />
                    <p className="break-words leading-relaxed">{error}</p>
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
                  <h3 className="font-bold text-sm sm:text-base">What you can review</h3>
                  <div className="mt-4 sm:mt-5 space-y-3.5 sm:space-y-4">
                    {[
                      [Building2, 'Company overview', 'Identity, address and financial metrics'],
                      [Users, 'Directors & shareholders', 'Names, designations and shareholding'],
                      [ShieldCheck, 'Auditor information', 'Audit firm and credentials'],
                      [Handshake, 'Related parties', 'Relationships and transaction amounts'],
                      [BriefcaseBusiness, 'Business activities', 'Activity codes and verification status'],
                    ].map(([Icon, title, description]) => (
                      <div key={title} className="flex gap-2.5 sm:gap-3">
                        <div className="h-fit rounded-lg bg-slate-100 p-2 shrink-0">
                          <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-slate-700" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-900">{title}</p>
                          <p className="mt-0.5 text-[11px] sm:text-xs leading-relaxed text-slate-500">
                            {description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-900 p-4 sm:p-6 text-white shadow-xs">
                  <div className="flex items-center gap-2">
                    <CircleAlert size={17} className="text-amber-300" />
                    <h3 className="font-semibold text-xs sm:text-sm">Review extracted data</h3>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
                    Missing fields are marked “Not Found”. Verify important
                    values against original filings before relying on them.
                  </p>
                </div>
              </aside>
            </section>
          </>
        )}

        {report && data && (
          <>
            {/* Report Header with Copy Buttons */}
            <section className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setReport(null)
                    setFile(null)
                    setSearch('')
                    setError('')
                  }}
                  className="mb-3 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-700 hover:text-blue-900 transition"
                >
                  <ArrowRight className="rotate-180" size={15} />
                  Analyze another file
                </button>

                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  <CheckCircle2 size={14} />
                  Report generated
                </div>

                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <h2 className="break-words text-xl sm:text-3xl font-bold tracking-tight text-slate-950">
                    {valueOf(company.companyName, 'Company filing report')}
                  </h2>
                  <CopyButton text={company.companyName} label="Company Name" />
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-500">
                  <div className="inline-flex items-center gap-1">
                    <span>CIN: <strong className="font-medium text-slate-700">{valueOf(company.CIN)}</strong></span>
                    <CopyButton text={company.CIN} label="CIN" />
                  </div>
                  <span className="hidden xs:inline text-slate-300">·</span>
                  <div className="inline-flex items-center gap-1">
                    <span>Incorporated: <strong className="font-medium text-slate-700">{valueOf(company.incorporationDate)}</strong></span>
                    <CopyButton text={company.incorporationDate} label="Incorporation Date" />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => downloadJSON(report)}
                className="w-full sm:w-auto inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-[0.99] transition"
              >
                <Download size={16} />
                Download JSON
              </button>
            </section>

            {/* Stat Cards: 2 cols on mobile, 4 on desktop */}
            <section className="mt-5 sm:mt-7 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
              <StatCard
                label="Directors"
                value={numberOf(data.totalDirectors ?? directors.length)}
                icon={Users}
              />
              <StatCard
                label="Shareholders"
                value={numberOf(data.totalShareholders ?? shareholders.length)}
                icon={Landmark}
              />
              <StatCard
                label="Related parties"
                value={numberOf(data.totalRelatedParties ?? relatedParties.length)}
                icon={Handshake}
              />
              <StatCard
                label="Activities"
                value={numberOf(data.totalActivityRecords ?? activities.length)}
                icon={BriefcaseBusiness}
              />
            </section>

            {/* Navigation Tabs with smooth horizontal touch-scroll */}
            <div className="mt-6 sm:mt-8 border-b border-slate-200">
              <nav
                className="-mb-px flex gap-1 overflow-x-auto no-scrollbar touch-scroll pb-1"
                aria-label="Report sections"
              >
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActiveTab(id)
                      setSearch('')
                    }}
                    className={`inline-flex shrink-0 items-center gap-1.5 sm:gap-2 border-b-2 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                      activeTab === id
                        ? 'border-blue-700 text-blue-700'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Panels */}
            <section className="mt-5 sm:mt-6">
              {activeTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Company Details */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-7 shadow-xs">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="rounded-xl bg-blue-50 p-2.5 sm:p-3 text-blue-700">
                        <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base">Company details</h3>
                        <p className="text-xs sm:text-sm text-slate-500">
                          Identity and registered information (click Copy icon to copy any field)
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-5 grid-cols-1 sm:grid-cols-2">
                      <Field label="Company name" value={company.companyName} />
                      <Field label="CIN" value={company.CIN} />
                      <Field label="Incorporation date" value={company.incorporationDate} />
                      <Field label="PAN" value={company.PAN} />
                      <Field label="GST number" value={company.GSTNumber} />
                      <Field label="Phone" value={company.phone} />
                      <Field label="Email" value={company.email} />
                      <Field label="Website" value={company.website} />
                      <Field label="Business activity" value={company.businessActivity} />
                      <Field label="Activity code" value={company.activityCode} />
                      <Field label="Registered address" value={company.registeredAddress} wide />
                    </div>
                  </div>

                  {/* Financials & Summary */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                      <h3 className="font-bold text-sm sm:text-base">Reported financial metrics</h3>
                      <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                        Values returned by the extraction workflow
                      </p>
                      <div className="mt-4 space-y-3.5">
                        <div className="flex justify-between items-center gap-3 border-b border-slate-100 pb-2.5">
                          <span className="text-xs sm:text-sm text-slate-600">Turnover</span>
                          <div className="inline-flex items-center gap-1.5">
                            <strong className="text-right text-xs sm:text-sm font-semibold">
                              {moneyOf(company.turnover)}
                            </strong>
                            <CopyButton text={moneyOf(company.turnover)} label="Turnover" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-xs sm:text-sm text-slate-600">Net worth</span>
                          <div className="inline-flex items-center gap-1.5">
                            <strong className="text-right text-xs sm:text-sm font-semibold">
                              {moneyOf(company.netWorth)}
                            </strong>
                            <CopyButton text={moneyOf(company.netWorth)} label="Net Worth" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                      <h3 className="font-bold text-sm sm:text-base">Extraction summary</h3>
                      <div className="mt-4 space-y-3 text-xs sm:text-sm">
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-slate-600">Subsidiary company</span>
                          <div className="inline-flex items-center gap-1.5">
                            <strong>
                              {data.isSubsidiaryCompany === undefined
                                ? 'Not Found'
                                : data.isSubsidiaryCompany
                                  ? 'Yes'
                                  : 'No'}
                            </strong>
                            <CopyButton
                              text={
                                data.isSubsidiaryCompany === undefined
                                  ? 'Not Found'
                                  : data.isSubsidiaryCompany
                                    ? 'Yes'
                                    : 'No'
                              }
                              label="Subsidiary Status"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-slate-600">Subsidiaries listed</span>
                          <div className="inline-flex items-center gap-1.5">
                            <strong>{numberOf(data.subsidiaries?.length ?? 0)}</strong>
                            <CopyButton text={numberOf(data.subsidiaries?.length ?? 0)} label="Subsidiaries count" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-slate-600">Excel rows</span>
                          <div className="inline-flex items-center gap-1.5">
                            <strong>{numberOf(excelData.totalRows)}</strong>
                            <CopyButton text={numberOf(excelData.totalRows)} label="Excel rows count" />
                          </div>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <span className="text-slate-600">Transaction types</span>
                          <div className="inline-flex items-center gap-1.5">
                            <strong>{numberOf(excelData.transactionTypesFound ?? transactions.length)}</strong>
                            <CopyButton text={numberOf(excelData.transactionTypesFound ?? transactions.length)} label="Transaction types count" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 sm:p-4 text-xs sm:text-sm text-amber-900">
                    <CircleAlert size={17} className="mt-0.5 shrink-0" />
                    <p className="leading-relaxed">
                      Extracted information is not independently verified here.
                      “Not Found” does not necessarily mean the information
                      does not exist in other documents.
                    </p>
                  </div>
                </div>
              )}

              {/* Directors Tab */}
              {activeTab === 'directors' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold">Directors</h3>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {directors.length} records found
                      </p>
                    </div>
                    <SearchBox value={search} onChange={setSearch} placeholder="Search directors..." />
                  </div>

                  <DataTable
                    rows={filterRows(directors)}
                    emptyMessage="No directors match your search."
                    columns={[
                      { key: 'name', label: 'Name' },
                      { key: 'designation', label: 'Designation' },
                      { key: 'DIN', label: 'DIN' },
                      { key: 'address', label: 'Address' },
                    ]}
                    renderMobileCard={(director, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-sm text-slate-900 break-words">
                                {valueOf(director.name, 'Unnamed Director')}
                              </h4>
                              <CopyButton text={director.name} label="Name" />
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-xs font-mono text-slate-500">
                                DIN: {valueOf(director.DIN, '—')}
                              </p>
                              <CopyButton text={director.DIN} label="DIN" />
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                              {valueOf(director.designation, 'Director')}
                            </span>
                            <CopyButton text={director.designation} label="Designation" />
                          </div>
                        </div>
                        {director.address && (
                          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 break-words leading-relaxed">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[10px] font-semibold uppercase text-slate-400">
                                Address
                              </span>
                              <CopyButton text={director.address} label="Address" />
                            </div>
                            {valueOf(director.address)}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Shareholders Tab */}
              {activeTab === 'shareholders' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold">Shareholders</h3>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {shareholders.length} records found
                      </p>
                    </div>
                    <SearchBox value={search} onChange={setSearch} placeholder="Search shareholders..." />
                  </div>

                  <DataTable
                    rows={filterRows(shareholders)}
                    emptyMessage="No shareholders match your search."
                    columns={[
                      { key: 'name', label: 'Name' },
                      { key: 'shares', label: 'Shares', render: (value) => numberOf(value) },
                      {
                        key: 'shareholdingPercentage',
                        label: 'Shareholding',
                        render: (value) => (
                          <span className="font-semibold text-emerald-700">{valueOf(value, '—')}</span>
                        ),
                      },
                      { key: 'address', label: 'Address' },
                    ]}
                    renderMobileCard={(holder, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 break-words">
                              {valueOf(holder.name, 'Shareholder')}
                            </h4>
                            <CopyButton text={holder.name} label="Name" />
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                              {valueOf(holder.shareholdingPercentage, '—')}
                            </span>
                            <CopyButton text={holder.shareholdingPercentage} label="Shareholding" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className="text-slate-400">Total Shares:</span>
                          <div className="inline-flex items-center gap-1">
                            <span className="font-semibold text-slate-800">{numberOf(holder.shares)}</span>
                            <CopyButton text={holder.shares} label="Shares" />
                          </div>
                        </div>
                        {holder.address && (
                          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 break-words leading-relaxed">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[10px] font-semibold uppercase text-slate-400">
                                Address
                              </span>
                              <CopyButton text={holder.address} label="Address" />
                            </div>
                            {valueOf(holder.address)}
                          </div>
                        )}
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Auditor Tab */}
              {activeTab === 'auditor' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="rounded-xl bg-blue-50 p-2.5 sm:p-3 text-blue-700">
                      <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base">Auditor details</h3>
                      <p className="text-xs sm:text-sm text-slate-500">
                        Information from the extracted report (click Copy icon to copy any field)
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6 grid gap-3 sm:gap-5 grid-cols-1 sm:grid-cols-2">
                    <Field label="Audit firm" value={auditor.firmName} />
                    <Field label="Auditor PAN" value={auditor.PAN} />
                    <Field label="Individual auditor" value={auditor.individualAuditorName} />
                    <Field label="Membership number" value={auditor.membershipNumber} />
                    <Field label="Address" value={auditor.address} wide />
                  </div>
                </div>
              )}

              {/* Related Parties Tab */}
              {activeTab === 'related' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold">Related parties</h3>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {relatedParties.length} records found
                      </p>
                    </div>
                    <SearchBox
                      value={search}
                      onChange={setSearch}
                      placeholder="Search name or relationship..."
                    />
                  </div>

                  <DataTable
                    rows={filterRows(relatedParties)}
                    emptyMessage="No related parties match your search."
                    columns={[
                      { key: 'name', label: 'Name / Entity' },
                      { key: 'relationship', label: 'Relationship' },
                      { key: 'purchases', label: 'Purchases', render: moneyOf },
                      { key: 'sales', label: 'Sales', render: moneyOf },
                      { key: 'expenses', label: 'Expenses', render: moneyOf },
                      { key: 'contributions', label: 'Contributions', render: moneyOf },
                      { key: 'amountPayable', label: 'Payable', render: moneyOf },
                      { key: 'amountReceivable', label: 'Receivable', render: moneyOf },
                    ]}
                    renderMobileCard={(party, index) => (
                      <div
                        key={index}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 break-words">
                              {valueOf(party.name, 'Related Entity')}
                            </h4>
                            <CopyButton text={party.name} label="Entity Name" />
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                              {valueOf(party.relationship, 'Related Party')}
                            </span>
                            <CopyButton text={party.relationship} label="Relationship" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                          {[
                            ['Purchases', moneyOf(party.purchases), 'text-slate-800'],
                            ['Sales', moneyOf(party.sales), 'text-slate-800'],
                            ['Expenses', moneyOf(party.expenses), 'text-slate-800'],
                            ['Contributions', moneyOf(party.contributions), 'text-slate-800'],
                            ['Payable', moneyOf(party.amountPayable), 'text-red-600'],
                            ['Receivable', moneyOf(party.amountReceivable), 'text-emerald-600'],
                          ].map(([lbl, amt, colClass]) => (
                            <div key={lbl} className="bg-slate-50 p-2 rounded-lg flex flex-col justify-between">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] text-slate-500">{lbl}</span>
                                <CopyButton text={amt} label={lbl} />
                              </div>
                              <span className={`font-semibold mt-0.5 ${colClass}`}>{amt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  />

                  {transactions.length > 0 && (
                    <details className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs">
                      <summary className="cursor-pointer font-semibold text-xs sm:text-sm select-none">
                        Detailed Excel transactions ({transactions.length} types)
                      </summary>
                      <div className="mt-3.5 sm:mt-4 space-y-3.5">
                        {transactions.map((transaction, index) => (
                          <div
                            key={`${transaction.xbrlTag || transaction.transactionType}-${index}`}
                            className="rounded-xl border border-slate-200 p-3 sm:p-4 bg-slate-50/50"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-800">
                                {valueOf(transaction.transactionType, transaction.xbrlTag)}
                              </h4>
                              <CopyButton
                                text={valueOf(transaction.transactionType, transaction.xbrlTag)}
                                label="Transaction Type"
                              />
                            </div>
                            <div className="mt-2.5 overflow-x-auto touch-scroll">
                              <table className="min-w-full text-left text-[11px] sm:text-xs">
                                <thead>
                                  <tr className="text-slate-500 border-b border-slate-200">
                                    <th className="py-1.5 pr-3 font-semibold">Related party</th>
                                    <th className="py-1.5 pr-3 font-semibold">Financial year</th>
                                    <th className="py-1.5 pr-3 font-semibold">Amount</th>
                                    <th className="py-1.5 font-semibold">Mapping</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {(transaction.entries || []).map((entry, entryIndex) => (
                                    <tr
                                      key={`${entry.relatedParty}-${entry.financialYear}-${entryIndex}`}
                                      className="hover:bg-white/80"
                                    >
                                      <td className="py-1.5 pr-3 text-slate-800">
                                        <div className="flex items-center justify-between gap-1">
                                          <span>{valueOf(entry.relatedParty, '—')}</span>
                                          <CopyButton text={entry.relatedParty} label="Party" />
                                        </div>
                                      </td>
                                      <td className="py-1.5 pr-3 text-slate-600">
                                        <div className="flex items-center justify-between gap-1">
                                          <span>{valueOf(entry.financialYear, '—')}</span>
                                          <CopyButton text={entry.financialYear} label="Year" />
                                        </div>
                                      </td>
                                      <td className="py-1.5 pr-3 font-medium text-slate-900">
                                        <div className="flex items-center justify-between gap-1">
                                          <span>{moneyOf(entry.amount)}</span>
                                          <CopyButton text={moneyOf(entry.amount)} label="Amount" />
                                        </div>
                                      </td>
                                      <td className="py-1.5 text-slate-500">
                                        <div className="flex items-center justify-between gap-1">
                                          <span>{valueOf(entry.mappingStatus, '—')}</span>
                                          <CopyButton text={entry.mappingStatus} label="Mapping" />
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {/* Business Activities Tab */}
              {activeTab === 'activities' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold">Business activities</h3>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {activities.length} activity records found
                      </p>
                    </div>
                    <SearchBox
                      value={search}
                      onChange={setSearch}
                      placeholder="Search activity or code..."
                    />
                  </div>

                  <DataTable
                    rows={filterRows(activities)}
                    emptyMessage="No activities match your search."
                    columns={[
                      { key: 'activityCode4Digit', label: 'Activity code' },
                      { key: 'activityCodeDefinition', label: 'Activity definition' },
                      { key: 'itcCode8Digit', label: 'ITC code' },
                      { key: 'itcCodeDescription', label: 'ITC description' },
                      {
                        key: 'descriptionVerificationStatus',
                        label: 'Verification',
                        render: (value) => {
                          const status = valueOf(value, 'Unknown')
                          const verified = status.toLowerCase() === 'verified'
                          return (
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                verified
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {status}
                            </span>
                          )
                        },
                      },
                    ]}
                    renderMobileCard={(activity, index) => {
                      const status = valueOf(activity.descriptionVerificationStatus, 'Unknown')
                      const verified = status.toLowerCase() === 'verified'
                      return (
                        <div
                          key={index}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md">
                                Code: {valueOf(activity.activityCode4Digit, '—')}
                              </span>
                              <CopyButton text={activity.activityCode4Digit} label="Activity Code" />
                            </div>
                            <div className="flex items-center gap-1">
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  verified
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                {status}
                              </span>
                              <CopyButton text={status} label="Status" />
                            </div>
                          </div>

                          <div className="text-xs leading-relaxed text-slate-800">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="text-[10px] font-semibold uppercase text-slate-400">
                                Activity Definition
                              </span>
                              <CopyButton text={activity.activityCodeDefinition} label="Activity Definition" />
                            </div>
                            {valueOf(activity.activityCodeDefinition, '—')}
                          </div>

                          {(activity.itcCode8Digit || activity.itcCodeDescription) && (
                            <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] uppercase text-slate-400 font-semibold">ITC Code:</span>
                                  <span className="font-mono font-medium text-slate-800">{valueOf(activity.itcCode8Digit, '—')}</span>
                                </div>
                                <CopyButton text={activity.itcCode8Digit} label="ITC Code" />
                              </div>
                              <div className="flex items-start justify-between gap-1">
                                <p className="text-[11px] text-slate-500 leading-snug">
                                  {valueOf(activity.itcCodeDescription, '—')}
                                </p>
                                <CopyButton text={activity.itcCodeDescription} label="ITC Description" />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                </div>
              )}
            </section>

            {/* Bottom Download Banner */}
            <section className="mt-6 sm:mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="rounded-xl bg-slate-100 p-2.5 sm:p-3 text-slate-700 shrink-0">
                  <FileJson className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
                </div>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm">Download the full report</h3>
                  <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                    Includes the complete JSON response, even fields not shown in these tables.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => downloadJSON(report)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-slate-800 active:scale-[0.99] transition shrink-0"
              >
                <Download size={16} />
                Download JSON
              </button>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-3.5 py-4 text-center sm:text-left text-[11px] sm:text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>FileScope AI · Company Filing Analyzer</p>
          <p>Verify extracted information against original source documents.</p>
        </div>
      </footer>
    </div>
  )
}
