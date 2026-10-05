import { foundationEnabled, query } from "../../lib/foundation/db";
import { requireRole } from "../../lib/foundation/session";
import { logout } from "../../lib/foundation/actions";
import { MovementWorkspace } from "../../lib/foundation/workspace";
import { redirect } from "next/navigation";
import { InstallStaff } from "../../lib/points/install-staff";
export const metadata = {
  manifest: "/staff.webmanifest",
  icons: { apple: "/staff-icon-192.png" },
  appleWebApp: { capable: true, title: "Nival Mesero" },
};
export const dynamic = "force-dynamic";
export default async function Staff() {
  if (!foundationEnabled()) redirect("/staff/acceso");
  const actor = await requireRole("staff");
  if (!actor.businessId) redirect("/staff/acceso");
  const [b] = await query(
    actor,
    "select id,name,status from nival_pr.businesses where id=$1",
    [actor.businessId],
  );
  return (
    <main className="dashboard">
      <header className="dashHead">
        <div>
          <small>NIVAL · MOSTRADOR</small>
          <h1>{b?.name || "Tu negocio"}</h1>
          <p>{actor.name} · Visitas y canjes</p>
        </div>
        <form action={logout}>
          <button>Cerrar sesión</button>
        </form>
      </header>
      <InstallStaff />
      <MovementWorkspace actor={actor} businessId={actor.businessId} />
    </main>
  );
}
