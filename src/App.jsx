
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

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
          <Icon size={21} />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, wide = false }) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm leading-6 text-slate-800">
        {valueOf(value)}
      </p>
    </div>
  )
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search
        size={17}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || 'Search records...'}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <FileText size={32} className="mx-auto text-slate-400" />
      <p className="mt-3 font-semibold text-slate-700">No records found</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  )
}

function DataTable({ rows, columns, emptyMessage }) {
  if (!rows.length) {
    return <EmptyState message={emptyMessage || 'No data available.'} />
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr
                key={index}
                className="align-top hover:bg-slate-50"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="max-w-xs px-4 py-3 leading-6 text-slate-700"
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : valueOf(row[column.key], '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-700 p-2.5 text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold">FileScope AI</h1>
              <p className="text-xs text-slate-500">
                Company Filing Analyzer
              </p>
            </div>
          </div>

          <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Filing analysis
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {!report && (
          <>
            <section className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Corporate intelligence
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Company filings,{' '}
                <span className="text-blue-700">made clear.</span>
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Upload a company filing ZIP to review company details,
                directors, shareholders, auditor information, related parties
                and business activity records.
              </p>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">Upload company filing</h3>
                    <p className="mt-1 text-sm text-slate-500">
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
                  className={`mt-6 flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                    dragging
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-300 bg-slate-50 hover:border-blue-500 hover:bg-blue-50/50'
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

                  <FileArchive size={42} className="text-blue-700" />
                  <p className="mt-4 break-all font-semibold">
                    {file ? file.name : 'Drop your ZIP file here'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(2)} MB selected`
                      : 'or click to browse your computer'}
                  </p>
                  <span className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                    Choose ZIP file
                  </span>
                </label>

                {file && (
                  <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null)
                        setError('')
                        setReport(null)
                      }}
                      className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-red-600"
                      aria-label="Remove file"
                    >
                      <X size={17} />
                    </button>
                  </div>
                )}

                <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
                  <ShieldCheck
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  The ZIP is sent to your configured n8n production webhook.
                  Upload only documents you are authorized to process.
                </div>

                <button
                  type="button"
                  disabled={!file || loading}
                  onClick={analyzeFile}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Analyzing filing...
                    </>
                  ) : (
                    <>
                      Analyze company filing
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {loading && (
                  <p className="mt-3 text-center text-sm text-blue-700">
                    Processing documents. Larger ZIP files may take longer.
                  </p>
                )}

                {error && (
                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <CircleAlert size={19} className="mt-0.5 shrink-0" />
                    <p className="break-words">{error}</p>
                  </div>
                )}
              </div>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-bold">What you can review</h3>
                  <div className="mt-5 space-y-4">
                    {[
                      [Building2, 'Company overview', 'Identity, address and financial metrics'],
                      [Users, 'Directors & shareholders', 'Names, designations and shareholding'],
                      [ShieldCheck, 'Auditor information', 'Audit firm and credentials'],
                      [Handshake, 'Related parties', 'Relationships and transaction amounts'],
                      [BriefcaseBusiness, 'Business activities', 'Activity codes and verification status'],
                    ].map(([Icon, title, description]) => (
                      <div key={title} className="flex gap-3">
                        <div className="h-fit rounded-lg bg-slate-100 p-2">
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-900 p-6 text-white">
                  <div className="flex items-center gap-2">
                    <CircleAlert size={19} className="text-amber-300" />
                    <h3 className="font-semibold">Review extracted data</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
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
            <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    setReport(null)
                    setFile(null)
                    setSearch('')
                    setError('')
                  }}
                  className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  <ArrowRight className="rotate-180" size={16} />
                  Analyze another file
                </button>

                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  <CheckCircle2 size={15} />
                  Report generated
                </div>

                <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  {valueOf(company.companyName, 'Company filing report')}
                </h2>
                <p className="mt-2 break-words text-sm text-slate-500">
                  CIN: {valueOf(company.CIN)} · Incorporated:{' '}
                  {valueOf(company.incorporationDate)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => downloadJSON(report)}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Download size={17} />
                Download JSON
              </button>
            </section>

            <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                label="Business activities"
                value={numberOf(data.totalActivityRecords ?? activities.length)}
                icon={BriefcaseBusiness}
              />
            </section>

            <div className="mt-8 border-b border-slate-200">
              <nav
                className="-mb-px flex gap-1 overflow-x-auto"
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
                    className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold transition sm:px-4 ${
                      activeTab === id
                        ? 'border-blue-700 text-blue-700'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                    }`}
                  >
                    <Icon size={17} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            <section className="mt-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                        <Building2 size={21} />
                      </div>
                      <div>
                        <h3 className="font-bold">Company details</h3>
                        <p className="text-sm text-slate-500">
                          Identity and registered information
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="font-bold">Reported financial metrics</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Values returned by the extraction workflow
                      </p>
                      <div className="mt-5 space-y-4">
                        <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
                          <span className="text-sm text-slate-600">Turnover</span>
                          <strong className="text-right text-sm">{moneyOf(company.turnover)}</strong>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-sm text-slate-600">Net worth</span>
                          <strong className="text-right text-sm">{moneyOf(company.netWorth)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <h3 className="font-bold">Extraction summary</h3>
                      <div className="mt-5 space-y-3 text-sm">
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-600">Subsidiary company</span>
                          <strong>
                            {data.isSubsidiaryCompany === undefined
                              ? 'Not Found'
                              : data.isSubsidiaryCompany
                                ? 'Yes'
                                : 'No'}
                          </strong>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-600">Subsidiaries listed</span>
                          <strong>{numberOf(data.subsidiaries?.length ?? 0)}</strong>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-600">Excel rows</span>
                          <strong>{numberOf(excelData.totalRows)}</strong>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-slate-600">Transaction types</span>
                          <strong>{numberOf(excelData.transactionTypesFound ?? transactions.length)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <CircleAlert size={19} className="mt-0.5 shrink-0" />
                    <p>
                      Extracted information is not independently verified here.
                      “Not Found” does not necessarily mean the information
                      does not exist in other documents.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'directors' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Directors</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {directors.length} records
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
                  />
                </div>
              )}

              {activeTab === 'shareholders' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Shareholders</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {shareholders.length} records
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
                          <span className="font-semibold">{valueOf(value, '—')}</span>
                        ),
                      },
                      { key: 'address', label: 'Address' },
                    ]}
                  />
                </div>
              )}

              {activeTab === 'auditor' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold">Auditor details</h3>
                      <p className="text-sm text-slate-500">
                        Information from the extracted report
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label="Audit firm" value={auditor.firmName} />
                    <Field label="Auditor PAN" value={auditor.PAN} />
                    <Field label="Individual auditor" value={auditor.individualAuditorName} />
                    <Field label="Membership number" value={auditor.membershipNumber} />
                    <Field label="Address" value={auditor.address} wide />
                  </div>
                </div>
              )}

              {activeTab === 'related' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Related parties</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {relatedParties.length} records
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
                  />

                  {transactions.length > 0 && (
                    <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <summary className="cursor-pointer font-semibold">
                        Detailed Excel transactions ({transactions.length} types)
                      </summary>
                      <div className="mt-4 space-y-4">
                        {transactions.map((transaction, index) => (
                          <div
                            key={`${transaction.xbrlTag || transaction.transactionType}-${index}`}
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <h4 className="text-sm font-semibold">
                              {valueOf(transaction.transactionType, transaction.xbrlTag)}
                            </h4>
                            <div className="mt-3 overflow-x-auto">
                              <table className="min-w-full text-left text-xs">
                                <thead>
                                  <tr className="text-slate-500">
                                    <th className="py-2 pr-4">Related party</th>
                                    <th className="py-2 pr-4">Financial year</th>
                                    <th className="py-2 pr-4">Amount</th>
                                    <th className="py-2">Mapping</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(transaction.entries || []).map((entry, entryIndex) => (
                                    <tr
                                      key={`${entry.relatedParty}-${entry.financialYear}-${entryIndex}`}
                                      className="border-t border-slate-100"
                                    >
                                      <td className="py-2 pr-4">{valueOf(entry.relatedParty, '—')}</td>
                                      <td className="py-2 pr-4">{valueOf(entry.financialYear, '—')}</td>
                                      <td className="py-2 pr-4">{moneyOf(entry.amount)}</td>
                                      <td className="py-2">{valueOf(entry.mappingStatus, '—')}</td>
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

              {activeTab === 'activities' && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold">Business activities</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {activities.length} activity records
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
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
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
                  />
                </div>
              )}
            </section>

            <section className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                  <FileJson size={21} />
                </div>
                <div>
                  <h3 className="font-semibold">Download the full report</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Includes the complete JSON response, even fields not shown in these tables.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => downloadJSON(report)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <Download size={17} />
                Download JSON
              </button>
            </section>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>FileScope AI · Company Filing Analyzer</p>
          <p>Verify extracted information against original source documents.</p>
        </div>
      </footer>
    </div>
  )
}
