function calculateMasonryLayout() {
    const grid = document.querySelector('.card-container');
    const cards = document.querySelectorAll('.card');
    const rowHeight = 10; // Must match grid-auto-rows value

    cards.forEach(card => {
        const contentHeight = card.offsetHeight;
        const rowSpan = Math.ceil(contentHeight / rowHeight);
        card.style.gridRowEnd = `span ${rowSpan}`;
    });

    // Re-calculate on window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            cards.forEach(card => card.style.gridRowEnd = '');
            calculateMasonryLayout();
        }, 250);
    });
}