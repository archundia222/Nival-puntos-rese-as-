'use client';

import { useEffect } from 'react';

export default function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.nivalLanding');
    if (!root || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const elements = root.querySelectorAll<HTMLElement>([
      '.nvWhySection article', '.nvHowCard',
      '.nvReviewsCopy', '.nvGoogleVisual', '.nvOwnerCopy', '.nvDashboard',
      '.nvCounterVisual', '.nvCounterCopy', '.nvIndustryTile', '.nvPlanCard',
      '.nvFaqIntro', '.nvFaqList', '.nvFinalCtaCopy', '.nvFinalCtaAction',
    ].join(','));
    elements.forEach(element => element.classList.add('nvReveal'));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return null;
}
