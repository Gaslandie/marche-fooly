const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

// Aucun serveur ni base de donnees : seuls les effets de bord sont remplaces.
// Les vrais controleurs restent executes pour verifier les droits.
process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/test-not-used";
process.env.JWT_SECRET ||= "local-test-only-secret-not-used";
const Order = require("../src/models/Order");
const Product = require("../src/models/Product");
const events = require("../src/services/notificationEvents");
const notify = events.notifyOrderStatusChanged;
events.notifyOrderStatusChanged = async () => {};
const { getByReference, updateStatus } = require("../src/controllers/orderController");
events.notifyOrderStatusChanged = notify;

const customerId = new mongoose.Types.ObjectId();
const staffId = new mongoose.Types.ObjectId();

function fixture(status = "pending") {
  return {
    _id: new mongoose.Types.ObjectId(),
    reference: "ORD-20261008-ABCDE",
    customer: customerId,
    seller: new mongoose.Types.ObjectId(),
    status,
    items: [{ product: new mongoose.Types.ObjectId(), quantity: 1 }],
    save: async function () { this.saved = true; },
    populate: async function () { return this; },
  };
}

async function run(handler, order, role, userId, body = {}) {
  const res = {
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
  const query = Object.assign(Promise.resolve(order), {
    populate: () => Promise.resolve(order),
  });
  const originalFind = Order.findOne;
  const originalUpdate = Product.findByIdAndUpdate;
  let stockWrites = 0;
  Order.findOne = () => query;
  Product.findByIdAndUpdate = async () => { stockWrites += 1; };
  try {
    await handler({
      user: { _id: userId, role },
      params: { reference: order.reference },
      body,
    }, res, error => { throw error; });
    return { res, stockWrites };
  } finally {
    Order.findOne = originalFind;
    Product.findByIdAndUpdate = originalUpdate;
  }
}

test("staff consulte une commande sans obtenir de droits d'écriture", async () => {
  const order = fixture();
  const { res, stockWrites } = await run(getByReference, order, "staff", staffId);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.order.reference, order.reference);
  assert.equal(order.saved, undefined);
  assert.equal(stockWrites, 0);
});

test("staff ne confirme, prépare, expédie, livre ou annule aucune commande d'autrui", async () => {
  for (const [status, target] of [
    ["pending", "confirmed"], ["confirmed", "preparing"],
    ["preparing", "shipped"], ["shipped", "delivered"],
    ["pending", "cancelled"], ["shipped", "cancelled"],
  ]) {
    const order = fixture(status);
    const { res, stockWrites } = await run(updateStatus, order, "staff", staffId, { status: target });
    assert.equal(res.statusCode, 403, `${status} -> ${target}`);
    assert.equal(order.status, status);
    assert.equal(order.saved, undefined);
    assert.equal(stockWrites, 0);
  }
});

test("owner et admin conservent la confirmation des commandes", async () => {
  for (const role of ["owner", "admin"]) {
    const order = fixture();
    const { res } = await run(updateStatus, order, role, staffId, { status: "confirmed" });
    assert.equal(res.statusCode, 200, role);
    assert.equal(order.status, "confirmed");
    assert.equal(order.saved, true);
  }
});

test("staff peut annuler son propre achat mais ne peut pas le confirmer", async () => {
  const denied = fixture();
  const refusal = await run(updateStatus, denied, "staff", customerId, { status: "confirmed" });
  assert.equal(refusal.res.statusCode, 403);
  const order = fixture();
  const { res, stockWrites } = await run(updateStatus, order, "staff", customerId, { status: "cancelled" });
  assert.equal(res.statusCode, 200);
  assert.equal(order.cancelledBy, "customer");
  assert.equal(stockWrites, 1);
});
