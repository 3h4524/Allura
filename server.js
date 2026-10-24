import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })
const app = express()
app.use(express.json())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const hasSupabase = Boolean(supabaseUrl && supabaseKey)
const adminClient = hasSupabase && serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null
const publicClient = hasSupabase ? createClient(supabaseUrl, supabaseKey) : null

const demoLamp = { id: 'lamp-demo', nfcToken: 'demo', status: 'active', ownerId: 'demo-user' }
const demoGift = { receiverName: 'Emma', receiverEmail: 'emma@example.com', occasion: 'Sinh nhật', title: 'Một điều dịu dàng dành cho Emma', message: 'Mỗi khi ánh đèn này sáng lên, mong bạn nhớ rằng luôn có một người đang nghĩ về bạn.', signature: 'Thương, Luke', voice: null }
demoGift.receiverEmail = '482716'
const moods = [
  { id: 'relax', name: 'Thư giãn', icon: '☁', color: '#e9dfd8' },
  { id: 'sleep', name: 'Ngủ ngon', icon: '☾', color: '#ddd9e4' },
  { id: 'focus', name: 'Tập trung', icon: '◒', color: '#e6e0cb' },
  { id: 'meditation', name: 'Thiền định', icon: '◌', color: '#dce5dd' },
  { id: 'romantic', name: 'Lãng mạn', icon: '♡', color: '#eed9dc' },
]
const music = [
  { id: 1, title: 'Quiet Morning', artist: 'Allura Studio', mood: 'relax', duration: '03:42', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80' },
  { id: 2, title: 'Soft Rain', artist: 'Mina Lee', mood: 'sleep', duration: '04:18', image: 'https://images.unsplash.com/photo-1501691223387-dd0500403074?auto=format&fit=crop&w=800&q=80' },
  { id: 3, title: 'Warm Evening', artist: 'Allura Studio', mood: 'romantic', duration: '05:06', image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=80' },
]

app.get('/api/health', (_req, res) => res.json({ ok: true, provider: hasSupabase ? 'supabase' : 'demo' }))

const productCache = new Map()
const PRODUCT_CACHE_TTL = 60_000

app.get('/api/products/allura-living-glow', (_req, res, next) => {
  if (publicClient) return next()
  res.json({ product: { id: 'allura-lotus', name: 'Đèn hoa sen đa giác quan ALLURA' }, variants: [{ id: 'allura-standard', name: 'Phiên bản tiêu chuẩn', price: 500000 }], images: [{ id: 'allura-1', image_url: '/assets/allura-hero.png', alt_text: 'Đèn hoa sen ALLURA' }, { id: 'allura-2', image_url: '/assets/allura-hero.png', alt_text: 'Đèn ALLURA trong không gian sống' }, { id: 'allura-3', image_url: '/assets/allura-hero.png', alt_text: 'Chi tiết đèn hoa sen ALLURA' }], features: [], specs: [] })
})

app.get('/api/products/:slug', async (req, res) => {
  if (!publicClient) return res.status(503).json({ message: 'Supabase chưa được cấu hình.' })
  const cached = productCache.get(req.params.slug)
  if (cached && cached.expiresAt > Date.now()) return res.json(cached.data)
  const db = adminClient || publicClient
  const { data: product, error: productError } = await db.from('products').select('*').eq('slug', req.params.slug).eq('status', 'active').maybeSingle()
  if (productError) return res.status(400).json({ message: productError.message })
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' })
  const [variants, images, features, specs] = await Promise.all([
    db.from('product_variants').select('*').eq('product_id', product.id).eq('status', 'active').order('display_order'),
    db.from('product_images').select('*').eq('product_id', product.id).order('display_order'),
    db.from('product_features').select('*').eq('product_id', product.id).order('display_order'),
    db.from('product_specs').select('*').eq('product_id', product.id).order('display_order'),
  ])
  const error = variants.error || images.error || features.error || specs.error
  if (error) return res.status(400).json({ message: error.message })
  const payload = { product, variants: variants.data || [], images: images.data || [], features: features.data || [], specs: specs.data || [] }
  productCache.set(req.params.slug, { data: payload, expiresAt: Date.now() + PRODUCT_CACHE_TTL })
  res.json(payload)
})

const districtCache = new Map()
const geocodeCache = new Map()
const addressApiBase = process.env.ADDRESS_API_BASE || 'https://tinhthanhpho.com/api/v1'
app.get('/api/locations/provinces', async (_req, res) => {
  try { const response = await fetch(`${addressApiBase}/new-provinces?limit=100`); if (!response.ok) return res.status(response.status).json({ message: 'Không thể tải tỉnh thành.' }); const data = await response.json(); res.json(Array.isArray(data) ? data : (data.data || [])) } catch (error) { res.status(502).json({ message: error.message }) }
})
app.get('/api/locations/provinces/:code', async (req, res) => {
  const key = String(req.params.code); const cached = districtCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return res.json(cached.data)
  try { const response = await fetch(`${addressApiBase}/new-provinces/${encodeURIComponent(key)}/wards?limit=1000`); if (!response.ok) return res.status(response.status).json({ message: 'Không thể tải phường/xã.' }); const data = await response.json(); const areas = Array.isArray(data) ? data : (data.data || []); districtCache.set(key, { data: areas, expiresAt: Date.now() + 86400000 }); res.json(areas) } catch (error) { res.status(502).json({ message: error.message }) }
})
app.get('/api/locations/search', async (req, res) => {
  const query = String(req.query.q || '').trim()
  if (query.length < 2) return res.json([])

  const cacheKey = query.toLocaleLowerCase()
  const cached = geocodeCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return res.json(cached.data)

  try {
    const endpoint = new URL('https://photon.komoot.io/api/')
    endpoint.searchParams.set('q', `${query}, Vietnam`)
    endpoint.searchParams.set('limit', '8')
    endpoint.searchParams.set('lang', 'default')
    endpoint.searchParams.set('bbox', '102.1,8.2,109.6,23.5')
    const response = await fetch(endpoint, { headers: { Accept: 'application/json', 'User-Agent': 'AlluraGiftPlatform/1.0' } })
    if (!response.ok) return res.json([])
    const data = await response.json()
    const results = (data.features || [])
      .filter(feature => !feature.properties?.countrycode || feature.properties.countrycode.toLowerCase() === 'vn')
      .map(feature => {
        const properties = feature.properties || {}
        const street = [properties.housenumber, properties.street].filter(Boolean).join(' ')
        const locality = properties.city || properties.town || properties.village || properties.county || properties.state
        const label = [street || properties.name, properties.suburb || properties.district, locality, properties.state].filter(Boolean).filter((item, index, list) => list.indexOf(item) === index).join(', ')
        return { label, lat: feature.geometry?.coordinates?.[1] || null, lon: feature.geometry?.coordinates?.[0] || null }
      })
      .filter(item => item.label)
    geocodeCache.set(cacheKey, { data: results, expiresAt: Date.now() + 300000 })
    res.json(results)
  } catch {
    res.json([])
  }
})
app.get('/api/locations/reverse-geocode', async (req, res) => {
  const lat = Number(req.query.lat), lon = Number(req.query.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return res.status(400).json({ message: 'Tọa độ không hợp lệ.' })
  try { const response = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`, { headers: { Accept: 'application/json', 'User-Agent': 'AlluraGiftPlatform/1.0' } }); if (!response.ok) return res.status(response.status).json({ message: 'Không thể xác định địa chỉ.' }); const data = await response.json(); const properties = data.features?.[0]?.properties || {}; res.json({ displayName: [properties.name, properties.street, properties.city].filter(Boolean).join(', '), address: { house_number: properties.housenumber, road: properties.street, neighbourhood: properties.locality, suburb: properties.district, city: properties.city, state: properties.state, province: properties.city } }) } catch (error) { res.status(502).json({ message: error.message }) }
})

app.get('/api/lamp/:token', async (req, res) => {
  if (publicClient) {
    const accessToken = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    const db = accessToken
      ? createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } } })
      : publicClient
    const { data: statusRows, error } = await db.rpc('get_lamp_status', { p_nfc_token: req.params.token })
    if (error) return res.status(400).json({ message: error.message })
    const data = statusRows?.[0]
    if (!data) return res.status(404).json({ message: 'Lamp không tồn tại.' })
    const gift = data.has_ready_gift ? { status: 'ready' } : null
    return res.json({ lamp: { id: data.lamp_id, nfc_token: req.params.token, status: data.lamp_status }, gift, isOwner: Boolean(data.is_owner) })
  }
  res.json({ lamp: { ...demoLamp, nfcToken: req.params.token }, gift: { ...demoGift, status: 'ready' }, isOwner: false })
})
async function musicUrl(track) {
  if (!track?.audio_path) return null
  if (/^https?:\/\//i.test(track.audio_path)) return track.audio_path
  const storage = adminClient || publicClient
  if (!storage) return track.audio_path
  if (adminClient) {
    const signed = await adminClient.storage.from('allura-music').createSignedUrl(track.audio_path, 3600)
    if (!signed.error && signed.data?.signedUrl) return signed.data.signedUrl
  }
  return storage.storage.from('allura-music').getPublicUrl(track.audio_path).data.publicUrl
}

async function giftVoiceUrl(voiceFileId) {
  if (!voiceFileId || !adminClient) return null
  const { data: voice, error } = await adminClient
    .from('voice_files')
    .select('storage_key')
    .eq('id', voiceFileId)
    .maybeSingle()
  if (error || !voice?.storage_key) return null
  const signed = await adminClient.storage.from('allura-voice').createSignedUrl(voice.storage_key, 3600)
  return signed.error ? null : signed.data?.signedUrl || null
}

async function giftMusic(musicId) {
  if (!musicId || !publicClient) return null
  const { data: track, error } = await publicClient
    .from('music')
    .select('id,title,artist,mood_id,duration_seconds,thumbnail,audio_path')
    .eq('id', musicId)
    .eq('status', 'active')
    .maybeSingle()
  if (error || !track) return null
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    duration: track.duration_seconds ? new Date(track.duration_seconds * 1000).toISOString().slice(14, 19) : null,
    thumbnail: track.thumbnail,
    url: await musicUrl(track),
  }
}

app.get('/api/music', async (req, res) => {
  if (publicClient) {
    const mood = String(req.query.mood || '').trim()
    const trackQuery = publicClient.from('music').select('id,title,artist,mood_id,duration_seconds,thumbnail,audio_path').eq('status', 'active').order('created_at')
    const [{ data: dbMoods, error: moodError }, { data: dbTracks, error: trackError }] = await Promise.all([
      publicClient.from('music_moods').select('id,name,description,thumbnail,display_order').order('display_order'),
      trackQuery,
    ])
    if (moodError || trackError) return res.status(400).json({ message: moodError?.message || trackError?.message })
    const selectedMood = mood ? (dbMoods || []).find(item => item.id === mood || item.name.toLowerCase() === mood.toLowerCase()) : null
    const filteredTracks = mood ? (selectedMood ? (dbTracks || []).filter(track => track.mood_id === selectedMood.id) : []) : (dbTracks || [])
    const tracks = await Promise.all(filteredTracks.map(async track => ({ ...track, duration: track.duration_seconds ? new Date(track.duration_seconds * 1000).toISOString().slice(14, 19) : null, audio: await musicUrl(track) })))
    return res.json({ moods: dbMoods || [], tracks })
  }
  const mood = String(req.query.mood || '').trim()
  res.json({ moods, tracks: mood ? music.filter(track => track.mood === mood) : music })
})

app.get('/api/music/:id', async (req, res) => {
  if (!publicClient) return res.status(503).json({ message: 'Supabase chưa được cấu hình.' })
  const { data, error } = await publicClient.from('music').select('id,title,artist,mood_id,duration_seconds,thumbnail,audio_path').eq('id', req.params.id).eq('status', 'active').maybeSingle()
  if (error) return res.status(400).json({ message: error.message })
  if (!data) return res.status(404).json({ message: 'Không tìm thấy bài nhạc.' })
  res.json({ ...data, duration: data.duration_seconds ? new Date(data.duration_seconds * 1000).toISOString().slice(14, 19) : null, audio: await musicUrl(data) })
})
app.post('/api/receiver/verify', async (req, res) => {
  const code = String(req.body.code || '').trim()
  const email = code
  if (publicClient && req.body.nfcToken) {
    const { data, error } = await publicClient.rpc('verify_receiver_code', { p_nfc_token: req.body.nfcToken, p_code: code })
    if (error) return res.status(400).json({ message: error.message })
    if (!data?.length) return res.status(403).json({ message: 'Email không khớp với người nhận của món quà này.' })
    const voiceUrl = await giftVoiceUrl(data[0].voice_file_id)
    const music = await giftMusic(data[0].music_id)
    return res.json({ accessToken: 'receiver-session', gift: { receiverName: data[0].receiver_name, occasion: data[0].occasion, title: data[0].title, message: data[0].message, signature: data[0].signature, voiceFileId: data[0].voice_file_id, voiceUrl, musicId: data[0].music_id, music, musicUrl: music?.url || null, imageUrl: data[0].image_url, imageUrls: data[0].image_urls || (data[0].image_url ? [data[0].image_url] : []), imagePositions: data[0].image_positions || {} } })
  }
  if (email !== demoGift.receiverEmail) return res.status(403).json({ message: 'Email không khớp với người nhận của món quà này.' })
  res.json({ accessToken: 'demo-receiver-session', gift: demoGift })
})
app.post('/api/lamps/claim', async (req, res) => {
  if (!publicClient) return res.status(503).json({ message: 'Supabase chưa được cấu hình.' })
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Bạn cần đăng nhập.' })
  const userClient = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data, error } = await userClient.rpc('claim_lamp', { p_nfc_token: req.body.nfcToken })
  if (error) {
    const errorCode = String(error.message || '')
    const message = errorCode === 'lamp_not_assigned_to_account'
      ? 'NFC này chưa được gán cho email của tài khoản đang đăng nhập. Hãy đăng nhập bằng đúng email người mua đã nhập khi tạo đơn.'
      : errorCode === 'authentication_required'
        ? 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.'
        : errorCode
    return res.status(400).json({ code: errorCode, message })
  }
  res.json({ lamp: data })
})
app.get('/api/gifts/:lampId', async (req, res) => {
  if (!publicClient) return res.status(503).json({ message: 'Supabase chÆ°a Ä‘Æ°á»£c cáº¥u hĂ¬nh.' })
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Báº¡n cáº§n Ä‘Äƒng nháº­p.' })
  const userClient = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: userData } = await userClient.auth.getUser(token)
  if (!userData.user) return res.status(401).json({ message: 'PhiĂªn Ä‘Äƒng nháº­p khĂ´ng há»£p lá»‡.' })

  const { data, error } = await userClient
    .from('gift_contents')
    .select('id,lamp_id,receiver_name,occasion,custom_occasion,title,message,signature,voice_file_id,image_url,image_urls,image_positions,status')
    .eq('lamp_id', req.params.lampId)
    .maybeSingle()
  if (error) return res.status(400).json({ message: error.message })
  if (!data) return res.json({ gift: null })

  const { data: musicRow } = await userClient
    .from('gift_contents')
    .select('music_id')
    .eq('id', data.id)
    .maybeSingle()
  const musicId = musicRow?.music_id || null
  const music = await giftMusic(musicId)
  const voiceUrl = await giftVoiceUrl(data.voice_file_id)
  res.json({
    gift: {
      id: data.id,
      lampId: data.lamp_id,
      receiverName: data.receiver_name,
      occasion: data.occasion,
      customOccasion: data.custom_occasion,
      title: data.title,
      message: data.message,
      signature: data.signature,
      voiceFileId: data.voice_file_id,
      voiceUrl,
      musicId,
      music,
      musicUrl: music?.url || null,
      imageUrl: data.image_url,
      imageUrls: data.image_urls || (data.image_url ? [data.image_url] : []),
      imagePositions: data.image_positions || {},
      status: data.status,
    },
  })
})
app.post('/api/gifts', async (req, res) => {
  if (!publicClient) return res.status(201).json({ ...demoGift, ...req.body, status: 'Ready' })
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ message: 'Bạn cần đăng nhập.' })
  const userClient = createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: userData } = await userClient.auth.getUser(token)
  if (!userData.user) return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' })
  const requestedLampId = String(req.body.lampId || '').trim()
  let lampQuery = userClient.from('lamps').select('id').eq('owner_id', userData.user.id).in('status', ['inactive', 'active'])
  if (requestedLampId) lampQuery = lampQuery.eq('id', requestedLampId)
  const { data: lamps, error: lampError } = await lampQuery.limit(requestedLampId ? 1 : 2)
  if (!requestedLampId && lamps?.length > 1) return res.status(400).json({ message: 'Scan the NFC lamp you want to set up first.' })
  if (lampError || !lamps?.length) return res.status(400).json({ message: 'Tài khoản chưa có lamp active.' })
  const receiverEmail = req.body.receiverEmail ? String(req.body.receiverEmail).toLowerCase().trim() : null
  const { data, error } = await userClient.from('gift_contents').upsert({ lamp_id: lamps[0].id, receiver_name: req.body.receiverName, receiver_email: receiverEmail, occasion: req.body.occasion, title: req.body.title, message: req.body.message, signature: req.body.signature, status: 'ready' }, { onConflict: 'lamp_id' }).select().single()
  if (error) return res.status(400).json({ message: error.message })
  const { error: activationError } = await userClient.from('lamps').update({ status: 'active', activated_at: new Date().toISOString() }).eq('id', lamps[0].id).eq('owner_id', userData.user.id)
  if (activationError) return res.status(400).json({ message: activationError.message })
  res.status(201).json(data)
})

const dist = path.join(__dirname, 'dist')
app.use(express.static(dist))
app.use((_req, res) => res.sendFile(path.join(dist, 'index.html')))
const port = process.env.PORT || 3001
app.listen(port, () => console.log(`Allura API listening on http://localhost:${port}`))

