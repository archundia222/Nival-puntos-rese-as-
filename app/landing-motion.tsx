"use client";

import { useEffect } from "react";

export default function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".nivalLanding");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root) return;

    const header = root.querySelector<HTMLElement>(".nvNav");
    const updateHeader = () => header?.classList.toggle("is-solid", window.scrollY > 20);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      return () => window.removeEventListener("scroll", updateHeader);
    }

    root.classList.add("nvMotionReady");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -28px 0px" });

    root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateHeader);
      root.classList.remove("nvMotionReady");
    };
  }, []);

  return null;
}
