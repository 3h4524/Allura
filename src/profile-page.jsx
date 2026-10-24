import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, MapPin, Phone, Save, UserRound } from 'lucide-react'
import { useLanguage } from './language.jsx'
import { currentUser, supabase } from './lib/supabase'

const fallbackProvinces = [
  { code: 'hn', name: 'Hà Nội' },
  { code: 'hcm', name: 'Thành phố Hồ Chí Minh' },
  { code: 'dn', name: 'Đà Nẵng' },
  { code: 'hp', name: 'Hải Phòng' },
  { code: 'ct', name: 'Cần Thơ' },
  { code: 'kh', name: 'Khánh Hòa' },
  { code: 'bd', name: 'Bình Dương' },
  { code: 'dd', name: 'Đồng Nai' },
]

const locationName = location => location?.name || location?.full_name || location?.province_name || location?.ward_name || ''
const locationCode = location => String(location?.code || location?.id || location?.province_code || location?.ward_code || '')

export default function ProfilePage({ onNavigate }) {
  const { language } = useLanguage()
  const english = language === 'en'
  const copy = useMemo(() => english ? {
    eyebrow: 'YOUR ALLURA PROFILE',
    title: <>Make your Allura space<br /><em>feel like yours.</em></>,
    description: 'Keep your contact details ready for gift setup, order support, and your private memories.',
    account: 'Account profile',
    accountHint: 'Your email is connected to this Allura account.',
    fullName: 'Full name',
    fullNamePlaceholder: 'Your name',
    email: 'Email address',
    phone: 'Phone number',
    phonePlaceholder: 'For example: +84 935 427 618',
    address: 'Delivery address',
    addressPlaceholder: 'Your preferred delivery address',
    addressLoading: 'Loading address suggestions...',
    noAddressSuggestions: 'No matching locations found.',
    security: 'Private and secure',
    securityText: 'Your profile is only visible to you and is used to make setup and support more convenient.',
    save: 'Save changes',
    saving: 'Saving...',
    saved: 'Profile updated successfully.',
    signIn: 'Sign in to view your profile',
    notConfigured: 'Supabase Auth is not configured yet.',
    loadError: 'Unable to load your profile. Please try again.',
    saveError: 'Unable to save your profile. Please try again.',
    back: 'Back to Allura',
  } : {
    eyebrow: 'HỒ SƠ ALLURA CỦA BẠN',
    title: <>Làm cho không gian Allura<br /><em>mang dấu ấn của bạn.</em></>,
    description: 'Lưu thông tin liên hệ để thiết lập quà tặng, hỗ trợ đơn hàng và quản lý những kỷ niệm riêng tư thuận tiện hơn.',
    account: 'Thông tin tài khoản',
    accountHint: 'Email này đang được liên kết với tài khoản Allura của bạn.',
    fullName: 'Họ và tên',
    fullNamePlaceholder: 'Tên của bạn',
    email: 'Địa chỉ email',
    phone: 'Số điện thoại',
    phonePlaceholder: 'Ví dụ: 0935 427 618',
    address: 'Địa chỉ nhận hàng',
    addressPlaceholder: 'Địa chỉ nhận hàng bạn thường dùng',
    addressLoading: 'Đang tải gợi ý địa chỉ...',
    noAddressSuggestions: 'Không tìm thấy địa điểm phù hợp.',
    security: 'Riêng tư và bảo mật',
    securityText: 'Thông tin hồ sơ chỉ hiển thị với bạn, giúp việc thiết lập và hỗ trợ thuận tiện hơn.',
    save: 'Lưu thay đổi',
    saving: 'Đang lưu...',
    saved: 'Đã cập nhật hồ sơ.',
    signIn: 'Đăng nhập để xem hồ sơ',
    notConfigured: 'Supabase Auth chưa được cấu hình.',
    loadError: 'Không thể tải hồ sơ. Vui lòng thử lại.',
    saveError: 'Không thể lưu hồ sơ. Vui lòng thử lại.',
    back: 'Về trang Allura',
  }, [english])

  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ fullName: '', phone: '', address: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [provinces, setProvinces] = useState([])
  const [wards, setWards] = useState([])
  const [locationOpen, setLocationOpen] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [addressSearchLoading, setAddressSearchLoading] = useState(false)
  const [remoteSuggestions, setRemoteSuggestions] = useState([])
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/locations/provinces')
      .then(response => response.ok ? response.json() : Promise.reject(new Error('locations unavailable')))
      .then(data => {
        if (!active) return
        const next = Array.isArray(data) ? data.filter(item => locationName(item)) : []
        setProvinces(next.length ? next : fallbackProvinces)
      })
      .catch(() => { if (active) setProvinces(fallbackProvinces) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedProvinceCode) {
      setWards([])
      return undefined
    }

    let active = true
    setLocationLoading(true)
    fetch(`/api/locations/provinces/${encodeURIComponent(selectedProvinceCode)}`)
      .then(response => response.ok ? response.json() : Promise.reject(new Error('wards unavailable')))
      .then(data => { if (active) setWards(Array.isArray(data) ? data.filter(item => locationName(item)) : []) })
      .catch(() => { if (active) setWards([]) })
      .finally(() => { if (active) setLocationLoading(false) })
    return () => { active = false }
  }, [selectedProvinceCode])

  useEffect(() => {
    const query = form.address.trim()
    if (!locationOpen || query.length < 2) {
      setRemoteSuggestions([])
      setAddressSearchLoading(false)
      return undefined
    }

    let active = true
    const timer = setTimeout(() => {
      setAddressSearchLoading(true)
      fetch(`/api/locations/search?q=${encodeURIComponent(query)}`)
        .then(response => response.ok ? response.json() : Promise.reject(new Error('address search unavailable')))
        .then(data => { if (active) setRemoteSuggestions(Array.isArray(data) ? data : []) })
        .catch(() => { if (active) setRemoteSuggestions([]) })
        .finally(() => { if (active) setAddressSearchLoading(false) })
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [form.address, locationOpen])

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!supabase) {
        if (active) {
          setError(copy.notConfigured)
          setLoading(false)
        }
        return
      }

      try {
        const account = await currentUser()
        if (!active) return
        if (!account) {
          setUser(null)
          setLoading(false)
          return
        }

        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email, status, created_at')
          .eq('id', account.id)
          .maybeSingle()

        if (profileError) throw profileError
        if (!active) return

        const metadata = account.user_metadata || {}
        setUser(account)
        setProfile(data)
        setForm({
          fullName: data?.full_name || metadata.full_name || metadata.name || '',
          phone: metadata.phone || '',
          address: metadata.address || '',
        })
      } catch {
        if (active) setError(copy.loadError)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [copy])

  const change = event => {
    setSaved(false)
    setError('')
    const value = event.target.value
    setForm(current => ({ ...current, [event.target.name]: value }))
    if (event.target.name === 'address') {
      const match = provinces.find(item => locationName(item).toLocaleLowerCase() === value.trim().toLocaleLowerCase())
      if (match) setSelectedProvinceCode(locationCode(match))
    }
  }

  const detectedProvince = provinces.find(item => form.address.toLocaleLowerCase().includes(locationName(item).toLocaleLowerCase()))
  const activeProvinceCode = selectedProvinceCode || locationCode(detectedProvince)

  useEffect(() => {
    if (!selectedProvinceCode && detectedProvince && locationCode(detectedProvince)) setSelectedProvinceCode(locationCode(detectedProvince))
  }, [detectedProvince, selectedProvinceCode])

  const showingWards = Boolean(activeProvinceCode && wards.length)
  const sourceLocations = showingWards ? wards : provinces
  const addressQuery = form.address.trim().toLocaleLowerCase()
  const localAddressSuggestions = sourceLocations
    .filter(item => {
      const name = locationName(item).toLocaleLowerCase()
      return addressQuery && (showingWards || name.includes(addressQuery) || form.address.toLocaleLowerCase().includes(name))
    })
    .slice(0, 8)
    .map(item => ({
      ...item,
      type: showingWards ? 'ward' : 'province',
      label: locationName(item),
    }))
  const addressSuggestions = [
    ...remoteSuggestions.map(item => ({ ...item, type: 'address', label: item.label })),
    ...localAddressSuggestions,
  ].filter((item, index, list) => list.findIndex(candidate => candidate.label === item.label) === index).slice(0, 8)

  const chooseAddressSuggestion = suggestion => {
    if (suggestion.type === 'address') {
      setForm(current => ({ ...current, address: suggestion.label }))
    } else if (suggestion.type === 'province') {
      setSelectedProvinceCode(locationCode(suggestion))
      setForm(current => ({ ...current, address: suggestion.label }))
    } else {
      const current = form.address.trim()
      const provinceName = detectedProvince ? locationName(detectedProvince) : ''
      const next = current && current.toLocaleLowerCase().includes(suggestion.label.toLocaleLowerCase())
        ? current
        : `${current || provinceName}, ${suggestion.label}`.replace(/^,\s*/, '')
      setForm(currentForm => ({ ...currentForm, address: next }))
    }
    setLocationOpen(false)
  }

  const save = async event => {
    event.preventDefault()
    if (!user || !supabase) return
    setError('')
    setSaved(false)
    setSaving(true)

    try {
      const fullName = form.fullName.trim()
      if (!fullName) throw new Error(copy.fullName)

      const { data, error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)
        .select('id, full_name, email, status, created_at')
        .maybeSingle()

      if (profileError) throw profileError

      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: form.phone.trim(),
          address: form.address.trim(),
        },
      })

      if (authError) throw authError
      setUser(authData.user || { ...user, user_metadata: { ...user.user_metadata, full_name: fullName, phone: form.phone.trim(), address: form.address.trim() } })
      setProfile(data || profile)
      setSaved(true)
      window.dispatchEvent(new Event('allura:profile-updated'))
    } catch (saveError) {
      setError(saveError?.message === copy.fullName ? copy.fullName : copy.saveError)
    } finally {
      setSaving(false)
    }
  }

  const metadata = user?.user_metadata || {}
  const displayName = form.fullName || metadata.name || (english ? 'Anonymous' : 'Ẩn danh')
  const avatar = metadata.avatar_url || metadata.picture || metadata.photo_url || ''

  if (loading) return <section className="profile-state"><div className="profile-loading" /></section>

  if (!user) {
    return <section className="profile-state"><div className="profile-state-card"><UserRound size={30}/><div className="eyebrow">ALLURA MEMBERSHIP</div><h1>{copy.signIn}</h1><button className="primary" onClick={() => onNavigate('/dang-nhap')}>{english ? 'Sign in' : 'Đăng nhập'} <ArrowRight size={17}/></button></div></section>
  }

  return <section className="profile-page container">
    <div className="profile-heading">
      <div><div className="eyebrow"><UserRound size={15}/> {copy.eyebrow}</div><h1>{copy.title}</h1><p>{copy.description}</p></div>
      <button className="profile-back" onClick={() => onNavigate('/')}><ArrowRight size={15}/> {copy.back}</button>
    </div>

    <div className="profile-layout">
      <aside className="profile-aside">
        <div className="profile-identity">
          {avatar ? <img src={avatar} alt={displayName} className="profile-avatar" /> : <div className="profile-avatar profile-avatar-fallback"><UserRound size={32}/></div>}
          <strong>{displayName}</strong>
          <span>{user.email}</span>
          <small>{profile?.status === 'active' ? (english ? 'Active account' : 'Tài khoản đang hoạt động') : profile?.status || 'Allura member'}</small>
        </div>
        <div className="profile-security"><LockKeyhole size={18}/><div><b>{copy.security}</b><p>{copy.securityText}</p></div></div>
      </aside>

      <form className="profile-card" onSubmit={save}>
        <div className="profile-card-heading"><div><div className="eyebrow">ALLURA ACCOUNT</div><h2>{copy.account}</h2><p>{copy.accountHint}</p></div><Save size={20}/></div>
        <div className="profile-form-grid">
          <label className="profile-field profile-wide">{copy.fullName}<span><UserRound size={16}/><input name="fullName" value={form.fullName} onChange={change} placeholder={copy.fullNamePlaceholder} autoComplete="name" required /></span></label>
          <label className="profile-field profile-wide">{copy.email}<span className="is-disabled"><Mail size={16}/><input value={user.email || profile?.email || ''} readOnly aria-readonly="true" /></span></label>
          <label className="profile-field">{copy.phone}<span><Phone size={16}/><input name="phone" value={form.phone} onChange={change} placeholder={copy.phonePlaceholder} autoComplete="tel" /></span></label>
          <label className="profile-field profile-address-field">{copy.address}<div className="profile-address-autocomplete">
            <span className="profile-address-input-shell"><MapPin size={16}/><input name="address" value={form.address} onChange={change} onFocus={() => setLocationOpen(true)} onBlur={() => setTimeout(() => setLocationOpen(false), 120)} placeholder={copy.addressPlaceholder} autoComplete="street-address" /></span>
            {locationOpen && form.address.trim().length >= 2 && <div className="profile-address-suggestions" role="listbox">
              {(locationLoading || addressSearchLoading) && <div className="profile-address-status">{addressSearchLoading ? (english ? 'Searching addresses...' : 'Đang tìm địa chỉ...') : copy.addressLoading}</div>}
              {!locationLoading && !addressSearchLoading && addressSuggestions.map(suggestion => <button type="button" key={`${suggestion.type}-${locationCode(suggestion)}-${suggestion.label}`} onMouseDown={event => event.preventDefault()} onClick={() => chooseAddressSuggestion(suggestion)}><MapPin size={14}/><span>{suggestion.label}</span><small>{suggestion.type === 'address' ? (english ? 'Address' : 'Địa chỉ') : suggestion.type === 'province' ? (english ? 'Province / city' : 'Tỉnh / thành phố') : (english ? 'Ward / commune' : 'Phường / xã')}</small></button>)}
              {!locationLoading && !addressSearchLoading && !addressSuggestions.length && <div className="profile-address-status">{copy.noAddressSuggestions}</div>}
            </div>}
          </div></label>
        </div>
        {error && <div className="profile-message profile-error">{error}</div>}
        {saved && <div className="profile-message profile-success"><CheckCircle2 size={16}/> {copy.saved}</div>}
        <div className="profile-actions"><span>{english ? 'Changes apply to your Allura account.' : 'Thay đổi sẽ được áp dụng cho tài khoản Allura của bạn.'}</span><button className="primary" disabled={saving}>{saving ? copy.saving : copy.save} <ArrowRight size={17}/></button></div>
      </form>
    </div>
  </section>
}
