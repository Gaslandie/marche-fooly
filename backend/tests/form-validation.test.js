const test = require("node:test");
const assert = require("node:assert/strict");

const { runValidators } = require("../src/middlewares/validate");
const {
  createContactMessageValidators,
} = require("../src/validators/contactValidators");
const {
  subscribeNewsletterValidators,
} = require("../src/validators/newsletterValidators");
const {
  applyValidators,
  updateMeSellerValidators,
} = require("../src/validators/sellerValidators");
const { createOrderValidators } = require("../src/validators/orderValidators");
const { createProductValidators } = require("../src/validators/productValidators");

async function validate(body, validators) {
  const req = { body: structuredClone(body), params: {}, query: {} };
  let status;
  let response;
  let passed = false;
  const res = {
    status(code) {
      status = code;
      return this;
    },
    json(value) {
      response = value;
    },
  };
  await runValidators(validators)(req, res, () => {
    passed = true;
  });
  return { body: req.body, status, response, passed };
}

test("contact : nom réel et téléphone guinéen normalisés", async () => {
  const valid = {
    fullName: "  Aïssatou   N’Diaye ",
    email: "AISSATOU@EXAMPLE.COM",
    phone: "612 34 56 78",
    subject: "Question produit",
    message: "Bonjour, je souhaite obtenir plus d’informations.",
  };
  const result = await validate(valid, createContactMessageValidators);
  assert.equal(result.passed, true);
  assert.equal(result.body.fullName, "Aïssatou N’Diaye");
  assert.equal(result.body.email, "aissatou@example.com");
  assert.equal(result.body.phone, "+224612345678");

  for (const fullName of ["555555", "Jean2", "<script>", "A"] ) {
    const invalid = await validate({ ...valid, fullName }, createContactMessageValidators);
    assert.equal(invalid.status, 422, fullName);
  }
});

test("contact, vendeur et commande refusent les mauvais numéros", async () => {
  const invalidPhones = [
    "+24 612345678",
    "+225612345678",
    "61234567",
    "6123456789",
    "555555555555555",
    "abc612345678",
  ];
  for (const phone of invalidPhones) {
    const contact = await validate({
      fullName: "Aïssatou Diallo",
      email: "aissatou@example.com",
      phone,
      subject: "Question produit",
      message: "Bonjour, ceci est un message suffisamment long.",
    }, createContactMessageValidators);
    assert.equal(contact.status, 422, `contact ${phone}`);

    const seller = await validate({
      storeName: "Boutique Test",
      contactDetails: { phone },
    }, applyValidators);
    assert.equal(seller.status, 422, `vendeur ${phone}`);

    const order = await validate({
      items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
      paymentMethod: "cash_on_delivery",
      fulfillmentMethod: "seller_pickup",
      customerPhone: phone,
    }, createOrderValidators);
    assert.equal(order.status, 422, `commande ${phone}`);
  }
});

test("vendeur : formulaire minimal accepté et téléphone normalisé", async () => {
  const result = await validate({
    storeName: "Boutique 224",
    description: "Présentation de la boutique",
    contactDetails: { phone: "+224 (612) 34-56-78" },
    address: { city: "Sangarédi", country: "Guinée" },
  }, applyValidators);
  assert.equal(result.passed, true);
  assert.equal(result.body.contactDetails.phone, "+224612345678");

  const partial = await validate({
    contactDetails: { phone: "612345678" },
  }, updateMeSellerValidators);
  assert.equal(partial.passed, true);
  assert.equal(partial.body.contactDetails.phone, "+224612345678");
});

test("newsletter : email normalisé et champs administratifs refusés", async () => {
  const valid = await validate({
    email: "  CLIENT@EXAMPLE.COM ",
    source: "footer",
  }, subscribeNewsletterValidators);
  assert.equal(valid.passed, true);
  assert.equal(valid.body.email, "client@example.com");

  const invalidEmail = await validate({ email: "client@invalid" }, subscribeNewsletterValidators);
  assert.equal(invalidEmail.status, 422);
  const forbidden = await validate({
    email: "client@example.com",
    isActive: true,
  }, subscribeNewsletterValidators);
  assert.equal(forbidden.status, 422);
});

test("commande : valeurs calculées et téléphone étranger refusés", async () => {
  const base = {
    items: [{ product: "507f1f77bcf86cd799439011", quantity: 2 }],
    paymentMethod: "cash_on_delivery",
    fulfillmentMethod: "home_delivery",
    customerPhone: "612 34 56 78",
    shippingAddress: { street: "Rue 1", city: "Sangarédi" },
  };
  const valid = await validate(base, createOrderValidators);
  assert.equal(valid.passed, true);
  assert.equal(valid.body.customerPhone, "+224612345678");

  for (const injected of [
    { totalAmount: 1 },
    { status: "delivered" },
    { customer: "507f1f77bcf86cd799439011" },
  ]) {
    const result = await validate({ ...base, ...injected }, createOrderValidators);
    assert.equal(result.status, 422);
  }
});

test("produit : prix, stock, devise et champs propriétaires contrôlés", async () => {
  const base = {
    name: "Téléphone Test",
    description: "Description valide du produit test.",
    price: 1200000,
    currency: "GNF",
    stockQuantity: 2,
    category: "507f1f77bcf86cd799439011",
  };
  assert.equal((await validate(base, createProductValidators)).passed, true);

  for (const invalid of [
    { price: -1 },
    { price: "12.5" },
    { stockQuantity: -1 },
    { currency: "USD" },
    { seller: "507f1f77bcf86cd799439011" },
    { status: "deleted" },
  ]) {
    const result = await validate({ ...base, ...invalid }, createProductValidators);
    assert.equal(result.status, 422, JSON.stringify(invalid));
  }
});
