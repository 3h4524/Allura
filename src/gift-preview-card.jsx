import React from 'react'
import { ChevronLeft, ChevronRight, ImagePlus, Music2, Pause, Play, Repeat2, Volume2 } from 'lucide-react'

const text = {
  vi: {
    brandSub: 'LIGHT UP MEMORIES, GENTLE',
    madeFor: 'Dành riêng cho',
    defaultRecipient: 'người bạn yêu thương',
    defaultTitle: 'Một điều dịu dàng dành cho bạn',
    defaultMessage: 'Mỗi khi ánh đèn này sáng lên, mong bạn nhớ rằng luôn có một người đang nghĩ về bạn.',
    defaultSignature: 'Thương, ...',
    voice: 'Lời nhắn bằng giọng nói',
    listen: 'Nhấn để lắng nghe',
    music: 'Nhạc nền',
    musicListen: 'Nhấn để nghe nhạc',
    musicLibrary: 'Chọn nhạc từ hệ thống',
    closeMusicLibrary: 'Đóng thư viện nhạc',
    openMusicPage: 'Mở trang nhạc đầy đủ',
    musicLoading: 'Đang tải thư viện nhạc...',
    musicEmpty: 'Chưa có bài nhạc nào',
    previousTrack: 'Bài trước',
    nextTrack: 'Bài tiếp theo',
    repeatTrack: 'Lặp lại bài hát',
    galleryTitle: 'NHỮNG KHOẢNH KHẮC ĐÁNG NHỚ',
    emptyGallery: 'Chưa có ảnh kỷ niệm',
    previous: 'Ảnh trước',
    next: 'Ảnh tiếp theo',
  },
  en: {
    brandSub: 'LIGHT UP MEMORIES, GENTLE',
    madeFor: 'Made for',
    defaultRecipient: 'someone you love',
    defaultTitle: 'A gentle note for you',
    defaultMessage: 'Whenever this light comes on, remember that someone is always thinking of you.',
    defaultSignature: 'With love, ...',
    voice: 'Voice message',
    listen: 'Tap to listen',
    music: 'Background music',
    musicListen: 'Tap to listen',
    musicLibrary: 'Choose from Allura music',
    closeMusicLibrary: 'Close music library',
    openMusicPage: 'Open full music page',
    musicLoading: 'Loading music library...',
    musicEmpty: 'No music tracks yet',
    previousTrack: 'Previous track',
    nextTrack: 'Next track',
    repeatTrack: 'Repeat track',
    galleryTitle: 'MEMORY MOMENTS',
    emptyGallery: 'No memory photos yet',
    previous: 'Previous image',
    next: 'Next image',
  },
}

function imageList(gift) {
  if (Array.isArray(gift?.imageUrls) && gift.imageUrls.length) return gift.imageUrls
  if (Array.isArray(gift?.image_urls) && gift.image_urls.length) return gift.image_urls
  return gift?.imageUrl ? [gift.imageUrl] : []
}

function positionFor(gift, imagePositions, url) {
  return imagePositions?.[url] || gift?.imagePositions?.[url] || gift?.image_positions?.[url] || { x: 50, y: 50 }
}

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return '00:00'
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(Math.floor(value % 60)).padStart(2, '0')}`
}

export default function GiftPreviewCard({
  gift = {},
  language = 'vi',
  voiceUrl = '',
  playing = false,
  onToggleVoice,
  musicUrl = '',
  musicTitle = '',
  musicArtist = '',
  musicPlaying = false,
  onToggleMusic,
  musicTracks = [],
  musicLoading = false,
  musicPickerOpen = false,
  onToggleMusicPicker,
  onChooseMusic,
  musicControls = false,
  musicCurrentTime = 0,
  musicDuration = 0,
  musicRepeat = false,
  onSeekMusic,
  onPreviousMusic,
  onNextMusic,
  onToggleMusicRepeat,
  selectedImage = 0,
  onSelectImage,
  onOpenImage,
  imagePositions = {},
}) {
  const copy = text[language === 'en' ? 'en' : 'vi']
  const images = imageList(gift)
  const activeIndex = images.length ? Math.min(Math.max(0, selectedImage), images.length - 1) : 0
  const currentImage = images[activeIndex]
  const position = positionFor(gift, imagePositions, currentImage)
  const previewMessage = gift.message || copy.defaultMessage
  const moveImage = direction => {
    if (!images.length || !onSelectImage) return
    onSelectImage((activeIndex + direction + images.length) % images.length)
  }

  return (
    <div className="gift-preview-canvas">
      <div className="gift-preview-top">
        <button type="button" aria-label="Back">‹</button>
        <span>ALLURA<small>{copy.brandSub}</small></span>
        <button type="button" aria-label="More">•••</button>
      </div>
      <div className="gift-preview-cover">
        {currentImage
          ? <img
              src={currentImage}
              alt={copy.galleryTitle + ' cover'}
              style={{ objectPosition: position.x + '%' + ' ' + position.y + '%' }}
              onClick={() => onOpenImage?.(currentImage)}
            />
          : <div className="preview-lamp"><div /></div>}
        <button type="button" className="gallery-nav prev" onClick={() => moveImage(-1)} disabled={!images.length} aria-label={copy.previous}><ChevronLeft size={16} /></button>
        <button type="button" className="gallery-nav next" onClick={() => moveImage(1)} disabled={!images.length} aria-label={copy.next}><ChevronRight size={16} /></button>
      </div>
      <div className="gift-preview-occasion">{gift.occasion || 'KỶ NIỆM'}</div>
      <h2>{gift.title || copy.defaultTitle}</h2>
      <div className="gift-preview-to">{copy.madeFor} {gift.receiverName || copy.defaultRecipient}</div>
      <blockquote>“{previewMessage}”</blockquote>
      <div className="gift-preview-signature">{gift.signature || copy.defaultSignature}</div>
      {voiceUrl && <button type="button" className={'gift-preview-voice ' + (playing ? 'is-playing' : '')} onClick={onToggleVoice}>
        <span className="voice-play">{playing ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}</span>
        <span><b>{copy.voice}</b><small>{copy.listen}</small></span>
        <Volume2 size={15} />
      </button>}
      {musicUrl && <button type="button" className={'gift-preview-music ' + (musicPlaying ? 'is-playing' : '')} onClick={onToggleMusic}>
        <span className="music-play">{musicPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}</span>
        <span><b>{musicTitle || copy.music}</b><small>{musicArtist || copy.musicListen}</small></span>
        <Music2 size={15} />
      </button>}
      {musicUrl && musicControls && <div className="gift-preview-music-controls">
        <div className="music-control-buttons">
          <button type="button" onClick={onPreviousMusic} disabled={!musicTracks.length} aria-label={copy.previousTrack}><ChevronLeft size={13} /></button>
          <button type="button" className={musicRepeat ? 'active' : ''} onClick={onToggleMusicRepeat} aria-label={copy.repeatTrack} title={copy.repeatTrack}><Repeat2 size={13} /></button>
          <button type="button" onClick={onNextMusic} disabled={!musicTracks.length} aria-label={copy.nextTrack}><ChevronRight size={13} /></button>
        </div>
        <div className="music-seek-row"><span>{formatTime(musicCurrentTime)}</span><input type="range" min="0" max={musicDuration || 1} step="0.1" value={Math.min(musicCurrentTime, musicDuration || 0)} onChange={event => onSeekMusic?.(Number(event.target.value))} aria-label="Tua nhạc" disabled={!musicDuration} /><span>{formatTime(musicDuration)}</span></div>
      </div>}
      {onToggleMusicPicker && <>
        <button type="button" className="gift-preview-music-library-toggle" onClick={onToggleMusicPicker}><Music2 size={13} /> {musicPickerOpen ? copy.closeMusicLibrary : copy.musicLibrary}</button>
        {musicPickerOpen && <div className="gift-preview-music-library">
          {musicLoading
            ? <small>{copy.musicLoading}</small>
            : musicTracks.length
              ? musicTracks.map(track => <button type="button" key={track.id} className="gift-preview-music-option" onClick={() => onChooseMusic?.(track)} disabled={!track.audio}>
                  <span className="music-option-play"><Play size={11} fill="currentColor" /></span>
                  <span><b>{track.title}</b><small>{track.artist}</small></span>
                  <small>{track.duration || '—'}</small>
                </button>)
              : <small>{copy.musicEmpty}</small>}
          <a href="/nhac-thu-gian" target="_blank" rel="noreferrer" className="gift-preview-music-page"><Music2 size={12} /> {copy.openMusicPage}</a>
        </div>}
      </>}
      <div className="gift-preview-gallery-heading"><ImagePlus size={12} /> {copy.galleryTitle}</div>
      <div className="gift-preview-gallery">
        {images.length
          ? images.map((url, index) => <button type="button" key={url} className={index === activeIndex ? 'selected' : ''} onClick={() => onSelectImage?.(index)}>
              <img src={url} alt={copy.galleryTitle + ' ' + (index + 1)} style={{ objectPosition: positionFor(gift, imagePositions, url).x + '%' + ' ' + positionFor(gift, imagePositions, url).y + '%' }} />
            </button>)
          : <div className="empty-gallery">{copy.emptyGallery}</div>}
      </div>
      <div className="gift-preview-dots">{images.map((_, index) => <i key={index} className={index === activeIndex ? 'active' : ''} />)}</div>
      <div className="gift-preview-footer">A GIFT OF LIGHT · A MEMORY OF LOVE</div>
    </div>
  )
}
