import { HomeHero } from "@/components/sections/HomeHero";
import { HomeMarquee } from "@/components/sections/HomeMarquee";
import { ImpactSection } from "@/components/sections/ImpactSection";
import { HorizontalGallery } from "@/components/sections/HorizontalGallery";
import { OnOffTrackSection } from "@/components/sections/OnOffTrackSection";
import { HelmetsGrid } from "@/components/sections/HelmetsGrid";


export default function Home() {
  return (
    <main className="relative z-10">

      <HomeHero />
      <HomeMarquee />
      <ImpactSection />
      <HorizontalGallery />
      <OnOffTrackSection />
      <HelmetsGrid />
    </main>
  );
}
