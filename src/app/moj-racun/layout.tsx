import { Container } from "@/components/ui/container";
import { DashboardNav } from "@/components/dashboard-nav";
import { requireUser } from "@/lib/session";
import { db } from "@/db";

export default async function MojRacunLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const threads = await db().listThreads(user.id);
  const unread = threads.reduce((s, t) => s + t.unreadCount, 0);

  return (
    <Container className="py-8 md:py-12">
      <div className="grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-12">
        <DashboardNav
          user={{
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
          }}
          unreadMessages={unread}
        />
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
