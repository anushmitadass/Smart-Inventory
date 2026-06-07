'use client'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { API_URL } from '../lib/supabase'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type UserRole = 'admin' | 'staff' | 'viewer'
type Supplier = { id: string; name: string; contact_email?: string; contact_phone?: string; address?: string; lead_time_days?: number; notes?: string }
type ActivityEntry = { id: string; user_email: string; action: string; item_name?: string; details?: string; created_at: string }

type Item = {
  id: string; name: string; category: string
  current_stock: number; minimum_stock: number
  unit: string; expiry_date?: string | null
  notes?: string | null; price_per_unit?: number | null
}
type Forecast = { days_until_stockout: number | null; avg_daily_usage: number | null; suggested_reorder_qty: number | null; message: string }
type TrendPoint = { date: string; type: 'IN' | 'OUT'; quantity: number }
type ExpiryInfo = { expiry_date: string | null; days_until_expiry: number | null; status: 'ok' | 'warning' | 'critical' | 'expired' | 'no_expiry' }
type TxnHistory = { id: string; type: string; quantity: number; note: string; timestamp: string }
type MonthlyReport = { total_in: number; total_out: number; total_transactions: number; top_consumed: { name: string; unit: string; quantity: number }[]; message: string }
type WasteEntry = { id: string; item_name: string; unit: string; quantity: number; reason: string; note: string; created_at: string }
type ValueBreakdown = { id: string; name: string; current_stock: number; unit: string; price_per_unit: number; total_value: number }
type ExpiryAlert = { id: string; name: string; expiry_date: string; days_until_expiry: number; status: string }
type Reminder = { id: string; name: string; category: string; current_stock: number; minimum_stock: number; unit: string; status: string }

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', current_stock: 0, minimum_stock: 0, unit: 'units', expiry_date: '', notes: '', price_per_unit: '' })
  const [updateQty, setUpdateQty] = useState<{ [id: string]: number }>({})
  const [forecasts, setForecasts] = useState<{ [id: string]: Forecast }>({})
  const [showForecast, setShowForecast] = useState<string | null>(null)
  const [trends, setTrends] = useState<{ [id: string]: TrendPoint[] }>({})
  const [showTrends, setShowTrends] = useState<string | null>(null)
  const [expiries, setExpiries] = useState<{ [id: string]: ExpiryInfo }>({})
  const [showExpiry, setShowExpiry] = useState<string | null>(null)
  const [expiryInput, setExpiryInput] = useState<{ [id: string]: string }>({})
  const [activeSlide, setActiveSlide] = useState(0)
  const [activeItemIdx, setActiveItemIdx] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const [bulkQty, setBulkQty] = useState<{ [id: string]: number }>({})
  const [bulkType, setBulkType] = useState<'IN' | 'OUT'>('IN')
  const [bulkSelected, setBulkSelected] = useState<string[]>([])
  // Phase 2
  const [history, setHistory] = useState<{ [id: string]: TxnHistory[] }>({})
  const [showHistory, setShowHistory] = useState<string | null>(null)
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [wasteLog, setWasteLog] = useState<WasteEntry[]>([])
  const [showWasteForm, setShowWasteForm] = useState(false)
  const [wasteForm, setWasteForm] = useState({ inventory_id: '', quantity: 0, reason: 'expired', note: '' })
  const [valueData, setValueData] = useState<{ total_value: number; breakdown: ValueBreakdown[] } | null>(null)
  const [priceInputs, setPriceInputs] = useState<{ [id: string]: string }>({})
  const [expiryAlerts, setExpiryAlerts] = useState<ExpiryAlert[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  // Phase 3 + 4
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<UserRole>('viewer')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_email: '', contact_phone: '', address: '', lead_time_days: '', notes: '' })
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([])
  const [qrDataUrls, setQrDataUrls] = useState<{ [id: string]: string }>({})
  const [showQr, setShowQr] = useState<string | null>(null)
  const [showItemSupplierPicker, setShowItemSupplierPicker] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
    fetchMonthlyReport()
    fetchWasteLog()
    fetchValueData()
    fetchExpiryAlerts()
    fetchReminders()
    fetchSuppliers()
    fetchActivityLog()
    initAuth()
  }, [])

  async function fetchItems() {
    const res = await fetch(`${API_URL}/inventory`)
    setItems(await res.json())
  }
  async function fetchMonthlyReport() {
    const res = await fetch(`${API_URL}/reports/monthly`)
    setMonthlyReport(await res.json())
  }
  async function fetchWasteLog() {
    const res = await fetch(`${API_URL}/waste`)
    setWasteLog(await res.json())
  }
  async function fetchValueData() {
    const res = await fetch(`${API_URL}/inventory/value/total`)
    setValueData(await res.json())
  }
  async function fetchExpiryAlerts() {
    const res = await fetch(`${API_URL}/expiry-alerts`)
    const d = await res.json()
    setExpiryAlerts(d.alerts || [])
  }
  async function fetchReminders() {
    const res = await fetch(`${API_URL}/reorder-reminders`)
    const d = await res.json()
    setReminders(d.reminders || [])
  }
  async function initAuth() {
    const { data: { session } } = await sb.auth.getSession()
    if (!session) { window.location.href = '/login'; return }
    setUser(session.user)
    setUserRole('admin')
  }

  async function handleSignOut() {
    await sb.auth.signOut()
    window.location.href = '/login'
  }

  async function fetchSuppliers() {
    const res = await fetch(`${API_URL}/suppliers`)
    setSuppliers(await res.json())
  }

  async function addSupplier() {
    await fetch(`${API_URL}/suppliers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...supplierForm, lead_time_days: supplierForm.lead_time_days ? +supplierForm.lead_time_days : null })
    })
    setSupplierForm({ name: '', contact_email: '', contact_phone: '', address: '', lead_time_days: '', notes: '' })
    setShowSupplierForm(false)
    fetchSuppliers()
    logActivity('Added supplier', supplierForm.name)
  }

  async function deleteSupplier(id: string, name: string) {
    await fetch(`${API_URL}/suppliers/${id}`, { method: 'DELETE' })
    fetchSuppliers()
    logActivity('Deleted supplier', name)
  }

  async function linkSupplierToItem(inventoryId: string, supplierId: string) {
    await fetch(`${API_URL}/suppliers/link`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory_id: inventoryId, supplier_id: supplierId })
    })
    fetchItems()
    setShowItemSupplierPicker(null)
  }

  async function fetchActivityLog() {
    const res = await fetch(`${API_URL}/activity`)
    setActivityLog(await res.json())
  }

  async function logActivity(action: string, itemName?: string, details?: string) {
    if (!user) return
    await fetch(`${API_URL}/activity`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: user.email, action, item_name: itemName || '', details: details || '' })
    })
    fetchActivityLog()
  }

  async function generateQR(item: any) {
    if (showQr === item.id) { setShowQr(null); return }
    const url = `${window.location.origin}/item/${item.id}`
    const dataUrl = await QRCode.toDataURL(url, { width: 200, margin: 2, color: { dark: '#3d2e22', light: '#ede3d8' } })
    setQrDataUrls(prev => ({ ...prev, [item.id]: dataUrl }))
    setShowQr(item.id)
  }

  async function addItem() {
    await fetch(`${API_URL}/inventory`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, expiry_date: form.expiry_date || null, notes: form.notes || null, price_per_unit: form.price_per_unit ? +form.price_per_unit : null })
    })
    setForm({ name: '', category: '', current_stock: 0, minimum_stock: 0, unit: 'units', expiry_date: '', notes: '', price_per_unit: '' })
    setShowForm(false)
    fetchItems(); fetchValueData()
    logActivity('Added item', form.name)
  }

  async function updateStock(item: Item, type: 'IN' | 'OUT') {
    const qty = updateQty[item.id] || 0
    if (qty <= 0) return
    await fetch(`${API_URL}/inventory/${item.id}/stock`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: qty, type })
    })
    setUpdateQty(prev => ({ ...prev, [item.id]: 0 }))
    fetchItems(); fetchValueData(); fetchReminders()
  }

  async function deleteItem(id: string) {
    const item = items.find(i => i.id === id)
    await fetch(`${API_URL}/inventory/${id}`, { method: 'DELETE' })
    fetchItems(); fetchValueData()
    logActivity('Deleted item', item?.name)
  }

  async function fetchForecast(item: Item) {
    if (showForecast === item.id) { setShowForecast(null); return }
    const res = await fetch(`${API_URL}/inventory/${item.id}/forecast`)
    const data = await res.json()
    setForecasts(prev => ({ ...prev, [item.id]: data }))
    setShowForecast(item.id)
  }
  async function fetchTrends(item: Item) {
    if (showTrends === item.id) { setShowTrends(null); return }
    const res = await fetch(`${API_URL}/inventory/${item.id}/trends`)
    const d = await res.json()
    setTrends(prev => ({ ...prev, [item.id]: d.trends || [] }))
    setShowTrends(item.id)
  }
  async function fetchExpiry(item: Item) {
    if (showExpiry === item.id) { setShowExpiry(null); return }
    const res = await fetch(`${API_URL}/inventory/${item.id}/expiry`)
    const data = await res.json()
    setExpiries(prev => ({ ...prev, [item.id]: data }))
    setShowExpiry(item.id)
  }
  async function saveExpiry(item: Item) {
    const val = expiryInput[item.id] || null
    await fetch(`${API_URL}/inventory/${item.id}/expiry`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expiry_date: val }) })
    const res2 = await fetch(`${API_URL}/inventory/${item.id}/expiry`)
    const data2 = await res2.json()
    setExpiries(prev => ({ ...prev, [item.id]: data2 }))
    fetchItems(); fetchExpiryAlerts()
  }
  async function fetchHistory(item: Item) {
    if (showHistory === item.id) { setShowHistory(null); return }
    const res = await fetch(`${API_URL}/inventory/${item.id}/history`)
    const d = await res.json()
    setHistory(prev => ({ ...prev, [item.id]: d.history || [] }))
    setShowHistory(item.id)
  }
  async function savePrice(item: Item) {
    const price = priceInputs[item.id] ? +priceInputs[item.id] : null
    await fetch(`${API_URL}/inventory/${item.id}/price`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ price_per_unit: price }) })
    fetchItems(); fetchValueData()
  }
  async function submitWaste() {
    if (!wasteForm.inventory_id || wasteForm.quantity <= 0) return
    await fetch(`${API_URL}/waste`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(wasteForm) })
    setWasteForm({ inventory_id: '', quantity: 0, reason: 'expired', note: '' })
    setShowWasteForm(false)
    fetchItems(); fetchWasteLog(); fetchValueData()
  }
  async function applyBulkUpdate() {
    await Promise.all(bulkSelected.map(id => {
      const qty = bulkQty[id] || 0
      if (qty <= 0) return Promise.resolve()
      return fetch(`${API_URL}/inventory/${id}/stock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity: qty, type: bulkType }) })
    }))
    setBulkSelected([]); setBulkQty({}); fetchItems(); fetchValueData(); fetchReminders()
  }
  function exportCSV() { window.open(`${API_URL}/inventory/export/csv`, '_blank') }

  function getStatus(item: Item) {
    if (item.current_stock <= 0) return 'critical'
    if (item.current_stock <= item.minimum_stock) return 'low'
    return 'healthy'
  }
  function getStockPercent(item: Item) {
    if (item.minimum_stock === 0) return 100
    return Math.min(100, Math.round((item.current_stock / (item.minimum_stock * 3)) * 100))
  }

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) && (filterCategory === '' || i.category === filterCategory))
  const categories = [...new Set(items.map(i => i.category))]
  const critical = items.filter(i => getStatus(i) === 'critical').length
  const low = items.filter(i => getStatus(i) === 'low').length
  const healthy = items.filter(i => getStatus(i) === 'healthy').length
  const slides = ['overview', 'items', 'analytics', 'reports', 'bulk', 'suppliers', 'activity']
  const slideLabels = ['Overview', 'Stock Items', 'Analytics', 'Reports', 'Bulk Update', 'Suppliers', 'Activity Log']

  const d = darkMode
  const bg = d ? '#1a1410' : '#f5ede4'
  const bgCard = d ? '#251e18' : '#ede3d8'
  const bgInput = d ? '#1a1410' : '#f5ede4'
  const border = d ? '#3d2e22' : '#d4c4b4'
  const text = d ? '#e8d5c4' : '#3d2e22'
  const textSub = d ? '#9c7b5e' : '#b8a898'
  const textMid = d ? '#c8b49a' : '#7a6040'

  function renderTrendBars(itemId: string) {
    const data = trends[itemId]
    if (!data || data.length === 0) return <div style={{ color: textSub, fontSize: '0.85rem', fontStyle: 'italic', marginTop: 12 }}>No transactions recorded yet.</div>
    const byDate: { [date: string]: { IN: number; OUT: number } } = {}
    data.forEach(d => { if (!byDate[d.date]) byDate[d.date] = { IN: 0, OUT: 0 }; byDate[d.date][d.type] = (byDate[d.date][d.type] || 0) + d.quantity })
    const dates = Object.keys(byDate).sort().slice(-7)
    const maxVal = Math.max(...dates.flatMap(d => [byDate[d].IN || 0, byDate[d].OUT || 0]), 1)
    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 80 }}>
          {dates.map(d => (
            <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', gap: 3, height: 65 }}>
                {(byDate[d].IN || 0) > 0 && <div title={`IN: ${byDate[d].IN}`} style={{ flex: 1, background: '#c8b49a', borderRadius: '3px 3px 0 0', height: `${(byDate[d].IN / maxVal) * 65}px`, transition: 'height 0.4s ease' }} />}
                {(byDate[d].OUT || 0) > 0 && <div title={`OUT: ${byDate[d].OUT}`} style={{ flex: 1, background: '#e8d5c4', borderRadius: '3px 3px 0 0', height: `${(byDate[d].OUT / maxVal) * 65}px`, transition: 'height 0.4s ease' }} />}
              </div>
              <div style={{ fontSize: '0.6rem', color: textSub }}>{d.slice(5)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
          <span style={{ fontSize: '0.72rem', color: '#c8b49a' }}>▮ IN</span>
          <span style={{ fontSize: '0.72rem', color: '#e8d5c4' }}>▮ OUT</span>
          <span style={{ fontSize: '0.72rem', color: textSub, marginLeft: 'auto' }}>7-day OUT: <strong>{data.filter(d => d.type === 'OUT').reduce((s, d) => s + d.quantity, 0)}</strong></span>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${bg}; font-family: 'Times New Roman', Times, serif; transition: background 0.3s; }
        .page { min-height: 100vh; background: ${bg}; transition: background 0.3s; }
        .page::before { content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); pointer-events: none; z-index: 0; opacity: 0.4; }
        .inner { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 0 2rem 3rem; }
        .site-header { border-bottom: 1px solid ${border}; padding: 2rem 0 1.5rem; margin-bottom: 2.5rem; display: flex; align-items: flex-end; justify-content: space-between; }
        .logo { font-size: 2.6rem; font-weight: 300; color: ${text}; letter-spacing: -1px; line-height: 1; }
        .logo em { font-style: italic; color: #9c7b5e; }
        .tagline { font-size: 0.78rem; color: ${textSub}; letter-spacing: 3px; text-transform: uppercase; margin-top: 6px; }
        .header-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
        .date-label { font-size: 0.72rem; color: ${textSub}; letter-spacing: 2px; text-transform: uppercase; }
        .header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
        .toggle-wrap { display: flex; align-items: center; gap: 8px; cursor: pointer; }
        .toggle-label { font-size: 0.7rem; color: ${textSub}; letter-spacing: 1.5px; text-transform: uppercase; }
        .toggle-track { width: 40px; height: 22px; border-radius: 40px; background: ${d ? '#9c7b5e' : border}; position: relative; transition: background 0.3s; border: 1px solid ${border}; }
        .toggle-thumb { width: 16px; height: 16px; border-radius: 50%; background: ${d ? '#f5ede4' : '#9c7b5e'}; position: absolute; top: 2px; left: ${d ? '20px' : '2px'}; transition: left 0.3s; }
        .slide-nav { display: flex; gap: 0; border: 1px solid ${border}; border-radius: 40px; overflow: hidden; margin-bottom: 2rem; background: ${bgCard}; width: fit-content; flex-wrap: wrap; }
        .slide-tab { padding: 0.55rem 1.4rem; font-family: 'Times New Roman', serif; font-size: 0.75rem; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; color: ${textSub}; background: transparent; border: none; transition: all 0.3s ease; }
        .slide-tab.active { background: ${text}; color: ${bg}; border-radius: 40px; }
        .carousel-outer { overflow: hidden; }
        .carousel-track { display: flex; transition: transform 0.5s cubic-bezier(0.77, 0, 0.175, 1); }
        .slide { min-width: 100%; }
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
        .stat-card { background: ${bgCard}; border: 1px solid ${border}; border-radius: 20px; padding: 1.4rem 1.5rem; position: relative; overflow: hidden; }
        .stat-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; border-radius: 0 0 20px 20px; }
        .sc-healthy::after { background: #c8b49a; } .sc-low::after { background: #d4a882; } .sc-critical::after { background: #c47a5a; } .sc-total::after { background: #9c7b5e; } .sc-value::after { background: #b8a070; }
        .stat-label { font-size: 0.65rem; color: ${textSub}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
        .stat-num { font-size: 2.8rem; font-weight: 300; line-height: 1; color: ${text}; }
        .stat-num-sm { font-size: 1.8rem; font-weight: 300; line-height: 1; color: ${text}; }
        .stat-sub { font-size: 0.72rem; color: #c8b49a; margin-top: 4px; font-style: italic; }
        .alert-strip { background: ${d ? 'rgba(196,122,90,0.12)' : '#f0e0d0'}; border: 1px solid #d4b49a; border-left: 3px solid #c47a5a; border-radius: 10px; padding: 0.85rem 1.2rem; margin-bottom: 1rem; font-size: 0.82rem; color: ${d ? '#e8a070' : '#7a4a2e'}; font-style: italic; display: flex; align-items: center; gap: 10px; }
        .expiry-strip { background: ${d ? 'rgba(180,120,60,0.12)' : '#f5e8d0'}; border: 1px solid #d4a870; border-left: 3px solid #b87840; border-radius: 10px; padding: 0.85rem 1.2rem; margin-bottom: 1rem; font-size: 0.82rem; color: ${d ? '#d4a870' : '#7a5020'}; font-style: italic; display: flex; align-items: flex-start; gap: 10px; flex-direction: column; }
        .form-panel { background: ${bgCard}; border: 1px solid ${border}; border-radius: 20px; padding: 2rem; margin-bottom: 2rem; animation: slideDown 0.3s ease; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .form-heading { font-size: 1.1rem; font-weight: 300; color: ${text}; letter-spacing: 1px; margin-bottom: 0.5rem; font-style: italic; }
        .nude-input { background: ${bgInput}; border: 1px solid ${border}; border-radius: 10px; padding: 0.7rem 1rem; color: ${text}; font-family: 'Times New Roman', serif; font-size: 0.9rem; outline: none; width: 100%; transition: border-color 0.2s; }
        .nude-input:focus { border-color: #9c7b5e; }
        .nude-input::placeholder { color: ${textSub}; font-style: italic; }
        .field-wrap { display: flex; flex-direction: column; gap: 5px; }
        .field-label { font-size: 0.72rem; color: ${textMid}; letter-spacing: 1px; text-transform: uppercase; }
        .field-req { color: #c47a5a; }
        .field-hint { font-size: 0.68rem; color: ${textSub}; font-style: italic; line-height: 1.4; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.1rem; }
        .save-btn { margin-top: 1.2rem; background: ${text}; color: ${bg}; border: none; padding: 0.75rem 2rem; border-radius: 40px; font-family: 'Times New Roman', serif; font-size: 0.8rem; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s; }
        .save-btn:hover { opacity: 0.8; }
        .search-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
        .item-card { background: ${bgCard}; border: 1px solid ${border}; border-radius: 20px; padding: 2rem 2.5rem; min-height: 340px; display: flex; gap: 3rem; animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .item-left { flex: 1; }
        .item-right { width: 260px; display: flex; flex-direction: column; gap: 12px; }
        .item-number { font-size: 0.65rem; color: ${textSub}; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px; }
        .item-title { font-size: 2.2rem; font-weight: 300; color: ${text}; line-height: 1.1; margin-bottom: 4px; font-style: italic; }
        .item-cat-badge { display: inline-block; background: ${bgInput}; border: 1px solid ${border}; padding: 3px 14px; border-radius: 40px; font-size: 0.68rem; color: #9c7b5e; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 0.5rem; }
        .stock-section { margin-bottom: 1.5rem; }
        .stock-top { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
        .stock-big { font-size: 3rem; font-weight: 300; color: ${text}; line-height: 1; }
        .stock-unit-label { font-size: 0.8rem; color: ${textSub}; font-style: italic; }
        .stock-bar-track { height: 6px; background: ${border}; border-radius: 6px; overflow: hidden; }
        .stock-bar-fill { height: 6px; border-radius: 6px; transition: width 0.6s ease; }
        .bar-healthy { background: linear-gradient(90deg, #c8b49a, #9c7b5e); }
        .bar-low { background: linear-gradient(90deg, #d4a882, #b87840); }
        .bar-critical { background: linear-gradient(90deg, #c47a5a, #a0502a); }
        .stock-min-label { font-size: 0.68rem; color: ${textSub}; margin-top: 5px; font-style: italic; }
        .status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 40px; font-size: 0.7rem; letter-spacing: 1.5px; text-transform: uppercase; }
        .sp-healthy { background: rgba(200,180,154,0.2); color: ${d ? '#c8b49a' : '#7a6040'}; border: 1px solid #c8b49a; }
        .sp-low { background: rgba(212,168,130,0.2); color: ${d ? '#d4a882' : '#8a5020'}; border: 1px solid #d4a882; }
        .sp-critical { background: rgba(196,122,90,0.2); color: ${d ? '#c47a5a' : '#8a3010'}; border: 1px solid #c47a5a; }
        .sp-dot { width: 5px; height: 5px; border-radius: 50%; }
        .d-healthy { background: #9c7b5e; } .d-low { background: #b87840; }
        .d-critical { background: #a0502a; animation: blink 1.5s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .card-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .action-pill { padding: 6px 14px; border-radius: 40px; font-family: 'Times New Roman', serif; font-size: 0.7rem; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; border: 1px solid ${border}; background: ${bgInput}; color: ${textMid}; transition: all 0.2s; }
        .action-pill:hover { background: ${text}; color: ${bg}; border-color: ${text}; }
        .action-pill.active { background: ${text}; color: ${bg}; border-color: ${text}; }
        .action-pill.danger { color: #a0502a; border-color: #c47a5a; }
        .action-pill.danger:hover { background: #c47a5a; color: #f5ede4; }
        .update-inline { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
        .nude-qty { background: ${bgInput}; border: 1px solid ${border}; border-radius: 10px; padding: 6px 10px; width: 60px; text-align: center; color: ${text}; font-family: 'Times New Roman', serif; font-size: 0.9rem; outline: none; }
        .nude-qty:focus { border-color: #9c7b5e; }
        .in-pill { background: rgba(200,180,154,0.2); color: ${d ? '#c8b49a' : '#7a6040'}; border: 1px solid #c8b49a; padding: 6px 14px; border-radius: 40px; font-size: 0.7rem; letter-spacing: 1px; cursor: pointer; font-family: 'Times New Roman', serif; }
        .out-pill { background: rgba(196,122,90,0.15); color: ${d ? '#c47a5a' : '#8a3010'}; border: 1px solid #c47a5a; padding: 6px 14px; border-radius: 40px; font-size: 0.7rem; letter-spacing: 1px; cursor: pointer; font-family: 'Times New Roman', serif; }
        .panel-box { background: ${bgInput}; border: 1px solid ${border}; border-radius: 14px; padding: 1rem 1.2rem; margin-top: 10px; animation: fadeIn 0.3s ease; }
        .panel-label { font-size: 0.62rem; color: ${textSub}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
        .carousel-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 1.5rem; }
        .carousel-dots { display: flex; gap: 8px; }
        .c-dot { width: 8px; height: 8px; border-radius: 50%; background: ${border}; cursor: pointer; transition: all 0.3s; }
        .c-dot.active { width: 24px; border-radius: 4px; background: ${text}; }
        .nav-arrows { display: flex; gap: 10px; }
        .arrow-btn { width: 40px; height: 40px; border-radius: 50%; border: 1px solid ${border}; background: ${bgCard}; color: ${text}; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .arrow-btn:hover { background: ${text}; color: ${bg}; border-color: ${text}; }
        .arrow-btn:disabled { opacity: 0.3; cursor: default; }
        .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .a-card { background: ${bgCard}; border: 1px solid ${border}; border-radius: 20px; padding: 1.5rem 1.8rem; }
        .a-title { font-size: 0.68rem; color: ${textSub}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 1rem; }
        .a-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${border}; }
        .a-row:last-child { border-bottom: none; }
        .a-item-name { font-size: 0.88rem; color: ${text}; font-style: italic; }
        .a-val { font-size: 0.78rem; color: #9c7b5e; }
        .new-item-btn { background: transparent; border: 1px solid ${text}; color: ${text}; padding: 0.6rem 1.6rem; border-radius: 40px; font-family: 'Times New Roman', serif; font-size: 0.78rem; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
        .new-item-btn:hover { background: ${text}; color: ${bg}; }
        .export-btn { background: transparent; border: 1px solid #9c7b5e; color: #9c7b5e; padding: 0.6rem 1.6rem; border-radius: 40px; font-family: 'Times New Roman', serif; font-size: 0.78rem; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
        .export-btn:hover { background: #9c7b5e; color: #f5ede4; }
        .bulk-card { background: ${bgCard}; border: 1px solid ${border}; border-radius: 20px; padding: 1.8rem 2rem; }
        .bulk-title { font-size: 1.1rem; font-weight: 300; color: ${text}; font-style: italic; margin-bottom: 0.4rem; }
        .bulk-hint { font-size: 0.75rem; color: ${textSub}; font-style: italic; margin-bottom: 1.5rem; }
        .bulk-type-row { display: flex; gap: 10px; margin-bottom: 1.5rem; }
        .bulk-type-btn { padding: 8px 24px; border-radius: 40px; font-family: 'Times New Roman', serif; font-size: 0.78rem; letter-spacing: 1.5px; text-transform: uppercase; cursor: pointer; border: 1px solid ${border}; background: ${bgInput}; color: ${textMid}; transition: all 0.2s; }
        .bulk-type-btn.active-in { background: rgba(200,180,154,0.3); color: ${d ? '#c8b49a' : '#5a4030'}; border-color: #c8b49a; }
        .bulk-type-btn.active-out { background: rgba(196,122,90,0.2); color: ${d ? '#c47a5a' : '#7a2010'}; border-color: #c47a5a; }
        .bulk-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid ${border}; }
        .bulk-row:last-child { border-bottom: none; }
        .bulk-check { width: 16px; height: 16px; accent-color: #9c7b5e; cursor: pointer; }
        .bulk-name { flex: 1; font-size: 0.9rem; color: ${text}; font-style: italic; }
        .bulk-stock { font-size: 0.75rem; color: ${textSub}; min-width: 80px; }
        .bulk-apply-btn { margin-top: 1.5rem; background: ${text}; color: ${bg}; border: none; padding: 0.75rem 2rem; border-radius: 40px; font-family: 'Times New Roman', serif; font-size: 0.8rem; letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s; }
        .bulk-apply-btn:hover { opacity: 0.8; }
        .bulk-apply-btn:disabled { opacity: 0.3; cursor: default; }
        .notes-tag { font-size: 0.72rem; color: ${textSub}; font-style: italic; margin-top: 4px; padding: 4px 10px; background: ${bgInput}; border: 1px solid ${border}; border-radius: 20px; display: inline-block; }
        .history-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 6px 0; border-bottom: 1px solid ${border}; font-size: 0.78rem; }
        .history-row:last-child { border-bottom: none; }
        .section-title { font-size: 0.68rem; color: ${textSub}; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 0.8rem; }
        .report-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 1.5rem; }
        .report-card { background: ${bgCard}; border: 1px solid ${border}; border-radius: 16px; padding: 1.2rem 1.4rem; }
        .report-num { font-size: 2.2rem; font-weight: 300; color: ${text}; line-height: 1; }
        .report-label { font-size: 0.65rem; color: ${textSub}; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
        .top-bar-wrap { margin-top: 8px; }
        .top-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .top-bar-name { font-size: 0.82rem; color: ${text}; font-style: italic; min-width: 120px; }
        .top-bar-track { flex: 1; height: 8px; background: ${border}; border-radius: 8px; overflow: hidden; }
        .top-bar-fill { height: 8px; background: linear-gradient(90deg, #c8b49a, #9c7b5e); border-radius: 8px; transition: width 0.6s ease; }
        .top-bar-val { font-size: 0.72rem; color: ${textSub}; min-width: 40px; text-align: right; }
        .waste-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${border}; font-size: 0.82rem; }
        .waste-row:last-child { border-bottom: none; }
        .price-inline { display: flex; gap: 6px; align-items: center; margin-top: 6px; }
        .reminder-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid ${border}; }
        .reminder-row:last-child { border-bottom: none; }
      `}</style>

      <div className="page">
        <div className="inner">

          {/* ── Header ── */}
          <header className="site-header">
            <div>
              <div className="logo">Stock <em>& Store</em></div>
              <div className="tagline">curated inventory, effortlessly</div>
            </div>
            <div className="header-right">
              <div className="date-label">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.68rem', color: textSub, fontStyle: 'italic' }}>{user.email}</span>

                  <button onClick={handleSignOut} style={{ background: 'transparent', border: `1px solid ${border}`, color: textSub, padding: '3px 12px', borderRadius: 20, fontSize: '0.68rem', cursor: 'pointer', fontFamily: 'Times New Roman, serif', letterSpacing: 1 }}>Sign Out</button>
                </div>
              )}
              <div className="header-actions">
                <div className="toggle-wrap" onClick={() => setDarkMode(!darkMode)}>
                  <span className="toggle-label">{darkMode ? 'Dark' : 'Light'}</span>
                  <div className="toggle-track"><div className="toggle-thumb" /></div>
                </div>
                <button className="export-btn" onClick={exportCSV}>↓ Export CSV</button>
                {userRole === 'admin' && <button className="new-item-btn" onClick={() => { setActiveSlide(0); setShowForm(!showForm) }}>
                  {showForm ? '✕ cancel' : '+ new item'}
                </button>}
              </div>
            </div>
          </header>

          {/* ── Slide Nav ── */}
          <div className="slide-nav">
            {slideLabels.map((label, i) => (
              <button key={i} className={`slide-tab ${activeSlide === i ? 'active' : ''}`} onClick={() => setActiveSlide(i)}>{label}</button>
            ))}
          </div>

          {/* ── Carousel ── */}
          <div className="carousel-outer">
            <div className="carousel-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>

              {/* ── Slide 0: Overview ── */}
              <div className="slide">
                <div style={{ fontSize: '0.7rem', color: textSub, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                  Inventory Summary — a live snapshot of all your tracked items
                </div>

                {/* Stats row — now 5 cards including total value */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '2rem' }}>
                  <div className="stat-card sc-total"><div className="stat-label">Total Items</div><div className="stat-num">{items.length}</div><div className="stat-sub">unique products</div></div>
                  <div className="stat-card sc-healthy"><div className="stat-label">Well Stocked</div><div className="stat-num">{healthy}</div><div className="stat-sub">above minimum</div></div>
                  <div className="stat-card sc-low"><div className="stat-label">Running Low</div><div className="stat-num">{low}</div><div className="stat-sub">reorder soon</div></div>
                  <div className="stat-card sc-critical"><div className="stat-label">Critical</div><div className="stat-num">{critical}</div><div className="stat-sub">depleted</div></div>
                  <div className="stat-card sc-value">
                    <div className="stat-label">Total Value</div>
                    <div className="stat-num-sm">₹{valueData ? valueData.total_value.toLocaleString('en-IN') : '—'}</div>
                    <div className="stat-sub">across all stock</div>
                  </div>
                </div>

                {/* Stock alerts */}
                {(critical > 0 || low > 0) && (
                  <div className="alert-strip">
                    <span>✦</span>
                    <span>{critical + low} item{critical + low > 1 ? 's' : ''} require your attention — please reorder at your earliest convenience.</span>
                  </div>
                )}

                {/* Expiry alerts */}
                {expiryAlerts.length > 0 && (
                  <div className="expiry-strip">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>⏳</span>
                      <strong>{expiryAlerts.length} item{expiryAlerts.length > 1 ? 's' : ''} expiring soon</strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      {expiryAlerts.map(a => (
                        <span key={a.id} style={{ fontSize: '0.75rem', padding: '2px 12px', borderRadius: 20, background: a.status === 'expired' ? 'rgba(196,122,90,0.2)' : 'rgba(180,120,60,0.15)', border: `1px solid ${a.status === 'expired' ? '#c47a5a' : '#b87840'}`, color: a.status === 'expired' ? '#a0502a' : '#8a5020' }}>
                          {a.name} — {a.days_until_expiry < 0 ? `expired ${Math.abs(a.days_until_expiry)}d ago` : `${a.days_until_expiry}d left`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {showForm && (
                  <div className="form-panel">
                    <div className="form-heading">Add a new item to your collection</div>
                    <div style={{ fontSize: '0.75rem', color: textSub, fontStyle: 'italic', marginBottom: '1.2rem' }}>Fill in the details below. All fields except expiry date, price and notes are required.</div>
                    <div className="form-grid">
                      <div className="field-wrap">
                        <label className="field-label">Item Name <span className="field-req">*</span></label>
                        <input className="nude-input" placeholder="e.g. Printer Paper" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        <div className="field-hint">The exact name of the product you are tracking.</div>
                      </div>
                      <div className="field-wrap">
                        <label className="field-label">Category <span className="field-req">*</span></label>
                        <input className="nude-input" list="category-list" placeholder="e.g. Office Supplies" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
                        <datalist id="category-list">
                          <option value="Office Supplies" /><option value="Food & Beverages" /><option value="Medicine & Health" />
                          <option value="Cleaning Supplies" /><option value="Electronics" /><option value="Packaging" />
                          <option value="Raw Materials" /><option value="Clothing & Apparel" /><option value="Tools & Equipment" /><option value="Stationery" />
                        </datalist>
                        <div className="field-hint">Pick from suggestions or type your own.</div>
                      </div>
                      <div className="field-wrap">
                        <label className="field-label">Unit <span className="field-req">*</span></label>
                        <input className="nude-input" list="unit-list" placeholder="e.g. units, kg, boxes" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
                        <datalist id="unit-list">
                          <option value="units" /><option value="kg" /><option value="grams" /><option value="litres" />
                          <option value="ml" /><option value="boxes" /><option value="packets" /><option value="rolls" /><option value="pieces" /><option value="bottles" />
                        </datalist>
                        <div className="field-hint">How is this item measured?</div>
                      </div>
                      <div className="field-wrap">
                        <label className="field-label">Current Stock <span className="field-req">*</span></label>
                        <input className="nude-input" type="number" min="0" placeholder="e.g. 50" value={form.current_stock} onChange={e => setForm({ ...form, current_stock: +e.target.value })} />
                        <div className="field-hint">How many units do you have right now?</div>
                      </div>
                      <div className="field-wrap">
                        <label className="field-label">Minimum Stock <span className="field-req">*</span></label>
                        <input className="nude-input" type="number" min="0" placeholder="e.g. 10" value={form.minimum_stock} onChange={e => setForm({ ...form, minimum_stock: +e.target.value })} />
                        <div className="field-hint">Alert threshold — when to reorder.</div>
                      </div>
                      <div className="field-wrap">
                        <label className="field-label">Price per Unit ₹ <span style={{ color: textSub, fontSize: '0.68rem' }}>(optional)</span></label>
                        <input className="nude-input" type="number" min="0" step="0.01" placeholder="e.g. 25.50" value={form.price_per_unit} onChange={e => setForm({ ...form, price_per_unit: e.target.value })} />
                        <div className="field-hint">Used to calculate total inventory value in ₹.</div>
                      </div>
                      <div className="field-wrap">
                        <label className="field-label">Expiry Date <span style={{ color: textSub, fontSize: '0.68rem' }}>(optional)</span></label>
                        <input className="nude-input" type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
                        <div className="field-hint">For perishables, medicines, or chemicals.</div>
                      </div>
                      <div className="field-wrap" style={{ gridColumn: '1 / -1' }}>
                        <label className="field-label">Notes <span style={{ color: textSub, fontSize: '0.68rem' }}>(optional)</span></label>
                        <input className="nude-input" placeholder="e.g. Supplier: ABC Co. | Storage: Shelf B3 | Handle with care" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                        <div className="field-hint">Supplier name, storage location, handling instructions, reorder contact.</div>
                      </div>
                    </div>
                    <button className="save-btn" onClick={addItem}>Save to collection</button>
                  </div>
                )}

                {/* Category overview */}
                <div style={{ background: bgCard, border: `1px solid ${border}`, borderRadius: 20, padding: '1.5rem 2rem' }}>
                  <div className="section-title">By Category</div>
                  {categories.length === 0 && <div style={{ color: textSub, fontStyle: 'italic', fontSize: '0.9rem' }}>No items yet. Add your first item above.</div>}
                  {categories.map(cat => {
                    const catItems = items.filter(i => i.category === cat)
                    const catCritical = catItems.filter(i => getStatus(i) === 'critical').length
                    const catLow = catItems.filter(i => getStatus(i) === 'low').length
                    return (
                      <div key={cat} className="a-row">
                        <div className="a-item-name">{cat}</div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#9c7b5e' }}>{catItems.length} items</span>
                          {catCritical > 0 && <span style={{ fontSize: '0.68rem', color: '#a0502a', background: 'rgba(196,122,90,0.15)', padding: '2px 10px', borderRadius: 20 }}>{catCritical} critical</span>}
                          {catLow > 0 && <span style={{ fontSize: '0.68rem', color: '#8a5020', background: 'rgba(212,168,130,0.15)', padding: '2px 10px', borderRadius: 20 }}>{catLow} low</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Slide 1: Stock Items ── */}
              <div className="slide">
                <div style={{ fontSize: '0.7rem', color: textSub, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                  Browse your items — search or filter to find a specific product
                </div>
                <div className="search-row">
                  <input className="nude-input" placeholder="Search items..." value={search} onChange={e => { setSearch(e.target.value); setActiveItemIdx(0) }} style={{ flex: 1 }} />
                  <select className="nude-input" value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setActiveItemIdx(0) }} style={{ minWidth: 160 }}>
                    <option value="">All categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem', color: textSub, fontStyle: 'italic' }}>No items found.</div>
                ) : (() => {
                  const item = filtered[activeItemIdx]
                  if (!item) return null
                  const status = getStatus(item)
                  const pct = getStockPercent(item)
                  return (
                    <>
                      <div className="item-card">
                        <div className="item-left">
                          <div className="item-number">Item {activeItemIdx + 1} of {filtered.length}</div>
                          <div className="item-title">{item.name}</div>
                          <span className="item-cat-badge">{item.category}</span>
                          {item.notes && <div className="notes-tag">📝 {item.notes}</div>}
                          {item.price_per_unit && (
                            <div style={{ fontSize: '0.72rem', color: textSub, fontStyle: 'italic', marginTop: 4 }}>
                              ₹{item.price_per_unit}/unit · Total value: <strong style={{ color: text }}>₹{(item.price_per_unit * item.current_stock).toLocaleString('en-IN')}</strong>
                            </div>
                          )}

                          <div className="stock-section" style={{ marginTop: 12 }}>
                            <div className="stock-top">
                              <span className="stock-big">{item.current_stock}</span>
                              <span className="stock-unit-label">{item.unit}</span>
                            </div>
                            <div className="stock-bar-track">
                              <div className={`stock-bar-fill ${status === 'healthy' ? 'bar-healthy' : status === 'low' ? 'bar-low' : 'bar-critical'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <div className="stock-min-label">Minimum threshold: {item.minimum_stock} {item.unit}</div>
                          </div>

                          <div style={{ marginBottom: 12 }}>
                            {status === 'healthy' && <span className="status-pill sp-healthy"><span className="sp-dot d-healthy" />Well Stocked</span>}
                            {status === 'low' && <span className="status-pill sp-low"><span className="sp-dot d-low" />Running Low</span>}
                            {status === 'critical' && <span className="status-pill sp-critical"><span className="sp-dot d-critical" />Critical</span>}
                          </div>

                          {userRole !== 'viewer' && <><div style={{ fontSize: '0.65rem', color: textSub, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>
                            Update Stock — enter qty then click Stock In (received) or Stock Out (consumed/sold)
                          </div>
                            <div className="update-inline">
                              <input className="nude-qty" type="number" min="0" placeholder="qty" value={updateQty[item.id] || ''} onChange={e => setUpdateQty(prev => ({ ...prev, [item.id]: +e.target.value }))} />
                              <button className="in-pill" onClick={() => updateStock(item, 'IN')}>+ Stock In</button>
                              <button className="out-pill" onClick={() => updateStock(item, 'OUT')}>− Stock Out</button>
                            </div></>}

                          {/* Set price inline */}
                          <div style={{ fontSize: '0.65rem', color: textSub, letterSpacing: '1px', textTransform: 'uppercase', marginTop: 14, marginBottom: 4 }}>
                            Set Price per Unit ₹ — used to calculate total inventory value
                          </div>
                          <div className="price-inline">
                            <input className="nude-qty" style={{ width: 90 }} type="number" min="0" step="0.01" placeholder="₹ price" value={priceInputs[item.id] || item.price_per_unit || ''} onChange={e => setPriceInputs(prev => ({ ...prev, [item.id]: e.target.value }))} />
                            <button className="in-pill" onClick={() => savePrice(item)}>Save Price</button>
                          </div>
                        </div>

                        <div className="item-right">
                          <div style={{ fontSize: '0.65rem', color: textSub, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>Actions — tap to expand</div>
                          <div className="card-actions">
                            <button className={`action-pill ${showForecast === item.id ? 'active' : ''}`} onClick={() => fetchForecast(item)}>⚡ Forecast</button>
                            <button className={`action-pill ${showTrends === item.id ? 'active' : ''}`} onClick={() => fetchTrends(item)}>📈 Trends</button>
                            <button className={`action-pill ${showHistory === item.id ? 'active' : ''}`} onClick={() => fetchHistory(item)}>📋 History</button>
                            <button className={`action-pill ${showExpiry === item.id ? 'active' : ''}`} onClick={() => fetchExpiry(item)}>📅 Expiry</button>
                            <button className={`action-pill \${showQr === item.id ? 'active' : ''}`} onClick={() => generateQR(item)}>📱 QR Code</button>
                            {userRole !== 'viewer' && <button className={`action-pill \${showItemSupplierPicker === item.id ? 'active' : ''}`} onClick={() => setShowItemSupplierPicker(showItemSupplierPicker === item.id ? null : item.id)}>🏭 Supplier</button>}
                            {userRole === 'admin' && <button className="action-pill danger" onClick={() => { deleteItem(item.id); setActiveItemIdx(Math.max(0, activeItemIdx - 1)) }}>✕ Remove</button>}
                          </div>

                          {showForecast === item.id && forecasts[item.id] && (
                            <div className="panel-box">
                              <div className="panel-label">⚡ ML Forecast — predicted from past OUT transactions</div>
                              {forecasts[item.id].message !== 'ok' ? (
                                <div style={{ color: textSub, fontSize: '0.82rem', fontStyle: 'italic' }}>{forecasts[item.id].message}</div>
                              ) : (
                                <>
                                  <div style={{ fontSize: '0.85rem', color: text, marginBottom: 5 }}><em>{forecasts[item.id].days_until_stockout} days</em> until stockout</div>
                                  <div style={{ fontSize: '0.8rem', color: textMid, marginBottom: 5 }}>Avg usage: {forecasts[item.id].avg_daily_usage} per transaction</div>
                                  <div style={{ fontSize: '0.8rem', color: '#9c7b5e' }}>Suggested reorder: <strong>{forecasts[item.id].suggested_reorder_qty} {item.unit}</strong></div>
                                </>
                              )}
                            </div>
                          )}

                          {showTrends === item.id && (
                            <div className="panel-box">
                              <div className="panel-label">📈 Trends — IN vs OUT last 7 days</div>
                              {renderTrendBars(item.id)}
                            </div>
                          )}

                          {showHistory === item.id && (
                            <div className="panel-box">
                              <div className="panel-label">📋 Reorder History — all past transactions for this item</div>
                              {(!history[item.id] || history[item.id].length === 0) ? (
                                <div style={{ color: textSub, fontSize: '0.8rem', fontStyle: 'italic' }}>No transactions yet.</div>
                              ) : history[item.id].slice(0, 8).map(h => (
                                <div key={h.id} className="history-row">
                                  <div>
                                    <span style={{ color: h.type === 'IN' ? '#c8b49a' : '#c47a5a', fontWeight: 600, fontSize: '0.72rem', letterSpacing: 1 }}>{h.type}</span>
                                    <span style={{ color: text, marginLeft: 8 }}>{h.quantity} {item.unit}</span>
                                    {h.note && <div style={{ color: textSub, fontSize: '0.68rem', fontStyle: 'italic' }}>{h.note}</div>}
                                  </div>
                                  <div style={{ color: textSub, fontSize: '0.68rem' }}>{new Date(h.timestamp).toLocaleDateString('en-GB')}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {showExpiry === item.id && (
                            <div className="panel-box">
                              <div className="panel-label">📅 Expiry — set or view when this item expires</div>
                              {expiries[item.id] && expiries[item.id].status !== 'no_expiry' ? (
                                <div style={{ marginBottom: 10 }}>
                                  {expiries[item.id].status === 'expired' && <div style={{ color: '#a0502a', fontSize: '0.82rem', fontStyle: 'italic', marginBottom: 4 }}>Expired {Math.abs(expiries[item.id].days_until_expiry!)} days ago</div>}
                                  {expiries[item.id].status === 'critical' && <div style={{ color: '#a0502a', fontSize: '0.82rem', fontStyle: 'italic', marginBottom: 4 }}>Expires in {expiries[item.id].days_until_expiry} days</div>}
                                  {expiries[item.id].status === 'warning' && <div style={{ color: '#8a5020', fontSize: '0.82rem', fontStyle: 'italic', marginBottom: 4 }}>Expires in {expiries[item.id].days_until_expiry} days</div>}
                                  {expiries[item.id].status === 'ok' && <div style={{ color: textMid, fontSize: '0.82rem', fontStyle: 'italic', marginBottom: 4 }}>Expires in {expiries[item.id].days_until_expiry} days</div>}
                                  <div style={{ fontSize: '0.72rem', color: textSub }}>{expiries[item.id].expiry_date}</div>
                                </div>
                              ) : <div style={{ color: textSub, fontSize: '0.8rem', fontStyle: 'italic', marginBottom: 8 }}>No expiry date set.</div>}
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input type="date" value={expiryInput[item.id] || item.expiry_date || ''} onChange={e => setExpiryInput(prev => ({ ...prev, [item.id]: e.target.value }))} className="nude-input" style={{ fontSize: '0.78rem', padding: '5px 8px', flex: 1 }} />
                                <button className="action-pill" style={{ whiteSpace: 'nowrap' }} onClick={() => saveExpiry(item)}>Set</button>
                              </div>
                            </div>
                          )}

                          {showQr === item.id && qrDataUrls[item.id] && (
                            <div className="panel-box">
                              <div className="panel-label">📱 QR Code — scan to view live item details</div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8 }}>
                                <img src={qrDataUrls[item.id]} alt="QR Code" style={{ width: 160, height: 160, borderRadius: 8 }} />
                                <div style={{ fontSize: '0.68rem', color: textSub, fontStyle: 'italic', textAlign: 'center' }}>Scan to open live stock details for {item.name}</div>
                                <a href={qrDataUrls[item.id]} download={`qr-${item.name}.png`} style={{ fontSize: '0.7rem', color: '#9c7b5e', textDecoration: 'underline', cursor: 'pointer' }}>Download QR Image</a>
                              </div>
                            </div>
                          )}

                          {showItemSupplierPicker === item.id && (
                            <div className="panel-box">
                              <div className="panel-label">🏭 Link Supplier — assign a supplier to this item</div>
                              {suppliers.length === 0
                                ? <div style={{ color: textSub, fontSize: '0.8rem', fontStyle: 'italic' }}>No suppliers yet. Add one in the Suppliers tab.</div>
                                : suppliers.map(s => (
                                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: `1px solid ${border}` }}>
                                    <span style={{ fontSize: '0.85rem', color: text, fontStyle: 'italic' }}>{s.name}</span>
                                    <button className="action-pill" onClick={() => linkSupplierToItem(item.id, s.id)}>Link</button>
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="carousel-footer">
                        <div className="carousel-dots">
                          {filtered.slice(0, Math.min(filtered.length, 8)).map((_, i) => (
                            <div key={i} className={`c-dot ${activeItemIdx === i ? 'active' : ''}`} onClick={() => setActiveItemIdx(i)} />
                          ))}
                          {filtered.length > 8 && <span style={{ fontSize: '0.7rem', color: textSub, alignSelf: 'center' }}>+{filtered.length - 8}</span>}
                        </div>
                        <div className="nav-arrows">
                          <button className="arrow-btn" disabled={activeItemIdx === 0} onClick={() => setActiveItemIdx(i => i - 1)}>←</button>
                          <button className="arrow-btn" disabled={activeItemIdx === filtered.length - 1} onClick={() => setActiveItemIdx(i => i + 1)}>→</button>
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* ── Slide 2: Analytics ── */}
              <div className="slide">
                <div className="analytics-grid">
                  <div className="a-card">
                    <div className="a-title">Critical Items</div>
                    {items.filter(i => getStatus(i) === 'critical').length === 0
                      ? <div style={{ color: textSub, fontStyle: 'italic', fontSize: '0.9rem' }}>All items are well stocked.</div>
                      : items.filter(i => getStatus(i) === 'critical').map(i => (
                        <div key={i.id} className="a-row"><span className="a-item-name">{i.name}</span><span style={{ color: '#a0502a', fontSize: '0.78rem' }}>{i.current_stock} {i.unit}</span></div>
                      ))}
                  </div>
                  <div className="a-card">
                    <div className="a-title">Stock Value Breakdown — top items by ₹ value</div>
                    {!valueData || valueData.breakdown.filter(b => b.price_per_unit > 0).length === 0
                      ? <div style={{ color: textSub, fontStyle: 'italic', fontSize: '0.9rem' }}>Set prices on items to see value breakdown.</div>
                      : valueData.breakdown.filter(b => b.price_per_unit > 0).slice(0, 6).map(b => (
                        <div key={b.id} className="a-row">
                          <span className="a-item-name">{b.name}</span>
                          <span style={{ color: '#9c7b5e', fontSize: '0.78rem' }}>₹{b.total_value.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                  </div>
                  <div className="a-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="a-title">Full Inventory — stock levels at a glance</div>
                    {items.map(i => {
                      const s = getStatus(i); const pct = getStockPercent(i)
                      return (
                        <div key={i.id} className="a-row">
                          <span className="a-item-name">{i.name}</span>
                          <div style={{ flex: 1, margin: '0 20px' }}>
                            <div className="stock-bar-track">
                              <div className={`stock-bar-fill ${s === 'healthy' ? 'bar-healthy' : s === 'low' ? 'bar-low' : 'bar-critical'}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <span className="a-val">{i.current_stock} {i.unit}</span>
                        </div>
                      )
                    })}
                    {items.length === 0 && <div style={{ color: textSub, fontStyle: 'italic', fontSize: '0.9rem' }}>No items yet.</div>}
                  </div>
                </div>
              </div>

              {/* ── Slide 3: Reports ── */}
              <div className="slide">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                  {/* Monthly report */}
                  <div className="a-card" style={{ gridColumn: '1 / -1' }}>
                    <div className="a-title">Monthly Report — {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</div>
                    {!monthlyReport || monthlyReport.message !== 'ok' ? (
                      <div style={{ color: textSub, fontStyle: 'italic', fontSize: '0.9rem' }}>No transactions this month yet.</div>
                    ) : (
                      <>
                        <div className="report-grid">
                          <div className="report-card">
                            <div className="report-label">Total Restocked (IN)</div>
                            <div className="report-num">{monthlyReport.total_in}</div>
                            <div style={{ fontSize: '0.7rem', color: textSub, fontStyle: 'italic', marginTop: 4 }}>units received this month</div>
                          </div>
                          <div className="report-card">
                            <div className="report-label">Total Consumed (OUT)</div>
                            <div className="report-num">{monthlyReport.total_out}</div>
                            <div style={{ fontSize: '0.7rem', color: textSub, fontStyle: 'italic', marginTop: 4 }}>units used or sold this month</div>
                          </div>
                          <div className="report-card">
                            <div className="report-label">Total Transactions</div>
                            <div className="report-num">{monthlyReport.total_transactions}</div>
                            <div style={{ fontSize: '0.7rem', color: textSub, fontStyle: 'italic', marginTop: 4 }}>stock movements logged</div>
                          </div>
                        </div>
                        {monthlyReport.top_consumed.length > 0 && (
                          <>
                            <div className="section-title" style={{ marginTop: 8 }}>Top 5 Most Consumed This Month</div>
                            <div className="top-bar-wrap">
                              {monthlyReport.top_consumed.map((item, i) => {
                                const max = monthlyReport.top_consumed[0].quantity
                                return (
                                  <div key={i} className="top-bar-row">
                                    <div className="top-bar-name">{item.name}</div>
                                    <div className="top-bar-track">
                                      <div className="top-bar-fill" style={{ width: `${(item.quantity / max) * 100}%` }} />
                                    </div>
                                    <div className="top-bar-val">{item.quantity} {item.unit}</div>
                                  </div>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Reorder reminders */}
                  <div className="a-card">
                    <div className="a-title">Reorder Reminders — items needing attention</div>
                    {reminders.length === 0
                      ? <div style={{ color: textSub, fontStyle: 'italic', fontSize: '0.9rem' }}>All items are adequately stocked.</div>
                      : reminders.map(r => (
                        <div key={r.id} className="reminder-row">
                          <div>
                            <div className="a-item-name">{r.name}</div>
                            <div style={{ fontSize: '0.68rem', color: textSub }}>{r.category}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.78rem', color: r.status === 'critical' ? '#a0502a' : '#8a5020' }}>{r.current_stock} / {r.minimum_stock} {r.unit}</div>
                            <div style={{ fontSize: '0.65rem', background: r.status === 'critical' ? 'rgba(196,122,90,0.15)' : 'rgba(212,168,130,0.15)', color: r.status === 'critical' ? '#a0502a' : '#8a5020', padding: '1px 8px', borderRadius: 20, marginTop: 2 }}>{r.status}</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  {/* Waste tracker */}
                  <div className="a-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div className="a-title" style={{ marginBottom: 0 }}>Waste Tracker — expired or damaged items</div>
                      <button className="action-pill" onClick={() => setShowWasteForm(!showWasteForm)}>+ Log Waste</button>
                    </div>
                    {showWasteForm && (
                      <div style={{ background: bgInput, border: `1px solid ${border}`, borderRadius: 12, padding: '1rem', marginBottom: '1rem', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{ fontSize: '0.65rem', color: textSub, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>
                          Log a waste event — select item, enter quantity lost and reason
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <select className="nude-input" value={wasteForm.inventory_id} onChange={e => setWasteForm({ ...wasteForm, inventory_id: e.target.value })}>
                            <option value="">Select item...</option>
                            {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.current_stock} {i.unit})</option>)}
                          </select>
                          <input className="nude-input" type="number" min="1" placeholder="Quantity wasted" value={wasteForm.quantity || ''} onChange={e => setWasteForm({ ...wasteForm, quantity: +e.target.value })} />
                          <select className="nude-input" value={wasteForm.reason} onChange={e => setWasteForm({ ...wasteForm, reason: e.target.value })}>
                            <option value="expired">Expired</option>
                            <option value="damaged">Damaged</option>
                            <option value="contaminated">Contaminated</option>
                            <option value="theft">Theft / Loss</option>
                            <option value="other">Other</option>
                          </select>
                          <input className="nude-input" placeholder="Optional note..." value={wasteForm.note} onChange={e => setWasteForm({ ...wasteForm, note: e.target.value })} />
                          <button className="save-btn" style={{ marginTop: 4 }} onClick={submitWaste}>Log Waste</button>
                        </div>
                      </div>
                    )}
                    {wasteLog.length === 0
                      ? <div style={{ color: textSub, fontStyle: 'italic', fontSize: '0.9rem' }}>No waste logged yet.</div>
                      : wasteLog.slice(0, 6).map(w => (
                        <div key={w.id} className="waste-row">
                          <div>
                            <div style={{ color: text, fontSize: '0.85rem', fontStyle: 'italic' }}>{w.item_name}</div>
                            <div style={{ color: textSub, fontSize: '0.68rem' }}>{w.reason}{w.note ? ` · ${w.note}` : ''}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#a0502a', fontSize: '0.78rem' }}>−{w.quantity} {w.unit}</div>
                            <div style={{ color: textSub, fontSize: '0.65rem' }}>{new Date(w.created_at).toLocaleDateString('en-GB')}</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>

                </div>
              </div>

              {/* ── Slide 4: Bulk Update ── */}
              <div className="slide">
                <div className="bulk-card">
                  {userRole === 'viewer' && <div style={{ textAlign: 'center', padding: '3rem', color: textSub, fontStyle: 'italic' }}>Viewers cannot update stock. Contact an admin to change your role.</div>}
                  {userRole !== 'viewer' && <>
                    <div className="bulk-title">Bulk Stock Update</div>
                    <div className="bulk-hint">Select multiple items, enter a quantity for each, choose IN or OUT, then apply all at once. Useful after a large delivery or end-of-day consumption log.</div>
                    <div className="bulk-type-row">
                      <button className={`bulk-type-btn ${bulkType === 'IN' ? 'active-in' : ''}`} onClick={() => setBulkType('IN')}>+ Stock In — received / restocked</button>
                      <button className={`bulk-type-btn ${bulkType === 'OUT' ? 'active-out' : ''}`} onClick={() => setBulkType('OUT')}>− Stock Out — consumed / sold</button>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
                      <input type="checkbox" className="bulk-check" checked={bulkSelected.length === items.length && items.length > 0} onChange={e => setBulkSelected(e.target.checked ? items.map(i => i.id) : [])} />
                      <span style={{ fontSize: '0.72rem', color: textSub, letterSpacing: '1px', textTransform: 'uppercase' }}>Select all ({items.length} items)</span>
                    </div>
                    {items.length === 0 && <div style={{ color: textSub, fontStyle: 'italic', fontSize: '0.9rem' }}>No items yet.</div>}
                    {items.map(item => (
                      <div key={item.id} className="bulk-row">
                        <input type="checkbox" className="bulk-check" checked={bulkSelected.includes(item.id)} onChange={e => setBulkSelected(prev => e.target.checked ? [...prev, item.id] : prev.filter(id => id !== item.id))} />
                        <span className="bulk-name">{item.name}</span>
                        <span className="bulk-stock">{item.current_stock} {item.unit}</span>
                        <input className="nude-qty" type="number" min="0" placeholder="qty" disabled={!bulkSelected.includes(item.id)} value={bulkQty[item.id] || ''} onChange={e => setBulkQty(prev => ({ ...prev, [item.id]: +e.target.value }))} style={{ opacity: bulkSelected.includes(item.id) ? 1 : 0.3 }} />
                      </div>
                    ))}
                    <button className="bulk-apply-btn" disabled={bulkSelected.length === 0} onClick={applyBulkUpdate}>
                      Apply {bulkType === 'IN' ? 'Stock In' : 'Stock Out'} to {bulkSelected.length} item{bulkSelected.length !== 1 ? 's' : ''}
                    </button>
                  </>}
                </div>
              </div>


              {/* ── Slide 5: Suppliers ── */}
              <div className="slide">
                <div className="a-card" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="a-title" style={{ marginBottom: 0 }}>Supplier Directory — manage your vendors and contacts</div>
                    {userRole === 'admin' && <button className="action-pill" onClick={() => setShowSupplierForm(!showSupplierForm)}>+ Add Supplier</button>}
                  </div>

                  {showSupplierForm && userRole === 'admin' && (
                    <div style={{ background: bgInput, border: `1px solid ${border}`, borderRadius: 14, padding: '1.2rem', marginBottom: '1.2rem', animation: 'fadeIn 0.3s ease' }}>
                      <div style={{ fontSize: '0.65rem', color: textSub, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
                        New Supplier — fill in contact details. Name is required.
                      </div>
                      <div className="form-grid">
                        <div className="field-wrap">
                          <label className="field-label">Supplier Name *</label>
                          <input className="nude-input" placeholder="e.g. ABC Trading Co." value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} />
                        </div>
                        <div className="field-wrap">
                          <label className="field-label">Email</label>
                          <input className="nude-input" placeholder="supplier@example.com" value={supplierForm.contact_email} onChange={e => setSupplierForm({ ...supplierForm, contact_email: e.target.value })} />
                        </div>
                        <div className="field-wrap">
                          <label className="field-label">Phone</label>
                          <input className="nude-input" placeholder="+91 98765 43210" value={supplierForm.contact_phone} onChange={e => setSupplierForm({ ...supplierForm, contact_phone: e.target.value })} />
                        </div>
                        <div className="field-wrap">
                          <label className="field-label">Lead Time (days)</label>
                          <input className="nude-input" type="number" min="0" placeholder="e.g. 7" value={supplierForm.lead_time_days} onChange={e => setSupplierForm({ ...supplierForm, lead_time_days: e.target.value })} />
                          <div className="field-hint">How many days from order to delivery?</div>
                        </div>
                        <div className="field-wrap">
                          <label className="field-label">Address</label>
                          <input className="nude-input" placeholder="City, State" value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} />
                        </div>
                        <div className="field-wrap">
                          <label className="field-label">Notes</label>
                          <input className="nude-input" placeholder="Any additional info" value={supplierForm.notes} onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })} />
                        </div>
                      </div>
                      <button className="save-btn" onClick={addSupplier}>Save Supplier</button>
                    </div>
                  )}

                  {suppliers.length === 0 ? (
                    <div style={{ color: textSub, fontStyle: 'italic', fontSize: '0.9rem' }}>No suppliers yet. {userRole === 'admin' ? 'Add your first supplier above.' : 'Contact an admin to add suppliers.'}</div>
                  ) : suppliers.map(s => (
                    <div key={s.id} className="a-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <div style={{ fontSize: '1rem', color: text, fontStyle: 'italic' }}>{s.name}</div>
                        {userRole === 'admin' && <button className="action-pill danger" style={{ fontSize: '0.65rem', padding: '3px 10px' }} onClick={() => deleteSupplier(s.id, s.name)}>✕</button>}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {s.contact_email && <span style={{ fontSize: '0.72rem', color: textSub }}>✉ {s.contact_email}</span>}
                        {s.contact_phone && <span style={{ fontSize: '0.72rem', color: textSub }}>☎ {s.contact_phone}</span>}
                        {s.lead_time_days && <span style={{ fontSize: '0.72rem', color: '#9c7b5e' }}>⏱ {s.lead_time_days} day lead time</span>}
                        {s.address && <span style={{ fontSize: '0.72rem', color: textSub }}>📍 {s.address}</span>}
                      </div>
                      {s.notes && <div style={{ fontSize: '0.7rem', color: textSub, fontStyle: 'italic' }}>📝 {s.notes}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Slide 6: Activity Log ── */}
              <div className="slide">
                <div className="a-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div className="a-title" style={{ marginBottom: 0 }}>Activity Log — who did what and when</div>
                    <button className="action-pill" onClick={fetchActivityLog}>↻ Refresh</button>
                  </div>
                  {activityLog.length === 0 ? (
                    <div style={{ color: textSub, fontStyle: 'italic', fontSize: '0.9rem' }}>No activity recorded yet. Actions like adding items, updating stock, and logging waste will appear here.</div>
                  ) : activityLog.map(a => (
                    <div key={a.id} className="a-row" style={{ gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', color: text }}>{a.action}{a.item_name ? ` — ${a.item_name}` : ''}</div>
                        <div style={{ fontSize: '0.7rem', color: textSub, fontStyle: 'italic' }}>{a.user_email}</div>
                        {a.details && <div style={{ fontSize: '0.68rem', color: textSub }}>{a.details}</div>}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: textSub, whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="carousel-footer" style={{ marginTop: '1.5rem' }}>
            <div className="carousel-dots">
              {slides.map((_, i) => (
                <div key={i} className={`c-dot ${activeSlide === i ? 'active' : ''}`} onClick={() => setActiveSlide(i)} />
              ))}
            </div>
            <div style={{ fontSize: '0.65rem', color: textSub, letterSpacing: '2px', textTransform: 'uppercase' }}>
              Stock & Store · {items.length} items · ₹{valueData ? valueData.total_value.toLocaleString('en-IN') : '0'} total value
            </div>
          </div>

        </div>
      </div>
    </>
  )
}