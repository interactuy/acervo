import { EditorialSections } from "@/modules/home/editorial-sections";
import { HomeEditorialHero } from "@/modules/home/home-editorial-hero";

export function HomePage() {
  return (
    <>
      <HomeEditorialHero />
      <EditorialSections />
    </>
  );
}
