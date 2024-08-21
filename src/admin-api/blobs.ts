import router from "./router.js";
import db, { blobDB } from "../db/db.js";
import { getBlobURL } from "../helpers/blob.js";
import storage from "../storage/index.js";
import { parseGetListQuery, setContentRange } from "./helpers.js";
import { buildConditionsFromFilter, buildOrderByFromSort } from "../helpers/sql.js";
import { Request } from "koa";

function blobRowToBlob(row: any, req?: Request) {
  return {
    ...row,
    owners: row.owners?.split(",") ?? [],
    id: row.sha256,
    url: getBlobURL(row, req ? req.protocol + "://" + req.host : undefined),
  };
}
function safeColumn(name: string) {
  if (["sha256", "type", "size", "uploaded"].includes(name)) return name;
  throw new Error("Invalid table name");
}

// getOne
router.get("/blobs/:id", (ctx) => {
  const row = db.prepare(baseBlobSql + " WHERE sha256 = ?" + groupByBlobHash).get(ctx.params.id);
  if (row) ctx.body = blobRowToBlob(row, ctx.request);
});

// delete blob
router.delete("/blobs/:id", async (ctx) => {
  await blobDB.removeBlob(ctx.params.id);
  if (await storage.hasBlob(ctx.params.id)) await storage.removeBlob(ctx.params.id);
  ctx.body = { success: true };
});

// getList / getMany
const baseBlobSql = `
SELECT blobs.*,GROUP_CONCAT(owners.pubkey, ',') as owners FROM blobs
  LEFT JOIN owners ON owners.blob = blobs.sha256
`.trim();
const groupByBlobHash = " GROUP BY blobs.sha256";

router.get("/blobs", (ctx) => {
  let sql = baseBlobSql;
  let params: (string | number)[] = [];

  const { filter, sort, range } = parseGetListQuery(ctx.query);

  const conditions = buildConditionsFromFilter(filter, ["sha256", "type"], safeColumn);

  sql += conditions.sql;
  params.push(...conditions.params);

  sql += groupByBlobHash;

  sql += buildOrderByFromSort(sort, safeColumn);

  if (range) {
    sql += " LIMIT ? OFFSET ?";
    params.push(range[1] - range[0], range[0]);
  }

  const total = (
    db.prepare("SELECT COUNT(*) as count FROM blobs" + conditions.sql).get(conditions.params) as { count: number }
  ).count;
  const blobs = db.prepare(sql).all(...params) as any[];

  setContentRange(ctx, range, blobs, total);
  ctx.body = blobs.map((r) => blobRowToBlob(r, ctx.request));
});
