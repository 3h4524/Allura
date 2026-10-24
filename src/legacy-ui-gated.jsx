import React, { useEffect, useState } from 'react'
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react'
import { currentUser, supabase } from './lib/supabase'
import { LegacyGuide } from './legacy-ui.jsx'
import LegacyGiftStudio from './nfc-gift-studio.jsx'

export { LegacyGuide }
export { LegacyGiftStudio }

export default function LegacyUiGated() { return null }

