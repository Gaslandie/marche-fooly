const test = require("node:test");
const assert = require("node:assert/strict");
const { Readable } = require("node:stream");

// Pas de connexion à MongoDB. Images temporaires et requêtes privées sans compte.
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/test-not-used";
process.env.JWT_SECRET = "cache-test-only-secret-not-used";
const images = require("../src/services/productImageService");
const fileId = "507f1f77bcf86cd799439011";
let downloads = 0;
const bytes = Buffer.from("image-test");
images.getBucket = () => ({
  find: (query) => ({
    limit: () => ({
      toArray: async () => query._id.toString() === fileId ? [{
        _id: query._id,
        metadata: { contentHash: "test-hash", variant: "large", ownerSeller: "507f1f77bcf86cd799439031" },
        contentType: "image/webp",
        length: bytes.length,
        uploadDate: new Date("2026-10-17T00:00:00Z"),
      }] : [],
    }),
  }),
  openDownloadStream: () => {
    downloads += 1;
    return Readable.from(bytes);
  },
});
const app = require("../src/app");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const { signAuthToken } = require("../src/utils/jwt");

test("cache HTTP : données privées exclues, images versionnées réutilisées", async (t) => {
  const originalExists = Product.exists;
  Product.exists = async () => ({ _id: fileId });
  t.after(() => { Product.exists = originalExists; });
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  for (const path of ["/api/auth/me", "/api/orders/mine", "/api/admin/users", "/api/favorites"]) {
    const res = await fetch(base + path);
    assert.equal(res.status, 401, path);
    assert.match(res.headers.get("cache-control"), /private.*no-store/, path);
    const invalid = await fetch(base + path, { headers: { Authorization: "Bearer invalid-test-session" } });
    assert.equal(invalid.status, 401, path);
    assert.match(invalid.headers.get("cache-control"), /no-store/, path);
  }

  const accounts = ["507f1f77bcf86cd799439021", "507f1f77bcf86cd799439022"].map(id => ({
    _id: id, firstName: "Compte de test", lastName: "Local", role: "customer", status: "active",
  }));
  const originalFind = User.findById;
  User.findById = async id => accounts.find(user => user._id === id);
  t.after(() => { User.findById = originalFind; });
  const tokenA = signAuthToken(accounts[0]);
  for (const user of accounts) {
    const res = await fetch(`${base}/api/auth/me`, {
      headers: { Authorization: `Bearer ${signAuthToken(user)}` },
    });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("cache-control"), /private.*no-store/);
    assert.equal((await res.json()).data.user.id, user._id, "aucun mélange entre comptes");
  }
  const customerAdmin = await fetch(`${base}/api/admin/users`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.equal(customerAdmin.status, 403);
  assert.match(customerAdmin.headers.get("cache-control"), /no-store/);
  accounts[0].status = "suspended";
  const revoked = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  assert.equal(revoked.status, 403, "une session suspendue est refusée immédiatement");
  assert.match(revoked.headers.get("cache-control"), /no-store/);

  const first = await fetch(`${base}/api/media/images/${fileId}?v=test`);
  assert.equal(first.status, 200);
  assert.match(first.headers.get("cache-control"), /public.*max-age=60.*must-revalidate/);
  assert.equal(await first.text(), bytes.toString());
  const second = await fetch(`${base}/api/media/images/${fileId}?v=test`, {
    headers: { "If-None-Match": first.headers.get("etag") },
  });
  assert.equal(second.status, 304);
  assert.equal(await second.text(), "");
  assert.equal(downloads, 1, "la seconde lecture ne recharge pas le fichier");

  for (const id of ["invalide", "507f1f77bcf86cd799439012"]) {
    const res = await fetch(`${base}/api/media/images/${id}`);
    assert.equal(res.status, 404);
    assert.match(res.headers.get("cache-control"), /no-store/);
  }
});
