import { DM_Sans, Fraunces } from "next/font/google";
import LandingHero from "./components/landing-hero";

const displayFont = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const textFont = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export default function HomePage() {
  return (
    <div className={`${displayFont.variable} ${textFont.variable}`}>
      <LandingHero />
    </div>
  );
}
