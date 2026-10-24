import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, Copy, ExternalLink, Gift, LogOut, RefreshCw, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { currentUser, supabase } from './lib/supabase'
import './admin-page.css'
import './admin-brand-fix.css'
import './admin-ui-polish.css'
import './admin-tooltip.css'

const empty = { buyerName: '', buyerEmail: '', buyerPhone: '', buyerAddress: '', buyerNote: '', productName: '', variantName: '', quantity: 1, unitPrice: 0 }
const makeToken = () => `allura-${crypto.randomUUID().replaceAll('-', '')}`

export default function AdminCodePage({ onNavigate }) {
  const [user, setUser] = useState(null)
  const [allowed, setAllowed] = useState(null)
  const [orders, setOrders] = useState([])
  const [lamps, setLamps] = useState([])
  const [profiles, setProfiles] = useState([])
  const [gifts, setGifts] = useState([])
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(null)
  const [copied, setCopied] = useState(false)
  const [trackingQuery, setTrackingQuery] = useState('')
  const [trackingStatus, setTrackingStatus] = useState('all')
  const [trackingPage, setTrackingPage] = useState(1)

  const update = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  const total = useMemo(() => Number(form.unitPrice || 0), [form.unitPrice])
  const lampMap = useMemo(() => new Map(lamps.map(lamp => [lamp.id, lamp])), [lamps])
  const profileMap = useMemo(() => new Map(profiles.map(profile => [profile.id, profile])), [profiles])
  const giftMap = useMemo(() => new Map(gifts.map(gift => [gift.lamp_id, gift])), [gifts])
  const trackingRows = useMemo(() => {
    const query = trackingQuery.trim().toLowerCase()
    return orders
      .map(order => {
        const lamp = lampMap.get(order.lamp_id)
        const profile = lamp?.owner_id ? profileMap.get(lamp.owner_id) : null
        const gift = lamp?.id ? giftMap.get(lamp.id) : null
        const isActive = lamp?.status === 'active'
        const status = isActive ? 'active' : lamp?.status === 'disabled' ? 'disabled' : 'waiting'
        return { order, lamp, profile, gift, status }
      })
      .filter(row => trackingStatus === 'all' || row.status === trackingStatus)
      .filter(row => {
        if (!query) return true
        const { order, lamp, profile } = row
        return [
          order.buyer_name,
          order.buyer_email,
          order.product_name,
          order.variant_name,
          order.nfc_token,
          order.lamp_id,
          lamp?.owner_id,
          profile?.full_name,
          profile?.email,
        ].some(value => String(value || '').toLowerCase().includes(query))
      })
  }, [orders, lamps, profiles, gifts, lampMap, profileMap, giftMap, trackingQuery, trackingStatus])
  const trackingStats = useMemo(() => ({
    total: orders.length,
    waiting: orders.filter(order => lampMap.get(order.lamp_id)?.status !== 'active').length,
    active: orders.filter(order => lampMap.get(order.lamp_id)?.status === 'active').length,
    ready: orders.filter(order => giftMap.get(order.lamp_id)?.status === 'ready').length,
  }), [orders, lampMap, giftMap])
  const trackingPageSize = 10
  const trackingPageCount = Math.max(1, Math.ceil(trackingRows.length / trackingPageSize))
  const paginatedTrackingRows = trackingRows.slice((trackingPage - 1) * trackingPageSize, trackingPage * trackingPageSize)

  useEffect(() => { setTrackingPage(1) }, [trackingQuery, trackingStatus])
  useEffect(() => { setTrackingPage(current => Math.min(current, trackingPageCount)) }, [trackingPageCount])

  const formatDate = value => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'
  const statusLabel = status => status === 'active' ? 'Đã kích hoạt' : status === 'disabled' ? 'Đã vô hiệu hóa' : 'Chờ kích hoạt'
  const getAccountLabel = row => row.profile?.full_name || row.profile?.email || row.order.buyer_email || (row.lamp?.owner_id ? `User ${row.lamp.owner_id.slice(0, 8)}…` : 'Chưa claim')

  async function load() {
    setTrackingStatus('all')
    setTrackingPage(1)
    setLoading(true)
    setError('')
    const current = await currentUser()
    setUser(current)
    if (!current || !supabase) {
      setAllowed(false)
      setLoading(false)
      return
    }
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', current.id).maybeSingle()
    if (!profile?.is_admin) {
      setAllowed(false)
      setLoading(false)
      return
    }
    setAllowed(true)
    const [ordersResult, lampsResult, profilesResult, giftsResult] = await Promise.all([
      supabase.from('admin_orders').select('*').order('created_at', { ascending: false }),
      supabase.from('lamps').select('id,nfc_token,owner_id,status,activated_at,created_at'),
      supabase.from('profiles').select('id,full_name,email'),
      supabase.from('gift_contents').select('lamp_id,status,updated_at'),
    ])
    if (ordersResult.error) setError(ordersResult.error.message)
    else setOrders(ordersResult.data || [])
    setLamps(lampsResult.data || [])
    setProfiles(profilesResult.data || [])
    setGifts(giftsResult.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function complete(event) {
    event.preventDefault()
    setError('')
    setDone(null)
    if (!user || !supabase) return setError('Chưa cấu hình Supabase hoặc chưa đăng nhập.')
    if (!form.buyerEmail.trim()) return setError('Email người mua là bắt buộc để gán chiếc đèn.')

    setBusy(true)
    const nfcToken = makeToken()
    const lamp = await supabase.from('lamps').insert({
      nfc_token: nfcToken,
      owner_id: null,
      status: 'inactive',
      activated_at: null,
    }).select('id,nfc_token,status').single()

    if (lamp.error) {
      setError(lamp.error.message)
      setBusy(false)
      return
    }

    const order = await supabase.from('admin_orders').insert({
      created_by: user.id,
      lamp_id: lamp.data.id,
      buyer_name: form.buyerName,
      buyer_email: form.buyerEmail.trim().toLowerCase(),
      buyer_phone: form.buyerPhone || null,
      buyer_address: form.buyerAddress || null,
      buyer_note: form.buyerNote || null,
      product_name: form.productName,
      variant_name: form.variantName || '',
      quantity: 1,
      unit_price: Number(form.unitPrice || 0),
      receiver_name: null,
      receiver_email: null,
      occasion: 'Khác',
      title: null,
      message: null,
      signature: null,
      image_url: null,
      nfc_token: nfcToken,
      status: 'draft',
    }).select('*').single()

    if (order.error) {
      await supabase.from('lamps').delete().eq('id', lamp.data.id)
      setError(order.error.message)
      setBusy(false)
      return
    }

    setDone(order.data)
    setForm(empty)
    await load()
    setBusy(false)
  }

  async function copy(value) {
    await navigator.clipboard?.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function signOut() {
    await supabase?.auth.signOut()
    onNavigate('/dang-nhap')
  }

  if (loading) return <div className="admin-state">Đang kiểm tra quyền admin…</div>
  if (!allowed) return <section className="admin-state"><ShieldCheck size={32}/><h1>Khu vực dành cho admin</h1><p>Tài khoản này chưa được cấp quyền truy cập.</p><button className="primary" onClick={() => onNavigate(user ? '/' : '/dang-nhap')}>{user ? 'Về trang chủ' : 'Đăng nhập'}</button></section>

  return <div className="admin-page">
    <header className="admin-header"><div className="admin-brand"><img className="admin-brand-logo" src="/assets/allura-round-logo.png" alt="Allura" /><span><b>Allura Admin</b><small>gift issuing console</small></span></div><div className="admin-actions"><button onClick={load}><RefreshCw size={16}/> Làm mới</button><button onClick={signOut}><LogOut size={16}/> Đăng xuất</button></div></header>
    <main className="admin-layout">
      <section className="admin-main">
        <div className="admin-intro"><div><div className="eyebrow"><Sparkles size={15}/> QUẢN LÝ QUÀ TẶNG</div><h1>Tạo món quà<br/><em>& phát hành NFC.</em></h1><p>Tạo token trước, sau đó người mua sẽ đăng nhập để nhận đèn và tự thiết lập nội dung.</p></div><div className="admin-stat"><b>{orders.length}</b><span>Đơn đã tạo</span></div></div>
        <form className="admin-form" onSubmit={complete}>
          <AdminGroup title="Thông tin người mua"><div className="admin-grid"><Field label="Tên người mua *" name="buyerName" value={form.buyerName} onChange={update} required/><Field label="Email người mua *" name="buyerEmail" value={form.buyerEmail} onChange={update} type="email" required/><Field label="Số điện thoại" name="buyerPhone" value={form.buyerPhone} onChange={update}/><Field label="Địa chỉ người mua" name="buyerAddress" value={form.buyerAddress} onChange={update}/><Field label="Ghi chú đơn hàng" name="buyerNote" value={form.buyerNote} onChange={update} wide/></div></AdminGroup>
          <AdminGroup title="Sản phẩm"><div className="admin-grid"><Field label="Sản phẩm *" name="productName" value={form.productName} onChange={update} required/><Field label="Phiên bản" name="variantName" value={form.variantName} onChange={update}/><Field label="Số lượng *" name="quantity" value={form.quantity} onChange={update} type="number" min="1" required/><Field label="Đơn giá" name="unitPrice" value={form.unitPrice} onChange={update} type="number" min="0"/></div><div className="admin-total">Tổng tham khảo <b>{new Intl.NumberFormat('vi-VN').format(total)}đ</b></div><p className="admin-code-help">Sau khi tạo, gửi URL NFC cho người mua. Người mua phải đăng nhập bằng đúng email này để kích hoạt đèn.</p></AdminGroup>
          {error && <div className="admin-error">{error}</div>}
          <button className="admin-complete" disabled={busy}>{busy ? 'Đang tạo NFC token…' : 'Tạo NFC token chờ kích hoạt'} <CheckCircle2 size={18}/></button>
        </form>
      </section>
      <aside className="admin-sidebar"><div className="admin-side-title"><h2>Lịch sử phát hành</h2><span>{orders.length}</span></div>{orders.length ? orders.map(order => <article className="admin-order" key={order.id}><div><b>{order.product_name}</b><span>{order.buyer_name} · {order.buyer_email || 'Chưa có email'}</span></div><small>{order.assigned_at ? 'Đã gán cho người mua' : 'Chờ người mua kích hoạt'}</small>{order.nfc_token && <code>/n/{order.nfc_token}</code>}</article>) : <div className="admin-empty"><Gift size={22}/><p>Chưa có NFC nào được phát hành.</p></div>}</aside>
    </main>
    <section className="admin-tracking">
      <div className="admin-tracking-header">
        <div><div className="eyebrow"><Search size={15}/> NFC TRACKING</div><h2>Theo dõi NFC đã phát hành</h2><p>Đối soát mỗi token với chiếc đèn, email người mua và tài khoản đã claim.</p></div>
        <div className="admin-tracking-filters"><label className="admin-search"><Search size={16}/><input value={trackingQuery} onChange={event => setTrackingQuery(event.target.value)} placeholder="Tìm tên, email, token, lamp ID…" /></label><StatusDropdown value={trackingStatus} onChange={setTrackingStatus} /></div>
      </div>
      <div className="admin-tracking-stats"><div><span>Tổng NFC</span><b>{trackingStats.total}</b></div><div><span>Chờ claim</span><b>{trackingStats.waiting}</b></div><div><span>Đã kích hoạt</span><b>{trackingStats.active}</b></div><div><span>Đã có nội dung</span><b>{trackingStats.ready}</b></div></div>
      <div className="admin-table-wrap">
        <table className="admin-tracking-table"><thead><tr><th>NFC / đèn</th><th>Người mua</th><th>Tài khoản sở hữu</th><th>Trạng thái</th><th>Nội dung</th><th>Thời gian</th><th></th></tr></thead><tbody>
          {paginatedTrackingRows.length ? paginatedTrackingRows.map(row => {
            const { order, lamp, gift, profile, status } = row
            const nfcUrl = order.nfc_token ? `${window.location.origin}/n/${order.nfc_token}` : ''
            return <tr key={order.id}>
              <td><div className="tracking-token"><span className="admin-tooltip-value" tabIndex="0" title={order.nfc_token || 'Chưa có token'} data-tooltip={order.nfc_token || 'Chưa có token'}><code>{order.nfc_token || 'Chưa có token'}</code></span><span className="admin-tooltip-value" tabIndex="0" title={`Lamp ID: ${lamp?.id || order.lamp_id || 'Chưa gán'}`} data-tooltip={`Lamp ID: ${lamp?.id || order.lamp_id || 'Chưa gán'}`}><small>Lamp ID: {lamp?.id || order.lamp_id || 'Chưa gán'}</small></span>{lamp?.owner_id && <span className="admin-tooltip-value" tabIndex="0" title={`Owner ID: ${lamp.owner_id}`} data-tooltip={`Owner ID: ${lamp.owner_id}`}><small>Owner ID: {lamp.owner_id}</small></span>}</div></td>
              <td><div className="tracking-person"><b>{order.buyer_name || 'Chưa có tên'}</b><span>{order.buyer_email || 'Chưa có email'}</span>{order.buyer_phone && <small>{order.buyer_phone}</small>}</div></td>
              <td><div className="tracking-person"><b>{getAccountLabel(row)}</b><span>{profile?.email && profile.email !== getAccountLabel(row) ? profile.email : row.lamp?.owner_id ? 'Đã claim bằng email người mua' : 'Chưa có tài khoản claim'}</span></div></td>
              <td><span className={`tracking-status ${status}`}>{statusLabel(status)}</span>{(order.assigned_at || lamp?.activated_at) && <small className="tracking-date">{formatDate(order.assigned_at || lamp.activated_at)}</small>}</td>
              <td><span className={`tracking-gift ${gift?.status === 'ready' ? 'ready' : ''}`}>{gift?.status === 'ready' ? 'Đã lưu' : 'Chưa thiết lập'}</span></td>
              <td><span className="tracking-date">Tạo: {formatDate(order.created_at)}</span><span className="tracking-date">Kích hoạt: {formatDate(lamp?.activated_at)}</span></td>
              <td><div className="tracking-actions">{nfcUrl && <button title="Copy URL NFC" onClick={() => copy(nfcUrl)}><Copy size={15}/></button>}{nfcUrl && <a title="Mở URL NFC" href={`/n/${order.nfc_token}`} target="_blank" rel="noreferrer"><ExternalLink size={15}/></a>}</div></td>
            </tr>
          }) : <tr><td colSpan="7" className="admin-table-empty">Không tìm thấy NFC phù hợp.</td></tr>}
        </tbody></table>
      </div>
      {trackingRows.length > 0 && <div className="admin-pagination"><button type="button" disabled={trackingPage === 1} onClick={() => setTrackingPage(current => Math.max(1, current - 1))}>Trước</button><span>Trang {trackingPage} / {trackingPageCount}</span><button type="button" disabled={trackingPage === trackingPageCount} onClick={() => setTrackingPage(current => Math.min(trackingPageCount, current + 1))}>Sau</button></div>}
      <p className="admin-tracking-note">Email người mua là email được dùng để claim đèn. Khi người mua kích hoạt thành công, hệ thống ghi lại user ID và thời điểm claim để admin đối soát.</p>
    </section>
    {done && <div className="admin-success-overlay"><div className="admin-success"><button className="admin-close" onClick={() => setDone(null)}>×</button><CheckCircle2 size={42}/><div className="eyebrow">ĐÃ TẠO NFC</div><h2>Token đang chờ người mua kích hoạt</h2><p>Gửi URL này cho người mua và nhắc họ đăng nhập bằng đúng email đã nhập:</p><div className="token-box"><code>{window.location.origin}/n/{done.nfc_token}</code><button onClick={() => copy(`${window.location.origin}/n/${done.nfc_token}`)}>{copied ? 'Đã copy' : <><Copy size={16}/> URL</>}</button><a href={`/n/${done.nfc_token}`} target="_blank" rel="noreferrer"><ExternalLink size={16}/></a></div><button className="primary" onClick={() => setDone(null)}>Tạo NFC khác</button></div></div>}
  </div>
}

function StatusDropdown({ value, onChange }) {
  const dropdownRef = useRef(null)
  const [open, setOpen] = useState(false)
  const options = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'waiting', label: 'Chờ kích hoạt' },
    { value: 'active', label: 'Đã kích hoạt' },
    { value: 'disabled', label: 'Đã vô hiệu hóa' },
  ]
  const selected = options.find(option => option.value === value) || options[0]

  useEffect(() => {
    const close = event => {
      if (!dropdownRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return <div ref={dropdownRef} className={`admin-status-dropdown${open ? ' is-open' : ''}`}>
    <button type="button" className="admin-status-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}>
      <span>{selected.label}</span><ChevronDown size={17}/>
    </button>
    {open && <div className="admin-status-menu" role="listbox" aria-label="Lọc trạng thái">
      {options.map(option => <button type="button" role="option" aria-selected={option.value === value} className={option.value === value ? 'selected' : ''} key={option.value} onClick={() => { onChange(option.value); setOpen(false) }}>{option.label}</button>)}
    </div>}
  </div>
}

function AdminGroup({ title, children }) { return <section className="admin-group"><h2>{title}</h2>{children}</section> }
function Field({ label, name, value, onChange, wide, ...props }) { return <label className={wide ? 'admin-field wide' : 'admin-field'}>{label}<input name={name} value={value} onChange={onChange} {...props}/></label> }
