import React, { useEffect, useState } from 'react'
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react'
import { currentUser, supabase } from './lib/supabase'
import { useLanguage } from './language.jsx'
import './nfc-gift-studio.css'

const PENDING_NFC_KEY = 'allura:pending-nfc-token'
const SETUP_LAMP_KEY = 'allura:setup-lamp-id'

export default function SenderSetupGate({ onNavigate, children }) {
  const { language } = useLanguage()
  const english = language === 'en'
  const [state, setState] = useState('checking')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function claimPendingLamp() {
      const token = sessionStorage.getItem(PENDING_NFC_KEY)
      if (!token) {
        if (!cancelled) setState('ready')
        return
      }

      const user = await currentUser()
      if (!user || !supabase) {
        if (!cancelled) setState('login')
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        if (!cancelled) setState('login')
        return
      }

      const headers = { Authorization: `Bearer ${accessToken}` }
      const statusResponse = await fetch(`/api/lamp/${encodeURIComponent(token)}`, { headers })
      const statusData = await statusResponse.json().catch(() => ({}))

      if (!statusResponse.ok) {
        if (!cancelled) {
          setError(statusData.message || (english ? 'This NFC lamp could not be found.' : 'Không tìm thấy chiếc đèn NFC này.'))
          setState('error')
        }
        return
      }

      if (statusData.isOwner && ['inactive', 'active'].includes(statusData.lamp?.status)) {
        sessionStorage.setItem(SETUP_LAMP_KEY, statusData.lamp.id)
        sessionStorage.removeItem(PENDING_NFC_KEY)
        if (!cancelled) setState('ready')
        return
      }

      const claimResponse = await fetch('/api/lamps/claim', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfcToken: token }),
      })
      const claimData = await claimResponse.json().catch(() => ({}))

      if (!claimResponse.ok) {
        if (!cancelled) {
          setError(
            claimData.message === 'lamp_not_assigned_to_account'
              ? (english
                ? 'This NFC link is assigned to another buyer email. Sign in with the email used when the admin created the order.'
                : 'NFC nay da duoc gan voi email khac. Hay dang nhap bang email nguoi mua da dung khi tao don.')
              : claimData.message || (english
              ? 'This NFC lamp is not assigned to this account.'
              : 'Chiếc đèn NFC này chưa được gán cho tài khoản của bạn.'),
          )
          setState('error')
        }
        return
      }

      if (claimData.lamp?.id) sessionStorage.setItem(SETUP_LAMP_KEY, claimData.lamp.id)
      sessionStorage.removeItem(PENDING_NFC_KEY)
      if (!cancelled) setState('ready')
    }

    claimPendingLamp().catch(eventError => {
      if (!cancelled) {
        setError(eventError?.message || (english ? 'Unable to activate this NFC lamp.' : 'Không thể kích hoạt chiếc đèn NFC.'))
        setState('error')
      }
    })

    return () => { cancelled = true }
  }, [english])

  async function switchAccount() {
    await supabase?.auth.signOut()
    onNavigate('/dang-nhap')
  }

  if (state === 'ready') return children
  if (state === 'checking') return <div className="nfc-gate-state">{english ? 'Checking your NFC lamp…' : 'Đang kiểm tra chiếc đèn NFC…'}</div>

  if (state === 'login') {
    return (
      <section className="nfc-gate-page">
        <div className="nfc-gate-card">
          <div className="nfc-gate-icon"><LockKeyhole size={27} /></div>
          <div className="eyebrow"><Sparkles size={15} /> ALLURA MEMORY</div>
          <h1>{english ? <>Sign in to <em>set up your gift.</em></> : <>Đăng nhập để <em>thiết lập món quà.</em></>}</h1>
          <p>{english ? 'Your NFC lamp is waiting to be linked to your Allura account.' : 'Chiếc đèn NFC đang chờ được liên kết với tài khoản Allura của bạn.'}</p>
          <button className="primary" onClick={() => onNavigate('/dang-nhap')}>{english ? 'Sign in' : 'Đăng nhập'} <ArrowRight size={17} /></button>
          <button className="nfc-gate-back" onClick={() => onNavigate('/dang-ky')}>{english ? 'Create an account' : 'Tạo tài khoản mới'}</button>
        </div>
      </section>
    )
  }

  return (
    <section className="nfc-gate-page">
      <div className="nfc-gate-card">
        <div className="nfc-gate-icon"><LockKeyhole size={27} /></div>
        <div className="eyebrow"><Sparkles size={15} /> ALLURA MEMORY</div>
        <h1>{english ? <>This lamp needs a little <em>care first.</em></> : <>Chiếc đèn này cần được <em>kích hoạt trước.</em></>}</h1>
        <p>{error || (english ? 'Only the buyer account linked to this order can claim the NFC lamp.' : 'Chỉ tài khoản của người mua được gán trong đơn hàng mới có thể nhận chiếc đèn NFC này.')}</p>
        <button className="primary" onClick={switchAccount}>{english ? 'Sign in with another account' : 'Đăng nhập tài khoản khác'} <ArrowRight size={17} /></button>
        <button className="nfc-gate-back" onClick={() => onNavigate('/')}>{english ? 'Back to Allura' : 'Về trang Allura'}</button>
      </div>
    </section>
  )
}

export { PENDING_NFC_KEY, SETUP_LAMP_KEY }
