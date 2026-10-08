import type { Actor } from "./db";
import { requireBusiness } from "./session";
import { Scanner } from "../points/scanner";
export async function MovementWorkspace({
  actor,
  businessId,
  mode="visit",
}: {
  actor: Actor;
  businessId: string;
  mode?:"visit"|"redeem";
}) {
  await requireBusiness(actor, businessId);
  return <Scanner businessId={businessId} mode={mode}/>;
}
