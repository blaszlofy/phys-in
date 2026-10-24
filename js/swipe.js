document.addEventListener('DOMContentLoaded', () => {
    const carouselContainer = document.querySelector('.feynman-carousel-container')
    const cards = Array.from(document.querySelectorAll('.carousel-card'))
    const btnPrev = document.querySelector('.carousel-prev')
    const btnNext = document.querySelector('.carousel-next')

    let currentIndex = 0
    let isAnimating = false

    let autoPlayTimer;
    const autoPlayDelay = 6000
    let isPaused = false

    function updateCarousel() {
        const total = cards.length

        cards.forEach(card => card.className = 'carousel-card card-hidden')

        cards[currentIndex].className = 'carousel-card card-active'
        cards[(currentIndex + 1) % total].className = 'carousel-card card-next'
        cards[(currentIndex - 1 + total) % total].className = 'carousel-card card-prev'
    }

    function moveToNext() {
        if (isAnimating) return
        isAnimating = true

        currentIndex = (currentIndex + 1) % cards.length
        updateCarousel()

        setTimeout(() => { isAnimating = false; }, 400)
    }

    function moveToPrev() {
        if (isAnimating) return
        isAnimating = true

        currentIndex = (currentIndex - 1 + cards.length) % cards.length
        updateCarousel()

        setTimeout(() => { isAnimating = false; }, 400)
    }

    function startAutoPlay() {
        clearInterval(autoPlayTimer)
        if (!isPaused && !document.hidden) {
            autoPlayTimer = setInterval(moveToNext, autoPlayDelay)
        }
    }

    function stopAutoPlay() {
        clearInterval(autoPlayTimer)
    }

    function resetAutoPlay() {
        stopAutoPlay()
        startAutoPlay()
    }

    btnNext.addEventListener('click', () => {
        moveToNext()
        resetAutoPlay()
    })

    btnPrev.addEventListener('click', () => {
        moveToPrev()
        resetAutoPlay()
    })

    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            isPaused = true
            stopAutoPlay()
        })
        carouselContainer.addEventListener('mouseleave', () => {
            isPaused = false
            startAutoPlay()
        })
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoPlay()
        } else {
            startAutoPlay()
        }
    })
    updateCarousel()
    startAutoPlay()
})