import React, { useEffect, useState } from 'react'
import { ArrowRight, LockKeyhole, Sparkles, X } from 'lucide-react'
import { currentUser, supabase } from './lib/supabase'
import { LegacyGiftStudio as GiftStudio } from './legacy-ui.jsx'
import GiftStudioGallery from './gift-studio-gallery.jsx'
import { useLanguage } from './language.jsx'
import './nfc-gift-studio.css'

export default function NfcGiftStudio({ onNavigate }) {
  const { language } = useLanguage()
  const [status, setStatus] = useState('loading')
  const [warning, setWarning] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function checkNfc() {
      const user = await currentUser()
      if (!user || !supabase) {
        if (!cancelled) setStatus('login')
        return
      }
      const { data, error } = await supabase.from('lamps').select('id,nfc_token').eq('owner_id', user.id).in('status', ['inactive', 'active']).limit(10)
      const hasNfc = data?.some(lamp => Boolean(lamp.nfc_token))
      if (!cancelled) setStatus(error ? 'error' : hasNfc ? 'ready' : 'missing')
    }
    checkNfc()
    return () => { cancelled = true }
  }, [])

  function interceptSave(event) {
    const saveButton = event.target?.closest?.('.studio-actions .primary')
    if (!saveButton || status === 'ready') return
    event.preventDefault()
    event.stopPropagation()
    setWarning(true)
  }

  return <div className="nfc-gift-shell" onClick={interceptSave}>
    <GiftStudioGallery key={language} onNavigate={onNavigate} language={language} />
    {warning && <div className="nfc-warning-overlay" role="dialog" aria-modal="true" aria-labelledby="nfc-warning-title"><div className="nfc-warning-modal"><button className="nfc-warning-close" onClick={() => setWarning(false)} aria-label="Đóng"><X size={18} /></button><div className="nfc-gate-icon"><LockKeyhole size={27} /></div><h2 id="nfc-warning-title">Tính năng đang thử nghiệm</h2><p>{status === 'login' ? 'Bạn đang trải nghiệm bản thử nghiệm của Allura. Hãy đăng nhập để tiếp tục mua sản phẩm và setup món quà.' : 'Bạn đang trải nghiệm bản thử nghiệm của Allura. Để sử dụng đầy đủ, hãy mua sản phẩm và hoàn tất setup món quà trước nhé.'}</p><button className="primary" onClick={() => onNavigate(status === 'login' ? '/dang-nhap' : '/san-pham')}>{status === 'login' ? 'Đăng nhập' : 'Mua sản phẩm & setup'} <ArrowRight size={16} /></button><button className="nfc-warning-later" onClick={() => setWarning(false)}>Để sau</button></div></div>}
  </div>
}

function NfcGate({ onNavigate, login = false, error = false }) {
  return <section className="nfc-gate-page"><div className="nfc-gate-card"><div className="nfc-gate-icon"><LockKeyhole size={27} /></div><div className="eyebrow"><Sparkles size={15} /> ALLURA MEMORY</div><h1>Hãy kích hoạt chiếc đèn<br /><em>trước khi viết lời nhắn.</em></h1><p>{error ? 'Không thể kiểm tra trạng thái NFC lúc này. Vui lòng thử lại sau.' : login ? 'Đăng nhập để kiểm tra chiếc đèn NFC đang được liên kết với tài khoản của bạn.' : 'Bạn chưa có chiếc đèn NFC active. Hãy đặt hàng trước, sau đó quay lại để lưu lời nhắn, ảnh và giọng nói vào món quà.'}</p><button className="primary" onClick={() => onNavigate(login ? '/dang-nhap' : '/san-pham')}>{login ? 'Đăng nhập' : 'Đặt hàng ngay'} <ArrowRight size={17} /></button>{!login && <button className="nfc-gate-back" onClick={() => onNavigate('/')}>Quay về trang chủ</button>}</div></section>
}
