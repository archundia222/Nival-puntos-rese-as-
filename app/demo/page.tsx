import { DM_Sans, Fraunces } from "next/font/google";
import Link from "next/link";
import { landingContent } from "../content";
import styles from "./demo.module.css";

const displayFont = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const textFont = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

function Stars() {
  return (
    <span className={styles.stars} aria-label={landingContent.demo.reviewStars}>
      ★★★★★
    </span>
  );
}

export default function DemoPage() {
  const { brand, demo } = landingContent;

  return (
    <div className={`${styles.demo} ${displayFont.variable} ${textFont.variable}`}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          <span className={styles.brandMark} aria-hidden="true">N</span>
          <span>{brand}</span>
          <span className={styles.brandSuffix}>{landingContent.navigation.product}</span>
        </Link>
        <Link className={styles.backLink} href="/">{demo.back}</Link>
      </header>

      <main className={styles.main}>
        <div className={styles.notice}>
          <span className={styles.noticeDot} aria-hidden="true" />
          <span>{demo.notice}</span>
        </div>

        <section className={styles.intro}>
          <p className={styles.eyebrow}>{demo.eyebrow}</p>
          <h1>{demo.title}</h1>
          <p>{demo.intro}</p>
        </section>

        <div className={styles.panels}>
          <section className={styles.pointsPanel} aria-labelledby="demo-points-title">
            <div className={styles.panelHeading}>
              <span className={styles.panelIndex}>01</span>
              <span className={styles.panelLabel}>{demo.pointsLabel}</span>
            </div>
            <div className={styles.customerCard}>
              <div className={styles.customerTop}>
                <div>
                  <p className={styles.customerName}>{demo.customerName}</p>
                  <p className={styles.customerDetail}>{demo.customerDetail}</p>
                </div>
                <span className={styles.customerInitial} aria-hidden="true">{demo.customerName.charAt(0)}</span>
              </div>
              <h2 id="demo-points-title">{demo.visitsLabel}</h2>
              <div className={styles.visitsValue}>{demo.visitsValue}</div>
              <div className={styles.progressTrack} aria-hidden="true">
                <span />
              </div>
              <p className={styles.rewardLabel}>{demo.rewardLabel}</p>
              <p className={styles.reward}>{demo.reward}</p>
              <div className={styles.stampRow} aria-hidden="true">
                {[0, 1, 2, 3, 4, 5].map((stamp) => <span className={stamp < 3 ? styles.stampDone : styles.stamp} key={stamp}>{stamp < 3 ? "✓" : ""}</span>)}
              </div>
            </div>
            <p className={styles.panelFoot}>{demo.visualFooter}</p>
          </section>

          <section className={styles.reviewsPanel} aria-labelledby="demo-reviews-title">
            <div className={styles.panelHeading}>
              <span className={styles.panelIndex}>02</span>
              <span className={styles.panelLabel}>{demo.reviewLabel}</span>
            </div>
            <h2 className={styles.reviewHeading} id="demo-reviews-title">{demo.reviewTitle}</h2>
            <article className={styles.reviewCard}>
              <div className={styles.reviewTop}>
                <span className={styles.googleMark} aria-hidden="true">G</span>
                <Stars />
              </div>
              <p className={styles.reviewAuthor}>{demo.reviewOneAuthor}</p>
              <p className={styles.reviewText}>{demo.reviewOneText}</p>
            </article>
            <article className={styles.reviewCard}>
              <div className={styles.reviewTop}>
                <span className={styles.googleMark} aria-hidden="true">G</span>
                <Stars />
              </div>
              <p className={styles.reviewAuthor}>{demo.reviewTwoAuthor}</p>
              <p className={styles.reviewText}>{demo.reviewTwoText}</p>
            </article>
            <p className={styles.panelFoot}>{demo.visualFooter}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
