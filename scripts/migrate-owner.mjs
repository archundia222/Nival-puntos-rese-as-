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
  const scope=process.argv.includes("--report-scope");
  const name = scope?"owner-report-scope":"owner-panel-v4";
  const sql=readFileSync(scope?"database/owner-report-scope.sql":"database/owner-panel.sql","utf8"), checksum=createHash("sha256").update(sql).digest("hex");
  const {
    rows: [prior],
  } = await client.query(
    "select checksum from nival_pr_private.schema_versions where name=$1",
    [name],
  );
  if (prior) {
    if (prior.checksum !== checksum)
      throw Error("Ya existe otra versión de owner-panel-v4.");
    console.log("Panel owner v4 ya aplicada.");
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
    console.log("Panel owner v4 aplicada en la base independiente.");
  }
} catch (e) {
  await client.query("rollback").catch(() => {});
  console.error(e.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
