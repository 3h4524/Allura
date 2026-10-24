import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, ChevronLeft, ChevronRight, Heart, Leaf, ListMusic, Moon, Music2, Pause, Play, Search, Sparkles, Target, Waves } from 'lucide-react'
import { useLanguage } from './language.jsx'
import MusicPlayer from './music-player.jsx'
import './music-page.css'

const icons = { relax: <Waves size={20}/>, sleep: <Moon size={20}/>, focus: <Target size={20}/>, meditation: <Brain size={20}/>, romantic: <Heart size={20}/>, nature: <Leaf size={20}/> }

const copy = {
  vi: {
    eyebrow: 'ALLURA MUSIC · A MOMENT TO BREATHE', title: <>Một khoảng lặng<br/><em>dành riêng cho bạn.</em></>, intro: 'Chọn một mood, đặt chiếc đèn cạnh mình và để âm thanh dẫn bạn về với khoảnh khắc hiện tại.', lamp: 'ĐÈN ALLURA', ready: 'Đang sẵn sàng', all: 'Tất cả', allDescription: 'Khám phá toàn bộ thư viện', selected: 'ĐANG CHỌN', explore: 'KHÁM PHÁ', library: 'Tất cả bản nhạc', tracks: 'bản nhạc', emptyTitle: 'Thư viện đang được chuẩn bị.', emptyText: 'Admin có thể thêm nhạc vào Supabase để bài hát xuất hiện tại đây.', listenTitle: 'Nghe cùng chiếc đèn.', listenText: 'Bạn có thể chọn một bản nhạc để seller thiết lập sẵn trong món quà NFC.', space: 'KHÔNG GIAN CỦA BẠN', sync: 'Đồng bộ với chiếc đèn', ambient: 'Ánh sáng dịu dàng', syncMood: 'Đồng bộ mood', syncMoodText: 'Ánh sáng thay đổi theo nhạc', timer: 'Hẹn giờ tắt', timerText: 'Tự động tắt sau khi bạn thư giãn', brightness: 'Độ sáng', saved: 'Nhạc sẽ được lưu cho trải nghiệm của bạn', guide: 'Xem hướng dẫn', moods: { relax: ['Thư giãn', 'Nhẹ nhàng để thả lỏng'], sleep: ['Ngủ', 'Âm thanh cho giấc ngủ sâu'], focus: ['Tập trung', 'Tập trung vào điều quan trọng'], meditation: ['Thiền', 'Một khoảng lặng cho tâm trí'], romantic: ['Lãng mạn', 'Dịu dàng cho hai người'], nature: ['Thiên nhiên', 'Thanh âm từ thiên nhiên'] }, brightnessValue: '70%', minutes: '30 phút', ariaPlay: 'Phát nhạc', ariaLike: 'Yêu thích', syncFooter: 'Nhạc sẽ được lưu cho trải nghiệm của bạn',
  },
  en: {
    eyebrow: 'ALLURA MUSIC · A MOMENT TO BREATHE', title: <>A quiet moment<br/><em>made for you.</em></>, intro: 'Choose a mood, place the lamp beside you, and let the sound bring you back to the present.', lamp: 'ALLURA LAMP', ready: 'Ready to glow', all: 'All music', allDescription: 'Explore the complete library', selected: 'SELECTED', explore: 'EXPLORE', library: 'All music', tracks: 'tracks', emptyTitle: 'The library is being prepared.', emptyText: 'An admin can add music in Supabase for tracks to appear here.', listenTitle: 'Listen with the lamp.', listenText: 'Choose a track for the seller to prepare inside your NFC gift.', space: 'YOUR SPACE', sync: 'Sync with your lamp', ambient: 'Gentle ambient light', syncMood: 'Sync mood', syncMoodText: 'Let the light follow the music', timer: 'Sleep timer', timerText: 'Turn off after you unwind', brightness: 'Brightness', saved: 'Your music will be saved to the experience', guide: 'View guide', moods: { relax: ['Relax', 'Gentle sounds to help you unwind'], sleep: ['Sleep', 'Sounds for deeper rest'], focus: ['Focus', 'A calm space for what matters'], meditation: ['Meditation', 'A quiet moment for your mind'], romantic: ['Romantic', 'Soft sounds for two'], nature: ['Nature', 'Natural sounds for a calmer space'] }, brightnessValue: '70%', minutes: '30 minutes', ariaPlay: 'Play track', ariaLike: 'Like track', syncFooter: 'Your music will be saved to the experience',
  },
}

export default function LocalizedMusicPage({ onNavigate }) {
  const { language } = useLanguage()
  const english = language === 'en'
  const text = copy[english ? 'en' : 'vi']
  const [tracks, setTracks] = useState([])
  const [moods, setMoods] = useState([])
  const [mood, setMood] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [current, setCurrent] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(70)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [repeat, setRepeat] = useState(false)
  const audio = useRef(null)

  useEffect(() => {
    let active = true
    fetch('/api/music', { cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error(`Music API returned ${response.status}`); return response.json() })
      .then(data => { if (!active) return; setTracks(Array.isArray(data.tracks) ? data.tracks : []); setMoods(Array.isArray(data.moods) ? data.moods : []) })
      .catch(() => { if (active) { setTracks([]); setMoods([]) } })
    return () => { active = false }
  }, [])

  const pageSize = 10
  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase()
    return tracks.filter(track => {
      const matchesMood = mood === 'all' || (track.mood || track.mood_id) === mood
      const matchesSearch = !normalizedSearch || `${track.title || ''} ${track.artist || ''}`.toLocaleLowerCase().includes(normalizedSearch)
      return matchesMood && matchesSearch
    })
  }, [mood, search, tracks])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visibleTracks = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page])
  const activeMood = moods.find(item => item.id === mood)
  const activeMoodCopy = text.moods[String(activeMood?.name || '').trim().toLowerCase()]
  useEffect(() => { setPage(1) }, [mood, search])
  useEffect(() => { setPage(value => Math.min(value, pageCount)) }, [pageCount])

  useEffect(() => {
    if (!current?.audio && !current?.audio_path) { setPlaying(false); return undefined }
    if (!audio.current) audio.current = new Audio()
    const player = audio.current
    player.src = current.audio || current.audio_path
    player.loop = repeat
    player.volume = volume / 100
    setCurrentTime(0)
    setDuration(0)
    const onLoadedMetadata = () => setDuration(Number.isFinite(player.duration) ? player.duration : 0)
    const onTimeUpdate = () => setCurrentTime(player.currentTime || 0)
    const onEnded = () => { if (!player.loop) setPlaying(false) }
    player.addEventListener('loadedmetadata', onLoadedMetadata)
    player.addEventListener('timeupdate', onTimeUpdate)
    player.addEventListener('ended', onEnded)
    player.load()
    if (playing) player.play().catch(() => setPlaying(false))
    return () => { player.pause(); player.removeEventListener('loadedmetadata', onLoadedMetadata); player.removeEventListener('timeupdate', onTimeUpdate); player.removeEventListener('ended', onEnded) }
  }, [current])

  useEffect(() => { if (audio.current) audio.current.loop = repeat }, [repeat])
  useEffect(() => { if (audio.current) audio.current.volume = volume / 100 }, [volume])
  useEffect(() => { if (!audio.current) return; if (playing) audio.current.play().catch(() => setPlaying(false)); else audio.current.pause() }, [playing])

  const choose = track => { if (current?.id === track.id) return setPlaying(value => !value); setCurrent(track); setPlaying(true) }
  const changeTrack = direction => { if (!filtered.length) return; const index = filtered.findIndex(track => track.id === current?.id); const nextIndex = (index + direction + filtered.length) % filtered.length; setCurrent(filtered[nextIndex]); setPlaying(true) }
  const moodCards = [{ id: 'all', name: text.all, description: text.allDescription, icon: <ListMusic size={20}/> }, ...moods.map(item => { const moodKey = String(item.name || '').trim().toLowerCase(); const translated = text.moods[moodKey] || [item.name, item.description || '']; return { ...item, moodKey, name: translated[0], description: translated[1] } })]

  return <section className="music-sanctuary"><div className="music-ambient"/><div className="music-shell"><header className="music-titlebar"><div><div className="music-eyebrow"><Music2 size={14}/> {text.eyebrow}</div><h1>{text.title}</h1><p>{text.intro}</p></div><div className="lamp-status"><i/><span>{text.lamp}</span><b>·</b><strong>{text.ready}</strong></div></header><div className="mood-grid">{moodCards.map(item => <button key={item.id} className={`mood-card-new ${mood === item.id ? 'active' : ''}`} onClick={() => setMood(item.id)}><div className="mood-card-top"><span className="mood-icon">{item.id === 'all' ? item.icon : icons[item.moodKey] || <Sparkles size={20}/>}</span><small>{mood === item.id ? text.selected : text.explore}</small></div><h3>{item.name}</h3><p>{item.description}</p></button>)}</div><div className="music-content"><div><div className="playlist-heading"><h2><ListMusic size={19}/> {activeMoodCopy?.[0] || activeMood?.name || (mood === 'all' ? text.library : text.moods[mood]?.[0] || 'Music')}</h2><span>{filtered.length} {text.tracks}</span></div><div className="playlist-toolbar"><label className="playlist-search"><Search size={15}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder={english ? 'Search a track or artist' : 'Tìm tên bài hát hoặc nghệ sĩ'} aria-label={english ? 'Search a track or artist' : 'Tìm tên bài hát hoặc nghệ sĩ'}/></label><span>{filtered.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} / ${filtered.length}` : '0 / 0'}</span></div><div className="playlist-scroll"><div className="playlist">{visibleTracks.map((track, index) => <article className={`playlist-row-new ${current?.id === track.id ? 'now-playing' : ''}`} key={track.id || index}><button className="song-play" onClick={() => choose(track)} aria-label={text.ariaPlay}>{current?.id === track.id && playing ? <Pause size={16}/> : <Play size={16} fill="currentColor"/>}</button><div className="song-copy"><b>{track.title}{current?.id === track.id && playing && <span className="equalizer"><i/><i/><i/></span>}</b><small>{track.artist}</small></div><button className="like-song" aria-label={text.ariaLike}><Heart size={18}/></button><time>{track.duration || '—'}</time></article>)}</div></div>{pageCount > 1 && <nav className="playlist-pagination" aria-label="Music pagination"><button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1}><ChevronLeft size={15}/> {english ? 'Previous' : 'Trước'}</button><span>{english ? 'Page' : 'Trang'} {page} / {pageCount}</span><button type="button" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={page === pageCount}>{english ? 'Next' : 'Sau'} <ChevronRight size={15}/></button></nav>}{!filtered.length && <div className="nfc-tip"><span>✦</span><p><b>{text.emptyTitle}</b><br/>{text.emptyText}</p></div>}<div className="nfc-tip"><span>♢</span><p><b>{text.listenTitle}</b><br/>{text.listenText}</p></div></div><aside className="sync-panel"><div className="sync-heading"><div><small>{text.space}</small><h2>{text.sync}</h2></div><span><Sparkles size={16}/></span></div><div className="lamp-scene"><img src="https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=82" alt={text.ambient}/><div><div><small>ALLURA AMBIENT</small><strong>{text.ambient}</strong></div><em>NFC READY</em></div></div><div className="sync-control"><div className="control-line"><span><Sparkles size={18}/><b>{text.syncMood}</b><small>{text.syncMoodText}</small></span><i className="toggle on"><i/></i></div><div className="control-line"><span><Moon size={18}/><b>{text.timer}</b><small>{text.timerText}</small></span><span className="timer">{text.minutes}</span></div><label className="range-line"><span>{text.brightness} <b>{text.brightnessValue}</b></span><input type="range" min="0" max="100" defaultValue="70"/></label></div><div className="sync-footer"><span>{text.syncFooter}</span><button type="button" onClick={() => onNavigate?.('/huong-dan')}>{text.guide}</button></div></aside></div></div>{current && <MusicPlayer current={current} tracks={filtered} playing={playing} setPlaying={setPlaying} volume={volume} setVolume={setVolume} currentTime={currentTime} duration={duration} repeat={repeat} setRepeat={setRepeat} english={english} onSeek={value => { if (audio.current) { audio.current.currentTime = value; setCurrentTime(value) } }} onPrevious={() => changeTrack(-1)} onNext={() => changeTrack(1)} />}</section>
}
