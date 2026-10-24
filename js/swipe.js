document.addEventListener('DOMContentLoaded', () => {
    const cards = Array.from(document.querySelectorAll('.carousel-card'))
    const btnPrev = document.querySelector('.carousel-prev')
    const btnNext = document.querySelector('.carousel-next')
    let currentIndex = 0

    let isAnimating = false

    function updateCarousel() {
        const total = cards.length

        cards.forEach(card => card.className = 'carousel-card card-hidden')

        cards[currentIndex].className = 'carousel-card card-active'
        cards[(currentIndex + 1) % total].className = 'carousel-card card-next'
        cards[(currentIndex - 1 + total) % total].className = 'carousel-card card-prev'
    }

    btnNext.addEventListener('click', () => {
        if (isAnimating) return
        isAnimating = true

        currentIndex = (currentIndex + 1) % cards.length
        updateCarousel()

        setTimeout(() => { isAnimating = false; }, 400)
    })

    btnPrev.addEventListener('click', () => {
        if (isAnimating) return
        isAnimating = true

        currentIndex = (currentIndex - 1 + cards.length) % cards.length
        updateCarousel()

        setTimeout(() => { isAnimating = false; }, 400)
    })
})