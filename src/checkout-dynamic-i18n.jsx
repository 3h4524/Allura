import React, { useEffect, useMemo, useState } from 'react'
import SiteHeader from './site-header.jsx'
import { ArrowRight, CheckCircle2, Gift, Mail, MapPin, MessageCircle, Minus, Plus, Share2, ShoppingBag, Trash2 } from 'lucide-react'
import emailjs from '@emailjs/browser'
import { useLanguage } from './language.jsx'
import { currentUser, supabase } from './lib/supabase'
import { CART_UPDATED_EVENT, getGuestCart, loadCartForUser, saveCartForUser, saveGuestCart } from './lib/cart'

const money = value => `${new Intl.NumberFormat('vi-VN').format(value)}₫`
const sellerEmail = import.meta.env.VITE_SELLER_EMAIL || 'seller@allura.vn'
const emailServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
const emailTemplateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const emailPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const sellerZalo = import.meta.env.VITE_SELLER_ZALO_URL || 'https://zalo.me/'
const sellerFacebook = 'https://www.facebook.com/profile.php?id=61594371934146'
const Field = ({ label, children, wide = false }) => <label className={wide ? 'wide' : ''}>{label}{children}</label>

export default function CheckoutDynamic({ onNavigate }) {
  const { language } = useLanguage()
  const english = language === 'en'
  const copy = english ? {
    continueShopping: '← Continue shopping', cart: 'Shopping cart', contactStep: 'Contact information', consultStep: 'Consult with seller', confirmStep: 'Order confirmation', eyebrow: 'ALLURA CONSULTATION FOR YOU', title: 'Leave your details', titleAccent: '& connect with the seller.', intro: 'Allura does not process payments directly in the app. Choose a contact method and the seller will advise and confirm your order.', contactTitle: 'Contact information', contactHint: 'The seller will use this to reply', fullName: 'Full name *', fullNamePlaceholder: 'Your name', phone: 'Phone number *', phonePlaceholder: '090...', email: 'Email *', recipientTitle: 'Delivery information', recipientHint: 'For accurate seller advice', recipientName: 'Recipient name *', recipientNamePlaceholder: 'Recipient name', recipientPhone: 'Recipient phone *', address: 'Delivery address *', addressPlaceholder: 'House number, street, ward/commune, province/city', note: 'Note for the seller', notePlaceholder: 'Lamp color, preferred delivery time, or anything you would like to ask...', contactMethodTitle: 'Choose how to contact us', noPayment: 'No payment in app', zaloHint: 'Open a chat with the seller', facebookHint: 'Message our fanpage', emailAction: 'Send information by email', emailHint: 'Compose an email to the seller', contactNote: 'Your product details and request will be sent to the seller for price, shipping fee and order confirmation.', sent: 'Contact channel opened. The seller will get back to you soon.', trust: ['No payment in app', 'Direct consultation', 'Information kept private'], summaryTitle: 'Your selected products', summaryCount: count => `${count} gift${count === 1 ? '' : 's'}`, sellerConfirm: 'The seller will confirm the price and order after consultation.', subtotal: 'Estimated subtotal', shipping: 'Shipping fee', shippingLater: 'To be quoted', total: 'ESTIMATED VALUE', totalNote: 'Not a payment transaction', submit: 'Send information to seller', submitted: 'Information sent', terms: 'By sending your information, you agree that the seller may contact you about your Allura order.', validation: 'Please complete all contact and delivery details.', syncError: 'Could not sync your cart. Please try again.', subject: 'Allura order consultation', noNote: '(None)',
  } : {
    continueShopping: '← Tiếp tục mua sắm', cart: 'Giỏ hàng', contactStep: 'Thông tin liên hệ', consultStep: 'Tư vấn cùng seller', confirmStep: 'Xác nhận đơn', eyebrow: 'ALLURA TƯ VẤN RIÊNG CHO BẠN', title: 'Để lại thông tin', titleAccent: '& kết nối với seller.', intro: 'Allura không thanh toán trực tiếp trên app. Chọn một cách liên hệ phù hợp, seller sẽ tư vấn và xác nhận đơn hàng với bạn.', contactTitle: 'Thông tin liên hệ', contactHint: 'Seller sẽ dùng để phản hồi', fullName: 'Họ và tên *', fullNamePlaceholder: 'Tên của bạn', phone: 'Số điện thoại *', phonePlaceholder: '090...', email: 'Email *', recipientTitle: 'Thông tin nhận hàng', recipientHint: 'Để seller tư vấn chính xác', recipientName: 'Tên người nhận *', recipientNamePlaceholder: 'Tên người nhận', recipientPhone: 'Số điện thoại nhận *', address: 'Địa chỉ nhận hàng *', addressPlaceholder: 'Số nhà, tên đường, phường/xã, tỉnh/thành', note: 'Lời nhắn cho seller', notePlaceholder: 'Màu đèn, thời gian cần hàng hoặc điều bạn muốn hỏi...', contactMethodTitle: 'Chọn cách liên hệ', noPayment: 'Không thanh toán trên app', zaloHint: 'Mở cuộc trò chuyện với seller', facebookHint: 'Nhắn tin qua fanpage', emailAction: 'Gửi thông tin qua email', emailHint: 'Soạn email gửi seller', contactNote: 'Thông tin sản phẩm và yêu cầu của bạn sẽ được gửi cho seller để tư vấn giá, phí giao hàng và xác nhận đơn.', sent: 'Đã mở kênh liên hệ. Seller sẽ phản hồi bạn sớm.', trust: ['Không thanh toán trên app', 'Tư vấn trực tiếp', 'Bảo mật thông tin'], summaryTitle: 'Sản phẩm bạn chọn', summaryCount: count => `${count} món quà`, sellerConfirm: 'Seller sẽ xác nhận giá và đơn hàng sau khi tư vấn.', subtotal: 'Tạm tính tham khảo', shipping: 'Phí giao hàng', shippingLater: 'Sẽ báo sau', total: 'GIÁ TRỊ THAM KHẢO', totalNote: 'Chưa phải giao dịch thanh toán', submit: 'Gửi thông tin cho seller', submitted: 'Đã gửi thông tin', terms: 'Bằng việc gửi thông tin, bạn đồng ý để seller liên hệ tư vấn đơn hàng Allura.', validation: 'Vui lòng điền đầy đủ thông tin liên hệ và giao nhận.', syncError: 'Không thể đồng bộ giỏ hàng. Vui lòng thử lại.', subject: 'Tư vấn đơn hàng Allura', noNote: '(Không có)',
  }

  const [items, setItems] = useState([])
  const [cartUser, setCartUser] = useState(null)
  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' })
  const [recipient, setRecipient] = useState({ name: '', phone: '', address: '', note: '' })
  const [contactMethod, setContactMethod] = useState('email')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0), [items])
  const updateBuyer = e => setBuyer({ ...buyer, [e.target.name]: e.target.value })
  const updateRecipient = e => setRecipient({ ...recipient, [e.target.name]: e.target.value })

  useEffect(() => {
    let active = true
    const loadCart = async () => {
      try {
        const user = await currentUser()
        if (user && supabase) {
          const metadata = user.user_metadata || {}
          let profile = null
          try {
            const { data } = await supabase.from('profiles').select('full_name, email').eq('id', user.id).maybeSingle()
            profile = data
          } catch {
            // Auth metadata still provides the saved contact and delivery fields.
          }
          const name = profile?.full_name || metadata.full_name || metadata.name || ''
          const email = user.email || profile?.email || ''
          const phone = metadata.phone || ''
          const address = metadata.address || ''
          if (active) {
            setBuyer({ name, email, phone })
            setRecipient({ name, phone, address, note: '' })
          }
        }
        const next = user ? await loadCartForUser(user) : getGuestCart()
        if (!active) return
        setCartUser(user)
        setItems(next)
      } catch {
        if (!active) return
        setCartUser(null)
        setItems(getGuestCart())
      }
    }
    loadCart()
    return () => { active = false }
  }, [])

  useEffect(() => {
    const refreshCart = () => {
      const next = cartUser ? loadCartForUser(cartUser) : Promise.resolve(getGuestCart())
      next.then(setItems).catch(() => {})
    }
    window.addEventListener(CART_UPDATED_EVENT, refreshCart)
    return () => window.removeEventListener(CART_UPDATED_EVENT, refreshCart)
  }, [cartUser])

  const updateCart = async next => {
    setError('')
    if (!cartUser) {
      const saved = saveGuestCart(next)
      setItems(saved)
      return
    }
    try {
      const saved = await saveCartForUser(cartUser, next)
      setItems(saved)
    } catch (updateError) {
      const remote = await loadCartForUser(cartUser).catch(() => items)
      setItems(remote)
      setError(updateError.message || copy.syncError)
    }
  }

  const buildMessage = () => [
    english ? 'Hello Allura, I would like advice about/order the following product:' : 'Xin chào Allura, mình muốn được tư vấn/đặt sản phẩm:',
    ...items.map(item => `- ${item.productName} / ${item.variantName} x${item.quantity} — ${money(item.unitPrice * item.quantity)}`),
    `${english ? 'Estimated subtotal' : 'Tạm tính'}: ${money(total)}`,
    '',
    `${english ? 'Contact person' : 'Người liên hệ'}: ${buyer.name}`,
    `Email: ${buyer.email}`,
    `${english ? 'Phone' : 'Số điện thoại'}: ${buyer.phone}`,
    `${english ? 'Recipient' : 'Người nhận'}: ${recipient.name}`,
    `${english ? 'Recipient phone' : 'Số điện thoại nhận'}: ${recipient.phone}`,
    `${english ? 'Delivery address' : 'Địa chỉ'}: ${recipient.address}`,
    `${english ? 'Note' : 'Lời nhắn'}: ${recipient.note || copy.noNote}`,
  ].join('\n')

  const submitContact = async e => {
    e.preventDefault()
    if (sending) return
    setError('')
    if (!items.length) return onNavigate('/san-pham')
    if (!buyer.name || !buyer.email || !buyer.phone || !recipient.name || !recipient.phone || !recipient.address) return setError(copy.validation)
    if (contactMethod === 'zalo') return window.location.assign(sellerZalo)
    if (contactMethod === 'facebook') return window.location.assign(sellerFacebook)
    if (!emailServiceId || !emailTemplateId || !emailPublicKey) return setError(english ? 'EmailJS is not configured. Please check the VITE_EMAILJS_* environment variables.' : 'EmailJS chua duoc cau hinh. Vui long kiem tra cac bien VITE_EMAILJS_* .')

    setSending(true)
    setSent(false)
    const message = buildMessage()
    const itemSummary = items.map(item => `${item.productName} / ${item.variantName} x${item.quantity}`).join('\\n')
    try {
      await emailjs.send(emailServiceId, emailTemplateId, {
        to_email: sellerEmail,
        subject: `${copy.subject} - ${buyer.name}`,
        order_subject: `${copy.subject} - ${buyer.name}`,
        product: items.map(item => item.productName).join(', '),
        variant: items.map(item => item.variantName).join(', '),
        quantity: String(items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)),
        unitPrice: money(total),
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        address: recipient.address,
        note: recipient.note || copy.noNote,
        recipient_name: recipient.name,
        recipient_phone: recipient.phone,
        recipient_address: recipient.address,
        cart_items: itemSummary,
        order_summary: message,
        subtotal: money(total),
        total: money(total),
        submitted_at: new Date().toLocaleString(english ? 'en-US' : 'vi-VN'),
        from_name: buyer.name,
        reply_to: buyer.email,
      }, { publicKey: emailPublicKey })
      setSent(true)
    } catch (sendError) {
      setError(sendError?.text || sendError?.message || (english ? 'Could not send the email. Please try again.' : 'Khong the gui email. Vui long thu lai.'))
    } finally {
      setSending(false)
    }
  }

  return <div className="checkout-page">
    <SiteHeader onNavigate={onNavigate} rightAction={{ label: copy.continueShopping, onClick: () => onNavigate('/san-pham') }} showLogin={false} showCreate={false} />
    <main className="checkout-main container">
      <div className="checkout-progress"><span><ShoppingBag size={14}/> {copy.cart}</span><i>/</i><b><strong>1</strong> {copy.contactStep}</b><i>/</i><span><strong>2</strong> {copy.consultStep}</span><i>/</i><span><strong>3</strong> {copy.confirmStep}</span></div>
      <div className="checkout-grid">
        <section className="checkout-left">
          <div className="checkout-intro"><div className="eyebrow"><Gift size={16}/> {copy.eyebrow}</div><h1>{copy.title}<br/><em>{copy.titleAccent}</em></h1><p>{copy.intro}</p></div>
          <div className="checkout-card">
            <div className="checkout-section-title"><span>A</span><h2>{copy.contactTitle} <small>{copy.contactHint}</small></h2></div>
            <div className="form-grid"><Field label={copy.fullName}><input name="name" value={buyer.name} onChange={updateBuyer} placeholder={copy.fullNamePlaceholder} required/></Field><Field label={copy.phone}><input name="phone" value={buyer.phone} onChange={updateBuyer} placeholder={copy.phonePlaceholder} required/></Field><Field label={copy.email} wide><input name="email" type="email" value={buyer.email} onChange={updateBuyer} placeholder="email@example.com" required/></Field></div>
            <hr/>
            <div className="checkout-section-title"><span>B</span><h2>{copy.recipientTitle} <small><MapPin size={14}/> {copy.recipientHint}</small></h2></div>
            <div className="form-grid"><Field label={copy.recipientName}><input name="name" value={recipient.name} onChange={updateRecipient} placeholder={copy.recipientNamePlaceholder} required/></Field><Field label={copy.recipientPhone}><input name="phone" value={recipient.phone} onChange={updateRecipient} placeholder={copy.phonePlaceholder} required/></Field><Field label={copy.address} wide><input name="address" value={recipient.address} onChange={updateRecipient} placeholder={copy.addressPlaceholder} required/></Field><Field label={copy.note} wide><textarea name="note" value={recipient.note} onChange={updateRecipient} placeholder={copy.notePlaceholder} rows="3"/></Field></div>
          </div>
          <div className="checkout-card contact-card"><div className="checkout-section-title"><MessageCircle size={20}/><h2>{copy.contactMethodTitle} <small>{copy.noPayment}</small></h2></div><div className="contact-options"><button type="button" className={contactMethod === 'zalo' ? 'contact-option selected' : 'contact-option'} onClick={() => { setContactMethod('zalo'); window.location.assign(sellerZalo) }}><MessageCircle/><b>Zalo<small>{copy.zaloHint}</small></b>{contactMethod === 'zalo' && <CheckCircle2/>}</button><button type="button" className={contactMethod === 'facebook' ? 'contact-option selected' : 'contact-option'} onClick={() => { setContactMethod('facebook'); window.location.assign(sellerFacebook) }}><Share2/><b>Facebook<small>{copy.facebookHint}</small></b>{contactMethod === 'facebook' && <CheckCircle2/>}</button><button type="button" className={contactMethod === 'email' ? 'contact-option selected' : 'contact-option'} onClick={() => setContactMethod('email')}><Mail/><b>{copy.emailAction}<small>{copy.emailHint}</small></b>{contactMethod === 'email' && <CheckCircle2/>}</button></div><p className="contact-note">{copy.contactNote}</p></div>
          {error && <div className="checkout-error">{error}</div>}{sent && <div className="checkout-success"><CheckCircle2 size={18}/> {copy.sent}</div>}<div className="checkout-trust">{copy.trust.map(label => <span key={label}><CheckCircle2 size={19}/> {label}</span>)}</div>
        </section>
        <aside className="checkout-summary"><div className="summary-accent"/><div className="summary-title"><h2>{copy.summaryTitle}</h2><span>{copy.summaryCount(items.length)}</span></div>{items.map(item => <div className="summary-item" key={item.variantId}><img src={item.imageUrl || ''} alt={item.productName}/><div><b>{item.productName}</b><small>{item.variantName}</small><strong>{money(item.unitPrice * item.quantity)}</strong><div className="summary-quantity"><button type="button" aria-label={english ? 'Decrease quantity' : 'Giảm số lượng'} onClick={() => updateCart(items.map(row => row.variantId === item.variantId ? { ...row, quantity: Math.max(1, row.quantity - 1) } : row))}><Minus size={12}/></button><span>{item.quantity}</span><button type="button" aria-label={english ? 'Increase quantity' : 'Tăng số lượng'} onClick={() => updateCart(items.map(row => row.variantId === item.variantId ? { ...row, quantity: row.quantity + 1 } : row))}><Plus size={12}/></button><button type="button" className="summary-remove" aria-label={english ? 'Remove item' : 'Xóa sản phẩm'} onClick={() => updateCart(items.filter(row => row.variantId !== item.variantId))}><Trash2 size={13}/></button></div></div></div>)}<div className="summary-event"><MessageCircle size={19}/> {copy.sellerConfirm}</div><div className="summary-lines"><div><span>{copy.subtotal}</span><b>{money(total)}</b></div><div><span>{copy.shipping}</span><strong>{copy.shippingLater}</strong></div><hr/><div className="grand-total"><span>{copy.total}<small>{copy.totalNote}</small></span><b>{money(total)}</b></div></div><button className="checkout-submit" disabled={!items.length} onClick={submitContact}><MessageCircle size={20}/>{sent ? copy.submitted : copy.submit} <ArrowRight size={17}/></button><p className="terms">{copy.terms}</p></aside>
      </div>
    </main>
  </div>
}
