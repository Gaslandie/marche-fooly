const test = require("node:test");
const assert = require("node:assert/strict");
const { Readable, Writable } = require("node:stream");
const sharp = require("sharp");

// Vrais décodages et routes HTTP, stockage fictif : aucune connexion MongoDB.
process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/test-not-used";
process.env.JWT_SECRET = "image-security-test-only-not-a-production-key";
const mongoose = require("mongoose");
const User = require("../src/models/User");
const SellerProfile = require("../src/models/SellerProfile");
const Product = require("../src/models/Product");
const images = require("../src/services/productImageService");
const { signAuthToken } = require("../src/utils/jwt");
const app = require("../src/app");
const files = new Map();
let failVariant, holdUpload;
const sellerId = "507f1f77bcf86cd799439031";
const foreignSellerId = "507f1f77bcf86cd799439032";
const asset = buffer => images.createProductImageAsset({ buffer, originalName: "../../fichier.php.jpg", sellerProfileId: sellerId });
const png = () => sharp({ create: { width: 1500, height: 900, channels: 3, background: "green" } }).png().toBuffer();

class MemoryBucket {
  openUploadStream(filename, options) {
    const id = new mongoose.Types.ObjectId();
    const stream = new Writable({ write(buffer, _encoding, done) {
      if (options.metadata.variant === failVariant) return done(new Error("Stockage fictif indisponible"));
      const finish = () => {
        files.set(String(id), { _id: id, filename, ...options, length: buffer.length, buffer, uploadDate: new Date() });
        done();
      };
      if (holdUpload) holdUpload(finish); else finish();
    } });
    stream.id = id;
    return stream;
  }
  find(query) {
    const result = [...files.values()].filter(file => query._id?.$in
      ? query._id.$in.some(id => file._id.equals(id))
      : file._id.equals(query._id) && file.metadata.kind === query["metadata.kind"]);
    return { limit() { return this; }, toArray: async () => result };
  }
  async delete(id) { files.delete(String(id)); }
  openDownloadStream(id) { return Readable.from(files.get(String(id)).buffer); }
}

const descriptor = Object.getOwnPropertyDescriptor(mongoose.mongo, "GridFSBucket");
const readyState = Object.getOwnPropertyDescriptor(mongoose.connection, "readyState");
const db = mongoose.connection.db;
test.before(() => {
  Object.defineProperty(mongoose.mongo, "GridFSBucket", { configurable: true, value: MemoryBucket });
  Object.defineProperty(mongoose.connection, "readyState", { configurable: true, value: 1 });
  mongoose.connection.db = {};
});
test.after(() => {
  Object.defineProperty(mongoose.mongo, "GridFSBucket", descriptor);
  if (readyState) Object.defineProperty(mongoose.connection, "readyState", readyState);
  else delete mongoose.connection.readyState;
  mongoose.connection.db = db;
});
test.beforeEach(() => { files.clear(); failVariant = null; holdUpload = null; });

test("vrais JPG/PNG/WebP/AVIF : conversion, noms aléatoires et suppression des métadonnées privées", async () => {
  for (const format of ["jpeg", "png", "webp", "avif"]) {
    const source = await sharp(await png()).withMetadata({ exif: { IFD0: { Artist: "PRIVATE_TEST_METADATA" } } }).toFormat(format).toBuffer();
    const result = await asset(source);
    assert.equal(result.format, "webp");
    assert.equal(result.width, 1200);
    assert.ok(result.thumbFileId !== result.largeFileId);
    for (const id of [result.largeFileId, result.thumbFileId]) {
      const file = files.get(id);
      assert.match(file.filename, /^[a-f0-9-]+-(large|thumb)\.webp$/);
      assert.equal(file.contentType, "image/webp");
      assert.equal(file.metadata.status, "temporary");
      const metadata = await sharp(file.buffer).metadata();
      assert.equal(metadata.format, "webp");
      assert.equal(metadata.exif, undefined);
      assert.equal(file.buffer.includes(Buffer.from("PRIVATE_TEST_METADATA")), false);
    }
    const verified = await images.verifyProductImageForSeller(result, sellerId);
    assert.equal(String(verified.largeFileId), result.largeFileId);
    await assert.rejects(images.verifyProductImageForSeller(result, foreignSellerId), /non autorisee/);
    await assert.rejects(images.verifyProductImageForSeller({ ...result, version: "wrong-version" }, sellerId), /non autorisee/);
    await assert.rejects(images.verifyProductImageForSeller({ ...result, thumbFileId: result.largeFileId }, sellerId), /invalide/);
  }
});

test("fausses images, fichiers tronqués, animations et dimensions excessives : aucun stockage", async () => {
  const pixels = Buffer.concat([Buffer.alloc(300, 0), Buffer.alloc(300, 255)]);
  const animated = await sharp(pixels, { raw: { width: 10, height: 20, pageHeight: 10, channels: 3 } }).webp({ loop: 0, delay: [100, 100] }).toBuffer();
  assert.equal((await sharp(animated).metadata()).pages, 2);
  const huge = await sharp({ create: { width: 4500, height: 4500, channels: 3, background: "white" } }).png().toBuffer();
  for (const buffer of [
    Buffer.alloc(0), Buffer.alloc(images.MAX_IMAGE_BYTES + 1),
    Buffer.from("<html><script>alert(1)</script></html>"),
    Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
    Buffer.from("GIF89a"), Buffer.from("%PDF-1.7"),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10]),
    (await png()).subarray(0, 40), animated, huge,
  ]) {
    await assert.rejects(asset(buffer), error => error instanceof images.ProductImageError && error.status === 422);
    assert.equal(files.size, 0);
  }
});

test("saturation et panne stockage : traitement suivant possible, pas de variante orpheline", async () => {
  const buffer = await png();
  let release;
  const started = new Promise(resolve => { holdUpload = finish => { release = finish; resolve(); }; });
  const first = asset(buffer);
  await started;
  await assert.rejects(asset(buffer), error => error.status === 503);
  holdUpload = null;
  release();
  await first;
  files.clear();
  failVariant = "thumb";
  await assert.rejects(asset(buffer), /Stockage fictif/);
  assert.equal(files.size, 0);
  failVariant = null;
  assert.ok((await asset(buffer)).largeFileId);
});

test("photos privées : propriétaire, équipe, autre compte, publication et révocation", async t => {
  const image = await asset(await png());
  const users = ["seller", "seller", "customer", "staff", "admin", "owner"].map((role, index) => ({
    _id: new mongoose.Types.ObjectId(`507f1f77bcf86cd79943902${index}`), role, status: "active",
  }));
  const profile = { _id: sellerId, user: users[0]._id, status: "approved" };
  const product = { seller: sellerId, status: "draft", coverImage: { largeFileId: image.largeFileId } };
  let attached = false;
  const matchesReference = query => attached && String(query.seller) === String(product.seller) && query.$or.some(condition =>
    Object.entries(condition).some(([path, value]) => {
      const actual = path.split(".").reduce((obj, key) => obj?.[key], product);
      return actual != null && (value instanceof RegExp ? value.test(String(actual)) : String(actual) === String(value));
    })) && (!query.status || query.status.$in.includes(product.status));
  t.mock.method(User, "findById", async id => users.find(user => String(user._id) === String(id)));
  t.mock.method(Product, "exists", async query => matchesReference(query) ? { _id: sellerId } : null);
  t.mock.method(SellerProfile, "exists", async query => String(query._id) === sellerId && String(query.user) === String(profile.user) && profile.status === query.status ? { _id: sellerId } : null);
  t.mock.method(SellerProfile, "findOne", async query => String(query.user) === String(profile.user) && profile.status === query.status ? profile : null);
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const url = `${base}/api/media/images/${image.largeFileId}?v=${image.version}`;
  const tokens = users.map(signAuthToken);
  const get = (index, headers = {}) => fetch(url, { headers: { ...(index === null ? {} : { Authorization: `Bearer ${tokens[index]}` }), ...headers } });
  assert.equal((await get(null)).status, 401);
  for (const [index, allowed] of [[0, true], [1, false], [2, false], [3, false], [4, true], [5, true]]) {
    const res = await get(index);
    assert.equal(res.status, allowed ? 200 : 404, users[index].role);
    assert.match(res.headers.get("cache-control"), /private.*no-store/);
  }
  const own = await get(0);
  const etag = own.headers.get("etag");
  assert.equal((await get(1, { "If-None-Match": etag })).status, 404, "le cache ne contourne pas les droits");
  attached = true;
  assert.equal((await get(3)).status, 200, "staff lit la photo d'un vrai produit");
  assert.equal((await get(null)).status, 401, "un brouillon reste privé");
  product.status = "active";
  const published = await get(null);
  assert.equal(published.status, 200);
  assert.match(published.headers.get("cache-control"), /public.*max-age=60.*must-revalidate/);
  product.status = "out_of_stock";
  assert.equal((await get(null)).status, 200);
  product.status = "archived";
  assert.equal((await get(null, { "If-None-Match": etag })).status, 401);
  product.status = "active";
  product.seller = foreignSellerId;
  assert.equal((await get(null)).status, 401, "copier une adresse dans le produit d'un autre vendeur ne publie pas l'image");
  product.seller = sellerId;
  product.coverImage = null;
  product.coverImageUrl = `/api/media/images/${image.largeFileId}?v=${image.version}`;
  assert.equal((await get(null)).status, 200, "ancienne référence URL compatible");
  product.status = "draft";
  profile.status = "suspended";
  assert.equal((await get(0)).status, 404);
  profile.status = "approved";
  users[0].status = "suspended";
  assert.equal((await get(0)).status, 403);
  users[0].status = "active";
  users[0].role = "customer";
  assert.equal((await get(0)).status, 404, "rôle vendeur retiré avec le même jeton");
  users[0].role = "seller";

  const upload = async (index, buffer, extra = false) => {
    const form = new FormData();
    form.append("image", new Blob([buffer], { type: "image/png" }), "photo.png");
    if (extra) form.append("seller", foreignSellerId);
    return fetch(`${base}/api/uploads/product-image`, { method: "POST", body: form, headers: index === null ? {} : { Authorization: `Bearer ${tokens[index]}` } });
  };
  const valid = await png();
  assert.equal((await upload(null, valid)).status, 401);
  assert.equal((await upload(2, valid)).status, 403);
  assert.equal((await upload(0, valid)).status, 201);
  assert.equal((await upload(0, Buffer.from("<script>FAKE_IMAGE</script>"))).status, 422);
  assert.equal((await upload(0, valid, true)).status, 422);
  assert.equal((await upload(0, Buffer.alloc(images.MAX_IMAGE_BYTES + 1))).status, 422);
  profile.status = "suspended";
  assert.equal((await upload(0, valid)).status, 403);
});
