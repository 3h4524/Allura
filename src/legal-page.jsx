import React from 'react'
import { ArrowLeft, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { useLanguage } from './language.jsx'
import './legal-page.css'

const content = {
  terms: {
    vi: { eyebrow: 'ĐIỀU KHOẢN DỊCH VỤ', title: 'Một trải nghiệm rõ ràng,', accent: 'dễ tin cậy.', intro: 'Các nguyên tắc sử dụng Allura và những điều bạn cần biết khi tạo, kích hoạt hoặc nhận một món quà.', sections: [['Sử dụng dịch vụ', 'Bạn cần cung cấp thông tin chính xác khi tạo tài khoản, đặt hàng và thiết lập món quà. Mỗi tài khoản chỉ sử dụng các tính năng thuộc quyền sở hữu của mình.'], ['Nội dung món quà', 'Bạn chịu trách nhiệm về lời nhắn, hình ảnh, âm thanh và các nội dung được lưu vào chiếc đèn. Nội dung cần tôn trọng quyền riêng tư và quyền sở hữu của người khác.'], ['Tài khoản và NFC', 'Không chia sẻ mã nhận quà hoặc đường dẫn NFC với người không liên quan. Allura có thể tạm khóa quyền truy cập khi phát hiện hành vi sử dụng trái phép.']] },
    en: { eyebrow: 'TERMS OF SERVICE', title: 'A clear experience,', accent: 'built on trust.', intro: 'The principles for using Allura when creating, activating, or receiving a gift.', sections: [['Using the service', 'Please provide accurate information when creating an account, placing an order, and setting up a gift. Each account may use features connected to its own lamps.'], ['Gift content', 'You are responsible for the messages, images, audio, and other content saved to a lamp. Content must respect privacy and the rights of others.'], ['Accounts and NFC', 'Do not share a gift code or NFC link with anyone who should not access it. Allura may restrict access when unauthorized use is detected.']] },
  },
  privacy: {
    vi: { eyebrow: 'CHÍNH SÁCH BẢO MẬT', title: 'Giữ riêng những điều', accent: 'thuộc về bạn.', intro: 'Cách Allura sử dụng thông tin cần thiết để vận hành tài khoản, đơn hàng và trải nghiệm NFC.', sections: [['Thông tin được sử dụng', 'Allura sử dụng thông tin tài khoản, liên hệ và đơn hàng để xử lý giao dịch, liên kết đèn và hỗ trợ khách hàng.'], ['Nội dung cá nhân hóa', 'Lời nhắn, hình ảnh và voice được gắn với chiếc đèn tương ứng. Voice được lưu trong vùng riêng tư và chỉ được cấp quyền nghe qua phiên hợp lệ.'], ['Quyền kiểm soát', 'Bạn có thể yêu cầu cập nhật hoặc hỗ trợ xử lý nội dung đã tạo bằng cách liên hệ Trung tâm hỗ trợ.']] },
    en: { eyebrow: 'PRIVACY POLICY', title: 'Keeping what matters', accent: 'close to you.', intro: 'How Allura uses the information needed to operate accounts, orders, and NFC experiences.', sections: [['Information we use', 'Allura uses account, contact, and order information to process transactions, link lamps, and support customers.'], ['Personalized content', 'Messages, images, and voice notes are connected to the relevant lamp. Voice files are stored privately and served only through a valid session.'], ['Your control', 'You can request updates or help with content you created through the Allura Support Center.']] },
  },
  warranty: {
    vi: { eyebrow: 'BẢO HÀNH & ĐỔI TRẢ', title: 'Để món quà luôn', accent: 'trọn vẹn.', intro: 'Thông tin tham khảo về bảo hành sản phẩm và quy trình hỗ trợ sau khi nhận hàng.', sections: [['Thời hạn bảo hành', 'Sản phẩm được bảo hành 06 tháng từ ngày nhận hàng đối với lỗi kỹ thuật thuộc phạm vi sản xuất và lắp ráp.'], ['Đổi trả', 'Allura tiếp nhận yêu cầu trong 07 ngày từ ngày nhận hàng đối với lỗi sản xuất, hư hỏng do vận chuyển, giao sai hoặc thiếu thành phần.'], ['Gửi yêu cầu', 'Vui lòng chuẩn bị mã đơn hàng, thông tin liên hệ và mô tả tình trạng sản phẩm. Đội ngũ hỗ trợ sẽ phản hồi trong 24–48 giờ làm việc.']] },
    en: { eyebrow: 'WARRANTY & RETURNS', title: 'Keeping every gift', accent: 'complete.', intro: 'Reference information about product warranty and after-delivery support.', sections: [['Warranty period', 'Products include a 6-month warranty from delivery for technical issues within manufacturing and assembly coverage.'], ['Returns', 'Allura accepts requests within 7 days of delivery for manufacturing defects, shipping damage, incorrect items, or missing components.'], ['Requesting help', 'Please prepare your order code, contact details, and a description of the issue. The support team replies within 24–48 business hours.']] },
  },
}

export default function LegalPage({ kind, onNavigate }) {
  const { language } = useLanguage()
  const text = content[kind] || content.terms
  const copy = text[language === 'en' ? 'en' : 'vi']
  const Icon = kind === 'warranty' ? Wrench : kind === 'privacy' ? ShieldCheck : Sparkles
  return <main className="legal-page">
    <div className="legal-hero container">
      <button type="button" className="legal-back" onClick={() => onNavigate('/')}><ArrowLeft size={15}/> {language === 'en' ? 'Back to Allura' : 'Về Allura'}</button>
      <div className="eyebrow"><Icon size={15}/> {copy.eyebrow}</div>
      <h1>{copy.title}<br/><em>{copy.accent}</em></h1>
      <p>{copy.intro}</p>
    </div>
    <div className="legal-sections container">{copy.sections.map(([title, body], index) => <article key={title}><span>0{index + 1}</span><div><h2>{title}</h2><p>{body}</p></div></article>)}</div>
  </main>
}
