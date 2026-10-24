import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Heart, ListMusic, Moon, Pause, Play, Sparkles, SunMedium, Waves, Wind } from 'lucide-react'
import MusicPlayer from './music-player.jsx'
import './music-page.css'

const icons = { relax: <Waves size={20}/>, sleep: <Moon size={20}/>, focus: <SunMedium size={20}/>, meditation: <Wind size={20}/>, romantic: <Heart size={20}/>, nature: <Waves size={20}/> }
const descriptions = { relax: 'Nhẹ nhàng để thả lỏng', sleep: 'Âm thanh cho giấc ngủ sâu', focus: 'Tập trung vào điều quan trọng', meditation: 'Một khoảng lặng cho tâm trí', romantic: 'Dịu dàng cho hai người', nature: 'Thanh âm từ thiên nhiên' }

export default function MusicPage() {
  const [tracks, setTracks] = useState([])
  const [moods, setMoods] = useState([])
  const [mood, setMood] = useState('all')
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

  const filtered = useMemo(() => mood === 'all' ? tracks : tracks.filter(track => (track.mood || track.mood_id) === mood), [mood, tracks])
  const activeMood = moods.find(item => item.id === mood)
  const currentMood = moods.find(item => item.id === current?.mood_id)

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
  const moodCards = [{ id: 'all', name: 'Tất cả', icon: <ListMusic size={20}/>, description: 'Khám phá toàn bộ thư viện' }, ...moods.map(item => ({ ...item, description: descriptions[String(item.name || '').toLowerCase()] || item.description || 'Một không gian âm thanh riêng' }))]

  return <section className="music-sanctuary"><div className="music-ambient"/><div className="music-shell"><div className="music-titlebar"><div><div className="music-eyebrow"><Sparkles size={14}/> ALLURA MUSIC · A MOMENT TO BREATHE</div><h1>Một khoảng lặng<br/><em>dành riêng cho bạn.</em></h1><p>Chọn một mood, đặt chiếc đèn cạnh mình và để âm thanh dẫn bạn về với khoảnh khắc hiện tại.</p></div><div className="lamp-status"><i/><span>ĐÈN ALLURA</span><b>·</b><strong>Đang sẵn sàng</strong></div></div><div className="mood-grid">{moodCards.map(item => <button key={item.id} className={`mood-card-new ${mood === item.id ? 'active' : ''}`} onClick={() => setMood(item.id)}><div className="mood-card-top"><span className="mood-icon">{item.id === 'all' ? item.icon : icons[String(item.name || '').toLowerCase()] || <Sparkles size={20}/>}</span><small>{mood === item.id ? 'ĐANG CHỌN' : 'KHÁM PHÁ'}</small></div><h3>{item.name}</h3><p>{item.description}</p></button>)}</div><div className="music-content"><div><div className="playlist-heading"><h2><ListMusic size={19}/> {activeMood?.name || (mood === 'all' ? 'Tất cả bản nhạc' : 'Thư viện âm thanh')}</h2><span>{filtered.length} bản nhạc</span></div><div className="playlist">{filtered.map((track, index) => <article className={`playlist-row-new ${current?.id === track.id ? 'now-playing' : ''}`} key={track.id || index}><button className="song-play" onClick={() => choose(track)} aria-label="Phát nhạc">{current?.id === track.id && playing ? <Pause size={16}/> : <Play size={16} fill="currentColor"/>}</button><div className="song-copy"><b>{track.title}{current?.id === track.id && playing && <span className="equalizer"><i/><i/><i/></span>}</b><small>{track.artist}</small></div><button className="like-song" aria-label="Yêu thích"><Heart size={18}/></button><time>{track.duration || '—'}</time></article>)}</div>{!filtered.length && <div className="nfc-tip"><span>✦</span><p><b>Thư viện đang được chuẩn bị.</b><br/>Admin có thể thêm nhạc vào Supabase để bài hát xuất hiện tại đây.</p></div>}<div className="nfc-tip"><span>♢</span><p><b>Nghe cùng chiếc đèn.</b><br/>Bạn có thể chọn một bản nhạc để seller thiết lập sẵn trong món quà NFC.</p></div></div><aside className="sync-panel"><div className="sync-heading"><div><small>KHÔNG GIAN CỦA BẠN</small><h2>Đồng bộ với chiếc đèn</h2></div><span><Sparkles size={16}/></span></div><div className="lamp-scene"><img src="https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=900&q=82" alt="Không gian ánh đèn"/><div><div><small>ALLURA AMBIENT</small><strong>Ánh sáng dịu dàng</strong></div><em>NFC READY</em></div></div><div className="sync-control"><div className="control-line"><span><Sparkles size={18}/><b>Đồng bộ mood</b><small>Ánh sáng thay đổi theo nhạc</small></span><i className="toggle on"><i/></i></div><div className="control-line"><span><Moon size={18}/><b>Hẹn giờ tắt</b><small>Tự động tắt sau khi bạn thư giãn</small></span><span className="timer">30 phút</span></div><label className="range-line"><span>Độ sáng <b>70%</b></span><input type="range" min="0" max="100" defaultValue="70"/></label></div><div className="sync-footer"><span>Nhạc sẽ được lưu cho trải nghiệm của bạn</span><a href="/huong-dan">Xem hướng dẫn</a></div></aside></div></div>{current && <MusicPlayer current={current} tracks={filtered} playing={playing} setPlaying={setPlaying} volume={volume} setVolume={setVolume} currentTime={currentTime} duration={duration} repeat={repeat} setRepeat={setRepeat} onSeek={value => { if (audio.current) { audio.current.currentTime = value; setCurrentTime(value) } }} onPrevious={() => changeTrack(-1)} onNext={() => changeTrack(1)} />}</section>
}
