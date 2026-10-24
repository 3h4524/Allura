import { supabase } from './supabase'

export const CART_KEY = 'allura:cart'
export const CART_UPDATED_EVENT = 'allura:cart-updated'

const GUEST_CART_KEY = 'allura:cart:guest'
const USER_CART_PREFIX = 'allura:cart:user:'
const PRODUCT_URL = '/api/products/allura-living-glow'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function readLocal(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeLocal(key, items) {
  localStorage.setItem(key, JSON.stringify(items))
}

function userCartKey(userId) {
  return `${USER_CART_PREFIX}${userId}`
}

function variantIdOf(item) {
  return item?.variantId || item?.variant_id || null
}

function normalizeItem(item) {
  const variantId = variantIdOf(item)
  if (!variantId) return null

  return {
    productId: item.productId || item.product_id || '',
    variantId,
    productName: item.productName || item.product_name || 'ALLURA',
    variantName: item.variantName || item.variant_name || '',
    quantity: Math.max(1, Number(item.quantity) || 1),
    unitPrice: Number(item.unitPrice ?? item.unit_price ?? 0),
    imageUrl: item.imageUrl || item.image_url || '',
  }
}

export function mergeCartItems(...collections) {
  const merged = new Map()

  collections.flat().forEach(item => {
    const normalized = normalizeItem(item)
    if (!normalized) return

    const current = merged.get(normalized.variantId)
    if (current) {
      current.quantity += normalized.quantity
      if (!current.imageUrl && normalized.imageUrl) current.imageUrl = normalized.imageUrl
      if (!current.productName && normalized.productName) current.productName = normalized.productName
      if (!current.variantName && normalized.variantName) current.variantName = normalized.variantName
      if (!current.unitPrice && normalized.unitPrice) current.unitPrice = normalized.unitPrice
    } else {
      merged.set(normalized.variantId, normalized)
    }
  })

  return [...merged.values()]
}

export function getGuestCart() {
  const legacyCart = readLocal(CART_KEY)
  const guestCart = mergeCartItems(readLocal(GUEST_CART_KEY), legacyCart)

  if (legacyCart.length) localStorage.removeItem(CART_KEY)
  if (guestCart.length) writeLocal(GUEST_CART_KEY, guestCart)

  return guestCart
}

export function saveGuestCart(items) {
  const next = mergeCartItems(items)
  writeLocal(GUEST_CART_KEY, next)
  localStorage.removeItem(CART_KEY)
  return next
}

function getCachedUserCart(userId) {
  return readLocal(userCartKey(userId))
}

function saveCachedUserCart(userId, items) {
  writeLocal(userCartKey(userId), items)
}

async function getActiveCart(userId, create = false) {
  if (!supabase || !userId) return null

  const existing = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (existing.error) throw existing.error
  if (existing.data || !create) return existing.data

  const created = await supabase
    .from('carts')
    .insert({ user_id: userId, status: 'active' })
    .select('id')
    .single()

  if (!created.error) return created.data

  // Another tab may have created the active cart between the select and insert.
  if (created.error.code === '23505') {
    const retry = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()
    if (retry.error) throw retry.error
    return retry.data
  }

  throw created.error
}

async function fetchCatalog() {
  const response = await fetch(PRODUCT_URL)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Không thể tải thông tin sản phẩm.')
  return data
}

async function hydrateRows(rows) {
  if (!rows.length) return []

  const catalog = await fetchCatalog()
  const variants = catalog.variants || []
  const imageUrl = catalog.images?.[0]?.image_url || ''

  return rows.map(row => {
    const variant = variants.find(item => item.id === row.variant_id)
    return normalizeItem({
      productId: catalog.product?.id || variant?.product_id || '',
      variantId: row.variant_id,
      productName: catalog.product?.name || 'ALLURA',
      variantName: variant?.name || 'ALLURA',
      quantity: row.quantity,
      unitPrice: row.unit_price ?? variant?.price ?? 0,
      imageUrl,
    })
  }).filter(Boolean)
}

async function readRemoteUserCart(userId) {
  const cart = await getActiveCart(userId)
  if (!cart) return []

  const result = await supabase
    .from('cart_items')
    .select('variant_id, quantity, unit_price')
    .eq('cart_id', cart.id)

  if (result.error) throw result.error
  return hydrateRows(result.data || [])
}

async function replaceRemoteUserCart(userId, items) {
  const next = mergeCartItems(items)
  const invalidItem = next.find(item => !UUID_PATTERN.test(item.variantId))
  if (invalidItem) throw new Error('Sản phẩm chưa có mã phiên bản hợp lệ. Vui lòng tải lại trang sản phẩm rồi thử lại.')

  const cart = await getActiveCart(userId, true)
  if (!cart) throw new Error('Không thể tạo giỏ hàng cho tài khoản này.')

  const existing = await supabase
    .from('cart_items')
    .select('id, variant_id')
    .eq('cart_id', cart.id)

  if (existing.error) throw existing.error

  const nextIds = new Set(next.map(item => item.variantId))
  const removedIds = (existing.data || [])
    .filter(item => !nextIds.has(item.variant_id))
    .map(item => item.id)

  if (removedIds.length) {
    const removed = await supabase.from('cart_items').delete().in('id', removedIds)
    if (removed.error) throw removed.error
  }

  if (next.length) {
    const upsert = await supabase.from('cart_items').upsert(
      next.map(item => ({
        cart_id: cart.id,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
      { onConflict: 'cart_id,variant_id' },
    )
    if (upsert.error) throw upsert.error
  }

  return next
}

export async function loadCartForUser(user) {
  if (!user?.id || !supabase) return getGuestCart()

  const pendingGuestCart = readLocal(GUEST_CART_KEY)
  try {
    const remoteCart = await readRemoteUserCart(user.id)
    // The old app could write to allura:cart while a user was already signed
    // in. Ignore that legacy cache here because the old add-to-cart flow has
    // already written the same quantity to Supabase.
    const guestCart = pendingGuestCart
    const merged = mergeCartItems(remoteCart, guestCart)

    if (guestCart.length) await replaceRemoteUserCart(user.id, merged)
    saveCachedUserCart(user.id, merged)
    localStorage.removeItem(GUEST_CART_KEY)
    localStorage.removeItem(CART_KEY)
    return merged
  } catch (error) {
    const cached = getCachedUserCart(user.id)
    if (cached.length) return cached
    throw error
  }
}

export async function saveCartForUser(user, items) {
  if (!user?.id || !supabase) return saveGuestCart(items)

  const next = mergeCartItems(items)
  await replaceRemoteUserCart(user.id, next)
  saveCachedUserCart(user.id, next)
  return next
}

export async function addItemToCart(user, item, quantity) {
  const current = user ? await loadCartForUser(user) : getGuestCart()
  const next = mergeCartItems(current, [{ ...item, quantity }])

  if (user) await saveCartForUser(user, next)
  else saveGuestCart(next)

  window.dispatchEvent(new Event(CART_UPDATED_EVENT))
  return next
}

export function cartQuantity(items) {
  return items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
}
