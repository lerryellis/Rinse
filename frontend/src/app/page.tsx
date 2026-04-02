import Hero from "@/components/Hero";
import ToolsGrid from "@/components/ToolsGrid";
import CompareSection from "@/components/CompareSection";
import HowToSection from "@/components/HowToSection";
import ReviewsSection from "@/components/ReviewsSection";

export default function Home() {
  return (
    <>
      <Hero />
      <ToolsGrid />
      <CompareSection />
      <HowToSection />
      <ReviewsSection />
    </>
  );
}
