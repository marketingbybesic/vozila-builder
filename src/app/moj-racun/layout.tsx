import { Container } from "@/components/ui/container";
import { DashboardNav } from "@/components/dashboard-nav";

export default function MojRacunLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="py-8 md:py-12">
      <div className="grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-12">
        <DashboardNav />
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
