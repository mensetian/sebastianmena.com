document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('nav#menu ul li');
    const sections = document.querySelectorAll('#main_scroll section');
    let currentSectionIndex = -1; // No section active initially
    let isAnimating = false;
    let lastScrollTime = 0;
    const scrollCooldown = 1000; // 1 second cooldown
    let isInitialState = true; // Track initial state

    // Initially hide all sections
    sections.forEach(section => {
        section.classList.remove('visible');
        section.style.display = 'none';
        section.scrollTop = 0; // Reset scroll position
    });

    // Update active menu item and section visibility
    function updateActiveSection(index, direction = null) {
        if (isAnimating || index < 0 || index >= sections.length) return;
        isAnimating = true;

        // Hide current section (if not initial state)
        if (currentSectionIndex >= 0) {
            const currentSection = sections[currentSectionIndex];
            currentSection.classList.remove('visible');
            currentSection.classList.add(direction === 'down' ? 'fade-out-up' : 'fade-out-down');
        }

        // Show new section
        const newSection = sections[index];
        newSection.style.display = 'block';
        newSection.style.zIndex = 2; // Ensure incoming section is above
        newSection.classList.remove('fade-out-up', 'fade-out-down');
        newSection.classList.add('visible', direction === 'down' ? 'fade-in-up' : 'fade-in-down');
        newSection.scrollTop = 0; // Reset scroll position

        // Update menu items
        menuItems.forEach(item => {
            item.classList.remove('active');
            const link = item.querySelector('a');
            if (link.getAttribute('href') === `#${newSection.id}`) {
                item.classList.add('active');
                link.setAttribute('aria-current', 'page'); // Accessibility improvement
            } else {
                link.removeAttribute('aria-current');
            }
        });

        // Update URL hash
        window.history.replaceState(null, null, `#${newSection.id}`);

        // Update current section index
        const previousSectionIndex = currentSectionIndex;
        currentSectionIndex = index;

        // Reset animation state after transition
        setTimeout(() => {
            if (previousSectionIndex >= 0) {
                const previousSection = sections[previousSectionIndex];
                previousSection.style.display = 'none';
                previousSection.style.zIndex = 1;
                previousSection.classList.remove('fade-out-up', 'fade-out-down');
            }
            newSection.classList.remove('fade-in-up', 'fade-in-down');
            isAnimating = false;
        }, 500); // Match CSS animation duration
    }

    // Revert to initial state (hide all sections)
    function revertToInitialState() {
        if (isAnimating) return;
        isAnimating = true;

        // Hide current section
        const currentSection = sections[currentSectionIndex];
        currentSection.classList.remove('visible');
        currentSection.classList.add('fade-out-up');

        // Reset menu items
        menuItems.forEach(item => {
            item.classList.remove('active');
            item.querySelector('a').removeAttribute('aria-current');
        });

        // Clear URL hash
        window.history.replaceState(null, null, ' ');

        // Update state
        setTimeout(() => {
            currentSection.style.display = 'none';
            currentSection.style.zIndex = 1;
            currentSection.classList.remove('fade-out-up');
            currentSectionIndex = -1;
            isInitialState = true;
            isAnimating = false;
        }, 500); // Match CSS animation duration
    }

    // Activate visibility on first interaction
    function activateVisibility(direction = 'down') {
        if (isInitialState) {
            isInitialState = false;
            updateActiveSection(0, direction); // Show first section
        }
    }

    // Menu click event listener
    menuItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.querySelector('a').getAttribute('href').substring(1);
            const targetIndex = Array.from(sections).findIndex(section => section.id === targetId);
            if (targetIndex !== currentSectionIndex) {
                const direction = targetIndex > currentSectionIndex || isInitialState ? 'down' : 'up';
                if (isInitialState) {
                    isInitialState = false; // Ensure state is updated
                    updateActiveSection(targetIndex, direction); // Navigate directly to target section
                } else {
                    updateActiveSection(targetIndex, direction);
                }
            }
        });
    });

    // Wheel event listener for scroll navigation
    document.addEventListener('wheel', (e) => {
        const now = Date.now();
        if (isAnimating || now - lastScrollTime < scrollCooldown) return;
        lastScrollTime = now;

        if (isInitialState) {
            e.preventDefault();
            activateVisibility(e.deltaY > 0 ? 'down' : 'up');
            return;
        }

        const currentSection = sections[currentSectionIndex];
        const isAtBottom = currentSection.scrollTop + currentSection.clientHeight >= currentSection.scrollHeight - 5;
        const isAtTop = currentSection.scrollTop <= 5;
        const direction = e.deltaY > 0 ? 'down' : 'up';
        let newIndex = direction === 'down' ? currentSectionIndex + 1 : currentSectionIndex - 1;

        if ((direction === 'down' && !isAtBottom) || (direction === 'up' && !isAtTop)) {
            return; // Permitir desplazamiento interno
        }

        if (direction === 'up' && currentSectionIndex === 0 && isAtTop) {
            e.preventDefault();
            revertToInitialState();
            return;
        }

        if ((direction === 'down' && isAtBottom) || (direction === 'up' && isAtTop)) {
            updateActiveSection(newIndex, direction);
        }
    }, { passive: false });

    // Keydown event listener for arrow keys
    document.addEventListener('keydown', (e) => {
        const now = Date.now();
        lastScrollTime = now;

        // Handle initial state
        if (isInitialState && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            activateVisibility(e.key === 'ArrowDown' ? 'down' : 'up');
            return;
        }

        // Exit if no section is active
        if (currentSectionIndex < 0) return;

        let newIndex = currentSectionIndex;
        if (e.key === 'ArrowDown') {
            newIndex = currentSectionIndex + 1;
            updateActiveSection(newIndex, 'down');
        } else if (e.key === 'ArrowUp' && currentSectionIndex === 0) {
            e.preventDefault();
            revertToInitialState();
        } else if (e.key === 'ArrowUp') {
            newIndex = currentSectionIndex - 1;
            updateActiveSection(newIndex, 'up');
        }
    });

    // Check for hash in URL on page load
    const hash = window.location.hash.substring(1); // Get hash without '#'
    if (hash) {
        const targetSection = document.getElementById(hash);
        if (targetSection) {
            const targetIndex = Array.from(sections).indexOf(targetSection);
            if (targetIndex !== -1) {
                isInitialState = false; // Disable initial state
                updateActiveSection(targetIndex, 'down');
            }
        }
    }
});