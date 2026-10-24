import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  vi: { translation: {
    nav: { home: 'Giới thiệu', product: 'Sản phẩm', guide: 'Hướng dẫn', setup: 'Thiết lập quà', music: 'Nhạc thư giãn', support: 'Hỗ trợ' },
    common: { login: 'Đăng nhập', create: 'Tạo quà ngay', cart: 'Giỏ hàng', menu: 'Mở menu', close: 'Đóng menu', living: '', footer: 'Một món quà không chỉ để nhìn, mà còn để cảm nhận.', language: 'Ngôn ngữ' },
    home: { heroLine1: 'Thắp sáng sắc hương,', heroLine2: 'đánh thức vấn vương.', heroText: 'Allura tin rằng mỗi khoảnh khắc đều xứng đáng được lưu giữ bằng ánh sáng, hương thơm và cảm xúc. Chúng tôi tạo ra những món quà mang câu chuyện riêng, để những yêu thương luôn hiện hữu trong cuộc sống, theo cách tinh tế và bền vững nhất.', discover: 'KHÁM PHÁ HÀNH TRÌNH ALLURA', memoryLine1: 'Gửi một món quà', memoryLine2: 'có câu chuyện.', memoryText: 'Ánh sáng, âm thanh và những lời yêu thương cùng hiện diện trong một trải nghiệm chỉ thuộc về hai người.', features: [['Ánh sáng đánh thức cảm xúc', 'Một chiếc đèn thủ công mang theo ánh sáng dịu dàng và một kỷ niệm riêng.'], ['Lời nhắn chỉ dành cho bạn', 'Viết những điều chưa nói, để người nhận mở ra bằng một cú chạm NFC.'], ['Nghe thấy cả yêu thương', 'Thêm một lời nhắn bằng giọng nói và nhạc nền cho khoảnh khắc mở quà.']], quoteLine1: 'Có những điều không thể gói trong hộp quà,', quoteLine2: 'nhưng có thể thắp sáng.' }
  }},
  en: { translation: {
    nav: { home: 'About us', product: 'Products', guide: 'Guide', setup: 'Gift setup', music: 'Relaxing music', support: 'Support' },
    common: { login: 'Log in', create: 'Create a gift', cart: 'Shopping cart', menu: 'Open menu', close: 'Close menu', living: '', footer: 'A gift is not only meant to be seen, but also to be felt.', language: 'Language' },
    home: { heroLine1: 'Light up every scent,', heroLine2: 'awaken every feeling.', heroText: 'At Allura, we believe every moment deserves to be treasured through light, fragrance and emotion. We create meaningful gifts with their own stories, so love can live on in everyday life — with elegance and intention.', discover: 'DISCOVER THE ALLURA JOURNEY', memoryLine1: 'Give a gift', memoryLine2: 'with a story.', memoryText: 'Light, sound and heartfelt words come together in an experience made for two.', features: [['Light that awakens emotion', 'A handcrafted lamp carrying a gentle glow and a memory of your own.'], ['A message made for you', 'Write the words left unsaid, opened by the recipient with one NFC touch.'], ['Hear the love', 'Add a voice message and a soft soundtrack to the moment a gift is opened.']], quoteLine1: 'Some things cannot be wrapped in a gift box,', quoteLine2: 'but they can be lit up.' }
  }}
}

const savedLanguage = typeof window !== 'undefined' ? window.localStorage.getItem('allura:language') : 'vi'
i18n.use(initReactI18next).init({ resources, lng: savedLanguage === 'en' ? 'en' : 'vi', fallbackLng: 'vi', interpolation: { escapeValue: false } })

export default i18n
