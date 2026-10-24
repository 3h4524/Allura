import React, { useState } from 'react'
import { ArrowRight, BookOpen, Check, CircleUserRound, Headphones, Heart, KeyRound, Lightbulb, LockKeyhole, MailOpen, Nfc, Send, Sparkles, UserRound, Users } from 'lucide-react'
import { useLanguage } from './language.jsx'
import { sections, englishSections } from './usage-guide.jsx'

const guideSteps = {
  vi: {
    user: [
      ['01', 'Đăng ký tài khoản', 'Tạo tài khoản Allura để quản lý món quà và chiếc đèn của bạn.'],
      ['02', 'Kích hoạt đèn', 'Nhập mã NFC để liên kết chiếc đèn với tài khoản.'],
      ['03', 'Thiết lập món quà', 'Viết lời nhắn, thêm ảnh và ghi âm điều bạn muốn nói.'],
      ['04', 'Lưu và kiểm tra', 'Xem trước tấm thiệp rồi lưu nội dung vào chiếc đèn.'],
      ['05', 'Trao gửi', 'Đưa món quà cho người thương và để họ chạm NFC.'],
    ],
    receiver: [
      ['01', 'Chạm vào đèn', 'Dùng điện thoại chạm vào vùng NFC trên chiếc đèn.'],
      ['02', 'Nhập mã nhận quà', 'Nhập mã 6 số seller gửi riêng cho bạn.'],
      ['03', 'Mở lời nhắn', 'Thiệp riêng tư sẽ mở ra sau khi mã được xác thực.'],
      ['04', 'Nghe giọng nói', 'Bật lời nhắn bằng giọng nói và nhạc nền.'],
      ['05', 'Giữ lại khoảnh khắc', 'Quay lại bất cứ lúc nào bằng chiếc đèn của bạn.'],
    ],
  },
  en: {
    user: [
      ['01', 'Create an account', 'Create your Allura account to manage your gift and lamp.'],
      ['02', 'Activate the lamp', 'Enter the NFC code to link the lamp to your account.'],
      ['03', 'Set up the gift', 'Write a message, add photos and record what you want to say.'],
      ['04', 'Save and review', 'Preview the card and save the content to the lamp.'],
      ['05', 'Give the gift', 'Give it to someone you love and let them tap the NFC.'],
    ],
    receiver: [
      ['01', 'Tap the lamp', 'Tap the NFC area on the lamp with your phone.'],
      ['02', 'Enter the gift code', 'Enter the six-digit code sent by the seller.'],
      ['03', 'Open the message', 'The private card opens after the code is verified.'],
      ['04', 'Listen to the voice note', 'Play the voice message and soundtrack.'],
      ['05', 'Keep the moment', 'Come back whenever you want through your Allura lamp.'],
    ],
  },
}

const guideCopy = {
  vi: {
    eyebrow: 'CẨM NANG ALLURA',
    title: <>Allura được tạo ra để <em>trao gửi.</em></>,
    intro: 'Tìm hiểu cách người tạo quà thiết lập món quà và cách người nhận mở ra một lời nhắn riêng tư.',
    user: 'Người dùng',
    userHint: '· thiết lập quà',
    receiver: 'Người nhận',
    receiverHint: '· mở quà',
    setup: 'Thiết lập món quà',
    open: 'Mở món quà của bạn',
    simple: '5 bước đơn giản',
    step: 'BƯỚC',
    continue: 'Tiếp tục',
    craftEyebrow: 'MỘT NGHI THỨC NHỎ',
    craftTitle: <>Điều kỳ diệu nằm trong <em>cách bạn trao đi.</em></>,
    craftIntro: 'Allura biến khoảnh khắc mở quà thành một trải nghiệm chậm rãi: chạm, nhập mã, lắng nghe và cảm nhận.',
    privateTitle: 'Riêng tư theo thiết kế',
    privateText: 'Chỉ người có mã nhận quà mới có thể mở nội dung bên trong.',
    lightTitle: 'Ánh sáng luôn ở lại',
    lightText: 'Mỗi lần bật đèn là một lần lời nhắn được nhớ lại.',
    receiverEyebrow: 'DÀNH CHO NGƯỜI NHẬN',
    receiverTitle: <>Một món quà được mở bằng <em>cảm xúc.</em></>,
    receiverSteps: [['01', 'Chạm NFC', 'Không cần cài thêm ứng dụng.'], ['02', 'Nhập mã', 'Mã 6 số được seller gửi riêng.'], ['03', 'Đọc lời nhắn', 'Tấm thiệp hiện ra trên điện thoại.'], ['04', 'Nghe giọng nói', 'Một phần ký ức bằng âm thanh.'], ['05', 'Bật đèn', 'Ánh sáng đồng hành cùng bạn.']],
  },
  en: {
    eyebrow: 'ALLURA · USER GUIDE',
    title: <>Allura was made to <em>be shared.</em></>,
    intro: 'Learn how the gift creator sets up a gift and how the recipient opens a private message.',
    user: 'Gift creator',
    userHint: '· set up a gift',
    receiver: 'Gift recipient',
    receiverHint: '· open a gift',
    setup: 'Set up your gift',
    open: 'Open your gift',
    simple: '5 simple steps',
    step: 'STEP',
    continue: 'Continue',
    craftEyebrow: 'A SMALL RITUAL',
    craftTitle: <>The magic is in <em>how you give.</em></>,
    craftIntro: 'Allura turns opening a gift into a slower, more meaningful experience: tap, enter the code, listen, and feel.',
    privateTitle: 'Private by design',
    privateText: 'Only the person with the gift code can open the message inside.',
    lightTitle: 'A light that stays',
    lightText: 'Every time the lamp turns on, a memory comes back to life.',
    receiverEyebrow: 'FOR THE RECIPIENT',
    receiverTitle: <>A gift opened with <em>feeling.</em></>,
    receiverSteps: [['01', 'Tap NFC', 'No extra app is needed.'], ['02', 'Enter the code', 'A private six-digit code from the seller.'], ['03', 'Read the message', 'The card appears on your phone.'], ['04', 'Hear the voice', 'A memory captured in sound.'], ['05', 'Turn on the lamp', 'Let the light stay with you.']],
  },
}

function GuideStepIcon({ index }) {
  return index === 0 ? <UserRound /> : index === 1 ? <Sparkles /> : index === 2 ? <Heart /> : index === 3 ? <Headphones /> : <Send />
}

function ReceiverStepIcon({ index }) {
  const icons = [Nfc, KeyRound, MailOpen, Headphones, Lightbulb]
  const Icon = icons[index] || Sparkles
  return <Icon size={16} />
}

export function LocalizedLegacyGuide() {
  const { language } = useLanguage()
  const english = language === 'en'
  const key = english ? 'en' : 'vi'
  const copy = guideCopy[key]
  const [audience, setAudience] = useState('user')
  const steps = guideSteps[key][audience]

  return <div className="guide-mock">
    <section className="guide-hero container">
      <div className="center-heading">
        <div className="eyebrow"><BookOpen size={15}/> {copy.eyebrow}</div>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
        <div className="segmented">
          <button className={audience === 'user' ? 'selected' : ''} onClick={() => setAudience('user')}><CircleUserRound size={15}/> {copy.user} <small>{copy.userHint}</small></button>
          <button className={audience === 'receiver' ? 'selected' : ''} onClick={() => setAudience('receiver')}><Users size={15}/> {copy.receiver} <small>{copy.receiverHint}</small></button>
        </div>
      </div>
    </section>
    <section className="guide-steps container">
      <div className="guide-section-title"><h2>{audience === 'user' ? copy.setup : copy.open}</h2><span><Check size={13}/> {copy.simple}</span></div>
      <div className="guide-step-grid">{steps.map(([number, title, text], index) => <article key={number} className={`guide-step-card ${index === 2 ? 'highlight' : ''}`}><b className="guide-step-number">{number}</b><div className="guide-step-icon"><GuideStepIcon index={index}/></div><span>{copy.step} {number}</span><h3>{title}</h3><p>{text}</p><small>{copy.continue} <ArrowRight size={13}/></small></article>)}</div>
    </section>
    <section className="guide-craft container">
      <div className="craft-image" style={{ background: 'linear-gradient(135deg,#b99570,#ead7bd)' }}><div className="lamp" style={{ transform: 'scale(.8)' }}><div className="lamp-light"/><div className="lamp-shade"/><div className="lamp-body"/><div className="lamp-base"/></div></div>
      <div className="craft-copy"><div className="eyebrow"><Sparkles size={14}/> {copy.craftEyebrow}</div><h2>{copy.craftTitle}</h2><p>{copy.craftIntro}</p><div className="tip"><LockKeyhole size={18}/><div><b>{copy.privateTitle}</b><p>{copy.privateText}</p></div></div><div className="tip"><Sparkles size={18}/><div><b>{copy.lightTitle}</b><p>{copy.lightText}</p></div></div></div>
    </section>
    <section className="guide-receiver"><div className="container"><div className="center-heading"><div className="eyebrow"><Heart size={14}/> {copy.receiverEyebrow}</div><h2>{copy.receiverTitle}</h2></div><div className="receiver-grid">{copy.receiverSteps.map(([number, title, text]) => <div key={number}><b>{number}</b><h3>{title}</h3><p>{text}</p><ReceiverStepIcon index={Number(number) - 1}/></div>)}</div></div></section>
  </div>
}

const nfcCopy = {
  vi: {
    creator: 'Dành cho người tặng', recipient: 'Dành cho người nhận',
    creatorSteps: [['Truy cập website và đăng nhập', 'Nhập email đã cung cấp khi mua sản phẩm. Hệ thống sẽ gửi mã OTP.'], ['Xác thực tài khoản', 'Nhập mã OTP để truy cập khu vực cá nhân hóa món quà.'], ['Thiết lập thông điệp', 'Trong Personalized Message & Voice, bạn có thể thêm Message, Voice và Picture.'], ['Xem trước và lưu', 'Kiểm tra lời nhắn, nghe lại đoạn ghi âm rồi chọn Lưu thông điệp.'], ['Trao tặng món quà', 'Nội dung được lưu và liên kết với chiếc đèn để người nhận khám phá.']],
    flow: ['Đăng nhập', 'Khởi động đèn', 'Kết nối NFC', 'Lắng nghe lời nhắn'],
    recipientText: 'Chạm điện thoại có NFC vào vị trí NFC trên đế đèn để mở nội dung đã được chuẩn bị riêng.',
  },
  en: {
    creator: 'For the gift creator', recipient: 'For the recipient',
    creatorSteps: [['Visit the website and sign in', 'Use the email provided when you purchased the product. We will send you a one-time code.'], ['Verify your account', 'Enter the code to access your private gift setup area.'], ['Set up the message', 'In Personalized Message & Voice, add your message, voice note, and pictures.'], ['Preview and save', 'Review the card, listen to the recording, then save the message.'], ['Give the gift', 'Your content is linked to the lamp for the recipient to discover.']],
    flow: ['Sign in', 'Turn on the lamp', 'Tap NFC', 'Listen to the message'],
    recipientText: 'Tap an NFC-enabled phone on the NFC area of the lamp to open the private content prepared for you.',
  },
}

function LocalizedNfcGuide() {
  const { language } = useLanguage()
  const copy = nfcCopy[language === 'en' ? 'en' : 'vi']
  return <div className="usage-nfc-content"><div className="usage-audience"><article><span>01</span><h3>{copy.creator}</h3><ol>{copy.creatorSteps.map(([title, text]) => <li key={title}><b>{title}</b><small>{text}</small></li>)}</ol></article><article><span>02</span><h3>{copy.recipient}</h3><div className="usage-receiver-flow">{copy.flow.map((item, index) => <React.Fragment key={item}><b>{item}</b>{index < copy.flow.length - 1 && <i>→</i>}</React.Fragment>)}</div><p>{copy.recipientText}</p></article></div></div>
}

function LocalizedUsageBody({ section, english }) {
  if (section.custom) return <LocalizedNfcGuide />
  return <div className="usage-steps">{section.steps.map(([title, items], index) => <article className="usage-step" key={title}><span className="usage-step-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><ul>{items.map(item => <li key={item}>{item}</li>)}</ul></div></article>)}{section.note && <div className="usage-note"><b>{english ? 'Note' : 'Lưu ý'}</b><span>{section.note}</span></div>}</div>
}

export function LocalizedUsageGuideSections({ onNavigate }) {
  const { language } = useLanguage()
  const english = language === 'en'
  const data = english ? englishSections : sections
  const [active, setActive] = useState('getting-started')
  const current = data.find(section => section.id === active) || data[0]
  const copy = english ? { eyebrow: 'USER GUIDE · ALLURA', title: <>A little extra care<br/><em>for a complete experience.</em></>, contact: 'Contact & support', aria: 'Guide sections' } : { eyebrow: 'HƯỚNG DẪN SỬ DỤNG · ALLURA', title: <>Thêm một chút chăm sóc<br/><em>cho trải nghiệm trọn vẹn.</em></>, contact: 'Liên hệ & tư vấn', aria: 'Các mục hướng dẫn' }
  return <section className="usage-append"><div className="container"><div className="usage-append-heading"><div className="eyebrow">{copy.eyebrow}</div><h2>{copy.title}</h2></div><div className="usage-layout usage-layout-append"><nav className="usage-tabs" aria-label={copy.aria}>{data.map(section => <button key={section.id} className={active === section.id ? 'active' : ''} onClick={() => setActive(section.id)}><span>{section.eyebrow.split(' · ')[0]}</span>{section.title}<i>→</i></button>)}<button onClick={() => onNavigate('/ho-tro')}><span>05</span>{copy.contact}<i>→</i></button></nav><main className="usage-detail"><div className="usage-detail-heading"><div className="eyebrow">{current.eyebrow}</div><h2>{current.title}</h2><p>{current.intro}</p></div><LocalizedUsageBody section={current} english={english}/></main></div></div></section>
}
