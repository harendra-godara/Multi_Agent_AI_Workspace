import Navbar from "../components/layout/Navbar";
import Hero from "../components/landing/Hero";
import Agents from "../components/agents/Agents";
import WorkspacePreview from "../components/workspace/WorkspacePreview";
import Features from "../components/landing/Features";
import CTA from "../components/landing/CTA";
import Footer from "../components/layout/Footer";

function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />

      <main>
        <Hero />
        <Agents />
        <WorkspacePreview />
        <Features />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}

export default Home;
