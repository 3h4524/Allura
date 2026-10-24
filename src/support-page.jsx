import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, ChevronDown, Clock3, Headphones, Mail, MessageCircle, Share2, ShieldCheck, Smartphone, Wrench, X } from 'lucide-react'
import emailjs from '@emailjs/browser'
import { useLanguage } from './language.jsx'

const emailServiceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
const emailTemplateId = import.meta.env.VITE_EMAILJS_SUPPORT_TEMPLATE_ID || import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const emailPublicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
const sellerFacebook = import.meta.env.VITE_SELLER_FACEBOOK_URL || 'https://www.facebook.com/profile.php?id=61594371934146'

const copy = {
  vi: {
    hotline: 'Hotline', supportEmail: 'Email hỗ trợ', social: 'Mạng xã hội',
    heroTitle: 'Ở đây để hành trình của bạn luôn', heroAccent: 'trọn vẹn.', heroText: 'Giải đáp nhanh các vấn đề về tài khoản, mã nhận quà, NFC, thông điệp cá nhân hóa và chính sách sau mua hàng.', sendRequest: 'Gửi yêu cầu hỗ trợ', response: 'Phản hồi trong 24–48 giờ làm việc',
    team: 'Đội ngũ hỗ trợ ALLURA', cardTitle: 'Một câu hỏi nhỏ,', cardAccent: 'một lời hồi đáp dịu dàng.', cardText: 'Hãy gửi cho chúng tôi thông tin đơn hàng và mô tả ngắn vấn đề bạn đang gặp phải.',
    findAnswer: 'TỰ TÌM CÂU TRẢ LỜI', faqTitle: 'Những điều bạn', faqAccent: 'thường cần biết.', faqText: 'Chọn nhóm phù hợp để xem hướng dẫn ngắn gọn. Nếu chưa giải quyết được, ALLURA luôn sẵn sàng hỗ trợ trực tiếp.',
    processEyebrow: 'KHI CẦN HỖ TRỢ KỸ THUẬT', processTitle: 'Gửi đúng thông tin,', processAccent: 'được hỗ trợ nhanh hơn.', processItems: ['Họ tên & thông tin liên hệ', 'Mã đơn hàng hoặc sản phẩm', 'Mô tả lỗi và thời điểm xảy ra', 'Ảnh/video hoặc ảnh chụp màn hình'], security: 'Không gửi mật khẩu, mã OTP hoặc thông tin thanh toán khi yêu cầu hỗ trợ.',
    contactEyebrow: 'LIÊN HỆ ALLURA', contactTitle: 'Chúng tôi sẵn sàng', contactAccent: 'lắng nghe.', contactText: 'Nếu vấn đề của bạn chưa có trong hướng dẫn, hãy liên hệ qua kênh chính thức để được kiểm tra cụ thể.', contactNow: 'Liên hệ ngay',
    accountTitle: 'Tài khoản & mã nhận quà', accountItems: [['Không đăng nhập được thì phải làm sao?', 'Kiểm tra lại email hoặc số điện thoại, đảm bảo kết nối Internet ổn định và thử tải lại trang bằng trình duyệt khác. Nếu quên mật khẩu, chọn “Quên mật khẩu” để khôi phục.'], ['Mã nhận quà không hợp lệ hoặc đã được sử dụng?', 'Kiểm tra lại từng ký tự của mã và chắc chắn bạn đang nhập tại đúng trang kích hoạt. Nếu vẫn không thành công, hãy gửi mã cùng thông tin đơn hàng để ALLURA kiểm tra.']],
    nfcTitle: 'NFC & thông điệp cá nhân hóa', nfcItems: [['Điện thoại không nhận NFC?', 'Kiểm tra điện thoại có hỗ trợ NFC, bật NFC nếu cần, rồi đưa vùng đọc NFC đến đúng vị trí được đánh dấu trên đèn. Giữ thiết bị ổn định vài giây và thử tháo ốp điện thoại nếu ốp cản tín hiệu.'], ['Quét NFC thành công nhưng không mở được trang?', 'Kiểm tra kết nối Internet, thử mở lại liên kết bằng trình duyệt khác và xem trang có yêu cầu đăng nhập hay xác thực không.'], ['Có thể chỉnh sửa hoặc xóa nội dung đã thiết lập không?', 'Bạn có thể gửi yêu cầu qua kênh hỗ trợ chính thức. ALLURA sẽ xác minh quyền quản lý nội dung và thông báo khả năng xử lý theo điều kiện dịch vụ.']],
    orderTitle: 'Đặt hàng, bảo hành & đổi trả', orderItems: [['Sản phẩm được bảo hành trong bao lâu?', 'Sản phẩm được bảo hành 06 tháng kể từ ngày nhận hàng đối với lỗi kỹ thuật thuộc phạm vi sản xuất và lắp ráp. Khách hàng cần cung cấp mã đơn hàng hoặc thông tin mua hàng để xác minh.'], ['Khi nào được đổi trả?', 'ALLURA tiếp nhận yêu cầu đổi trả trong 07 ngày kể từ ngày nhận hàng đối với sản phẩm có lỗi sản xuất, hư hỏng do vận chuyển, giao sai hoặc thiếu thành phần so với đơn đã xác nhận.'], ['Thời gian xử lý yêu cầu là bao lâu?', 'ALLURA phản hồi trong 24–48 giờ làm việc sau khi nhận đủ thông tin. Việc kiểm tra dự kiến 3–5 ngày làm việc và sửa chữa/thay thế dự kiến 7–14 ngày tùy tình trạng.']],
    modalEyebrow: 'GỬI YÊU CẦU HỖ TRỢ', modalTitle: 'Bạn đang cần chúng tôi', modalAccent: 'giúp điều gì?', modalText: 'Cung cấp càng đầy đủ thông tin, ALLURA càng dễ kiểm tra và phản hồi nhanh hơn.', name: 'Họ và tên *', namePlaceholder: 'Tên của bạn', email: 'Email *', phone: 'Số điện thoại', phonePlaceholder: '0935...', orderCode: 'Mã đơn hàng / sản phẩm', orderPlaceholder: 'Nếu có', issue: 'Loại vấn đề *', issueOptions: ['Tài khoản / đăng nhập', 'Mã nhận quà', 'NFC không kết nối', 'Thông điệp cá nhân hóa', 'Bảo hành / đổi trả', 'Đặt hàng / thanh toán', 'Vấn đề khác'], device: 'Thiết bị đang sử dụng', devicePlaceholder: 'Ví dụ: iPhone 15', description: 'Mô tả vấn đề *', descriptionPlaceholder: 'Mô tả lỗi, thời điểm xảy ra và các bước bạn đã thử...', browser: 'Trình duyệt / thông tin thêm', browserPlaceholder: 'Ví dụ: Safari iOS 18 hoặc Chrome', privacy: 'Không gửi mật khẩu, OTP hoặc thông tin thanh toán', sending: 'Đang gửi...', submit: 'Gửi yêu cầu', successEyebrow: 'ĐÃ TIẾP NHẬN', successTitle: 'ALLURA sẽ sớm', successAccent: 'hồi đáp bạn.', successText: 'Yêu cầu hỗ trợ đã được gửi thành công. Thời gian phản hồi dự kiến là 24–48 giờ làm việc.', close: 'Đóng', configError: 'EmailJS chưa được cấu hình. Vui lòng thêm đủ biến VITE_EMAILJS_* trong môi trường deploy.', sendError: 'Không thể gửi yêu cầu. Vui lòng thử lại.'
  },
  en: {
    hotline: 'Hotline', supportEmail: 'Support email', social: 'Social media',
    heroTitle: 'Here to keep your journey', heroAccent: 'complete.', heroText: 'Quick answers for accounts, gift codes, NFC, personalized messages, and after-purchase policies.', sendRequest: 'Send a support request', response: 'Replies within 24–48 business hours',
    team: 'ALLURA SUPPORT TEAM', cardTitle: 'A small question,', cardAccent: 'a thoughtful answer.', cardText: 'Send us your order details and a short description of the issue you are experiencing.',
    findAnswer: 'FIND AN ANSWER', faqTitle: 'Things you', faqAccent: 'may want to know.', faqText: 'Choose a topic for a quick guide. If you still need help, ALLURA is ready to support you directly.',
    processEyebrow: 'WHEN YOU NEED TECHNICAL SUPPORT', processTitle: 'Share the right details,', processAccent: 'get help faster.', processItems: ['Name & contact details', 'Order or product code', 'Issue description and timing', 'Photo/video or screenshot'], security: 'Never send your password, OTP code, or payment details in a support request.',
    contactEyebrow: 'CONTACT ALLURA', contactTitle: 'We are ready to', contactAccent: 'listen.', contactText: 'If your question is not covered in the guide, contact us through an official channel for a closer review.', contactNow: 'Contact us now',
    accountTitle: 'Account & gift code', accountItems: [['What if I cannot sign in?', 'Check your email or phone number, make sure your Internet connection is stable, and try another browser. If you forgot your password, choose “Forgot password” to recover it.'], ['Why is my gift code invalid or already used?', 'Check every character and make sure you are entering it on the correct activation page. If it still does not work, send the code and order details to ALLURA for review.']],
    nfcTitle: 'NFC & personalized messages', nfcItems: [['Why is my phone not detecting NFC?', 'Make sure your phone supports NFC and enable it if needed. Move the NFC reader area to the marked spot on the lamp, hold it steady for a few seconds, and remove the phone case if it blocks the signal.'], ['NFC scans successfully but the page will not open?', 'Check your Internet connection, try opening the link in another browser, and see whether the page requires sign-in or verification.'], ['Can I edit or delete content I have created?', 'Send a request through an official support channel. ALLURA will verify content ownership and let you know what can be handled under the service terms.']],
    orderTitle: 'Orders, warranty & returns', orderItems: [['How long is the warranty?', 'Products include a 6-month warranty from the delivery date for manufacturing and assembly defects. Please provide your order code or purchase details for verification.'], ['When can I request a return or exchange?', 'ALLURA accepts requests within 7 days of delivery for manufacturing defects, shipping damage, incorrect items, or missing components compared with the confirmed order.'], ['How long does a request take?', 'ALLURA replies within 24–48 business hours after receiving complete information. Inspection usually takes 3–5 business days, while repair or replacement may take 7–14 business days depending on the case.']],
    modalEyebrow: 'SEND A SUPPORT REQUEST', modalTitle: 'What can we', modalAccent: 'help you with?', modalText: 'The more details you share, the faster ALLURA can review and respond.', name: 'Full name *', namePlaceholder: 'Your name', email: 'Email *', phone: 'Phone number', phonePlaceholder: '0935...', orderCode: 'Order / product code', orderPlaceholder: 'If available', issue: 'Issue type *', issueOptions: ['Account / sign in', 'Gift code', 'NFC connection', 'Personalized message', 'Warranty / return', 'Order / payment', 'Other issue'], device: 'Device in use', devicePlaceholder: 'For example: iPhone 15', description: 'Issue description *', descriptionPlaceholder: 'Describe the issue, when it happened, and what you have tried...', browser: 'Browser / additional details', browserPlaceholder: 'For example: Safari iOS 18 or Chrome', privacy: 'Do not send passwords, OTP codes, or payment details', sending: 'Sending...', submit: 'Send request', successEyebrow: 'REQUEST RECEIVED', successTitle: 'ALLURA will get', successAccent: 'back to you soon.', successText: 'Your support request was sent successfully. The expected response time is 24–48 business hours.', close: 'Close', configError: 'EmailJS is not configured. Please add all VITE_EMAILJS_* variables to the deployment environment.', sendError: 'We could not send your request. Please try again.'
  }
}

const contactValues = [
  { key: 'hotline', value: '0935 427 618', href: 'tel:0935427618', icon: <MessageCircle size={18} /> },
  { key: 'supportEmail', value: 'allura.danang@gmail.com', href: 'mailto:allura.danang@gmail.com', icon: <Mail size={18} /> }
]

function getFaqGroups(text) { return [
  { title: text.accountTitle, icon: <ShieldCheck size={19} />, items: text.accountItems },
  { title: text.nfcTitle, icon: <Smartphone size={19} />, items: text.nfcItems },
  { title: text.orderTitle, icon: <Wrench size={19} />, items: text.orderItems }
] }

function ContactCard({ icon, label, value, href }) { return <a className="support-contact-card" href={href}><span className="support-contact-icon">{icon}</span><span><small>{label}</small><b>{value}</b></span><ArrowRight size={16} /></a> }
function FaqGroup({ group }) { return <section className="support-faq-group"><div className="support-faq-heading"><span>{group.icon}</span><h2>{group.title}</h2></div><div className="support-faq-list">{group.items.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={17} /></summary><p>{answer}</p></details>)}</div></section> }

function SupportIssueDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const close = event => {
      if (!dropdownRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    const closeOnEscape = event => event.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [])

  return <div ref={dropdownRef} className={`support-select${open ? ' is-open' : ''}`}>
    <button type="button" className="support-select-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}>
      <span>{value}</span><ChevronDown size={16} />
    </button>
    {open && <div className="support-select-menu" role="listbox" aria-label="Issue type">
      {options.map(option => <button type="button" role="option" aria-selected={option === value} className={option === value ? 'selected' : ''} key={option} onClick={() => { onChange(option); setOpen(false) }}>{option}</button>)}
    </div>}
  </div>
}

function SupportModal({ onClose, text, language }) {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', order_code: '', issue_type: text.issueOptions[2], description: '', device: '', browser: '' })
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }))
  const submit = async event => {
    event.preventDefault(); setError('')
    if (!emailServiceId || !emailTemplateId || !emailPublicKey) return setError(text.configError)
    setBusy(true)
    try {
      await emailjs.send(emailServiceId, emailTemplateId, { ...form, submitted_at: new Date().toLocaleString(language === 'en' ? 'en-US' : 'vi-VN'), to_email: 'allura.danang@gmail.com' }, { publicKey: emailPublicKey })
      setSent(true)
    } catch (sendError) { setError(sendError?.text || sendError?.message || text.sendError) } finally { setBusy(false) }
  }
  return <div className="support-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="support-modal-title" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="support-modal"><button className="support-modal-close" onClick={onClose} aria-label={text.close}><X size={19} /></button>{sent ? <div className="support-success"><CheckCircle2 size={32} /><div className="eyebrow">{text.successEyebrow}</div><h2>{text.successTitle}<br /><em>{text.successAccent}</em></h2><p>{text.successText}</p><button className="primary" onClick={onClose}>{text.close}</button></div> : <><div className="eyebrow"><MessageCircle size={15} /> {text.modalEyebrow}</div><h2 id="support-modal-title">{text.modalTitle}<br /><em>{text.modalAccent}</em></h2><p className="support-modal-copy">{text.modalText}</p><form className="support-form" onSubmit={submit}><div className="support-form-grid"><label>{text.name}<input name="name" value={form.name} onChange={change} required placeholder={text.namePlaceholder} /></label><label>{text.email}<input type="email" name="email" value={form.email} onChange={change} required placeholder="email@example.com" /></label><label>{text.phone}<input name="phone" value={form.phone} onChange={change} placeholder={text.phonePlaceholder} /></label><label>{text.orderCode}<input name="order_code" value={form.order_code} onChange={change} placeholder={text.orderPlaceholder} /></label><label>{text.issue}<SupportIssueDropdown value={form.issue_type} options={text.issueOptions} onChange={value => setForm(current => ({ ...current, issue_type: value }))} /></label><label>{text.device}<input name="device" value={form.device} onChange={change} placeholder={text.devicePlaceholder} /></label><label className="wide">{text.description}<textarea name="description" value={form.description} onChange={change} required rows="4" placeholder={text.descriptionPlaceholder} /></label><label className="wide">{text.browser}<input name="browser" value={form.browser} onChange={change} placeholder={text.browserPlaceholder} /></label></div>{error && <div className="support-form-error">{error}</div>}<div className="support-form-footer"><span><ShieldCheck size={14} /> {text.privacy}</span><button className="primary" disabled={busy}>{busy ? text.sending : text.submit} <ArrowRight size={17} /></button></div></form></>}</div></div>
}

export default function SupportPage() {
  const { language } = useLanguage()
  const text = copy[language === 'en' ? 'en' : 'vi']
  const [supportOpen, setSupportOpen] = useState(false)
  const openSupport = event => { event.preventDefault(); setSupportOpen(true) }
  return <div className="support-page"><div className="support-intro-block">
    <section className="support-hero container"><div className="support-hero-copy"><div className="eyebrow"><Headphones size={15} /> ALLURA SUPPORT</div><h1>{text.heroTitle} <em>{text.heroAccent}</em></h1><p>{text.heroText}</p><div className="support-hero-actions"><a className="primary" href="#support-form" onClick={openSupport}>{text.sendRequest} <ArrowRight size={17} /></a><span><Clock3 size={15} /> {text.response}</span></div></div><div className="support-hero-card"><div className="support-orb"><Headphones size={27} /></div><span className="support-status"><i /> {text.team}</span><h2>{text.cardTitle}<br /><em>{text.cardAccent}</em></h2><p>{text.cardText}</p></div></section>
    <section className="support-contact-band"><div className="container support-contact-grid">{contactValues.map(contact => <ContactCard key={contact.key} icon={contact.icon} label={text[contact.key]} value={contact.value} href={contact.href} />)}<div className="support-contact-note"><span className="support-contact-icon"><Share2 size={18} /></span><span><small>{text.social}</small><p><a href={sellerFacebook} target="_blank" rel="noreferrer">Facebook</a><a href="https://www.instagram.com/allura_danang" target="_blank" rel="noreferrer">Instagram</a><a href="https://www.tiktok.com/@allura.dn" target="_blank" rel="noreferrer">TikTok</a></p></span></div></div></section>
    </div>
     <section className="support-content container"><div className="support-section-intro"><div className="eyebrow"><CheckCircle2 size={15} /> {text.findAnswer}</div><h2>{text.faqTitle}<br /><em>{text.faqAccent}</em></h2><p>{text.faqText}</p></div><div className="support-faqs">{getFaqGroups(text).map(group => <FaqGroup key={group.title} group={group} />)}</div></section>
    <section className="support-process-band"><div className="container"><div className="support-process-heading"><div className="eyebrow"><Wrench size={15} /> {text.processEyebrow}</div><h2>{text.processTitle}<br /><em>{text.processAccent}</em></h2></div><div className="support-process-grid">{text.processItems.map((item, index) => <div className="support-process-step" key={item}><b>0{index + 1}</b><span>{item}</span></div>)}</div><p className="support-security"><ShieldCheck size={15} /> {text.security}</p></div></section>
    <section className="support-cta container"><div><div className="eyebrow"><MessageCircle size={15} /> {text.contactEyebrow}</div><h2>{text.contactTitle} <em>{text.contactAccent}</em></h2><p>{text.contactText}</p></div><a className="primary" href="#support-form" onClick={openSupport}>{text.contactNow} <ArrowRight size={17} /></a></section>
    {supportOpen && <SupportModal key={language} onClose={() => setSupportOpen(false)} text={text} language={language} />}
  </div>
}
