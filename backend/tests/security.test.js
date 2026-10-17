const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

// Comptes fictifs en mémoire. Aucune connexion MongoDB, aucun email envoyé.
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/test-not-used";
process.env.JWT_SECRET = "security-test-only-secret-with-no-production-use";
process.env.BCRYPT_SALT_ROUNDS = "10";
process.env.NODE_ENV = "production";
// Cas réel : ancienne configuration sans www, navigateur sur le domaine www.
process.env.CORS_ORIGIN = "https://marchefooly.com";
const jwt = require("jsonwebtoken");
const User = require("../src/models/User");
const { signAuthToken } = require("../src/utils/jwt");
const { resetPassword, login, register } = require("../src/controllers/authController");
const { hashPassword } = require("../src/utils/password");

// Les routes et leurs vrais gardes sont exécutés ; aucun effet métier admin.
const admin = require("../src/controllers/adminController");
let adminCalls = 0;
for (const name of Object.keys(admin)) {
  admin[name] = (_req, res) => { adminCalls += 1; return res.json({ success: true }); };
}
const app = require("../src/app");
const { authRateLimiter } = require("../src/middlewares/rateLimiters");

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("authentification et vrais droits serveur : autorisations, révocations et jetons refusés", async t => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const account = { _id: "507f1f77bcf86cd799439021", role: "customer", status: "active" };
  let reads = 0;
  const findById = User.findById;
  User.findById = async id => { reads += 1; return id === account._id ? account : null; };
  t.after(() => { User.findById = findById; });
  const request = (path, token, method = "GET", body) => fetch(base + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const rawToken = (payload, options = { expiresIn: "1h" }) => jwt.sign(payload, process.env.JWT_SECRET, options);

  for (const [origin, allowed] of [["https://www.marchefooly.com", true], ["https://evil.example", false]]) {
    const res = await fetch(`${base}/api/auth/me`, { headers: { Origin: origin } });
    assert.equal(res.headers.get("access-control-allow-origin"), allowed ? origin : null);
    const preflight = await fetch(`${base}/api/contact`, {
      method: "OPTIONS",
      headers: { Origin: origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type" },
    });
    assert.equal(preflight.headers.get("access-control-allow-origin"), allowed ? origin : null);
  }
  assert.equal((await fetch(`${base}/api/auth/me`, {
    headers: { Cookie: `mf_session=${signAuthToken(account)}` },
  })).status, 401, "l'API n'accepte pas une session implicite par cookie");
  const malformed = await fetch(`${base}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: '{"password":"PRIVATE_TEST_VALUE", invalid',
  });
  assert.equal(malformed.status, 400);
  assert.ok(!(await malformed.text()).includes("PRIVATE_TEST_VALUE"));

  User.findById = async () => { throw new Error("PRIVATE_DATABASE_TEST_VALUE"); };
  const consoleError = console.error;
  const logs = [];
  console.error = (...values) => logs.push(values.join(" "));
  try {
    const failure = await request("/api/auth/me", signAuthToken(account));
    assert.equal(failure.status, 500);
    assert.ok(!(await failure.text()).includes("PRIVATE_DATABASE_TEST_VALUE"));
    assert.ok(!logs.join(" ").includes("PRIVATE_DATABASE_TEST_VALUE"));
  } finally {
    console.error = consoleError;
    User.findById = async id => { reads += 1; return id === account._id ? account : null; };
  }

  for (const token of [
    "invalid", rawToken({ sub: account._id }, { expiresIn: -1 }),
    rawToken({ sub: account._id }, { algorithm: "HS384", expiresIn: "1h" }),
    rawToken({ sub: "not-an-object-id" }), rawToken({ sub: account._id }, {}),
    jwt.sign({ sub: account._id }, "another-secret", { expiresIn: "1h" }),
  ]) {
    assert.equal((await request("/api/auth/me", token)).status, 401);
  }
  assert.equal(reads, 0, "un jeton invalide ne doit même pas interroger les comptes");
  const token = signAuthToken({ ...account, role: "owner" });
  const adminPaths = ["/api/admin/users", "/api/admin/products", "/api/admin/sellers", "/api/admin/orders"];
  for (const role of ["customer", "seller"]) {
    account.role = role;
    for (const path of adminPaths) assert.equal((await request(path, token)).status, 403, `${role} ${path}`);
  }
  assert.equal(adminCalls, 0, "le rôle owner écrit dans un jeton ne donne aucun droit");
  for (const role of ["staff", "admin", "owner"]) {
    account.role = role;
    assert.equal((await request("/api/admin/products", token)).status, 200, role);
    assert.equal((await request("/api/admin/users", token)).status, role === "staff" ? 403 : 200, role);
    assert.equal((await request(`/api/admin/users/${account._id}/role`, token, "PATCH", { role: "staff" })).status, role === "owner" ? 200 : 403, role);
    assert.equal((await request(`/api/admin/sellers/${account._id}/status`, token, "PATCH", { status: "approved" })).status, role === "staff" ? 403 : 200, role);
  }
  account.role = "customer";
  assert.equal((await request("/api/admin/products", token)).status, 403, "un droit retiré est refusé avec le même jeton");
  for (const status of ["suspended", "pending"]) {
    account.status = status;
    assert.equal((await request("/api/auth/me", token)).status, 403, status);
  }
  assert.equal((await request("/api/auth/me", signAuthToken({ _id: "507f1f77bcf86cd799439099", role: "owner" }))).status, 401);

  authRateLimiter.resetKey("127.0.0.1");
  for (let index = 0; index < 31; index += 1) {
    const res = await fetch(`${base}/api/auth/LOGIN/`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    assert.equal(res.status, index < 30 ? 422 : 429, `tentative ${index + 1}`);
  }
  account.status = "active";
  assert.equal((await request("/api/auth/me", token)).status, 200, "le limiteur ne bloque pas la navigation authentifiée");
});

test("connexion : seuls les comptes actifs passent, sans exposer le mot de passe", async t => {
  const passwordHash = await hashPassword("Mot de passe de test uniquement!");
  const user = {
    _id: "507f1f77bcf86cd799439021", role: "customer", status: "active", passwordHash,
    save: async function () { this.saved = true; },
  };
  const findOne = User.findOne;
  User.findOne = () => ({ select: async () => user });
  t.after(() => { User.findOne = findOne; });
  for (const status of ["pending", "suspended", "active"]) {
    user.status = status;
    const res = response();
    await login({ body: { email: "test@example.invalid", password: "Mot de passe de test uniquement!" } }, res, error => { throw error; });
    assert.equal(res.statusCode, status === "active" ? 200 : 403, status);
    assert.ok(!JSON.stringify(res.body).includes(passwordHash));
  }
});

test("l'inscription publique ne peut créer ni propriétaire ni administrateur", async t => {
  const findOne = User.findOne;
  const create = User.create;
  User.findOne = () => ({ select: () => ({ lean: async () => null }) });
  let saved;
  User.create = async payload => {
    saved = payload;
    return { _id: "507f1f77bcf86cd799439025", ...payload };
  };
  t.after(() => { User.findOne = findOne; User.create = create; });
  const res = response();
  await register({ body: {
    firstName: "Compte", lastName: "Fictif", email: "test@example.invalid",
    phone: "+224612345678", password: "Phrase de test uniquement!",
    role: "owner", status: "suspended", isEmailVerified: true,
  } }, res, error => { throw error; });
  assert.equal(res.statusCode, 201);
  assert.equal(saved.role, "customer");
  assert.equal(saved.status, "active");
  assert.equal(saved.isEmailVerified, undefined);
  assert.equal(saved.password, undefined);
  assert.ok(!JSON.stringify(res.body).includes(saved.passwordHash));
});

test("réinitialisation : un lien utilisé en parallèle ne change le mot de passe qu'une fois", async t => {
  const token = "a".repeat(64);
  const state = {
    _id: "507f1f77bcf86cd799439021", status: "active",
    passwordResetTokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    passwordResetExpiresAt: new Date(Date.now() + 60000),
  };
  const findOne = User.findOne;
  const updateOne = User.updateOne;
  let writes = 0;
  User.findOne = () => ({ select: async () => ({ _id: state._id, status: state.status }) });
  User.updateOne = async (filter, update) => {
    // Comparaison atomique des conditions de MongoDB, sur un document fictif.
    const matches = Object.entries(filter).every(([key, value]) =>
      value && typeof value === "object" && "$gt" in value
        ? state[key] > value.$gt : state[key] === value);
    if (!matches) return { modifiedCount: 0 };
    writes += 1;
    Object.assign(state, update.$set);
    for (const key of Object.keys(update.$unset || {})) delete state[key];
    return { modifiedCount: 1 };
  };
  t.after(() => { User.findOne = findOne; User.updateOne = updateOne; });
  const responses = [response(), response()];
  await Promise.all(responses.map((res, index) => resetPassword({ body: {
    token, password: `Nouveau mot de passe de test ${index}!`,
  } }, res, error => { throw error; })));
  assert.deepEqual(responses.map(res => res.statusCode).sort(), [200, 400]);
  assert.equal(writes, 1);
  assert.equal(state.passwordResetTokenHash, undefined);
});
