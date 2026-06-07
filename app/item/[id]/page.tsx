'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { API_URL } from '../../../lib/supabase'

type ItemDetail = {
    id: string; name: string; category: string
    current_stock: number; minimum_stock: number
    unit: string; expiry_date?: string | null
    notes?: string | null; price_per_unit?: number | null
    stock_status: string; days_until_expiry: number | null
    expiry_status: string
    supplier?: { name: string; contact_email: string; contact_phone: string; lead_time_days: number } | null
}

export default function ItemDetailPage() {
    const params = useParams()
    const id = params?.id as string
    const [item, setItem] = useState<ItemDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!id) return
        fetch(`${API_URL}/inventory/${id}/detail`)
            .then(r => r.json())
            .then(d => { if (d.error) setError(d.error); else setItem(d); setLoading(false) })
            .catch(() => { setError('Could not load item.'); setLoading(false) })
    }, [id])

    const statusColor = item?.stock_status === 'healthy' ? '#9c7b5e' : item?.stock_status === 'low' ? '#b87840' : '#a0502a'
    const statusLabel = item?.stock_status === 'healthy' ? 'Well Stocked' : item?.stock_status === 'low' ? 'Running Low' : 'Critical'
    const expiryColor = item?.expiry_status === 'ok' ? '#9c7b5e' : item?.expiry_status === 'warning' ? '#b87840' : '#a0502a'

    return (
        <>
            <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5ede4; font-family: 'Times New Roman', serif; }
        .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5ede4; padding: 2rem; }
        .card { background: #ede3d8; border: 1px solid #d4c4b4; border-radius: 24px; padding: 2.5rem; width: 100%; max-width: 480px; }
        .logo { font-size: 1rem; color: #b8a898; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 1.5rem; }
        .item-title { font-size: 2.4rem; font-weight: 300; color: #3d2e22; font-style: italic; line-height: 1.1; margin-bottom: 6px; }
        .cat-badge { display: inline-block; background: #f5ede4; border: 1px solid #d4c4b4; padding: 3px 14px; border-radius: 40px; font-size: 0.68rem; color: #9c7b5e; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 1.5rem; }
        .section { margin-bottom: 1.5rem; }
        .section-label { font-size: 0.65rem; color: #b8a898; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
        .stock-num { font-size: 3.5rem; font-weight: 300; color: #3d2e22; line-height: 1; }
        .stock-unit { font-size: 0.9rem; color: #b8a898; font-style: italic; margin-left: 8px; }
        .bar-track { height: 8px; background: #d4c4b4; border-radius: 8px; overflow: hidden; margin-top: 10px; }
        .bar-fill { height: 8px; border-radius: 8px; }
        .status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 16px; border-radius: 40px; font-size: 0.75rem; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 10px; border: 1px solid; }
        .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d4c4b4; font-size: 0.85rem; }
        .row:last-child { border-bottom: none; }
        .row-label { color: #b8a898; font-style: italic; }
        .row-val { color: #3d2e22; }
        .notes-box { background: #f5ede4; border: 1px solid #d4c4b4; border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.82rem; color: #7a6040; font-style: italic; }
        .supplier-box { background: #f5ede4; border: 1px solid #d4c4b4; border-radius: 14px; padding: 1rem 1.2rem; }
        .divider { border: none; border-top: 1px solid #d4c4b4; margin: 1.5rem 0; }
        .footer { text-align: center; font-size: 0.68rem; color: #b8a898; letter-spacing: 2px; text-transform: uppercase; margin-top: 2rem; }
        .loading { text-align: center; color: #b8a898; font-style: italic; padding: 4rem; }
        .error-box { text-align: center; color: #a0502a; font-style: italic; padding: 4rem; }
      `}</style>
            <div className="wrap">
                <div className="card">
                    <div className="logo">Stock & Store · Item Detail</div>

                    {loading && <div className="loading">Loading item details...</div>}
                    {error && <div className="error-box">{error}</div>}

                    {item && (
                        <>
                            <div className="item-title">{item.name}</div>
                            <span className="cat-badge">{item.category}</span>

                            {/* Stock */}
                            <div className="section">
                                <div className="section-label">Current Stock</div>
                                <div>
                                    <span className="stock-num">{item.current_stock}</span>
                                    <span className="stock-unit">{item.unit}</span>
                                </div>
                                <div className="bar-track">
                                    <div className="bar-fill" style={{
                                        width: `${Math.min(100, item.minimum_stock === 0 ? 100 : (item.current_stock / (item.minimum_stock * 3)) * 100)}%`,
                                        background: `linear-gradient(90deg, ${statusColor}80, ${statusColor})`
                                    }} />
                                </div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 40, fontSize: '0.72rem', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 10, border: `1px solid ${statusColor}`, background: `${statusColor}20`, color: statusColor }}>
                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, display: 'inline-block' }} />
                                    {statusLabel}
                                </div>
                            </div>

                            <hr className="divider" />

                            {/* Details */}
                            <div className="section">
                                <div className="section-label">Item Details</div>
                                <div className="row"><span className="row-label">Minimum Stock</span><span className="row-val">{item.minimum_stock} {item.unit}</span></div>
                                {item.price_per_unit && <div className="row"><span className="row-label">Price per Unit</span><span className="row-val">₹{item.price_per_unit}</span></div>}
                                {item.price_per_unit && <div className="row"><span className="row-label">Total Stock Value</span><span className="row-val">₹{(item.price_per_unit * item.current_stock).toLocaleString('en-IN')}</span></div>}
                            </div>

                            {/* Expiry */}
                            {item.expiry_date && (
                                <>
                                    <hr className="divider" />
                                    <div className="section">
                                        <div className="section-label">Expiry Information</div>
                                        <div className="row"><span className="row-label">Expiry Date</span><span className="row-val">{item.expiry_date}</span></div>
                                        <div className="row">
                                            <span className="row-label">Days Remaining</span>
                                            <span style={{ color: expiryColor }}>
                                                {item.days_until_expiry !== null
                                                    ? item.days_until_expiry < 0
                                                        ? `Expired ${Math.abs(item.days_until_expiry)} days ago`
                                                        : `${item.days_until_expiry} days`
                                                    : '—'}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Notes */}
                            {item.notes && (
                                <>
                                    <hr className="divider" />
                                    <div className="section">
                                        <div className="section-label">Notes</div>
                                        <div className="notes-box">📝 {item.notes}</div>
                                    </div>
                                </>
                            )}

                            {/* Supplier */}
                            {item.supplier && (
                                <>
                                    <hr className="divider" />
                                    <div className="section">
                                        <div className="section-label">Supplier</div>
                                        <div className="supplier-box">
                                            <div style={{ fontSize: '1rem', color: '#3d2e22', fontStyle: 'italic', marginBottom: 8 }}>{item.supplier.name}</div>
                                            {item.supplier.contact_email && <div className="row"><span className="row-label">Email</span><span className="row-val">{item.supplier.contact_email}</span></div>}
                                            {item.supplier.contact_phone && <div className="row"><span className="row-label">Phone</span><span className="row-val">{item.supplier.contact_phone}</span></div>}
                                            {item.supplier.lead_time_days && <div className="row"><span className="row-label">Lead Time</span><span className="row-val">{item.supplier.lead_time_days} days</span></div>}
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="footer">Scanned via Stock & Store QR · Live Data</div>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}