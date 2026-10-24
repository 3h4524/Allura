import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Brain, ChevronLeft, ChevronRight, Heart, Leaf, ListMusic, Moon, Music2, Pause, Play, Search, Sparkles, Target, Waves } from 'lucide-react'
import MusicPlayer from './music-player.jsx'
import './music-page.css'

const copy = { all: ['All music', 'Explore the complete library'], relax: ['Relax', 'Gentle sounds to help you unwind'], sleep: ['Sleep', 'Sounds for deeper rest'], focus: ['Focus', 'A calm space for what matters'], meditation: ['Meditation', 'A quiet moment for your mind'], romantic: ['Romantic', 'Soft sounds for two'], nature: ['Nature', 'Natural sounds for a calmer space'] }
const icons = { relax: <Waves size={20}/>, sleep: <Moon size={20}/>, focus: <Target size={20}/>, meditation: <Brain size={20}/>, romantic: <Heart size={20}/>, nature: <Leaf size={20}/> }

export default function EnglishMusicPage() {
  const [tracks, setTracks] = useState([])
  const [moods, setMoods] = useState([])
  const [selected, setSelected] = useState('all')
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
      const matchesMood = selected === 'all' || (track.mood || track.mood_id) === selected
      const matchesSearch = !normalizedSearch || `${track.title || ''} ${track.artist || ''}`.toLocaleLowerCase().includes(normalizedSearch)
      return matchesMood && matchesSearch
    })
  }, [selected, search, tracks])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visibleTracks = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page])
  const activeMood = moods.find(item => item.id === selected)
  const selectedCopy = selected === 'all' ? copy.all : copy[String(activeMood?.name || '').toLowerCase()] || [activeMood?.name || 'Music', 'A private soundscape for your moment']
  useEffect(() => { setPage(1) }, [selected, search])
  useEffect(() => { setPage(value => Math.min(value, pageCount)) }, [pageCount])

  useEffect(() => {
    if (!current?.audio && !current?.audio_path) { setPlaying(false); return undefined }
    if (!audio.current) audio.current = new Audio()
    const player = audio.current
    player.src = current.audio || current.audio_path
    player.loop = repeat
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

  const play = track => { if (current?.id === track.id) return setPlaying(value => !value); setCurrent(track); setPlaying(true) }
  const changeTrack = direction => { if (!filtered.length) return; const index = filtered.findIndex(track => track.id === current?.id); const nextIndex = (index + direction + filtered.length) % filtered.length; setCurrent(filtered[nextIndex]); setPlaying(true) }
  const moodCards = [{ id: 'all' }, ...moods]

  return <section className="music-sanctuary"><div className="music-ambient"/><div className="music-shell"><header className="music-titlebar"><div><div className="music-eyebrow"><Music2 size={14}/> ALLURA MUSIC · A MOMENT TO BREATHE</div><h1>A quiet moment<br/><em>made for you.</em></h1><p>Choose a mood, place the lamp beside you, and let the sound bring you back to the present.</p></div><div className="lamp-status"><span>ALLURA LAMP</span><strong>Ready to glow</strong></div></header><div className="mood-grid">{moodCards.map(item => { const key = item.id === 'all' ? 'all' : String(item.name || '').toLowerCase(); const text = copy[key] || [item.name || item.id, 'A private soundscape for your moment']; return <button key={item.id} className={`mood-card-new ${selected === item.id ? 'active' : ''}`} onClick={() => setSelected(item.id)}><div className="mood-card-top"><span className="mood-icon">{item.id === 'all' ? <ListMusic size={20}/> : icons[key] || <Sparkles size={20}/>}</span><small>{selected === item.id ? 'SELECTED' : 'EXPLORE'}</small></div><h3>{text[0]}</h3><p>{text[1]}</p></button> })}</div><div className="music-content"><div><div className="playlist-heading"><h2><ListMusic size={19}/> {selectedCopy[0]}</h2><span>{filtered.length} tracks</span></div><div className="playlist-toolbar"><label className="playlist-search"><Search size={15}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search a track or artist" aria-label="Search a track or artist"/></label><span>{filtered.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} / ${filtered.length}` : '0 / 0'}</span></div><div className="playlist-scroll"><div className="playlist">{visibleTracks.map((track, index) => <article className={`playlist-row-new ${current?.id === track.id ? 'now-playing' : ''}`} key={track.id || index}><button className="song-play" onClick={() => play(track)} aria-label="Play track">{current?.id === track.id && playing ? <Pause size={16}/> : <Play size={16} fill="currentColor"/>}</button><div className="song-copy"><b>{track.title}</b><small>{track.artist}</small></div><button className="like-song" aria-label="Like track"><Heart size={18}/></button><time>{track.duration || '—'}</time></article>)}</div></div>{pageCount > 1 && <nav className="playlist-pagination" aria-label="Music pagination"><button type="button" onClick={() => setPage(value => Math.max(1, value - 1))} disabled={page === 1}><ChevronLeft size={15}/> Previous</button><span>Page {page} / {pageCount}</span><button type="button" onClick={() => setPage(value => Math.min(pageCount, value + 1))} disabled={page === pageCount}>Next <ChevronRight size={15}/></button></nav>}{!filtered.length && <div className="nfc-tip"><b>The library is being prepared.</b><br/>An admin can add music in Supabase for tracks to appear here.</div>}</div><aside className="sync-panel"><div className="sync-heading"><div><small>YOUR SPACE</small><h2>Sync with your lamp</h2></div><Sparkles size={16}/></div><div className="sync-control"><b>Sync mood</b><small>Let the light follow the music</small><b>Sleep timer</b><small>Turn off after you unwind</small><label>Brightness <input type="range" min="0" max="100" defaultValue="70"/></label></div><div className="sync-footer">Your music will be saved to the experience</div></aside></div></div>{current && <MusicPlayer current={current} tracks={filtered} playing={playing} setPlaying={setPlaying} volume={volume} setVolume={setVolume} currentTime={currentTime} duration={duration} repeat={repeat} setRepeat={setRepeat} english onSeek={value => { if (audio.current) { audio.current.currentTime = value; setCurrentTime(value) } }} onPrevious={() => changeTrack(-1)} onNext={() => changeTrack(1)} />}</section>
}
