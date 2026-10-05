import { ActionForm } from "../../../../lib/foundation/forms";
import { Hidden } from "../../../../lib/foundation/fields";
import { recoverCard } from "../../../../lib/points/recovery";
export default async function Recovery({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug } = await params,
    { token } = await searchParams;
  return (
    <main className="dashboard">
      <h1>Recupera tu tarjeta</h1>
      <p>
        Confirma para vincular este navegador a tus puntos. El acceso del
        dispositivo anterior dejará de funcionar.
      </p>
      <ActionForm action={recoverCard} label="Abrir mi tarjeta">
        <Hidden name="slug" value={slug} />
        <Hidden name="token" value={token || ""} />
      </ActionForm>
    </main>
  );
}
