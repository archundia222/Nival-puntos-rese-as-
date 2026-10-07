import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const owner = "11111111-1111-4111-8111-111111111111",
  other = "22222222-2222-4222-8222-222222222222",
  staff = "44444444-4444-4444-8444-444444444444",
  b = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  bb = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  c = "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  h = "a".repeat(64);
async function setup(
  mode = "single",
  rules = { min_hours_between_visits: 0, max_visits_per_day: 100 },
) {
  const db = new PGlite();
  await db.exec(
    'create schema neon_auth;create table neon_auth."user"(id uuid primary key);',
  );
  await db.exec(readFileSync("database/foundation-neon.sql", "utf8"));
  await db.exec(readFileSync("database/points-neon.sql", "utf8"));
  await db.exec(readFileSync("database/points-lifecycle.sql", "utf8"));
  await db.exec(readFileSync("database/points-legacy-phones.sql", "utf8"));
  await db.query('insert into neon_auth."user" values($1),($2)', [
    owner,
    other,
  ]);
  await db.query(
    "insert into nival_pr.profiles(id,role,full_name) values($1,'owner','Owner'),($2,'owner','Other'),($3,'staff','Mesero')",
    [owner, other, staff],
  );
  await db.query(
    "insert into nival_pr.businesses(id,name,slug,status,paid_until) values($1,'Café Prueba','cafe-prueba','activo',now()+interval '30 days'),($2,'Otro','otro','activo',now()+interval '30 days')",
    [b, bb],
  );
  await db.query(
    "insert into nival_pr.memberships(user_id,business_id,role,pin_hash) values($1,$4,'owner',null),($2,$5,'owner',null),($3,$4,'staff','hash')",
    [owner, other, staff, b, bb],
  );
  await db.query(
    "insert into nival_pr.programs(business_id,name,mode,rules) values($1,'Premios',$2,$3::jsonb)",
    [b, mode, JSON.stringify(rules)],
  );
  const program = (
    await db.query("select id from nival_pr.programs where business_id=$1", [b])
  ).rows[0].id;
  const rewards = (
    await db.query(
      "insert into nival_pr.rewards(program_id,name,points_cost,position) values($1,'Café',2,0),($1,'Dona',2,1) returning id",
      [program],
    )
  ).rows;
  await db.query(
    "insert into nival_pr.customers(id,business_id,name,phone,device_token_hash,consent_at) values($1,$2,'Cliente','525512345678',$3,now())",
    [c, b, h],
  );
  return { db, rewards };
}
async function scope(db, role, id = "", hash = "") {
  await db.exec("reset role;set role " + role);
  await db.query(
    "select set_config('npr.user_id',$1,false),set_config('npr.device_token_hash',$2,false)",
    [id, hash],
  );
}
async function visit(db) {
  return db.query(
    "insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id) values($1,$2,'visit',1,$3)",
    [b, c, staff],
  );
}
let serial = 0;
async function redeem(db, r) {
  const path =
    b +
    "/" +
    c +
    "/" +
    `00000000-0000-4000-8000-${String(++serial).padStart(12, "0")}` +
    ".png";
  await scope(db, "npr_v2_auth", staff);
  await db.query("select nival_pr_private.store_photo($1,$2,$3,$4,$5)", [
    b,
    c,
    path,
    Buffer.from("1234567890123456").toString("base64"),
    "image/png",
  ]);
  await scope(db, "npr_v2_staff", staff);
  return (
    await db.query(
      "insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id,reward_id,evidence_path) values($1,$2,'redeem',-2,$3,$4,$5) returning id",
      [b, c, staff, r, path],
    )
  ).rows[0].id;
}
test("new registration has hash, consent and expiry; cookie scope expires and denies other customer", async () => {
  const { db } = await setup();
  try {
    await scope(db, "npr_v2_auth");
    const row = (
      await db.query(
        "select nival_pr_private.enroll_customer($1,$2,$3,$4) id",
        ["cafe-prueba", "Nuevo", "525500000000", "b".repeat(64)],
      )
    ).rows[0];
    const card = (
      await db.query("select nival_pr_private.customer_card($1,$2) data", [
        b,
        "b".repeat(64),
      ])
    ).rows[0].data;
    assert.equal(card.id, row.id);
    assert.equal(card.name, "Nuevo");
    assert.equal(
      (
        await db.query("select nival_pr_private.customer_card($1,$2) data", [
          bb,
          "b".repeat(64),
        ])
      ).rows[0].data,
      null,
    );
    await db.exec("reset role");
    const user = (
      await db.query(
        "select consent_at,token_expires_at,device_token_hash,consent_version from nival_pr.customers where id=$1",
        [row.id],
      )
    ).rows[0];
    assert.equal(user.device_token_hash, "b".repeat(64));
    assert.equal(user.consent_version, "2026-10-05");
    assert.ok(user.consent_at);
    await db.query(
      "update nival_pr.customers set token_expires_at=now()-interval '1 second' where id=$1",
      [row.id],
    );
    await scope(db, "npr_v2_auth");
    assert.equal(
      (
        await db.query("select nival_pr_private.customer_card($1,$2) data", [
          b,
          "b".repeat(64),
        ])
      ).rows[0].data,
      null,
    );
  } finally {
    await db.close();
  }
});
test("default six hours and one visit per Mexico day enforce rejection", async () => {
  const { db } = await setup("single", {
    min_hours_between_visits: 6,
    max_visits_per_day: 1,
  });
  try {
    await scope(db, "npr_v2_staff", staff);
    await visit(db);
    await assert.rejects(visit(db), /Visita demasiado reciente/);
    await db.exec("reset role");
    await db.query(
      "update nival_pr.programs set rules='{" +
        '"min_hours_between_visits":0,"max_visits_per_day":1' +
        "}'",
    );
    await scope(db, "npr_v2_staff", staff);
    await assert.rejects(visit(db), /Limite diario/);
  } finally {
    await db.close();
  }
});
test("redeem without verified photo rejects; valid photo creates linked pending redemption", async () => {
  const { db, rewards } = await setup();
  try {
    await scope(db, "npr_v2_staff", staff);
    await visit(db);
    await visit(db);
    await assert.rejects(
      db.query(
        "insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id,reward_id) values($1,$2,'redeem',-2,$3,$4)",
        [b, c, staff, rewards[0].id],
      ),
      /Foto obligatoria/,
    );
    const id = await redeem(db, rewards[0].id);
    await db.exec("reset role");
    const d = (
      await db.query("select * from nival_pr.redemptions where ledger_id=$1", [
        id,
      ])
    ).rows[0];
    assert.equal(d.status, "pendiente");
    assert.ok(d.photo_path);
    assert.equal(
      Number(
        (await db.query("select nival_pr.point_balance($1) n", [c])).rows[0].n,
      ),
      0,
    );
  } finally {
    await db.close();
  }
});
test("choose goal locked until redeemed; next choice works and owner reversal restores goal and balance", async () => {
  const { db, rewards } = await setup("choose");
  try {
    await scope(db, "npr_v2_auth");
    await db.query("select nival_pr_private.choose_goal($1,$2,$3)", [
      b,
      h,
      rewards[0].id,
    ]);
    await assert.rejects(
      db.query("select nival_pr_private.choose_goal($1,$2,$3)", [
        b,
        h,
        rewards[1].id,
      ]),
      /Goal locked/,
    );
    await scope(db, "npr_v2_staff", staff);
    await visit(db);
    await visit(db);
    const id = await redeem(db, rewards[0].id);
    await scope(db, "npr_v2_auth");
    await db.query("select nival_pr_private.choose_goal($1,$2,$3)", [
      b,
      h,
      rewards[1].id,
    ]);
    await db.exec("reset role");
    const d = (
      await db.query("select id from nival_pr.redemptions where ledger_id=$1", [
        id,
      ])
    ).rows[0].id;
    await scope(db, "npr_v2_auth", owner);
    await db.query("select nival_pr_private.review_redemption($1,$2,$3)", [
      b,
      d,
      "reverse",
    ]);
    await db.exec("reset role");
    assert.equal(
      (
        await db.query(
          "select reward_id from nival_pr.customer_goals where customer_id=$1 and locked",
          [c],
        )
      ).rows[0].reward_id,
      rewards[0].id,
    );
    assert.equal(
      Number(
        (await db.query("select nival_pr.point_balance($1) n", [c])).rows[0].n,
      ),
      2,
    );
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from nival_pr.point_ledger where type='adjust' and reversal_of=$1",
          [id],
        )
      ).rows[0].n,
      1,
    );
    await scope(db, "npr_v2_auth", owner);
    await assert.rejects(
      db.query("select nival_pr_private.review_redemption($1,$2,$3)", [
        b,
        d,
        "reverse",
      ]),
      /ya revertido/,
    );
  } finally {
    await db.close();
  }
});
test("sequence repeats after final reward and enforces order", async () => {
  const { db, rewards } = await setup("sequence");
  try {
    await scope(db, "npr_v2_staff", staff);
    for (let i = 0; i < 6; i++) await visit(db);
    await assert.rejects(
      redeem(db, rewards[1].id),
      /Premio fuera de secuencia/,
    );
    await redeem(db, rewards[0].id);
    await redeem(db, rewards[1].id);
    await redeem(db, rewards[0].id);
    await db.exec("reset role");
    assert.equal(
      (await db.query("select nival_pr_private.next_reward($1) id", [c]))
        .rows[0].id,
      rewards[1].id,
    );
  } finally {
    await db.close();
  }
});
test("owner isolation applies to customers, staff and private photos; staff cannot read photos", async () => {
  const { db, rewards } = await setup();
  try {
    await scope(db, "npr_v2_staff", staff);
    await visit(db);
    await visit(db);
    const id = await redeem(db, rewards[0].id);
    await db.exec("reset role");
    const d = (
      await db.query("select id from nival_pr.redemptions where ledger_id=$1", [
        id,
      ])
    ).rows[0].id;
    await scope(db, "npr_v2_owner", other);
    assert.equal(
      (await db.query("select id from nival_pr.customers")).rows.length,
      0,
    );
    await scope(db, "npr_v2_auth", other);
    await assert.rejects(
      db.query("select * from nival_pr_private.read_photo($1)", [d]),
      /Owner required/,
    );
    await assert.rejects(
      db.query("select * from nival_pr_private.list_staff($1)", [b]),
      /Owner required/,
    );
    await scope(db, "npr_v2_auth", staff);
    await assert.rejects(
      db.query("select * from nival_pr_private.read_photo($1)", [d]),
      /Owner required/,
    );
    await scope(db, "npr_v2_auth", owner);
    assert.equal(
      (await db.query("select * from nival_pr_private.read_photo($1)", [d]))
        .rows[0].mime,
      "image/png",
    );
    await scope(db, "npr_v2_owner", owner);
    await assert.rejects(
      db.query("select * from nival_pr_private.evidence_photos"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
test("owner creates PIN-only staff and immediate deactivation revokes existing session and movement", async () => {
  const { db } = await setup();
  try {
    await scope(db, "npr_v2_auth", owner);
    const pin = "scrypt$" + "a".repeat(32) + "$" + "b".repeat(128);
    const id = (
      await db.query(
        "select nival_pr_private.manage_staff($1,null,$2,$3,true) id",
        [b, "Mesero Nuevo", pin],
      )
    ).rows[0].id;
    await db.query("select nival_pr_private.issue_staff_session($1,$2,$3)", [
      id,
      b,
      "c".repeat(64),
    ]);
    assert.equal(
      (
        await db.query("select * from nival_pr_private.staff_session($1)", [
          "c".repeat(64),
        ])
      ).rows.length,
      1,
    );
    await db.query(
      "select nival_pr_private.manage_staff($1,$2,null,null,false)",
      [b, id],
    );
    assert.equal(
      (
        await db.query("select * from nival_pr_private.staff_session($1)", [
          "c".repeat(64),
        ])
      ).rows.length,
      0,
    );
    await scope(db, "npr_v2_staff", id);
    await assert.rejects(
      db.query(
        "insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id) values($1,$2,'visit',1,$3)",
        [b, c, id],
      ),
      /actor no autorizado/,
    );
  } finally {
    await db.close();
  }
});
test("recovery one-use expiring link rotates hash, never grants access by phone alone", async () => {
  const { db } = await setup();
  try {
    await scope(db, "npr_v2_auth", staff);
    await db.query("select nival_pr_private.issue_recovery($1,$2,$3)", [
      b,
      c,
      "d".repeat(64),
    ]);
    await scope(db, "npr_v2_auth");
    await db.query("select nival_pr_private.consume_recovery($1,$2,$3)", [
      "cafe-prueba",
      "d".repeat(64),
      "e".repeat(64),
    ]);
    await assert.rejects(
      db.query("select nival_pr_private.consume_recovery($1,$2,$3)", [
        "cafe-prueba",
        "d".repeat(64),
        "f".repeat(64),
      ]),
      /Link expired/,
    );
    assert.equal(
      (
        await db.query("select nival_pr_private.customer_card($1,$2) data", [
          b,
          h,
        ])
      ).rows[0].data,
      null,
    );
    assert.equal(
      (
        await db.query("select nival_pr_private.customer_card($1,$2) data", [
          b,
          "e".repeat(64),
        ])
      ).rows[0].data.id,
      c,
    );
  } finally {
    await db.close();
  }
});

test("legacy ten-digit phone is searchable without admitting duplicate registration", async () => {
  const { db } = await setup();
  try {
    await db.query("update nival_pr.customers set phone=$1 where id=$2", [
      "5512345678",
      c,
    ]);
    await scope(db, "npr_v2_auth", staff);
    const r = (
      await db.query(
        "select nival_pr_private.staff_customer($1,$2,null) data",
        [b, "525512345678"],
      )
    ).rows[0].data;
    assert.equal(r.id, c);
    assert.equal(r.phone, "525512345678");
    await scope(db, "npr_v2_auth");
    await assert.rejects(
      db.query("select nival_pr_private.enroll_customer($1,$2,$3,$4)", [
        "cafe-prueba",
        "Falso",
        "525512345678",
        "f".repeat(64),
      ]),
      /duplicate phone/,
    );
  } finally {
    await db.close();
  }
});

test("program identity is business-scoped and public card receives saved name, color, logo and rewards", async () => {
  const { db } = await setup();
  try {
    const logo="data:image/png;base64,iVBORw0KGgo=";
    await scope(db, "npr_v2_owner", owner);
    await db.query("update nival_pr.programs set name=$1,color=$2,logo_url=$3,points_per_visit=3,rules=$4::jsonb where business_id=$5",["Club Café","#123456",logo,JSON.stringify({min_hours_between_visits:8,max_visits_per_day:2}),b]);
    await scope(db, "npr_v2_auth");
    const data=(await db.query("select nival_pr_private.public_business($1) data",["cafe-prueba"])).rows[0].data;
    assert.equal(data.program.name,"Club Café");
    assert.equal(data.program.color,"#123456");
    assert.equal(data.program.logo_url,logo);
    assert.equal(data.rewards[0].name,"Café");
    await db.exec("reset role");
    const saved=(await db.query("select points_per_visit,rules from nival_pr.programs where business_id=$1",[b])).rows[0];
    assert.equal(saved.points_per_visit,3);
    assert.equal(saved.rules.min_hours_between_visits,8);
    assert.equal(saved.rules.max_visits_per_day,2);
    await scope(db, "npr_v2_owner", other);
    assert.equal((await db.query("select id from nival_pr.programs where business_id=$1",[b])).rows.length,0);
  } finally {
    await db.close();
  }
});

test("pilot journey: customer entry, staff visit, repeat rejection, photographed redemption and owner review stay consistent", async()=>{
 const {db,rewards}=await setup("single",{min_hours_between_visits:0,max_visits_per_day:2});
 try{
  await scope(db,"npr_v2_auth");
  const publicData=(await db.query("select nival_pr_private.public_business($1) data",["cafe-prueba"])).rows[0].data;
  assert.equal(publicData.slug,"cafe-prueba");assert.equal(publicData.active,true);
  const token="9".repeat(64);
  const enrolled=(await db.query("select nival_pr_private.enroll_customer($1,$2,$3,$4) id",["cafe-prueba","Piloto","525500001234",token])).rows[0].id;
  await scope(db,"npr_v2_auth",staff);
  const lookup=(await db.query("select nival_pr_private.staff_customer($1,null,$2) data",[b,enrolled])).rows[0].data;
  assert.equal(lookup.name,"Piloto");assert.equal(Number(lookup.balance),0);
  await scope(db,"npr_v2_staff",staff);
  await db.query("insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id) values($1,$2,'visit',1,$3)",[b,enrolled,staff]);
  await db.query("insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id) values($1,$2,'visit',1,$3)",[b,enrolled,staff]);
  await assert.rejects(db.query("insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id) values($1,$2,'visit',1,$3)",[b,enrolled,staff]),/Limite diario/);
  const path=b+"/"+enrolled+"/99999999-9999-4999-8999-999999999999.png";
  await scope(db,"npr_v2_auth",staff);await db.query("select nival_pr_private.store_photo($1,$2,$3,$4,$5)",[b,enrolled,path,Buffer.from("1234567890123456").toString("base64"),"image/png"]);
  await scope(db,"npr_v2_staff",staff);
  const ledger=(await db.query("insert into nival_pr.point_ledger(business_id,customer_id,type,points,staff_id,reward_id,evidence_path) values($1,$2,'redeem',-2,$3,$4,$5) returning id",[b,enrolled,staff,rewards[0].id,path])).rows[0];
  await scope(db,"npr_v2_auth");const card=(await db.query("select nival_pr_private.customer_card($1,$2) data",[b,token])).rows[0].data;
  assert.equal(Number(card.balance),0);assert.equal(card.history[0].type,"redeem");
  await db.exec("reset role");const redemption=(await db.query("select id,status from nival_pr.redemptions where ledger_id=$1",[ledger.id])).rows[0];assert.equal(redemption.status,"pendiente");
  await scope(db,"npr_v2_auth",owner);assert.equal((await db.query("select mime from nival_pr_private.read_photo($1)",[redemption.id])).rows[0].mime,"image/png");
 }finally{await db.close();}
});
