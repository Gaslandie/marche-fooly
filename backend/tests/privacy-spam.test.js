const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");

process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/test-not-used";
process.env.JWT_SECRET = "privacy-spam-test-only-not-a-production-key";
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const SellerProfile = require("../src/models/SellerProfile");
const Notification = require("../src/models/Notification");
const Favorite = require("../src/models/Favorite");
const Contact = require("../src/models/ContactMessage");
const Newsletter = require("../src/models/NewsletterSubscriber");
const mailer = require("../src/utils/mailer");
// Aucun vrai email : échec volontaire pour vérifier l'absence de données privées dans les logs.
mailer.sendNotificationEmail = async () => { throw new Error("PRIVATE_TEST_EMAIL_OR_SECRET"); };
const notifications = require("../src/services/notificationService");
const { signAuthToken } = require("../src/utils/jwt");
const { update } = require("../src/controllers/productController");
const app = require("../src/app");
const { authRateLimiter, publicFormRateLimiter, uploadRateLimiter } = require("../src/middlewares/rateLimiters");
const ids = ["507f1f77bcf86cd799439021", "507f1f77bcf86cd799439022"];
const productId = "507f1f77bcf86cd799439041";
const sellerId = "507f1f77bcf86cd799439031";
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
async function localServer(t) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  return (path, { token, body, ...init } = {}) => fetch(base + path, {
    ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  });
}

test("notifications et favoris : changer de compte ou injecter un autre propriétaire ne donne aucun accès", async t => {
  const users = ids.map(_id => ({ _id, role: "customer", status: "active" }));
  t.mock.method(User, "findById", async id => users.find(user => user._id === id));
  const entries = ids.map((recipient, index) => ({
    _id: `507f1f77bcf86cd79943905${index}`, recipient, title: `Notification ${index}`, message: `Message privé ${index}`,
    emailError: "PRIVATE_MAIL_ERROR", emailSentAt: new Date(), readAt: null, save: async () => {},
  }));
  const matching = query => entries.filter(entry => Object.entries(query).every(([key, value]) => entry[key] === value));
  t.mock.method(Notification, "find", query => ({ sort() { return this; }, skip() { return this; }, limit: async () => matching(query) }));
  t.mock.method(Notification, "countDocuments", async query => matching(query).length);
  t.mock.method(Notification, "findOne", async query => matching(query)[0]);
  t.mock.method(Notification, "updateMany", async (query, update) => {
    const rows = matching(query);
    rows.forEach(row => Object.assign(row, update.$set));
    return { modifiedCount: rows.length };
  });
  const favorites = [{ user: ids[1], product: productId }];
  t.mock.method(Favorite, "deleteOne", async query => {
    const index = favorites.findIndex(row => row.user === query.user && row.product === query.product);
    if (index >= 0) favorites.splice(index, 1);
    return { deletedCount: index >= 0 ? 1 : 0 };
  });
  t.mock.method(Favorite, "aggregate", async pipeline => {
    assert.ok(ids.includes(pipeline[0].$match.user));
    return [{ items: [], meta: [{ total: favorites.filter(row => row.user === pipeline[0].$match.user).length }] }];
  });
  t.mock.method(Product, "find", () => ({ populate() { return this; }, then: resolve => Promise.resolve([]).then(resolve) }));
  const req = await localServer(t);
  const tokens = users.map(signAuthToken);
  for (const path of ["/api/notifications", "/api/favorites"]) assert.equal((await req(path)).status, 401);
  for (const index of [0, 1, 0]) {
    const res = await req(`/api/notifications?recipient=${ids[1 - index]}`, { token: tokens[index] });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("cache-control"), /private.*no-store/);
    const body = await res.json();
    assert.deepEqual(body.data.items.map(row => row.id), [entries[index]._id]);
    assert.ok(!JSON.stringify(body).includes("PRIVATE_MAIL_ERROR"));
    assert.equal(body.data.items[0].recipient, undefined);
    const fav = await req(`/api/favorites?user=${ids[1 - index]}`, { token: tokens[index] });
    assert.equal((await fav.json()).data.pagination.total, index === 1 ? 1 : 0);
  }
  assert.equal((await req(`/api/notifications/${entries[1]._id}/read`, { token: tokens[0], method: "PATCH", body: { recipient: ids[1] } })).status, 404);
  assert.equal(entries[1].readAt, null);
  assert.equal((await req(`/api/notifications/${entries[0]._id}/read`, { token: tokens[0], method: "PATCH" })).status, 200);
  await req("/api/notifications/read-all", { token: tokens[0], method: "PATCH", body: { recipient: ids[1] } });
  assert.equal(entries[1].readAt, null);
  const otherFav = await req(`/api/favorites/${productId}`, { token: tokens[0], method: "DELETE", body: { user: ids[1] } });
  assert.equal((await otherFav.json()).data.removed, false);
  const ownFav = await req(`/api/favorites/${productId}`, { token: tokens[1], method: "DELETE" });
  assert.equal((await ownFav.json()).data.removed, true);
  users[0].status = "suspended";
  assert.equal((await req("/api/notifications", { token: tokens[0] })).status, 403);
});

test("produits : propriétaire réel, rôle retiré et champs administrateur", async t => {
  let saves = 0;
  const product = { _id: productId, seller: sellerId, name: "Produit de test", currency: "GNF", images: [], save: async () => { saves += 1; } };
  t.mock.method(Product, "findById", async () => product);
  let approved = true;
  t.mock.method(SellerProfile, "findOne", query => ({ select() { return this; }, lean: async () => approved ? { _id: query.user === ids[0] ? sellerId : ids[1] } : null }));
  const run = async (role, user, body) => {
    const res = response();
    await update({ user: { _id: user, role }, params: { id: productId }, body }, res, error => { throw error; });
    return res;
  };
  assert.equal((await run("seller", ids[1], { name: "Intrusion" })).statusCode, 403);
  assert.equal((await run("staff", ids[0], { name: "Intrusion" })).statusCode, 403);
  assert.equal((await run("customer", ids[0], { name: "Intrusion" })).statusCode, 403);
  assert.equal((await run("seller", ids[0], { isFeatured: true })).statusCode, 422);
  assert.equal(saves, 0);
  assert.equal((await run("seller", ids[0], { name: "Produit modifié", seller: ids[1], role: "owner" })).statusCode, 200);
  assert.equal(product.seller, sellerId);
  assert.equal(product.role, undefined);
  approved = false;
  assert.equal((await run("seller", ids[0], { name: "Intrusion" })).statusCode, 403);
  assert.equal((await run("admin", ids[1], { isFeatured: true })).statusCode, 200);
  assert.equal(product.isFeatured, true);
});

test("profil : modifier son nom ne change ni les droits ni le compte cible", async t => {
  const user = new User({ _id: ids[0], firstName: "Compte", lastName: "Fictif", email: "test@example.invalid", role: "customer", status: "active" });
  t.mock.method(user, "save", async () => user);
  t.mock.method(User, "findById", async id => id === ids[0] ? user : null);
  const req = await localServer(t);
  const res = await req("/api/auth/me", { token: signAuthToken(user), method: "PATCH", body: '{"firstName":"Nouveau","_id":"507f1f77bcf86cd799439022","role":"owner","isEmailVerified":true,"passwordHash":"ATTACK","address":{"city":"Sangaredi","__proto__":{"polluted":true}}}' });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.data.user.id, ids[0]);
  assert.equal(body.data.user.firstName, "Nouveau");
  assert.equal(user.role, "customer");
  assert.equal(user.isEmailVerified, false);
  assert.equal(user.passwordHash, undefined);
  assert.equal({}.polluted, undefined);
  assert.equal(user.address.toObject().__proto__.polluted, undefined);
});

test("fiche vendeur : adresse privée visible seulement dans son propre espace", async t => {
  const users = ids.map(_id => ({ _id, role: "seller", status: "active" }));
  const profiles = users.map((user, index) => ({ _id: `507f1f77bcf86cd79943903${index}`, user: user._id, slug: `boutique-test-${index}`, status: "approved", storeName: "Boutique fictive", address: { street: `PRIVATE_STREET_${index}`, postalCode: `PRIVATE_POSTAL_${index}`, city: "Sangaredi" } }));
  t.mock.method(User, "findById", async id => users.find(user => user._id === id));
  t.mock.method(SellerProfile, "findOne", async query => profiles.find(profile => Object.entries(query).every(([key, value]) => profile[key] === value)));
  const req = await localServer(t);
  assert.equal((await req("/api/sellers/me")).status, 401);
  for (const index of [0, 1]) {
    const res = await req(`/api/sellers/me?user=${ids[1 - index]}`, { token: signAuthToken(users[index]) });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).data.sellerProfile.address.street, profiles[index].address.street);
    const publicRes = await req(`/api/sellers/${profiles[index].slug}`);
    assert.equal(publicRes.status, 200);
    const body = await publicRes.json();
    assert.ok(!JSON.stringify(body).includes("PRIVATE_"));
    assert.equal(body.data.sellerProfile.user, undefined);
    assert.equal(body.data.sellerProfile.status, undefined);
  }
});

test("spam et injections : quotas partagés, corps invalides comptés, adresses usurpées sans effet", async t => {
  const req = await localServer(t);
  let writes = 0;
  t.mock.method(Contact, "create", async payload => { writes += 1; return { ...payload, _id: productId, createdAt: new Date() }; });
  t.mock.method(Newsletter, "findOne", async () => null);
  t.mock.method(Newsletter, "create", async payload => { writes += 1; return payload; });
  t.mock.method(User, "findOne", () => { throw new Error("Une injection ne doit pas atteindre la base"); });
  const contact = { fullName: "Compte Fictif", email: "test@example.invalid", subject: "Message de test", message: "Essai local uniquement, aucun envoi réel." };
  publicFormRateLimiter.resetKey("127.0.0.1");
  authRateLimiter.resetKey("127.0.0.1");
  assert.equal((await req("/api/contact", { method: "POST", body: contact })).status, 201);
  assert.equal((await req("/api/newsletter/subscribe", { method: "POST", body: { email: contact.email } })).status, 201);
  for (const [path, body] of [
    ["/api/contact", { ...contact, email: { $ne: null } }],
    ["/api/contact", { ...contact, status: "resolved" }],
    ["/api/newsletter/subscribe", { email: { $regex: ".*" } }],
    ["/api/newsletter/subscribe", { email: contact.email, isActive: true }],
    ["/api/auth/login", { email: { $ne: null }, password: { $ne: null } }],
    ["/api/auth/forgot-password", { email: { $regex: ".*" } }],
  ]) assert.equal((await req(path, { method: "POST", body })).status, 422, path);
  assert.equal(writes, 2, "aucune écriture sur saisie invalide");
  publicFormRateLimiter.resetKey("127.0.0.1");
  for (let i = 0; i < 11; i += 1) {
    const res = await req(i % 2 ? "/api/NEWSLETTER/SUBSCRIBE/" : "/api/contact", { method: "POST", body: '{"PRIVATE_TEST":' });
    assert.equal(res.status, i < 10 ? 400 : 429);
    assert.ok(!(await res.text()).includes("PRIVATE_TEST"));
  }
  authRateLimiter.resetKey("127.0.0.1");
  for (let i = 0; i < 31; i += 1) assert.equal((await req("/api/auth/LOGIN/", { method: "POST", body: "{" })).status, i < 30 ? 400 : 429);
  publicFormRateLimiter.resetKey("198.51.100.2");
  for (let i = 0; i < 11; i += 1) {
    const res = await req("/api/contact", { method: "POST", body: {}, headers: { "X-Forwarded-For": `192.0.2.${i + 1}, 198.51.100.2` } });
    assert.equal(res.status, i < 10 ? 422 : 429);
  }
  uploadRateLimiter.resetKey("127.0.0.1");
  for (let i = 0; i < 31; i += 1) assert.equal((await req("/api/uploads/product-image", { method: "POST" })).status, i < 30 ? 401 : 429);
  publicFormRateLimiter.resetKey("127.0.0.1");
  assert.equal((await req("/api/contact", { method: "POST", body: JSON.stringify({ message: "x".repeat(110000) }) })).status, 413);
});

test("secret de signature trop court : refus au démarrage de production, valeur jamais affichée", () => {
  for (const [nodeEnv, secret, allowed] of [["production", "short-test-secret", false], ["production", "a".repeat(32), true], ["development", "short-test-secret", true]]) {
    const result = spawnSync(process.execPath, ["-e", 'require("./src/config/env")'], { cwd: require("node:path").join(__dirname, ".."), env: { ...process.env, NODE_ENV: nodeEnv, JWT_SECRET: secret, RENDER: "false" }, encoding: "utf8" });
    assert.equal(result.status, allowed ? 0 : 1);
    assert.ok(!result.stderr.includes(secret));
  }
});

test("erreurs d'email et de stockage : aucune adresse, identifiant ou erreur privée dans les logs", async t => {
  const logs = [];
  t.mock.method(console, "warn", (...values) => logs.push(values.join(" ")));
  let completed;
  const done = new Promise(resolve => { completed = resolve; });
  const notification = { _id: "PRIVATE_TEST_NOTIFICATION_ID", save: async () => { completed(); } };
  t.mock.method(Notification, "create", async () => notification);
  await notifications.createNotification({ recipient: { _id: ids[0], email: "private-test@example.invalid" }, title: "Test", message: "Test", email: true });
  await done;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(notification.emailError, "Envoi email impossible");
  assert.equal(logs.length, 1);
  assert.ok(!logs.join(" ").includes("PRIVATE_"));
  t.mock.method(Notification, "create", async () => { throw new Error("PRIVATE_DATABASE_VALUE"); });
  assert.equal(await notifications.safeCreateNotification({ recipient: ids[0] }), null);
  assert.ok(!logs.join(" ").includes("PRIVATE_"));
});

test("connexion base en échec : aucun secret de connexion dans les logs", async t => {
  const { mongoose, connectDatabase } = require("../src/config/db");
  const logs = [];
  t.mock.method(console, "error", (...values) => logs.push(values.join(" ")));
  t.mock.method(mongoose, "connect", async () => { throw new Error("PRIVATE_DATABASE_CONNECTION_STRING"); });
  await assert.rejects(connectDatabase(), /PRIVATE_DATABASE_CONNECTION_STRING/);
  assert.equal(logs.length, 1);
  assert.ok(!logs.join(" ").includes("PRIVATE_"));
});
