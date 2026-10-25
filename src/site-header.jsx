import React, { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Mail, MessageCircle, ShieldCheck, ShoppingBag, UserRound, X } from 'lucide-react'
import emailjs from '@emailjs/browser'
import { useLanguage } from './language.jsx'
import { supabase } from './lib/supabase'
import { CART_KEY, CART_UPDATED_EVENT, cartQuantity, getGuestCart, loadCartForUser } from './lib/cart'

const links = [['home', '/', 'home'], ['product', '/san-pham', 'product'], ['guide', '/huong-dan', 'guide'], ['setup', '/thiet-lap-mon-qua', 'setup'], ['music', '/nhac-thu-gian', 'music'], ['support', '/ho-tro', 'support']]
const emailServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
const newsletterTemplateId = import.meta.env.VITE_EMAILJS_SUPPORT_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const emailPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'allura.danang@gmail.com'
const supportPhone = '0935 427 618'

export default function SiteHeader({ onNavigate, active = '', showLogin = true, showCreate = true, showCart = false, rightAction = null }) {
  const [menu, setMenu] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [cartCount, setCartCount] = useState(0)
  const { language, setLanguage, copy } = useLanguage()
  const navigate = path => { onNavigate(path); setMenu(false); setAccountOpen(false) }
  const navLinks = links.map(([key, path, label]) => [key, path, copy.nav[label]])
  const account = useMemo(() => {
    const metadata = user?.user_metadata || {}
    const name = metadata.full_name || metadata.name || (language === 'en' ? 'Anonymous' : 'Ẩn danh')
    return {
      name,
      email: user?.email || '',
      avatar: metadata.avatar_url || metadata.picture || metadata.photo_url || '',
    }
  }, [language, user])
  const logoutLabel = language === 'en' ? 'Sign out' : 'Đăng xuất'
  const anonymousLabel = language === 'en' ? 'Anonymous' : 'Ẩn danh'

  useEffect(() => {
    if (!supabase) return undefined

    let active = true
    let sessionUser = null
    const refreshCartCount = async nextUser => {
      try {
        const items = nextUser ? await loadCartForUser(nextUser) : getGuestCart()
        if (active) setCartCount(cartQuantity(items))
      } catch {
        if (active) setCartCount(0)
      }
    }
    const applySession = session => {
      sessionUser = session?.user || null
      setUser(sessionUser)
      refreshCartCount(sessionUser)
    }

    supabase.auth.getSession().then(({ data }) => applySession(data.session)).catch(() => applySession(null))
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => applySession(session))
    const onCartUpdated = () => refreshCartCount(sessionUser)
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated)

    return () => {
      active = false
      authListener.subscription.unsubscribe()
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated)
    }
  }, [])

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    localStorage.removeItem(CART_KEY)
    setAccountOpen(false)
    setMenu(false)
    onNavigate('/')
  }

  const accountButton = user ? (
    <div className="site-account">
      <button
        type="button"
        className="site-account-trigger"
        onClick={() => setAccountOpen(value => !value)}
        aria-label={account.name}
        aria-expanded={accountOpen}
        title={account.name}
      >
        {account.avatar ? <span className="site-account-avatar-wrap"><img src={account.avatar} alt="" className="site-account-avatar" onError={event => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement?.querySelector('.site-account-fallback')?.removeAttribute('hidden') }} /><span className="site-account-fallback" hidden><UserRound size={17} /></span></span> : <span className="site-account-fallback"><UserRound size={17} /></span>}
      </button>
      {accountOpen && (
        <div className="site-account-menu">
          <div className="site-account-info">
            <strong>{account.name || anonymousLabel}</strong>
            <small>{account.email || anonymousLabel}</small>
          </div>
          <div className="site-account-menu-actions">
            <button type="button" className="site-account-profile" onClick={() => navigate('/ho-so')}>{language === 'en' ? 'My profile' : 'Hồ sơ của tôi'}</button>
            <button type="button" className="site-account-logout" onClick={signOut}>{logoutLabel}</button>
          </div>
        </div>
      )}
    </div>
  ) : null
  return <>
    <header className="site-header">
      <button className="site-brand" onClick={() => navigate('/')} aria-label="Allura"><img src="/assets/allura-logo-transparent.png" alt="Allura" /><span><b>Allura</b></span></button>
      <nav>{navLinks.map(([key, path, label]) => <button key={key} className={active === key ? 'active' : ''} onClick={() => navigate(path)}>{label}</button>)}</nav>
      <div className="site-header-actions">
        <div className="language-switcher" aria-label="Language selector"><button className={language === 'vi' ? 'active' : ''} onClick={() => setLanguage('vi')}>VI</button><span>/</span><button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button></div>
        {rightAction ? <button className="site-right-action" onClick={rightAction.onClick}>{rightAction.label}</button> : <>{showCreate && <button className="primary small" onClick={() => navigate('/thiet-lap-mon-qua')}>{copy.create}</button>}{showCart && <button className="site-cart" onClick={() => navigate('/gio-hang')} aria-label={copy.cart}><ShoppingBag size={18} />{cartCount > 0 && <span>{cartCount}</span>}</button>}{showLogin && (user ? accountButton : <button className="site-login" onClick={() => navigate('/dang-nhap')}>{copy.login}</button>)}</>}
      </div>
      <div className="mobile-header-language" aria-label="Language selector"><button className={language === 'vi' ? 'active' : ''} onClick={() => setLanguage('vi')}>VI</button><span>/</span><button className={language === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button></div>
      {!rightAction && showCart && <button type="button" className="site-mobile-cart" onClick={() => navigate('/gio-hang')} aria-label={copy.cart} title={copy.cart}><ShoppingBag size={18} />{cartCount > 0 && <span>{cartCount}</span>}</button>}
      <button className="site-menu-toggle" onClick={() => setMenu(!menu)} aria-label={menu ? copy.close : copy.menu}>{menu ? <X /> : <span>☰</span>}</button>
    </header>
    {menu && <nav className="site-mobile-nav" aria-label="Mobile navigation">{rightAction && <button type="button" className="site-mobile-action" onClick={() => { rightAction.onClick(); setMenu(false) }}>{rightAction.label}</button>}{navLinks.map(([key, path, label]) => <button key={key} className={`site-mobile-nav-link site-mobile-nav-${key} ${active === key ? 'active' : ''}`} onClick={() => navigate(path)}>{label || (language === 'en' ? 'About us' : 'Giới thiệu')}</button>)}{user ? <><div className="site-mobile-account"><span className="site-account-fallback"><UserRound size={17} /></span><span>{account.name}</span></div><button className="site-mobile-profile" onClick={() => navigate('/ho-so')}>{language === 'en' ? 'My profile' : 'Hồ sơ của tôi'}</button><button className="site-mobile-logout" onClick={signOut}>{logoutLabel}</button></> : showLogin && <button className="site-mobile-login" onClick={() => navigate('/dang-nhap')}>{copy.login}</button>}</nav>}
  </>
}

function LegacyFooter() {
  const { copy } = useLanguage()
  return <footer className="site-footer"><div className="site-brand"><img src="/assets/allura-logo-transparent.png" alt="Allura" /><span><b>Allura</b></span></div><p>{copy.footer}</p><span>© 2026 Allura. Made with care.</span></footer>
}

export function SiteFooter() {
  const { language } = useLanguage()
  const vi = language !== 'en'
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterState, setNewsletterState] = useState('idle')
  const go = path => { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0, 0) }
  const submitNewsletter = async event => {
    event.preventDefault()
    const email = newsletterEmail.trim()
    if (!email || newsletterState === 'sending') return
    if (!emailServiceId || !newsletterTemplateId || !emailPublicKey) return setNewsletterState('error')
    setNewsletterState('sending')
    try {
      await emailjs.send(emailServiceId, newsletterTemplateId, {
        to_email: supportEmail,
        email,
        from_email: email,
        name: email,
        subject: vi ? 'Đăng ký bản tin Allura' : 'Allura newsletter subscription',
        message: vi ? `Email đăng ký nhận bản tin: ${email}` : `Newsletter signup: ${email}`,
        description: vi ? `Email đăng ký nhận bản tin: ${email}` : `Newsletter signup: ${email}`,
        form_type: 'newsletter',
        submitted_at: new Date().toLocaleString(vi ? 'vi-VN' : 'en-US'),
      }, { publicKey: emailPublicKey })
      setNewsletterEmail('')
      setNewsletterState('sent')
    } catch {
      setNewsletterState('error')
    }
  }
  const nav = [[vi ? 'Về Allura' : 'About Allura', '/'], [vi ? 'Hướng dẫn sử dụng' : 'How it works', '/huong-dan'], [vi ? 'Cá nhân hóa quà tặng' : 'Personalize a gift', '/thiet-lap-mon-qua'], [vi ? 'Danh sách giai điệu' : 'Music library', '/nhac-thu-gian']]
  const help = [
    [vi ? 'Điều khoản dịch vụ' : 'Terms of service', '/dieu-khoan'],
    [vi ? 'Chính sách bảo mật' : 'Privacy policy', '/chinh-sach-bao-mat'],
    [vi ? 'Bảo hành & đổi trả' : 'Warranty & returns', '/bao-hanh-doi-tra'],
    [vi ? 'Trung tâm hỗ trợ' : 'Help center', '/ho-tro'],
  ]
  return <footer className="site-footer">
    <div className="site-footer-main">
      <div className="site-footer-brand"><div className="site-footer-wordmark"><b>Allura</b><span></span></div><p>{vi ? 'Đèn thủ công mình phát ra ánh sáng ấm và chạm NFC cá nhân hóa. Nơi kết nối những điều dịu dàng, gửi đi cùng một ký ức không gian.' : 'Handcrafted lamps with warm light and personalized NFC touch. A gentle way to send a memory across space.'}</p><button className="site-footer-memory" onClick={() => go('/nhac-thu-gian')}>〈 AMBIENT LIGHT & NFC MEMORIES</button></div>
      <div className="site-footer-column"><h3>{vi ? 'KHÁM PHÁ' : 'EXPLORE'}</h3>{nav.map(([label, path]) => <a key={label} href={path} onClick={event => { event.preventDefault(); go(path) }}>{label}</a>)}</div>
      <div className="site-footer-column"><h3>{vi ? 'PHÁP LÝ & HỖ TRỢ' : 'LEGAL & SUPPORT'}</h3>{help.map(([label, path]) => <a key={label} href={path} onClick={event => { event.preventDefault(); go(path) }}>{label}</a>)}</div>
      <div className="site-footer-newsletter"><h3>{vi ? 'BẢN TIN YÊU THƯƠNG' : 'A NOTE FROM ALLURA'}</h3><p>{vi ? 'Đăng ký nhận gợi ý đóng gói quà tặng và các bộ sưu tập ánh sáng giới hạn theo mùa.' : 'Receive gift ideas, seasonal notes and limited light collections.'}</p><form onSubmit={submitNewsletter}><Mail size={16}/><input type="email" value={newsletterEmail} onChange={event => { setNewsletterEmail(event.target.value); if (newsletterState !== 'idle') setNewsletterState('idle') }} placeholder={vi ? 'Email của bạn...' : 'Your email...'} aria-label={vi ? 'Email của bạn' : 'Your email'} required disabled={newsletterState === 'sending'} /><button type="submit" disabled={newsletterState === 'sending'}>{newsletterState === 'sending' ? '…' : vi ? 'Gửi' : 'Join'}</button></form>{newsletterState === 'sent' && <small className="newsletter-feedback success">{vi ? 'Đã gửi thông tin đăng ký.' : 'Subscription sent.'}</small>}{newsletterState === 'error' && <small className="newsletter-feedback error">{vi ? 'Không thể gửi, vui lòng thử lại.' : 'Could not send. Please try again.'}</small>}<small>{vi ? <>Hotline hỗ trợ: <a href="tel:0935427618">{supportPhone}</a> (09:00 – 21:00 hàng ngày)</> : <>Support: <a href="tel:0935427618">{supportPhone}</a> (09:00 – 21:00 daily)</>}</small></div>
    </div>
    <div className="site-footer-bottom"><span>© 2026 Allura Smart Living. {vi ? 'Bản quyền thuộc về Allura.' : 'All rights reserved by Allura.'}</span><div><a href="/san-pham" onClick={event => { event.preventDefault(); go("/san-pham") }}><ShieldCheck size={13}/> {vi ? 'Đèn thủ công tinh xảo' : 'Crafted with care'}</a><a href="/huong-dan" onClick={event => { event.preventDefault(); go("/huong-dan") }}><MessageCircle size={13}/> {vi ? 'Công nghệ chạm cảm xúc' : 'Touch the feeling'}</a><ArrowUpRight size={13}/></div></div>
  </footer>
}
