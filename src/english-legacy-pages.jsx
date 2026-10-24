import React, { useState } from 'react'
import { ArrowRight, BookOpen, Check, CircleUserRound, Headphones, Heart, ImagePlus, LockKeyhole, Send, Sparkles, UploadCloud, UserRound, Users } from 'lucide-react'
import { currentUser, supabase } from './lib/supabase'

const occasions = ['Birthday', 'Anniversary', 'Valentine’s Day', 'Christmas', 'Other']
const codeHash = async value => { const bytes = new TextEncoder().encode(value.trim()); const digest = await crypto.subtle.digest('SHA-256', bytes); return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('') }

export function EnglishGuide() {
  const [audience, setAudience] = useState('user')
  const creatorSteps = [
    ['01', 'Create an account', 'Create your Allura account to manage your gift and lamp.'],
    ['02', 'Activate your lamp', 'Enter the NFC code to connect the lamp to your account.'],
    ['03', 'Set up the gift', 'Write a message, add a photo, and record what you want to say.'],
    ['04', 'Save and review', 'Preview the card, then save the content to your lamp.'],
    ['05', 'Give it away', 'Hand the gift to someone special and let them tap the lamp.'],
  ]
  const receiverSteps = [
    ['01', 'Tap the lamp', 'Use your phone to tap the NFC area on the lamp.'],
    ['02', 'Enter the gift code', 'Enter the 6-digit code sent to you by the seller.'],
    ['03', 'Open the message', 'The private card opens after the code is verified.'],
    ['04', 'Listen to the voice note', 'Play the voice message and soundtrack.'],
    ['05', 'Keep the moment', 'Come back whenever you want through your Allura lamp.'],
  ]
  const steps = audience === 'user' ? creatorSteps : receiverSteps
  return <div className="guide-mock"><section className="guide-hero container"><div className="center-heading"><div className="eyebrow"><Sparkles size={15}/> ALLURA GUIDE</div><h1>Allura was made to <em>be shared.</em></h1><p>Learn how to create a gift and how the recipient opens a private message.</p><div className="segmented"><button className={audience === 'user' ? 'selected' : ''} onClick={() => setAudience('user')}>Gift creator <small>· set up a gift</small></button><button className={audience === 'receiver' ? 'selected' : ''} onClick={() => setAudience('receiver')}>Gift recipient <small>· open a gift</small></button></div></div></section><section className="guide-steps container"><div className="guide-section-title"><h2>{audience === 'user' ? 'Set up your gift' : 'Open your gift'}</h2><span><Check size={13}/> 5 simple steps</span></div><div className="guide-step-grid">{steps.map(([number, title, text], index) => <article key={number} className={`guide-step-card ${index === 2 ? 'highlight' : ''}`}><b className="guide-step-number">{number}</b><div className="guide-step-icon"><Heart /></div><span>STEP {number}</span><h3>{title}</h3><p>{text}</p><small>Continue <ArrowRight size={13}/></small></article>)}</div></section><section className="guide-receiver"><div className="container"><div className="center-heading"><div className="eyebrow"><Heart size={14}/> FOR THE RECIPIENT</div><h2>A gift opened with <em>feeling.</em></h2></div></div></section></div>
}

export function EnglishGiftStudio({ onNavigate }) {
  const [gift, setGift] = useState({ receiverName: '', receiverCode: '', occasion: occasions[0], title: '', message: '', signature: '', imageUrl: '' })
  const [imageBusy, setImageBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const change = event => setGift(current => ({ ...current, [event.target.name]: event.target.value }))
  const uploadImage = async event => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.')
    if (file.size > 5 * 1024 * 1024) return setError('Images must be smaller than 5MB.')
    setError(''); setImageBusy(true)
    const localUrl = URL.createObjectURL(file)
    setGift(current => ({ ...current, imageUrl: localUrl }))
    const user = await currentUser()
    if (user && supabase) {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${user.id}/${crypto.randomUUID()}.${extension}`
      const result = await supabase.storage.from('allura-gift-images').upload(path, file, { contentType: file.type, upsert: false })
      if (result.error) setError(result.error.message)
      else setGift(current => ({ ...current, imageUrl: supabase.storage.from('allura-gift-images').getPublicUrl(path).data.publicUrl }))
    }
    setImageBusy(false)
  }
  const save = async event => {
    event.preventDefault(); setError(''); setSaved(false)
    if (!/^\d{6}$/.test(gift.receiverCode)) return setError('The gift code must contain exactly 6 digits.')
    if (!gift.receiverName || !gift.title || !gift.message) return setError('Please complete the required gift details.')
    const user = await currentUser()
    if (!user || !supabase) return onNavigate('/dang-nhap')
    const { data: lamps } = await supabase.from('lamps').select('id').eq('owner_id', user.id).eq('status', 'active').limit(1)
    if (!lamps?.length) return setError('No active lamp was found. Please claim a lamp first.')
    const result = await supabase.from('gift_contents').upsert({ lamp_id: lamps[0].id, receiver_name: gift.receiverName, receiver_email: null, receiver_code_hash: await codeHash(gift.receiverCode), occasion: gift.occasion, title: gift.title, message: gift.message, signature: gift.signature, image_url: gift.imageUrl || null, status: 'ready' }, { onConflict: 'lamp_id' })
    if (result.error) setError(result.error.message); else setSaved(true)
  }
  return <div className="studio-page"><div className="studio-heading container"><div><div className="eyebrow"><Heart size={15}/> PERSONALIZED EMOTIONAL DESIGN</div><h1>Create a message made just for<br/><em>someone you love.</em></h1><p>Add a photo and a message to make your card truly personal.</p></div><div className="studio-progress"><span className="active">1</span><i/><span>2</span><i/><span>3</span><small>SET UP · PREVIEW · GIVE</small></div></div><div className="studio-layout container"><form className="studio-form" onSubmit={save}><div className="studio-block"><div className="studio-label"><b>1.</b> Recipient <UserRound size={16}/></div><input name="receiverName" value={gift.receiverName} onChange={change} placeholder="Recipient name" required/><div className="studio-label"><b>2.</b> Gift code <LockKeyhole size={16}/></div><input name="receiverCode" value={gift.receiverCode} onChange={event => setGift({ ...gift, receiverCode: event.target.value.replace(/\D/g, '').slice(0, 6) })} inputMode="numeric" maxLength="6" placeholder="6-digit seller code" required/><div className="studio-label"><b>3.</b> Occasion <Sparkles size={16}/></div><div className="occasion-pills">{occasions.map(occasion => <button type="button" className={gift.occasion === occasion ? 'selected' : ''} key={occasion} onClick={() => setGift({ ...gift, occasion })}>{occasion}</button>)}</div><div className="studio-label"><b>4.</b> Message title</div><input name="title" value={gift.title} onChange={change} placeholder="A gentle note for you" required/><div className="studio-label"><b>5.</b> Your message <span>{gift.message.length}/500</span></div><textarea name="message" maxLength="500" value={gift.message} onChange={change} rows="6" placeholder="Write what you want to say..." required/><div className="studio-label"><b>6.</b> Your signature</div><input name="signature" value={gift.signature} onChange={change} placeholder="With love, ..."/><div className="gift-image-upload"><div className="gift-image-copy"><div className="studio-label"><b>7.</b> Memory photo <ImagePlus size={16}/></div><p>Your photo will appear above the message in the card.</p></div>{gift.imageUrl && <img className="gift-image-preview" src={gift.imageUrl} alt="Card preview"/>}<label className="outline upload-label"><UploadCloud size={16}/> {imageBusy ? 'Uploading...' : gift.imageUrl ? 'Change photo' : 'Choose photo'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={imageBusy}/></label></div></div>{error && <div className="error">{error}</div>}<div className="studio-actions"><span><LockKeyhole size={14}/> Your content stays private</span><button className="primary" disabled={imageBusy}>{saved ? 'Gift saved' : 'Save gift'} <ArrowRight size={17}/></button></div></form><aside className="device-preview"><div className="preview-heading"><div><i className="live-dot"/> LIVE PREVIEW</div><small>Changes appear instantly</small></div><div className="phone-stage"><div className="phone-card"><div className="phone-top"><span>ALLURA</span><b>NFC GIFT</b></div><div className="preview-lamp"><div/></div>{gift.imageUrl && <img className="letter-photo" src={gift.imageUrl} alt="Memory photo in card"/>}<div className="preview-occasion">{gift.occasion}</div><h2>{gift.title || 'A gentle note for you'}</h2><div className="preview-to">Made for {gift.receiverName || 'someone you love'}</div><blockquote>“{gift.message || 'Whenever this light comes on, remember that someone is always thinking of you.'}”</blockquote><div className="preview-signature">{gift.signature || 'With love, ...'}</div><div className="preview-footer"><span>ALLURA MEMORY</span><span>✦</span></div></div></div></aside></div></div>
}
export function EnglishLegacyGuide() {
  const [audience, setAudience] = useState('user')
  const creatorSteps = [
    ['01', 'Create an account', 'Create your Allura account to manage your gift and lamp.'],
    ['02', 'Activate the lamp', 'Enter the NFC code to connect the lamp to your account.'],
    ['03', 'Set up the gift', 'Write a message, add photos, and record what you want to say.'],
    ['04', 'Save & review', 'Preview the card, then save the content to your lamp.'],
    ['05', 'Give it away', 'Hand the gift to someone special and let them tap the lamp.']
  ]
  const receiverSteps = [
    ['01', 'Tap the lamp', 'Use your phone to tap the NFC area on the lamp.'],
    ['02', 'Enter the gift code', 'Enter the 6-digit code sent to you by the seller.'],
    ['03', 'Open the message', 'The private card opens after the code is verified.'],
    ['04', 'Listen to the voice note', 'Play the voice message and soundtrack.'],
    ['05', 'Keep the moment', 'Come back whenever you want through your Allura lamp.']
  ]
  const steps = audience === 'user' ? creatorSteps : receiverSteps
  return <div className="guide-mock"><section className="guide-hero container"><div className="center-heading"><div className="eyebrow"><BookOpen size={15} /> ALLURA GUIDE</div><h1>Allura was made to <em>be shared.</em></h1><p>Learn how the gift creator sets up a gift and how the recipient opens a private message.</p><div className="segmented"><button className={audience === 'user' ? 'selected' : ''} onClick={() => setAudience('user')}><CircleUserRound size={15} /> Gift creator <small>· set up a gift</small></button><button className={audience === 'receiver' ? 'selected' : ''} onClick={() => setAudience('receiver')}><Users size={15} /> Gift recipient <small>· open a gift</small></button></div></div></section><section className="guide-steps container"><div className="guide-section-title"><h2>{audience === 'user' ? 'Set up your gift' : 'Open your gift'}</h2><span><Check size={13} /> 5 simple steps</span></div><div className="guide-step-grid">{steps.map(([number, title, text], index) => <article key={number} className={`guide-step-card ${index === 2 ? 'highlight' : ''}`}><b className="guide-step-number">{number}</b><div className="guide-step-icon">{index === 0 ? <UserRound /> : index === 1 ? <Sparkles /> : index === 2 ? <Heart /> : index === 3 ? <Headphones /> : <Send />}</div><span>STEP {number}</span><h3>{title}</h3><p>{text}</p><small>Continue <ArrowRight size={13} /></small></article>)}</div></section><section className="guide-craft container"><div className="craft-image" style={{ background: 'linear-gradient(135deg,#b99570,#ead7bd)' }}><div className="lamp" style={{ transform: 'scale(.8)' }}><div className="lamp-light" /><div className="lamp-shade" /><div className="lamp-body" /><div className="lamp-base" /></div></div><div className="craft-copy"><div className="eyebrow"><Sparkles size={14} /> A SMALL RITUAL</div><h2>The magic is in <em>how you give.</em></h2><p>Allura turns opening a gift into a slower, more meaningful experience: tap, enter the code, listen, and feel.</p><div className="tip"><LockKeyhole size={18} /><div><b>Private by design</b><p>Only the person with the gift code can open the message inside.</p></div></div><div className="tip"><Sparkles size={18} /><div><b>A light that stays</b><p>Every time the lamp turns on, a memory comes back to life.</p></div></div></div></section><section className="guide-receiver"><div className="container"><div className="center-heading"><div className="eyebrow"><Heart size={14} /> FOR THE RECIPIENT</div><h2>A gift opened with <em>feeling.</em></h2></div><div className="receiver-grid">{[['01', 'Tap NFC', 'No extra app is needed.'], ['02', 'Enter the code', 'A private 6-digit code from the seller.'], ['03', 'Read the message', 'The card appears on your phone.'], ['04', 'Hear the voice', 'A memory captured in sound.'], ['05', 'Turn on the lamp', 'Let the light stay with you.']].map(([number, title, text]) => <div key={number}><b>{number}</b><h3>{title}</h3><p>{text}</p><Sparkles size={16} /></div>)}</div></div></section></div>
}
