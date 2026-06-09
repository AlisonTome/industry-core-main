import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Hero } from "@/components/site/Hero";
import { TrustMetrics } from "@/components/site/TrustMetrics";
import { ProcessFlow } from "@/components/site/ProcessFlow";
import { Capabilities } from "@/components/site/Capabilities";
import { ProcurementSplit } from "@/components/site/ProcurementSplit";
import { Testimonials } from "@/components/site/Testimonials";
import { CTA } from "@/components/site/CTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <Hero />
        <TrustMetrics />
        <ProcessFlow />
        <Capabilities />
        <ProcurementSplit />
        <Testimonials />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
