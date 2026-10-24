const clamp = value => Math.max(0, Math.min(100, value))

if (typeof window !== 'undefined') {
  let drag = null
  let moved = false
  document.addEventListener('pointerdown', event => {
    const image = event.target.closest?.('.phone-card .letter-photo, .experience .letter-photo, .gift-preview-cover > img')
    if (!image) return
    image.setPointerCapture?.(event.pointerId)
    const rect = image.getBoundingClientRect()
    const currentX = Number(image.dataset.positionX || 50)
    const currentY = Number(image.dataset.positionY || 50)
    moved = false
    drag = { image, startX: event.clientX, startY: event.clientY, currentX, currentY, width: rect.width, height: rect.height }
    image.style.cursor = 'grabbing'
    event.preventDefault()
  })
  document.addEventListener('pointermove', event => {
    if (!drag) return
    if (Math.abs(event.clientX - drag.startX) > 3 || Math.abs(event.clientY - drag.startY) > 3) moved = true
    const nextX = clamp(drag.currentX + ((event.clientX - drag.startX) / drag.width) * 100)
    const nextY = clamp(drag.currentY + ((event.clientY - drag.startY) / drag.height) * 100)
    drag.image.dataset.positionX = nextX
    drag.image.dataset.positionY = nextY
    drag.image.style.objectPosition = `${nextX}% ${nextY}%`
  })
  const stop = () => {
    if (drag) {
      drag.image.style.cursor = 'grab'
      if (moved) {
        drag.image.dataset.dragged = '1'
        drag.image.dispatchEvent(new CustomEvent('allura:image-position-change', {
          bubbles: true,
          detail: {
            src: drag.image.currentSrc || drag.image.src,
            x: Number(drag.image.dataset.positionX || 50),
            y: Number(drag.image.dataset.positionY || 50)
          }
        }))
      }
    }
    drag = null
  }
  document.addEventListener('pointerup', stop)
  document.addEventListener('pointercancel', stop)
  document.addEventListener('click', event => {
    const image = event.target.closest?.('.phone-card .letter-photo, .experience .letter-photo, .gift-preview-cover > img')
    if (!image || image.dataset.dragged !== '1') return
    event.preventDefault()
    event.stopPropagation()
    delete image.dataset.dragged
  }, true)
}
