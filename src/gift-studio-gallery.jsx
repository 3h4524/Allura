import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, ImagePlus, LockKeyhole, Mic, Music2, Pause, Play, Sparkles, UploadCloud, UserRound, Volume2, X } from 'lucide-react'
import { currentUser, supabase } from './lib/supabase'
import GiftPreviewCard from './gift-preview-card.jsx'
import './music-dropdown.css'

const copy = {
  vi: {
    occasions: ['Sinh nhật', 'Kỷ niệm', 'Valentine', 'Giáng sinh', 'Khác'],
    eyebrow: 'THIẾT KẾ CẢM XÚC CÁ NHÂN HOÁ', title: 'Tạo lời nhắn dành riêng cho', titleEm: 'người bạn yêu thương.', intro: 'Thiết kế một tấm thiệp có lời nhắn, giọng nói và những khoảnh khắc được lưu lại cùng nhau.', progress: 'THIẾT LẬP · XEM TRƯỚC · TRAO GỬI',
    recipient: 'Người nhận', recipientPlaceholder: 'Tên người nhận', code: 'Mã nhận quà', codePlaceholder: 'Mã 6 số seller gửi', occasion: 'Dịp trao gửi', messageTitle: 'Tiêu đề lời nhắn', messageTitlePlaceholder: 'Một điều dịu dàng dành cho bạn', message: 'Lời nhắn yêu thương', messagePlaceholder: 'Viết điều bạn muốn nói...', signature: 'Chữ ký người gửi', signaturePlaceholder: 'Thương, ...',
    memories: 'Khoảnh khắc kỷ niệm', memoriesHelp: 'Tải tối đa 3 ảnh. Ảnh sẽ xuất hiện sau voice và nhạc nền trong thiệp.', chooseImages: 'Chọn nhiều ảnh', imageCount: 'ảnh', voice: 'Lời nhắn bằng giọng nói', voiceHelp: 'Ghi âm trực tiếp hoặc upload một file âm thanh ngắn.', recording: 'Đang ghi âm...', stopRecording: 'Dừng ghi âm', addVoice: 'Thêm lời nhắn âm thanh', voiceReady: 'Đã có lời nhắn bằng giọng nói', listen: 'Nhấn để lắng nghe', record: 'Ghi âm', upload: 'Upload', voiceLimit: 'Tối đa 50MB · MP3, M4A, WAV, WebM', music: 'Nhạc nền', musicHelp: 'Chọn một bản nhạc để receiver có thể nghe cùng món quà.', musicNone: 'Không dùng nhạc nền', musicUnavailable: 'Chưa có bản nhạc nào trong thư viện',
    private: 'Nội dung được bảo mật', save: 'Lưu món quà', saved: 'Đã lưu món quà', live: 'XEM TRƯỚC TRỰC TIẾP', order: 'Lời nhắn → voice → nhạc → ảnh', brandSub: 'LIGHT UP MEMORIES, GENTLE', madeFor: 'Dành riêng cho', defaultRecipient: 'người bạn yêu thương', defaultTitle: 'Một điều dịu dàng dành cho bạn', defaultMessage: 'Mỗi khi ánh đèn này sáng lên, mong bạn nhớ rằng luôn có một người đang nghĩ về bạn.', defaultSignature: 'Thương, ...', galleryTitle: 'NHỮNG KHOẢNH KHẮC ĐÁNG NHỚ', emptyGallery: 'Thêm ảnh để tạo một câu chuyện bằng hình ảnh', fullscreen: 'Xem toàn màn hình', footer: 'A GIFT OF LIGHT · A MEMORY OF LOVE',
    imageError: 'Mỗi ảnh tối đa 5MB.',
    loadError: 'Không thể tải món quà hiện tại.', secureError: 'Thiết bị hoặc kết nối hiện tại không hỗ trợ mã hóa an toàn. Vui lòng mở website bằng HTTPS rồi thử lại.', voiceSaveError: 'Không thể lưu lời nhắn bằng giọng nói.', saveError: 'Không thể lưu món quà. Vui lòng thử lại.', scanLamp: 'Hãy quét đúng chiếc đèn NFC bạn muốn thiết lập trước.', close: 'Đóng', micError: 'Không thể truy cập microphone. Bạn có thể upload file ghi âm thay thế.', audioError: 'Vui lòng chọn file âm thanh.', codeError: 'Mã nhận quà phải gồm đúng 6 chữ số.', noLamp: 'Tài khoản chưa có đèn active.'
  },
  en: {
    occasions: ['Birthday', 'Anniversary', "Valentine's Day", 'Christmas', 'Other'],
    eyebrow: 'PERSONALIZED EMOTIONAL DESIGN', title: 'Create a message made just for', titleEm: 'someone you love.', intro: 'Design a card with a personal message, voice note, and memories to keep together.', progress: 'SET UP · PREVIEW · GIVE',
    recipient: 'Recipient', recipientPlaceholder: 'Recipient name', code: 'Gift code', codePlaceholder: '6-digit seller code', occasion: 'Occasion', messageTitle: 'Message title', messageTitlePlaceholder: 'A gentle note for you', message: 'Your message', messagePlaceholder: 'Write what you want to say...', signature: 'Your signature', signaturePlaceholder: 'With love, ...',
    memories: 'Memory moments', memoriesHelp: 'Add up to 3 photos. They will appear after the voice note and music in the card.', chooseImages: 'Choose photos', imageCount: 'photos', voice: 'Voice message', voiceHelp: 'Record directly or upload a short audio file.', recording: 'Recording...', stopRecording: 'Stop recording', addVoice: 'Add a voice message', voiceReady: 'Voice message added', listen: 'Tap to listen', record: 'Record', upload: 'Upload', voiceLimit: 'Up to 50MB · MP3, M4A, WAV, WebM', music: 'Background music', musicHelp: 'Choose a track for the receiver to hear with the gift.', musicNone: 'No background music', musicUnavailable: 'No tracks are available in the library',
    private: 'Your content stays private', save: 'Save gift', saved: 'Gift saved', live: 'LIVE PREVIEW', order: 'Message → voice → music → photos', brandSub: 'LIGHT UP MEMORIES, GENTLE', madeFor: 'Made for', defaultRecipient: 'someone you love', defaultTitle: 'A gentle note for you', defaultMessage: 'Whenever this light comes on, remember that someone is always thinking of you.', defaultSignature: 'With love, ...', galleryTitle: 'MEMORY MOMENTS', emptyGallery: 'Add photos to tell a story through images', fullscreen: 'View full preview', footer: 'A GIFT OF LIGHT · A MEMORY OF LOVE',
    imageError: 'Each image must be smaller than 5MB.',
    loadError: 'Could not load the current gift.', secureError: 'This device or connection does not support secure encryption. Please open the website over HTTPS and try again.', voiceSaveError: 'Could not save the voice message.', saveError: 'Could not save the gift. Please try again.', scanLamp: 'Scan the NFC lamp you want to set up first.', close: 'Close', micError: 'Microphone access is unavailable. You can upload an audio file instead.', audioError: 'Please choose an audio file.', codeError: 'The gift code must contain exactly 6 digits.', noLamp: 'No active lamp was found.'
  }
}

async function hashCode(value, errorMessage) {
  const bytes = new TextEncoder().encode(value.trim())
  if (!globalThis.crypto?.subtle) throw new Error(errorMessage)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

const digitsOnly = value => String(value ?? '').replace(/\D/g, '').slice(0, 6)

const IMAGE_POSITION_STORAGE_KEY = 'allura:gift-image-positions'

function readImagePositions() {
  if (typeof window === 'undefined') return {}
  try {
    const value = JSON.parse(window.localStorage.getItem(IMAGE_POSITION_STORAGE_KEY) || '{}')
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}

function writeImagePositions(value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(IMAGE_POSITION_STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage may be unavailable in private browsing; the live position still works.
  }
}

function MusicDropdown({ tracks, value, onChange, disabled, noneLabel }) {
  const dropdownRef = useRef(null)
  const [open, setOpen] = useState(false)
  const selected = tracks.find(track => String(track.id) === String(value))
  const selectedLabel = selected ? `${selected.title} · ${selected.artist}` : noneLabel

  useEffect(() => {
    const close = event => {
      if (!dropdownRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return <div ref={dropdownRef} className={`music-dropdown${open ? ' is-open' : ''}${disabled ? ' is-disabled' : ''}`}>
    <button type="button" className="music-dropdown-trigger" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}>
      <span>{selectedLabel}</span><ChevronDown size={17}/>
    </button>
    {open && <div className="music-dropdown-menu" role="listbox" aria-label={text.music}>
      <button type="button" role="option" aria-selected={!value} className={!value ? 'selected' : ''} onClick={() => { onChange(''); setOpen(false) }}>{noneLabel}</button>
      {tracks.map(track => <button type="button" role="option" aria-selected={String(track.id) === String(value)} className={String(track.id) === String(value) ? 'selected' : ''} key={track.id} onClick={() => { onChange(track.id); setOpen(false) }}>{track.title} · {track.artist}</button>)}
    </div>}
  </div>
}

export default function GiftStudioGallery({ onNavigate, language = 'vi' }) {
  const text = copy[language === 'en' ? 'en' : 'vi']
  const [gift, setGift] = useState({ receiverName: '', receiverCode: '', occasion: text.occasions[0], title: '', message: '', signature: '', imageUrls: [], musicId: '' })
  const [existingGiftId, setExistingGiftId] = useState('')
  const [existingVoiceFileId, setExistingVoiceFileId] = useState(null)
  const [loadingGift, setLoadingGift] = useState(false)
  const [voiceUrl, setVoiceUrl] = useState('')
  const [voiceFile, setVoiceFile] = useState(null)
  const [musicTracks, setMusicTracks] = useState([])
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [recording, setRecording] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [imageBusy, setImageBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState(false)
  const [imagePositions, setImagePositions] = useState(readImagePositions)
  const recorder = useRef(null)
  const chunks = useRef([])
  const audioRef = useRef(null)
  const musicAudioRef = useRef(null)

  const change = event => setGift(current => ({ ...current, [event.target.name]: event.target.value }))
  const changeReceiverCode = event => setGift(current => ({ ...current, receiverCode: digitsOnly(event.target?.value) }))
  const previewMessage = gift.message || text.defaultMessage
  const currentImage = gift.imageUrls[selectedImage]
  const selectedMusic = musicTracks.find(track => String(track.id) === String(gift.musicId))

  useEffect(() => () => { gift.imageUrls.forEach(url => url.startsWith('blob:') && URL.revokeObjectURL(url)); if (voiceUrl?.startsWith('blob:')) URL.revokeObjectURL(voiceUrl) }, [])
  useEffect(() => {
    let active = true
    fetch('/api/music', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('music_load_failed')))
      .then(data => { if (active) setMusicTracks(Array.isArray(data.tracks) ? data.tracks : []) })
      .catch(() => { if (active) setMusicTracks([]) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    const lampId = typeof window !== 'undefined' ? window.sessionStorage.getItem('allura:setup-lamp-id') : ''
    if (!lampId || !supabase) return undefined
    let active = true
    async function loadExistingGift() {
      setLoadingGift(true)
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        if (!accessToken) return
        const response = await fetch(`/api/gifts/${encodeURIComponent(lampId)}`, { headers: { Authorization: `Bearer ${accessToken}` } })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || text.loadError)
        if (!active || !data.gift) return
        const saved = data.gift
        const imageUrls = Array.isArray(saved.imageUrls) ? saved.imageUrls.filter(Boolean) : saved.imageUrl ? [saved.imageUrl] : []
        setExistingGiftId(saved.id || '')
        setExistingVoiceFileId(saved.voiceFileId || null)
        setVoiceUrl(saved.voiceUrl || '')
        setSelectedImage(0)
        setGift(current => ({
          ...current,
          receiverName: saved.receiverName || '',
          occasion: saved.occasion || current.occasion,
          title: saved.title || '',
          message: saved.message || '',
          signature: saved.signature || '',
          imageUrls,
          musicId: saved.musicId || '',
        }))
        setImagePositions(current => {
          const next = { ...current, ...(saved.imagePositions || {}) }
          writeImagePositions(next)
          return next
        })
      } catch (eventError) {
        if (active) setError(eventError.message || text.loadError)
      } finally {
        if (active) setLoadingGift(false)
      }
    }
    loadExistingGift()
    return () => { active = false }
  }, [])
  useEffect(() => {
    setMusicPlaying(false)
    if (musicAudioRef.current) {
      musicAudioRef.current.pause()
      musicAudioRef.current.currentTime = 0
    }
  }, [gift.musicId])
  useEffect(() => {
    const handleImagePositionChange = event => {
      const { src, x, y } = event.detail || {}
      if (!src) return
      setImagePositions(current => {
        const nextX = Number.isFinite(Number(x)) ? Number(x) : 50
        const nextY = Number.isFinite(Number(y)) ? Number(y) : 50
        const next = {
          ...current,
          [src]: {
            x: Math.max(0, Math.min(100, nextX)),
            y: Math.max(0, Math.min(100, nextY))
          }
        }
        writeImagePositions(next)
        return next
      })
    }
    document.addEventListener('allura:image-position-change', handleImagePositionChange)
    return () => document.removeEventListener('allura:image-position-change', handleImagePositionChange)
  }, [])
  useEffect(() => {
    const image = document.querySelector('.gallery-device-preview .gift-preview-cover > img')
    if (!image || !currentImage) return
    const position = imagePositions[currentImage] || { x: 50, y: 50 }
    image.dataset.positionX = position.x
    image.dataset.positionY = position.y
    image.style.objectPosition = `${position.x}% ${position.y}%`
  }, [currentImage, imagePositions])
  useEffect(() => {
    const closeThumbnailLightbox = event => {
      if (event.target.closest?.('.gift-preview-gallery button')) setLightbox(false)
    }
    document.addEventListener('click', closeThumbnailLightbox)
    return () => document.removeEventListener('click', closeThumbnailLightbox)
  }, [])

  async function uploadImages(event) {
    const files = [...(event.target.files || [])].filter(file => file.type.startsWith('image/')).slice(0, 3)
    if (!files.length) return
    if (files.some(file => file.size > 5 * 1024 * 1024)) return setError(text.imageError)
    setError(''); setImageBusy(true)
    const localUrls = files.map(file => URL.createObjectURL(file))
    setGift(current => ({ ...current, imageUrls: [...current.imageUrls, ...localUrls].slice(0, 3) }))
    const user = await currentUser()
    if (user && supabase) {
      const uploaded = []
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index]
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`
        const result = await supabase.storage.from('allura-gift-images').upload(path, file, { contentType: file.type, upsert: false })
        if (!result.error) uploaded.push({ localUrl: localUrls[index], remoteUrl: supabase.storage.from('allura-gift-images').getPublicUrl(path).data.publicUrl })
      }
      if (uploaded.length) {
        setImagePositions(current => {
          const next = { ...current }
          uploaded.forEach(({ localUrl, remoteUrl }) => {
            if (current[localUrl]) next[remoteUrl] = current[localUrl]
          })
          writeImagePositions(next)
          return next
        })
        const uploadedUrls = uploaded.map(({ remoteUrl }) => remoteUrl)
        setGift(current => ({ ...current, imageUrls: [...current.imageUrls.filter(url => !url.startsWith('blob:')), ...uploadedUrls].slice(0, 3) }))
      }
    }
    setImageBusy(false); event.target.value = ''
  }

  async function startRecord() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const media = new MediaRecorder(stream); chunks.current = []
      media.ondataavailable = event => event.data.size && chunks.current.push(event.data)
      media.onstop = () => { stream.getTracks().forEach(track => track.stop()); const blob = new Blob(chunks.current, { type: 'audio/webm' }); setVoiceFile(blob); setVoiceUrl(URL.createObjectURL(blob)) }
      media.start(); recorder.current = media; setRecording(true)
    } catch { setError(text.micError) }
  }

  function stopRecord() { recorder.current?.stop(); setRecording(false) }
  function uploadVoice(event) { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith('audio/')) return setError(text.audioError); setVoiceFile(file); setVoiceUrl(URL.createObjectURL(file)); setError('') }
  function toggleVoice() { const audio = audioRef.current; if (!audio) return; if (audio.paused) { musicAudioRef.current?.pause(); setMusicPlaying(false); audio.play().then(() => setPlaying(true)).catch(() => {}) } else { audio.pause(); setPlaying(false) } }
  function toggleMusic() { const audio = musicAudioRef.current; if (!audio) return; if (audio.paused) { audioRef.current?.pause(); setPlaying(false); audio.play().then(() => setMusicPlaying(true)).catch(() => {}) } else { audio.pause(); setMusicPlaying(false) } }

  async function save(event) {
    event.preventDefault(); setError(''); setSaved(false)
    try {
      const receiverCode = digitsOnly(gift.receiverCode)
      if ((!existingGiftId || receiverCode) && !/^\d{6}$/.test(receiverCode)) return setError(text.codeError)
      const user = await currentUser(); if (!user || !supabase) return onNavigate('/dang-nhap')
      const setupLampId = typeof window !== 'undefined' ? window.sessionStorage.getItem('allura:setup-lamp-id') : ''
      let lampQuery = supabase.from('lamps').select('id').eq('owner_id', user.id).in('status', ['inactive', 'active'])
      if (setupLampId) lampQuery = lampQuery.eq('id', setupLampId)
      const { data: lamps } = await lampQuery.limit(setupLampId ? 1 : 2)
      if (!lamps?.length) return setError(text.noLamp)
      if (!setupLampId && lamps.length > 1) return setError(text.scanLamp)
      const lampId = lamps[0].id
      let voiceFileId = existingVoiceFileId
      if (voiceFile) {
        const path = `${user.id}/${crypto.randomUUID()}.webm`
        const upload = await supabase.storage.from('allura-voice').upload(path, voiceFile, { contentType: voiceFile.type || 'audio/webm', upsert: false })
        if (upload.error) return setError(upload.error.message)
        const row = await supabase.from('voice_files').insert({ owner_id: user.id, storage_key: path, file_name: 'gift-voice.webm', mime_type: voiceFile.type || 'audio/webm', file_size: voiceFile.size }).select('id').single()
        if (row.error || !row.data?.id) {
          await supabase.storage.from('allura-voice').remove([path])
          return setError(row.error?.message || text.voiceSaveError)
        }
        voiceFileId = row.data.id
      }
      const savedImagePositions = Object.fromEntries(gift.imageUrls.map(url => [url, imagePositions[url] || { x: 50, y: 50 }]))
      const payload = { lamp_id: lampId, receiver_name: gift.receiverName, receiver_email: null, occasion: gift.occasion, title: gift.title, message: gift.message, signature: gift.signature, image_url: gift.imageUrls[0] || null, image_urls: gift.imageUrls, image_positions: savedImagePositions, voice_file_id: voiceFileId || null, music_id: gift.musicId || null, status: 'ready' }
      if (receiverCode) payload.receiver_code_hash = await hashCode(receiverCode, text.secureError)
      const persistGift = values => existingGiftId
        ? supabase.from('gift_contents').update(values).eq('id', existingGiftId)
        : supabase.from('gift_contents').upsert(values, { onConflict: 'lamp_id' })
      let result = await persistGift(payload)
      if (result.error && /image_positions|schema cache/i.test(result.error.message || '')) {
        const { image_positions: _imagePositions, ...legacyPayload } = payload
        result = await persistGift(legacyPayload)
      }
      if (result.error && /music_id|schema cache/i.test(result.error.message || '')) {
        if (gift.musicId) return setError(language === 'en' ? 'Run migration 017_gift_music.sql before saving background music.' : 'Hãy chạy migration 017_gift_music.sql trước khi lưu nhạc nền.')
        const { music_id: _musicId, ...legacyPayload } = payload
        result = await persistGift(legacyPayload)
      }
      if (result.error) {
        setError(result.error.message)
      } else {
        const activation = await supabase.from('lamps').update({ status: 'active', activated_at: new Date().toISOString() }).eq('id', lampId).eq('owner_id', user.id)
        if (activation.error) setError(activation.error.message)
        else setSaved(true)
      }
    } catch (eventError) {
      setError(eventError?.message || text.saveError)
    }
  }

  return <section className="studio-page gallery-studio-page">
    <div className="studio-heading container">
      <div><div className="eyebrow"><Sparkles size={15} /> {text.eyebrow}</div><h1>{text.title}<br /><em>{text.titleEm}</em></h1><p>{text.intro}</p></div>
      <div className="studio-progress"><span className="active">1</span><i /><span>2</span><i /><span>3</span><small>{text.progress}</small></div>
    </div>
    <div className="studio-layout container">
      <form className="studio-form" onSubmit={save}><div className="studio-block">
        <div className="studio-label"><b>1.</b> {text.recipient} <UserRound size={16} /></div><input name="receiverName" value={gift.receiverName} onChange={change} placeholder={text.recipientPlaceholder} required />
        <div className="studio-label"><b>2.</b> {text.code} <LockKeyhole size={16} /></div><input type="tel" name="receiverCode" value={gift.receiverCode} onChange={changeReceiverCode} inputMode="numeric" autoComplete="one-time-code" maxLength="6" placeholder={existingGiftId ? (language === 'en' ? 'Leave blank to keep current code' : 'Để trống để giữ mã hiện tại') : text.codePlaceholder} required={!existingGiftId} />
        <div className="studio-label"><b>3.</b> {text.occasion} <Sparkles size={16} /></div><div className="occasion-pills">{text.occasions.map(item => <button type="button" className={gift.occasion === item ? 'selected' : ''} key={item} onClick={() => setGift({ ...gift, occasion: item })}>{item}</button>)}</div>
        <div className="studio-label"><b>4.</b> {text.messageTitle}</div><input name="title" value={gift.title} onChange={change} placeholder={text.messageTitlePlaceholder} required />
        <div className="studio-label"><b>5.</b> {text.message} <span>{gift.message.length}/500</span></div><textarea name="message" maxLength="500" value={gift.message} onChange={change} rows="6" placeholder={text.messagePlaceholder} required />
        <div className="studio-label"><b>6.</b> {text.signature}</div><input name="signature" value={gift.signature} onChange={change} placeholder={text.signaturePlaceholder} />
        <div className="gallery-upload"><div className="studio-label"><b>7.</b> {text.memories} <ImagePlus size={16} /></div><p>{text.memoriesHelp}</p><div className="gallery-upload-actions"><label className="outline upload-label"><UploadCloud size={15} /> {imageBusy ? (language === 'en' ? 'Uploading...' : 'Đang tải...') : text.chooseImages}<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadImages} disabled={imageBusy} /></label><small>{gift.imageUrls.length}/3 {text.imageCount}</small></div><div className="gallery-upload-thumbs">{gift.imageUrls.map((url, index) => <button type="button" key={url} className={index === selectedImage ? 'selected' : ''} onClick={() => setSelectedImage(index)}><img src={url} alt={`${text.memories} ${index + 1}`} /><span onClick={event => { event.stopPropagation(); setGift(current => ({ ...current, imageUrls: current.imageUrls.filter((_, itemIndex) => itemIndex !== index) })); setSelectedImage(Math.max(0, Math.min(index, gift.imageUrls.length - 2))) }}>×</span></button>)}</div></div>        <div className="voice-studio"><div className="voice-studio-heading"><div className="studio-label"><b>8.</b> {text.voice} <Volume2 size={16} /></div><p>{text.voiceHelp}</p></div><div className="record-row"><div className="record-orb">{recording ? <Pause size={18} /> : <Mic size={18} />}</div><div><b>{recording ? text.recording : voiceUrl ? text.voiceReady : text.addVoice}</b><small>{recording ? text.stopRecording : text.voiceLimit}</small></div><div className="voice-recorder-actions">{recording ? <button type="button" className="outline" onClick={stopRecord}>{text.stopRecording}</button> : <><button type="button" className="outline" onClick={startRecord}><Mic size={14} /> {text.record}</button><label className="outline upload-label"><UploadCloud size={14} /> {text.upload}<input type="file" accept="audio/*" onChange={uploadVoice} /></label></>}</div></div>{voiceUrl && <audio ref={audioRef} controls src={voiceUrl} style={{ width: '100%', marginTop: 12 }} onEnded={() => setPlaying(false)} />}</div>
        <div className="music-select-studio"><div className="voice-studio-heading"><div className="studio-label"><b>9.</b> {text.music} <Music2 size={16} /></div><p>{text.musicHelp}</p></div><MusicDropdown tracks={musicTracks} value={gift.musicId || ''} onChange={value => setGift(current => ({ ...current, musicId: value }))} disabled={!musicTracks.length} noneLabel={musicTracks.length ? text.musicNone : text.musicUnavailable} />{selectedMusic?.audio && <audio ref={musicAudioRef} controls src={selectedMusic.audio} style={{ width: '100%', marginTop: 12 }} onEnded={() => setMusicPlaying(false)} />}</div>
      </div>{error && <div className="error">{error}</div>}<div className="studio-actions"><span><LockKeyhole size={14} /> {text.private}</span><button className="primary" disabled={imageBusy || loadingGift}>{saved ? text.saved : existingGiftId ? (language === 'en' ? 'Save changes' : 'Lưu thay đổi') : text.save} <ArrowRight size={17} /></button></div></form>
      <aside className="device-preview gallery-device-preview"><div className="preview-heading"><div><i className="live-dot" /> {text.live}</div><small>{text.order}</small></div><GiftPreviewCard gift={gift} language={language} voiceUrl={voiceUrl} playing={playing} onToggleVoice={toggleVoice} musicUrl={selectedMusic?.audio || ''} musicTitle={selectedMusic?.title} musicArtist={selectedMusic?.artist} musicPlaying={musicPlaying} onToggleMusic={toggleMusic} selectedImage={selectedImage} onSelectImage={setSelectedImage} onOpenImage={() => setLightbox(true)} imagePositions={imagePositions} /><button type="button" className="preview-full"><Sparkles className="preview-full-open-icon" size={13} /><X className="preview-full-close-icon" size={18} aria-hidden="true" /> <span>{text.fullscreen}</span></button></aside>
    </div>{lightbox && currentImage && <div className="gift-lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(false)}><button type="button" onClick={() => setLightbox(false)} aria-label={text.close}><X size={20} /></button><img src={currentImage} alt={`${text.memories} enlarged`} onClick={event => event.stopPropagation()} /></div>}
  </section>
}
