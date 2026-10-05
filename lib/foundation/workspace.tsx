import type { Actor } from "./db";
import { requireBusiness } from "./session";
import { Scanner } from "../points/scanner";
export async function MovementWorkspace({
  actor,
  businessId,
}: {
  actor: Actor;
  businessId: string;
}) {
  await requireBusiness(actor, businessId);
  return <Scanner businessId={businessId} />;
}
