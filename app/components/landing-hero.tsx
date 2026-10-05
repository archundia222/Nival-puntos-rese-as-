"use client";

import { motion, useReducedMotion } from "framer-motion";
import { landingContent } from "../content";
import styles from "./landing-hero.module.css";

const whatsappHref = `https://wa.me/${landingContent.hero.whatsappPhone}?text=${encodeURIComponent(landingContent.hero.whatsappMessage)}`;

function BrandMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 36 36" className={styles.brandMark}>
      <rect x="1" y="1" width="34" height="34" rx="11" fill="currentColor" />
      <path d="M10 24V12h3.2l9.6 7.4V12H26v12h-3.1l-9.7-7.5V24H10Z" fill="#F4F0E5" />
    </svg>
  );
}

function Star() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={styles.star}>
      <path d="m10 1.7 2.55 5.17 5.7.83-4.12 4.02.97 5.68L10 14.72l-5.1 2.68.97-5.68L1.75 7.7l5.7-.83L10 1.7Z" fill="currentColor" />
    </svg>
  );
}

export default function LandingHero() {
  const reduceMotion = useReducedMotion();
  const { hero, navigation, brand, brandHomeLabel } = landingContent;

  return (
    <div className={styles.landing}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label={brandHomeLabel}>
          <BrandMark />
          <span className={styles.brandName}>{brand}</span>
          <span className={styles.brandProduct}>{navigation.product}</span>
        </a>
        <nav className={styles.navigation} aria-label={navigation.label}>
          <a className={styles.demoLink} href="/demo">{navigation.demo}</a>
          <a className={styles.accessLink} href="/acceso">{navigation.access}</a>
        </nav>
      </header>

      <main className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            {hero.eyebrow}
          </p>
          <h1 className={styles.title}>
            {hero.titleStart} <span>{hero.titleEnd}</span>
          </h1>
          <p className={styles.subtitle}>{hero.subtitle}</p>

          <div className={styles.actions}>
            <a className={styles.whatsappButton} href={whatsappHref} target="_blank" rel="noreferrer">
              {hero.whatsappLabel}
              <svg aria-hidden="true" viewBox="0 0 20 20" className={styles.arrow}>
                <path d="M4 10h11M10 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a className={styles.secondaryButton} href="/demo">{navigation.demo}</a>
          </div>
          <p className={styles.quickNote}>{hero.quickNote}</p>
        </div>

        <div className={styles.visual} role="img" aria-label={hero.visualAlt}>
          <div className={styles.visualLabel}>
            <span className={styles.labelRule} />
            <span>{hero.visualLabel}</span>
          </div>
          <div className={styles.orbit} aria-hidden="true">
            <svg viewBox="0 0 480 440" className={styles.orbitSvg}>
              <path d="M83 344c-49-67-43-169 12-235C150 40 276 26 354 79c66 45 91 129 60 199" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 7" />
              <circle cx="90" cy="326" r="4" fill="currentColor" />
              <circle cx="406" cy="245" r="5" fill="currentColor" />
            </svg>
          </div>

          <motion.div
            className={styles.phone}
            animate={reduceMotion ? undefined : { y: [0, -6, 0], rotate: [-3, -2.4, -3] }}
            transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className={styles.phoneFrame}>
              <div className={styles.phoneTop}>
                <span className={styles.phoneCamera} />
                <span className={styles.phoneTime}>{hero.phoneTime}</span>
                <span className={styles.phoneSignal} aria-hidden="true"><i /><i /><i /></span>
              </div>
              <div className={styles.phoneScreen}>
                <div className={styles.storeHeader}>
                  <span className={styles.storeMonogram}>{hero.businessInitial}</span>
                  <span className={styles.storeType}>{hero.productLabel}</span>
                </div>
                <h2 className={styles.storeName}>{hero.businessName}</h2>
                <p className={styles.welcome}>{hero.greeting}, {hero.customerName}</p>

                <div className={styles.pointsCard}>
                  <div className={styles.pointsTopline}>
                    <span>{hero.visitsLabel}</span>
                    <span className={styles.visitsCount}>{hero.visitsCount}</span>
                  </div>
                  <div className={styles.progressRail} aria-hidden="true">
                    <motion.span
                      className={styles.progressFill}
                      initial={false}
                      animate={reduceMotion ? { scaleX: 0.5 } : { scaleX: [0.5, 0.67, 0.5] }}
                      transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <p className={styles.reward}>{hero.reward}</p>
                  <div className={styles.stamps} aria-hidden="true">
                    {[0, 1, 2, 3, 4, 5].map((stamp) => (
                      <span className={stamp < 3 ? styles.stampFilled : styles.stamp} key={stamp}>
                        {stamp < 3 ? "✓" : stamp === 3 ? "·" : ""}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.visitRow}>
                  <span className={styles.visitDot} aria-hidden="true" />
                  <span>{hero.visitRecorded}</span>
                  <strong>{hero.pointsBadge}</strong>
                </div>
                <div className={styles.phoneBottom} aria-hidden="true">
                  <span className={styles.homeBar} />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={styles.reviewToast}
            initial={false}
            animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: [0, 1, 1, 0], y: [10, 0, 0, -5] }}
            transition={reduceMotion ? undefined : { duration: 6.8, repeat: Infinity, repeatDelay: 1.4, times: [0, 0.16, 0.78, 1], ease: "easeInOut" }}
          >
            <div className={styles.toastTop}>
              <span className={styles.toastMark} aria-hidden="true">G</span>
              <span className={styles.toastTitle}>{hero.reviewTitle}</span>
              <span className={styles.toastNow}>{hero.reviewTime}</span>
            </div>
            <div className={styles.stars} aria-label={hero.reviewStarsLabel}>
              {[0, 1, 2, 3, 4].map((star) => <Star key={star} />)}
            </div>
            <p className={styles.reviewAuthor}>{hero.reviewAuthor}</p>
            <p className={styles.reviewText}>{hero.reviewText}</p>
          </motion.div>

          <div className={styles.cornerNote} aria-hidden="true">
            <span>{hero.cornerNumber}</span>
            <span className={styles.cornerLine} />
            <span>{hero.cornerLabel}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
