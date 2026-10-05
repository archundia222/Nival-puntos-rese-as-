import { Pool, neonConfig } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
if (!process.argv.includes("--apply")) throw Error("Se requiere --apply.");
neonConfig.webSocketConstructor = globalThis.WebSocket;
const pool = new Pool({ connectionString: process.env.DATABASE_URL }),
  client = await pool.connect();
try {
  const {
    rows: [target],
  } = await client.query("select current_database() name");
  if (target.name !== "nival_puntos_resenas") throw Error("Base incorrecta.");
  const lifecycle = process.argv.includes("--lifecycle");
  const legacy = process.argv.includes("--legacy-phones");
  const name = legacy
    ? "points-legacy-phones"
    : lifecycle
      ? "points-lifecycle"
      : "points-v3";
  const sql = readFileSync(
      legacy
        ? "database/points-legacy-phones.sql"
        : lifecycle
          ? "database/points-lifecycle.sql"
          : "database/points-neon.sql",
      "utf8",
    ),
    checksum = createHash("sha256").update(sql).digest("hex");
  const {
    rows: [prior],
  } = await client.query(
    "select checksum from nival_pr_private.schema_versions where name=$1",
    [name],
  );
  if (prior) {
    if (prior.checksum !== checksum)
      throw Error("Ya existe otra versión de points-v3.");
    console.log("Points v3 ya aplicada.");
  } else {
    await client.query(
      sql.replace(
        /commit;\s*$/i,
        "insert into nival_pr_private.schema_versions(name,checksum) values('" +
          name +
          "','" +
          checksum +
          "');commit;",
      ),
    );
    console.log("Points v3 aplicada en la base independiente.");
  }
} catch (e) {
  await client.query("rollback").catch(() => {});
  console.error(e.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
