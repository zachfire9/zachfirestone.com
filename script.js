// Scroll-triggered section reveal
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    },
    // Trigger on any overlap (not a percentage of the section) so very tall
    // sections like Quotes still reveal; the margin keeps the fade-in from
    // firing until the section is slightly inside the viewport.
    { threshold: 0, rootMargin: '0px 0px -10% 0px' }
);

document.querySelectorAll('.section').forEach((section) => {
    observer.observe(section);
});

// Nav shadow + shrink on scroll
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        nav.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.5)';
        nav.style.borderBottomColor = 'rgba(0, 240, 255, 0.15)';
    } else {
        nav.style.boxShadow = 'none';
        nav.style.borderBottomColor = 'rgba(0, 240, 255, 0.08)';
    }
});

// Active nav link tracking
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach((section) => {
        const sectionTop = section.offsetTop - 120;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach((link) => {
        link.style.color = '';
        if (link.getAttribute('href') === `#${current}`) {
            link.style.color = 'var(--neon-cyan)';
        }
    });
});

// Random subtle glitch burst on name (every 8-15 seconds)
const glitchEl = document.querySelector('.glitch');
if (glitchEl) {
    setInterval(() => {
        glitchEl.classList.add('glitch-active');
        setTimeout(() => glitchEl.classList.remove('glitch-active'), 200);
    }, 8000 + Math.random() * 7000);
}
