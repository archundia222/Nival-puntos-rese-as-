"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query, authScope } from "../foundation/db";
import { randomToken, sha256 } from "../foundation/security.mjs";
import { cookieOptions } from "../foundation/session";
import type { Result } from "../foundation/actions";
export async function recoverCard(_: Result, f: FormData): Promise<Result> {
  const slug = String(f.get("slug") || ""),
    token = String(f.get("token") || "");
  if (!/^[a-z0-9-]{1,100}$/.test(slug) || !/^[A-Za-z0-9_-]{43}$/.test(token))
    return { error: "Este enlace no es válido." };
  try {
    const next = randomToken();
    const [r] = await query(
      authScope(),
      "select nival_pr_private.consume_recovery($1,$2,$3) id",
      [slug, sha256(token), sha256(next)],
    );
    (await cookies()).set("nival_customer_" + r.id, next, {
      ...cookieOptions,
      maxAge: 365 * 86400,
    });
  } catch {
    return {
      error:
        "El enlace venció o ya fue utilizado. Pide al mesero un nuevo enlace.",
    };
  }
  redirect("/b/" + slug);
}
