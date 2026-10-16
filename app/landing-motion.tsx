"use client";

import { useEffect } from "react";

export default function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".nivalLanding");
    if (!root) return;
    const header = root.querySelector<HTMLElement>(".nvNav");
    const updateHeader = () =>
      header?.classList.toggle("is-solid", window.scrollY > 20);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return () => window.removeEventListener("scroll", updateHeader);
    }
    const elements = root.querySelectorAll<HTMLElement>(
      [
        ".nvIndustryTile",
        ".nvHowStep",
        ".nvReviewsCopy",
        ".nvReviewVisual",
        ".nvOwnerCopy",
        ".nvOwnerVisual",
        ".nvPlanCard",
        ".nvFaqIntro",
      ].join(","),
    );
    elements.forEach((element) => element.classList.add("nvReveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateHeader);
    };
  }, []);

  return null;
}
