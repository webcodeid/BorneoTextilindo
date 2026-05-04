const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelectorAll('.site-nav a');
const revealNodes = document.querySelectorAll('[data-reveal]');
const trackedNodes = document.querySelectorAll('[data-track]');
const currentYear = document.querySelector('#current-year');
const filterChips = document.querySelectorAll('.filter-chip');
const portfolioCards = document.querySelectorAll('.portfolio-card');
const faqItems = document.querySelectorAll('.faq-item');
const sections = document.querySelectorAll('main section[id]');

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

if (navToggle && header) {
  navToggle.addEventListener('click', () => {
    const nextState = !header.classList.contains('is-open');
    header.classList.toggle('is-open', nextState);
    navToggle.setAttribute('aria-expanded', String(nextState));
  });
}

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    if (!header || !navToggle) {
      return;
    }

    header.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.16,
});

revealNodes.forEach((node) => revealObserver.observe(node));

const emitAnalytics = (eventName, payload) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    page_path: window.location.pathname,
    device_type: window.innerWidth <= 760 ? 'mobile' : 'desktop',
    timestamp: new Date().toISOString(),
    ...payload,
  });
};

trackedNodes.forEach((node) => {
  node.addEventListener('click', () => {
    emitAnalytics(node.dataset.track, {
      section_name: node.dataset.section || 'unknown',
    });
  });
});

faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) {
      return;
    }

    const question = item.querySelector('summary')?.textContent?.trim() || 'unknown';
    emitAnalytics('faq_open', {
      section_name: 'faq',
      question,
    });
  });
});

filterChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const selectedFilter = chip.dataset.filter || 'all';

    filterChips.forEach((item) => {
      item.classList.toggle('is-active', item === chip);
    });

    portfolioCards.forEach((card) => {
      const category = card.dataset.category || 'all';
      const shouldShow = selectedFilter === 'all' || selectedFilter === category;
      card.classList.toggle('is-hidden', !shouldShow);
    });

    emitAnalytics('portfolio_filter_click', {
      section_name: 'portfolio',
      selected_filter: selectedFilter,
    });
  });
});

const scrollCheckpoints = [
  { percent: 50, eventName: 'scroll_50', fired: false },
  { percent: 90, eventName: 'scroll_90', fired: false },
];

const setActiveNavLink = () => {
  let activeId = '';

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 140;
    const sectionBottom = sectionTop + section.offsetHeight;
    if (window.scrollY >= sectionTop && window.scrollY < sectionBottom) {
      activeId = section.id;
    }
  });

  navLinks.forEach((link) => {
    const targetId = link.getAttribute('href')?.replace('#', '');
    link.classList.toggle('is-active', Boolean(activeId) && targetId === activeId);
  });
};

const handleScrollTracking = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollable > 0) {
    const progress = (window.scrollY / scrollable) * 100;
    scrollCheckpoints.forEach((checkpoint) => {
      if (!checkpoint.fired && progress >= checkpoint.percent) {
        checkpoint.fired = true;
        emitAnalytics(checkpoint.eventName, {
          section_name: 'page-scroll',
        });
      }
    });
  }

  setActiveNavLink();
};

window.addEventListener('scroll', handleScrollTracking, { passive: true });
window.addEventListener('resize', setActiveNavLink);
handleScrollTracking();