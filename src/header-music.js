function addMusicLink() {
  document.querySelectorAll('.product-header nav, .checkout-header nav').forEach(nav => {
    if (nav.querySelector('[data-music-link]')) return
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.musicLink = 'true'
    button.textContent = 'Nhạc thư giãn'
    button.addEventListener('click', () => {
      window.history.pushState({}, '', '/nhac-thu-gian')
      window.dispatchEvent(new PopStateEvent('popstate'))
      window.scrollTo(0, 0)
    })
    nav.appendChild(button)
  })
}

const headerObserver = new MutationObserver(addMusicLink)
headerObserver.observe(document.body, { childList: true, subtree: true })
addMusicLink()
