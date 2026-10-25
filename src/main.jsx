import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowRight, CheckCircle2, Gift, Heart, ImagePlus, LockKeyhole, Mail, MapPin, MessageCircle, Music2, Play, Sparkles, UploadCloud, UserRound, Volume2, X } from 'lucide-react'
import emailjs from '@emailjs/browser'
import './styles.css'
import './home-hero.css'
import './branded-home.css'
import './site-header.css'
import SiteHeader, { SiteFooter } from './site-header.jsx'
import { LocalizedLegacyGuide, LocalizedUsageGuideSections } from './localized-guide.jsx'
import './site-header-component.css'
import './mockup.css'
import './guide-mockup.css'
import './usage-guide.css'
import './studio.css'
import './studio-layout.css'
import './studio-overrides.css'
import './studio-order-fix.css'
import './studio-heading-fix.css'
import './preview-fullscreen.css'
import './preview-close-fix.css'
import './gift-preview-polish.css'
import './receiver-flow.css'
import './voice-playing.css'
import './voice-layout-fix.css'
import './legacy-voice-fix.css'
import './gift-photo-layout-fix.css'
import './photo-drag.js'
import './photo-drag.css'
import './voice-replay.css'
import './letter-mode-fix.css'
import './auth-mockup.css'
import './auth-google.css'
import './auth-layout-fix.css'
import './auth-content-fix.css'
import './readability.css'
import './music-sanctuary.css'
import './product-detail.css'
import './product-brand-fix.css'
import './product-contact.css'
import './checkout-page.css'
import './checkout-layout-fix.css'
import './checkout-contact.css'
import './gift-image.css'
import './gift-studio-gallery.css'
import './receiver-fullscreen.css'
import './support-page.css'
import './profile-page.css'
import ProductDetailPage from './product-detail.jsx'
import AuthSafe from './auth-safe.jsx'
import SenderSetupGate, { PENDING_NFC_KEY, SETUP_LAMP_KEY } from './sender-setup-gate.jsx'
import CheckoutDynamic from './checkout-dynamic-i18n.jsx'
import AdminPage from './admin-page.jsx'
import AdminCodePage from './admin-code-page.jsx'
import { LegacyGiftStudio } from './legacy-ui-gated.jsx'
import BrandedHome from './home-page.jsx'
import LocalizedMusicPage from './localized-music-page.jsx'
import SupportPage from './support-page.jsx'
import ProfilePage from './profile-page.jsx'
import LegalPage from './legal-page.jsx'
import GiftPreviewCard from './gift-preview-card.jsx'
import { currentUser, supabase } from './lib/supabase'
import { LanguageProvider } from './language.jsx'
import { useLanguage } from './language.jsx'

const API = '/api'
const demoGift = { receiverName: '', receiverEmail: '', occasion: 'Sinh nhật', title: '', message: '', signature: '', imageUrl: '' }
const digitsOnly = value => String(value ?? '').replace(/\D/g, '').slice(0, 6)

function navigateTo(to, setPage) { window.history.pushState({}, '', to); setPage(to); window.scrollTo(0, 0) }

function App() {
  const [page, setPage] = useState(window.location.pathname)
  const [menu, setMenu] = useState(false)
  const navigate = to => { navigateTo(to, setPage); setMenu(false) }
  useEffect(() => { const onPop = () => setPage(window.location.pathname); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop) }, [])
  useEffect(() => { document.body.classList.remove('gift-preview-modal-open'); return () => document.body.classList.remove('gift-preview-modal-open') }, [page])
  useEffect(() => { const button = document.querySelector('.preview-full'); if (!button) return; const handler = () => document.querySelector('.phone-stage')?.requestFullscreen?.(); button.addEventListener('click', handler); return () => button.removeEventListener('click', handler) }, [page])
  useEffect(() => { const togglePreviewVoice = event => { const button = event.target.closest?.('.preview-voice button'); if (!button) return; event.preventDefault(); const audio = document.querySelector('.voice-studio audio'); const preview = button.closest('.preview-voice'); if (!audio) return; if (audio.paused) { audio.play().then(() => preview?.classList.add('is-playing')).catch(() => {}) } else { audio.pause(); preview?.classList.remove('is-playing') } }; document.addEventListener('click', togglePreviewVoice); return () => document.removeEventListener('click', togglePreviewVoice) }, [])
  useEffect(() => { const closeButton = document.createElement('button'); closeButton.type = 'button'; closeButton.className = 'preview-close-inline'; closeButton.setAttribute('aria-label', 'Đóng preview'); closeButton.textContent = '×'; const close = () => { document.querySelector('.gift-preview-canvas.gift-preview-expanded')?.classList.remove('gift-preview-expanded'); document.body.classList.remove('gift-preview-modal-open'); closeButton.remove() }; closeButton.addEventListener('click', close); const togglePreview = event => { const button = event.target.closest?.('.gallery-device-preview .preview-full'); if (!button) return; event.preventDefault(); event.stopPropagation(); const canvas = button.previousElementSibling?.classList.contains('gift-preview-canvas') ? button.previousElementSibling : button.parentElement?.querySelector('.gift-preview-canvas'); const expanded = canvas?.classList.toggle('gift-preview-expanded'); document.body.classList.toggle('gift-preview-modal-open', Boolean(expanded)); if (expanded) canvas?.querySelector('.gift-preview-top')?.appendChild(closeButton); else closeButton.remove() }; document.addEventListener('click', togglePreview, true); return () => { document.removeEventListener('click', togglePreview, true); closeButton.remove() } }, [])
  useEffect(() => { const closePreview = event => { if (event.key === 'Escape') { document.querySelector('.gift-preview-canvas.gift-preview-expanded')?.classList.remove('gift-preview-expanded'); document.body.classList.remove('gift-preview-modal-open') } }; document.addEventListener('keydown', closePreview); return () => document.removeEventListener('keydown', closePreview) }, [])
  if (page === '/san-pham') return <div className="app site-page-shell"><ProductDetailPage onNavigate={navigate}/><SiteFooter /></div>
  if (page === '/dang-nhap') return <div className="app site-page-shell"><SiteHeader onNavigate={navigate} /><AuthSafe mode="login" onNavigate={navigate}/><SiteFooter /></div>
  if (page === '/dang-ky') return <div className="app site-page-shell"><SiteHeader onNavigate={navigate} /><AuthSafe mode="register" onNavigate={navigate}/><SiteFooter /></div>
  if (page === '/gio-hang' || page === '/thanh-toan') return <div className="app site-page-shell"><CheckoutDynamic onNavigate={navigate}/><SiteFooter /></div>
  if (page === '/admin') return <div className="app site-page-shell"><AdminCodePage onNavigate={navigate}/></div>
  if (page === '/ho-tro') return <div className="app site-page-shell"><SiteHeader onNavigate={navigate} active="support" /><SupportPage /><SiteFooter /></div>
  if (page === '/dieu-khoan' || page === '/chinh-sach-bao-mat' || page === '/bao-hanh-doi-tra') {
    const kind = page === '/chinh-sach-bao-mat' ? 'privacy' : page === '/bao-hanh-doi-tra' ? 'warranty' : 'terms'
    return <div className="app site-page-shell"><SiteHeader onNavigate={navigate} showCart /><LegalPage kind={kind} onNavigate={navigate}/><SiteFooter /></div>
  }
  if (page === '/ho-so' || page === '/profile') return <div className="app site-page-shell"><SiteHeader onNavigate={navigate} showCart /><ProfilePage onNavigate={navigate} /><SiteFooter /></div>
  if (page.startsWith('/n/')) return <NfcTokenFlow token={page.slice(3)} onNavigate={navigate}/>
  const nav = <><button onClick={() => navigate('/')}>Giới thiệu</button><button onClick={() => navigate('/san-pham')}>Sản phẩm</button><button onClick={() => navigate('/huong-dan')}>Hướng dẫn</button><button onClick={() => navigate('/thiet-lap-mon-qua')}>Thiết lập món quà</button><button onClick={() => navigate('/nhac-thu-gian')}>Nhạc thư giãn</button></>
  return <div className="app"><SiteHeader onNavigate={navigate} active={page === '/' ? 'home' : page === '/san-pham' ? 'product' : page === '/huong-dan' ? 'guide' : page === '/thiet-lap-mon-qua' ? 'setup' : page === '/nhac-thu-gian' ? 'music' : page === '/ho-tro' ? 'support' : ''} showCart /><main>{page === '/huong-dan' ? <><LocalizedLegacyGuide/><LocalizedUsageGuideSections onNavigate={navigate}/></> : page === '/nhac-thu-gian' ? <LocalizedMusicPage onNavigate={navigate}/> : page === '/thiet-lap-mon-qua' ? <SenderSetupGate onNavigate={navigate}><LegacyGiftStudio onNavigate={navigate}/></SenderSetupGate> : <BrandedHome onNavigate={navigate}/>}</main><SiteFooter /></div>
}

function Home({ onNavigate }) { return <div className="mock-home"><section className="mock-hero container"><div className="mock-hero-copy"><div className="eyebrow"><Sparkles size={15}/> NFC · ĐÈN QUÀ TẶNG CHẠM CẢM XÚC</div><h1>Một món quà không chỉ để nhìn, mà còn để <em>cảm nhận.</em></h1><p>Kết hợp ánh sáng, lời nhắn và âm nhạc để biến một chiếc đèn thành kỷ niệm riêng dành cho người bạn yêu thương.</p><div className="hero-actions"><button className="primary" onClick={() => onNavigate('/san-pham')}>Xem sản phẩm <ArrowRight size={17}/></button><button className="text-button" onClick={() => onNavigate('/huong-dan')}><Play size={15}/> Khám phá Allura</button></div></div><div className="mock-hero-visual"><div className="hero-image-glow"/><div className="lamp"><div className="lamp-light"/><div className="lamp-shade"/><div className="lamp-body"/><div className="lamp-base"/></div></div></section><section className="section container"><div className="center-heading"><div className="eyebrow"><Heart size={15}/> ALLURA MEMORY</div><h2>Gửi một món quà <em>có câu chuyện.</em></h2><p>Tạo lời nhắn, thêm giọng nói và trao gửi một trải nghiệm chỉ thuộc về hai người.</p></div></section></div> }

function Guide() { return <section className="page-section container"><div className="center-heading"><div className="eyebrow"><Sparkles size={15}/> CẨM NANG ALLURA</div><h1>Sử dụng Allura thật <em>đơn giản.</em></h1><p>Chạm NFC để mở món quà, hoặc đăng nhập để thiết lập lời nhắn riêng.</p></div><div className="steps">{[['01','Đăng nhập','Tạo tài khoản Allura'],['02','Thiết lập quà','Viết lời nhắn và thêm ảnh'],['03','Lưu nội dung','Đồng bộ vào chiếc đèn'],['04','Trao gửi','Người nhận chạm NFC']].map(([n,t,d]) => <article className="step" key={n}><b className="step-no">{n}</b><h3>{t}</h3><p>{d}</p><ArrowRight size={16}/></article>)}</div></section> }

function GiftStudio({ onNavigate }) {
  const [gift, setGift] = useState({ ...demoGift, title: 'Chúc mừng kỷ niệm ngọt ngào ❤️' }); const [saved, setSaved] = useState(false); const [error, setError] = useState(''); const [imageBusy, setImageBusy] = useState(false)
  const change = e => setGift({ ...gift, [e.target.name]: e.target.value })
  const uploadImage = async e => { const file = e.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) return setError('Chỉ hỗ trợ JPG, PNG hoặc WebP.'); if (file.size > 5 * 1024 * 1024) return setError('Ảnh tối đa 5MB.'); setError(''); setImageBusy(true); const localUrl = URL.createObjectURL(file); setGift(current => ({ ...current, imageUrl: localUrl })); const user = await currentUser(); if (!user || !supabase) { setImageBusy(false); return } const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'; const path = `${user.id}/${crypto.randomUUID()}.${extension}`; const upload = await supabase.storage.from('allura-gift-images').upload(path, file, { contentType: file.type, upsert: false }); if (upload.error) setError(upload.error.message); else setGift(current => ({ ...current, imageUrl: supabase.storage.from('allura-gift-images').getPublicUrl(path).data.publicUrl })); setImageBusy(false) }
  const save = async e => { e.preventDefault(); setError(''); const user = await currentUser(); if (!user) return onNavigate('/dang-nhap'); if (!gift.receiverName || !gift.receiverEmail || !gift.title || !gift.message) return setError('Vui lòng điền đủ thông tin món quà.'); const { data: lamps } = await supabase.from('lamps').select('id').eq('owner_id', user.id).eq('status', 'active').limit(1); if (!lamps?.length) return setError('Tài khoản chưa có lamp active. Hãy claim lamp trước.'); const { error: saveError } = await supabase.from('gift_contents').upsert({ lamp_id: lamps[0].id, receiver_name: gift.receiverName, receiver_email: gift.receiverEmail.toLowerCase().trim(), occasion: gift.occasion, title: gift.title, message: gift.message, signature: gift.signature, image_url: gift.imageUrl || null, status: 'ready' }, { onConflict: 'lamp_id' }); if (saveError) setError(saveError.message); else setSaved(true) }
  return <section className="studio-page"><div className="studio-heading container"><div><div className="eyebrow"><Heart size={15}/> THIẾT KẾ CẢM XÚC CÁ NHÂN HOÁ</div><h1>Tạo lời nhắn dành riêng cho<br/><em>người bạn yêu thương.</em></h1><p>Thêm một ảnh kỷ niệm để tấm thiệp trở nên riêng tư hơn.</p></div></div><form className="studio-form container" onSubmit={save}><div className="studio-block"><div className="studio-label"><b>1.</b> Tên người nhận <UserRound size={16}/></div><input name="receiverName" value={gift.receiverName} onChange={change} required/><div className="studio-label"><b>2.</b> Email người nhận <Mail size={16}/></div><input name="receiverEmail" type="email" value={gift.receiverEmail} onChange={change} required/><div className="studio-label"><b>3.</b> Dịp trao gửi <Sparkles size={16}/></div><div className="occasion-pills">{['Sinh nhật','Kỷ niệm','Valentine','Giáng sinh','Khác'].map(o => <button type="button" className={gift.occasion === o ? 'selected' : ''} key={o} onClick={() => setGift({ ...gift, occasion: o })}>{o}</button>)}</div><div className="studio-label"><b>4.</b> Tiêu đề lời nhắn</div><input name="title" value={gift.title} onChange={change} required/><div className="studio-label"><b>5.</b> Lời nhắn yêu thương</div><textarea name="message" maxLength="500" value={gift.message} onChange={change} rows="7" required/><div className="studio-label"><b>6.</b> Chữ ký người gửi</div><input name="signature" value={gift.signature} onChange={change}/><div className="gift-image-upload"><div className="gift-image-copy"><div className="studio-label"><b>7.</b> Ảnh kỷ niệm <ImagePlus size={16}/></div><p>Ảnh sẽ hiển thị phía trên lời nhắn trong thiệp.</p></div>{gift.imageUrl && <img className="gift-image-preview" src={gift.imageUrl} alt="Ảnh xem trước trên thiệp"/>}<label className="outline upload-label"><UploadCloud size={16}/> {imageBusy ? 'Đang tải ảnh…' : gift.imageUrl ? 'Đổi ảnh' : 'Chọn ảnh'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={imageBusy}/></label></div></div>{error && <div className="error">{error}</div>}<div className="form-submit"><span><LockKeyhole size={15}/> Nội dung được bảo mật</span><button className="primary">{saved ? 'Đã lưu món quà' : 'Lưu món quà'} <ArrowRight size={17}/></button></div></form></section>
}

function NfcTokenFlow({ token, onNavigate }) {
  const { language } = useLanguage()
  const english = language === 'en'
  const [state, setState] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function inspectToken() {
      try {
        const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: {} }
        const accessToken = sessionData.session?.access_token
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        const response = await fetch(`/api/lamp/${encodeURIComponent(token)}`, { headers })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || (english ? 'This NFC link is not available.' : 'Liên kết NFC này không khả dụng.'))
        if (cancelled) return

        if (data.lamp?.status === 'inactive') {
          sessionStorage.setItem(PENDING_NFC_KEY, token)
          sessionStorage.setItem(SETUP_LAMP_KEY, data.lamp?.id || '')
          setState('sender')
        } else if (data.isOwner) {
          sessionStorage.setItem(PENDING_NFC_KEY, token)
          sessionStorage.setItem(SETUP_LAMP_KEY, data.lamp?.id || '')
          onNavigate('/thiet-lap-mon-qua')
        } else if (data.lamp?.status === 'active' && data.gift?.status === 'ready') {
          setState('receiver')
        } else {
          setState('pending')
        }
      } catch (eventError) {
        if (!cancelled) {
          setError(eventError?.message || (english ? 'This NFC link is not available.' : 'Liên kết NFC này không khả dụng.'))
          setState('error')
        }
      }
    }

    inspectToken()
    return () => { cancelled = true }
  }, [english, token])

  if (state === 'receiver') return <ReceiverCodeFlow token={token} onNavigate={onNavigate}/>
  if (state === 'loading') return <div className="nfc-gate-state">{english ? 'Checking your NFC lamp…' : 'Đang kiểm tra chiếc đèn NFC…'}</div>

  if (state === 'sender') {
    return (
      <section className="nfc-gate-page">
        <div className="nfc-gate-card">
          <div className="nfc-gate-icon"><Music2 size={27}/></div>
          <div className="eyebrow"><Sparkles size={15}/> ALLURA MEMORY</div>
          <h1>{english ? <>Choose your <em>Allura experience.</em></> : <>Chọn trải nghiệm <em>cùng Allura.</em></>}</h1>
          <p>{english ? 'This NFC lamp has not been activated yet. Explore the music library or set up its first gift.' : 'Chiếc đèn NFC này chưa được kích hoạt. Bạn có thể nghe nhạc hoặc bắt đầu thiết lập món quà đầu tiên.'}</p>
          <div className="nfc-choice-grid">
            <button type="button" className="nfc-choice" onClick={() => onNavigate('/nhac-thu-gian')}>
              <Music2 size={21}/>
              <span><strong>{english ? 'Explore music' : 'Trải nghiệm âm nhạc'}</strong><small>Explore Allura music</small></span>
              <ArrowRight size={17}/>
            </button>
            <button type="button" className="nfc-choice nfc-choice-primary" onClick={() => onNavigate('/thiet-lap-mon-qua')}>
              <Gift size={21}/>
              <span><strong>{english ? 'Set up a gift' : 'Thiết lập món quà'}</strong><small>Activate lamp &amp; create a gift</small></span>
              <ArrowRight size={17}/>
            </button>
          </div>
          <button className="nfc-gate-back" onClick={() => onNavigate('/')}>{english ? 'Back to Allura' : 'Về trang Allura'}</button>
        </div>
      </section>
    )
  }
  if (state === 'pending') {
    return (
      <section className="nfc-gate-page">
        <div className="nfc-gate-card">
          <div className="nfc-gate-icon"><LockKeyhole size={27}/></div>
          <div className="eyebrow"><Sparkles size={15}/> ALLURA MEMORY</div>
          <h1>{english ? <>A story is being <em>prepared.</em></> : <>Một câu chuyện đang được <em>chuẩn bị.</em></>}</h1>
          <p>{english ? 'This gift is not ready to open yet. Please come back when the sender has finished setting it up.' : 'Món quà này chưa sẵn sàng để mở. Hãy quay lại sau khi người gửi hoàn tất thiết lập.'}</p>
          <button className="primary" onClick={() => onNavigate('/')}>{english ? 'Back to Allura' : 'Về trang Allura'} <ArrowRight size={17}/></button>
        </div>
      </section>
    )
  }

  return (
    <section className="nfc-gate-page">
      <div className="nfc-gate-card">
        <div className="nfc-gate-icon"><LockKeyhole size={27}/></div>
        <div className="eyebrow"><Sparkles size={15}/> ALLURA MEMORY</div>
        <h1>{english ? <>This NFC link is <em>not available.</em></> : <>Liên kết NFC <em>không khả dụng.</em></>}</h1>
        <p>{error}</p>
        <button className="primary" onClick={() => onNavigate('/')}>{english ? 'Back to Allura' : 'Về trang Allura'} <ArrowRight size={17}/></button>
      </div>
    </section>
  )
}

function ReceiverFlow({ token }) { const [email, setEmail] = useState(''); const [gift, setGift] = useState(null); const [error, setError] = useState(''); useEffect(() => { sessionStorage.setItem('allura:nfc-token', token) }, [token]); const verify = async e => { e.preventDefault(); setError(''); try { const r = await fetch(API + '/receiver/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, nfcToken: token }) }); const data = await r.json(); if (!r.ok) throw Error(data.message); setGift({ ...data.gift, imageUrl: data.gift.imageUrl || data.gift.image_url }) } catch (e) { setError(e.message) } }; if (gift) return <GiftExperience gift={gift}/>; return <section className="receiver-page"><div className="receiver-glow"/><div className="receiver-card"><div className="lamp-mini"><div/></div><div className="eyebrow"><Sparkles size={15}/> A GIFT FOR YOU</div><h1>Một món quà<br/><em>đang chờ bạn.</em></h1><p>Nhập email để mở lời nhắn riêng tư từ người thương.</p><form onSubmit={verify}><label>Email của bạn<input type="email" value={email} onChange={e => setEmail(e.target.value)} required/></label>{error && <div className="error">{error}</div>}<button className="primary full">Mở món quà <ArrowRight size={17}/></button></form><div className="receiver-note"><LockKeyhole size={14}/> Nội dung được bảo vệ riêng tư</div></div></section> }

function getImagePosition(gift) { const position = gift.imagePositions?.[gift.imageUrl] || gift.image_positions?.[gift.imageUrl]; return position ? `${position.x}% ${position.y}%` : undefined }

function GiftExperience({ gift }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [musicTracks, setMusicTracks] = useState([])
  const [musicLoading, setMusicLoading] = useState(true)
  const [musicPickerOpen, setMusicPickerOpen] = useState(false)
  const [musicCurrentTime, setMusicCurrentTime] = useState(0)
  const [musicDuration, setMusicDuration] = useState(0)
  const [musicRepeat, setMusicRepeat] = useState(false)
  const [selectedMusic, setSelectedMusic] = useState(() => gift.music || (gift.musicUrl ? { url: gift.musicUrl } : null))
  const audioRef = useRef(null)
  const musicAudioRef = useRef(null)
  const images = gift.imageUrls?.length ? gift.imageUrls : gift.imageUrl ? [gift.imageUrl] : []
  const activeMusicUrl = selectedMusic?.url || selectedMusic?.audio || gift.musicUrl || ''
  const activeMusicTitle = selectedMusic?.title || gift.music?.title || ''
  const activeMusicArtist = selectedMusic?.artist || gift.music?.artist || ''

  useEffect(() => {
    if (selectedImage >= images.length && images.length) setSelectedImage(0)
  }, [images.length, selectedImage])

  useEffect(() => {
    let active = true
    fetch('/api/music', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('music_load_failed')))
      .then(data => { if (active) setMusicTracks(Array.isArray(data.tracks) ? data.tracks : []) })
      .catch(() => { if (active) setMusicTracks([]) })
      .finally(() => { if (active) setMusicLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    setPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [gift.voiceUrl])

  useEffect(() => {
    setMusicCurrentTime(0)
    setMusicDuration(0)
    if (musicAudioRef.current) {
      musicAudioRef.current.pause()
      musicAudioRef.current.currentTime = 0
      musicAudioRef.current.load()
    }
    const audio = musicAudioRef.current
    if (!audio || !activeMusicUrl) return undefined
    audio.loop = musicRepeat
    const onLoadedMetadata = () => setMusicDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const onTimeUpdate = () => setMusicCurrentTime(audio.currentTime || 0)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
    }
  }, [activeMusicUrl])

  useEffect(() => {
    if (musicAudioRef.current) musicAudioRef.current.loop = musicRepeat
  }, [musicRepeat])

  useEffect(() => {
    const audio = musicAudioRef.current
    if (!audio) return
    if (musicPlaying) audio.play().catch(() => setMusicPlaying(false))
    else audio.pause()
  }, [musicPlaying])

  const toggleVoice = () => {
    const audio = audioRef.current
    if (!audio || !gift.voiceUrl) return
    if (audio.paused) {
      musicAudioRef.current?.pause()
      setMusicPlaying(false)
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
    else { audio.pause(); setPlaying(false) }
  }

  const toggleMusic = () => {
    const audio = musicAudioRef.current
    if (!audio || !activeMusicUrl) return
    if (audio.paused) {
      audioRef.current?.pause()
      setPlaying(false)
      audio.play().then(() => setMusicPlaying(true)).catch(() => setMusicPlaying(false))
    } else { audio.pause(); setMusicPlaying(false) }
  }

  const chooseMusic = track => {
    if (!track?.audio) return
    musicAudioRef.current?.pause()
    setMusicPlaying(false)
    setSelectedMusic(track)
    setMusicPickerOpen(false)
  }

  const changeMusic = direction => {
    if (!musicTracks.length) return
    const currentId = selectedMusic?.id || gift.music?.id
    const index = musicTracks.findIndex(track => String(track.id) === String(currentId))
    const nextIndex = index < 0 ? (direction > 0 ? 0 : musicTracks.length - 1) : (index + direction + musicTracks.length) % musicTracks.length
    const nextTrack = musicTracks[nextIndex]
    if (!nextTrack?.audio) return
    setSelectedMusic(nextTrack)
    setMusicPickerOpen(false)
    setMusicPlaying(true)
  }

  const seekMusic = value => {
    if (!musicAudioRef.current) return
    musicAudioRef.current.currentTime = value
    setMusicCurrentTime(value)
  }

  return <>
    <section className="receiver-preview-page"><GiftPreviewCard gift={gift} selectedImage={selectedImage} onSelectImage={setSelectedImage} imagePositions={gift.imagePositions || gift.image_positions || {}} voiceUrl={gift.voiceUrl || ''} playing={playing} onToggleVoice={toggleVoice} musicUrl={activeMusicUrl} musicTitle={activeMusicTitle} musicArtist={activeMusicArtist} musicPlaying={musicPlaying} onToggleMusic={toggleMusic} musicTracks={musicTracks} musicLoading={musicLoading} musicPickerOpen={musicPickerOpen} onToggleMusicPicker={() => setMusicPickerOpen(value => !value)} onChooseMusic={chooseMusic} musicControls musicCurrentTime={musicCurrentTime} musicDuration={musicDuration} musicRepeat={musicRepeat} onSeekMusic={seekMusic} onPreviousMusic={() => changeMusic(-1)} onNextMusic={() => changeMusic(1)} onToggleMusicRepeat={() => setMusicRepeat(value => !value)} /></section>
    {gift.voiceUrl && <audio ref={audioRef} src={gift.voiceUrl} preload="metadata" onEnded={() => setPlaying(false)} />}
    {activeMusicUrl && <audio ref={musicAudioRef} src={activeMusicUrl} preload="metadata" onEnded={() => setMusicPlaying(false)} />}
  </>
}

function MusicLibrary({ embedded = false }) { const [tracks, setTracks] = useState([]); useEffect(() => { fetch(API + '/music').then(r => r.json()).then(data => setTracks(data.tracks || [])).catch(() => {}) }, []); return <section className={embedded ? 'embedded-music' : 'page-section container music-page'}><div className="center-heading"><div className="eyebrow"><Music2 size={15}/> ALLURA MUSIC</div><h1>Một khoảng lặng <em>dịu dàng.</em></h1><p>Âm thanh đồng hành cùng trải nghiệm Allura.</p></div><div className="track-list">{tracks.map(track => <div className="track" key={track.id}><img src={track.thumbnail || track.image} alt=""/><div className="track-info"><b>{track.title}</b><span>{track.artist}</span></div><span className="duration">{track.duration || '—'}</span></div>)}</div></section> }

function ReceiverCodeFlow({ token, onNavigate }) {
  const [code, setCode] = useState('')
  const [gift, setGift] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    sessionStorage.setItem('allura:nfc-token', token)
  }, [token])

  const verify = async event => {
    event.preventDefault()
    setError('')
    if (!/^\d{6}$/.test(code)) return setError('Vui lòng nhập đúng mã nhận quà 6 số.')
    try {
      const response = await fetch(API + '/receiver/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, nfcToken: token }),
      })
      const data = await response.json()
      if (!response.ok) throw Error(data.message)
      setGift({ ...data.gift, imageUrl: data.gift.imageUrl || data.gift.image_url })
    } catch (eventError) {
      setError(eventError?.message || 'Không thể mở món quà. Vui lòng thử lại.')
    }
  }

  const continueAsOwner = () => {
    sessionStorage.setItem(PENDING_NFC_KEY, token)
    onNavigate('/dang-nhap')
  }

  if (gift) return <GiftExperience gift={gift}/>

  return (
    <section className="receiver-page">
      <div className="receiver-glow"/>
      <div className="receiver-card">
        <div className="lamp-mini"><div/></div>
        <div className="eyebrow"><Sparkles size={15}/> A GIFT FOR YOU</div>
        <h1>Một món quà<br/><em>đang chờ bạn.</em></h1>
        <p>Quét NFC thành công. Nhập mã 6 số được seller gửi để mở thiệp.</p>
        <form onSubmit={verify}>
          <label>Mã nhận quà<input type="tel" name="code" inputMode="numeric" maxLength="6" value={code} onChange={event => setCode(digitsOnly(event.target?.value))} placeholder="000000" autoComplete="one-time-code" autoFocus required/></label>
          {error && <div className="error">{error}</div>}
          <button className="primary full">Mở món quà <ArrowRight size={17}/></button>
        </form>
        <div className="receiver-note"><LockKeyhole size={14}/> Mã chỉ dùng để mở món quà này</div>
        <button type="button" className="receiver-owner" onClick={continueAsOwner}>Bạn là chủ đèn? Đăng nhập để chỉnh sửa</button>
      </div>
    </section>
  )
}

createRoot(document.getElementById('root')).render(<LanguageProvider><App /></LanguageProvider>)

