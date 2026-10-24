import { ChevronLeft, ChevronRight, Heart, Pause, Play, Repeat2, Sparkles, Volume2 } from 'lucide-react'
import './music-player.css'

const formatTime = value => {
  if (!Number.isFinite(value) || value < 0) return '00:00'
  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function MusicPlayer({ current, tracks, playing, setPlaying, volume, setVolume, currentTime, duration, repeat, setRepeat, onSeek, onPrevious, onNext, english = false }) {
  const labels = english ? {
    previous: 'Previous track', next: 'Next track', repeat: repeat ? 'Disable repeat' : 'Repeat track', like: 'Like track', seek: 'Seek through track',
  } : {
    previous: 'Bài trước', next: 'Bài tiếp theo', repeat: repeat ? 'Tắt lặp lại' : 'Lặp lại bài hát', like: 'Yêu thích', seek: 'Tua bài hát',
  }
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
  const safeCurrentTime = safeDuration ? Math.min(currentTime, safeDuration) : 0

  return <div className="music-player">
    <div className="player-song"><div className="player-art"><Sparkles size={22}/></div><div><b>{current.title}</b><small>{current.artist}</small></div><button type="button" aria-label={labels.like}><Heart size={19}/></button></div>
    <div className="player-controls">
      <div><button type="button" onClick={onPrevious} disabled={!tracks.length} aria-label={labels.previous}><ChevronLeft size={18}/></button><button type="button" className="master-play" onClick={() => setPlaying(value => !value)}>{playing ? <Pause size={18}/> : <Play size={18} fill="currentColor"/>}</button><button type="button" onClick={onNext} disabled={!tracks.length} aria-label={labels.next}><ChevronRight size={18}/></button><button type="button" className={repeat ? 'repeat active' : 'repeat'} onClick={() => setRepeat(value => !value)} aria-label={labels.repeat} title={labels.repeat}><Repeat2 size={17}/></button></div>
      <div className="timeline"><span>{formatTime(safeCurrentTime)}</span><input type="range" min="0" max={safeDuration || 1} step="0.1" value={safeCurrentTime} onChange={event => onSeek(Number(event.target.value))} aria-label={labels.seek} disabled={!safeDuration}/><span>{formatTime(safeDuration)}</span></div>
    </div>
    <div className="player-tools"><Volume2 size={16}/><input type="range" min="0" max="100" value={volume} onChange={event => setVolume(Number(event.target.value))} aria-label={english ? 'Volume' : 'Âm lượng'}/></div>
  </div>
}
