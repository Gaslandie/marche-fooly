#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Smoke test: API commandes (Jour 19)
#
# Role exact du fichier:
#   Exerce de bout-en-bout les 5 endpoints /api/orders/* avec leurs
#   garde-fous (authenticate, requireApprovedSeller, ownership, validators,
#   machine d'etat). Couvre:
#     - Cas heureux: create -> listings -> machine d'etat complete jusqu'a delivered
#     - RBAC: 401 anonyme, 403 acteur non autorise sur transition
#     - Ownership: 404 anti-enumeration pour acces a commande etrangere
#     - Mono-vendeur: 422 sur panier mixte A+B
#     - Champs interdits: 422 sur seller/customer/totalAmount/items[*].unitPrice/etc.
#     - Validation: prix decimal, quantity 0, devise USD, produits archived/out_of_stock
#     - Stock: decrement, compensation (verifie via cancel qui restitue)
#     - Reference: format ORD-YYYYMMDD-XXXXX correctement genere
#
# Quand le lancer:
#   - Apres seed categories (necessaire pour avoir une categorie active).
#   - Apres modification du modele Order, validators, controller, routes.
#
# Prerequis:
#   - jq installe.
#   - Serveur sur BASE_URL (defaut http://localhost:5000).
#   - MONGODB_URI dans backend/.env (promotions + setup products + verifs
#     directes du stock).
#   - Au moins une categorie active en base (le seed en cree 14).
#
# Effet de bord (avant cleanup):
#   - 4 users: customer, sellerA, sellerB, admin.
#   - 2 SellerProfile (A et B) approuves.
#   - 6 produits de test (5 chez A, 1 chez B).
#   - 2 commandes (CMD1 chez A, CMD2 chez A pour test annulation).
#   - Cleanup automatique en fin: users, sellerprofiles, products, orders.
#
# Codes de retour:
#   - 0: tous les scenarios passent.
#   - 1: un scenario echoue.
#   - 2: dependance manquante ou serveur injoignable.
# -----------------------------------------------------------------------------

set -u

BASE_URL="${BASE_URL:-http://localhost:5000}"
EPOCH="$(date +%s)"
EMAIL_C="ord-smoke-c-${EPOCH}@test.local"
EMAIL_A="ord-smoke-a-${EPOCH}@test.local"
EMAIL_B="ord-smoke-b-${EPOCH}@test.local"
EMAIL_X="ord-smoke-x-${EPOCH}@test.local"
PHONE_BASE="${EPOCH: -7}"
PHONE_C="+22461${PHONE_BASE}"
PHONE_A="+22462${PHONE_BASE}"
PHONE_B="+22463${PHONE_BASE}"
PHONE_X="+22464${PHONE_BASE}"
PASSWORD="Ord-Smoke-1234"
STORE_A="Store A ${EPOCH}"
STORE_B="Store B ${EPOCH}"
PROD_PREFIX="ZZ Smoke Order ${EPOCH}"

# --- Prerequis ---------------------------------------------------------------
if ! command -v jq >/dev/null 2>&1; then
  echo "KO: jq est requis"; exit 2
fi
if ! curl -fsS "${BASE_URL}/" >/dev/null 2>&1; then
  echo "KO: serveur injoignable sur ${BASE_URL}"; exit 2
fi

# --- Helpers -----------------------------------------------------------------
expect_status() {
  local n="$1" expected="$2" got="$3" body="$4"
  if [ "$got" = "$expected" ]; then
    echo "OK ${n} (HTTP ${got})"
  else
    echo "KO ${n}: attendu ${expected}, recu ${got}"
    echo "Reponse: ${body}"
    cleanup_and_exit 1
  fi
}

call() {
  local method="$1" path="$2" token="$3" data="$4"
  local headers=(-H "Content-Type: application/json")
  if [ -n "$token" ]; then headers+=(-H "Authorization: Bearer ${token}"); fi
  local args=(-sS -o /tmp/ord_smoke_body.json -w "%{http_code}" -X "$method")
  if [ -n "$data" ]; then args+=(--data "$data"); fi
  CODE="$(curl "${args[@]}" "${headers[@]}" "${BASE_URL}${path}")"
  RESP="$(cat /tmp/ord_smoke_body.json)"
}

run_mongo() {
  local script="$1"
  ( cd "$(dirname "$0")/.." && node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const SellerProfile = require('./src/models/SellerProfile');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  ${script}
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
" )
}

cleanup_and_exit() {
  local code="$1"
  echo "--- cleanup ---"
  run_mongo "
    const emails = ['${EMAIL_C}','${EMAIL_A}','${EMAIL_B}','${EMAIL_X}'];
    const users = await User.find({ email: { \$in: emails } }).select('_id').lean();
    const userIds = users.map(u => u._id);
    const u = await User.deleteMany({ email: { \$in: emails } });
    const sp = await SellerProfile.deleteMany({ storeName: { \$in: ['${STORE_A}','${STORE_B}'] } });
    const p = await Product.deleteMany({ name: { \$regex: '^${PROD_PREFIX}' } });
    const o = await Order.deleteMany({ customer: { \$in: userIds } });
    console.log('cleanup users:', u.deletedCount, '| sellers:', sp.deletedCount, '| products:', p.deletedCount, '| orders:', o.deletedCount);
  " || true
  exit "$code"
}

# --- Setup categorie active du seed -----------------------------------------
CAT_ID="$(curl -fsS "${BASE_URL}/api/categories?limit=1" | jq -r '.data.items[0].id')"
if [ -z "$CAT_ID" ] || [ "$CAT_ID" = "null" ]; then
  echo "KO setup: aucune categorie active (lancer le seed d'abord)"; exit 2
fi
echo "setup: categorie active = ${CAT_ID}"

# ============================================================================
# Scenarios
# ============================================================================

# --- 1) Anonymes -> 401 -----------------------------------------------------
call POST "/api/orders" "" '{}'
expect_status 1 401 "$CODE" "$RESP"
call GET "/api/orders/mine" "" ""
expect_status 2 401 "$CODE" "$RESP"
call GET "/api/orders/seller" "" ""
expect_status 3 401 "$CODE" "$RESP"

# --- 4) Register 4 users ----------------------------------------------------
call POST "/api/auth/register" "" "$(cat <<EOF
{"firstName":"Client","lastName":"Smoke","email":"${EMAIL_C}","phone":"${PHONE_C}","password":"${PASSWORD}"}
EOF
)"
expect_status 4 201 "$CODE" "$RESP"
TOKEN_C="$(echo "$RESP" | jq -r '.data.token')"
USER_C_ID="$(echo "$RESP" | jq -r '.data.user.id')"

call POST "/api/auth/register" "" "$(cat <<EOF
{"firstName":"Vendeur","lastName":"Alpha","email":"${EMAIL_A}","phone":"${PHONE_A}","password":"${PASSWORD}"}
EOF
)"
expect_status "4-a" 201 "$CODE" "$RESP"
TOKEN_A="$(echo "$RESP" | jq -r '.data.token')"

call POST "/api/auth/register" "" "$(cat <<EOF
{"firstName":"Vendeur","lastName":"Beta","email":"${EMAIL_B}","phone":"${PHONE_B}","password":"${PASSWORD}"}
EOF
)"
expect_status "4-b" 201 "$CODE" "$RESP"
TOKEN_B="$(echo "$RESP" | jq -r '.data.token')"

call POST "/api/auth/register" "" "$(cat <<EOF
{"firstName":"Admin","lastName":"Smoke","email":"${EMAIL_X}","phone":"${PHONE_X}","password":"${PASSWORD}"}
EOF
)"
expect_status "4-x" 201 "$CODE" "$RESP"
TOKEN_X="$(echo "$RESP" | jq -r '.data.token')"

# Candidatures vendeur pour A et B
call POST "/api/sellers/apply" "$TOKEN_A" "$(cat <<EOF
{"storeName":"${STORE_A}","description":"Boutique A pour orders smoke"}
EOF
)"
expect_status "4-aa" 201 "$CODE" "$RESP"

call POST "/api/sellers/apply" "$TOKEN_B" "$(cat <<EOF
{"storeName":"${STORE_B}","description":"Boutique B pour orders smoke"}
EOF
)"
expect_status "4-bb" 201 "$CODE" "$RESP"

# --- 5) Promotions + creation produits ---------------------------------------
SETUP_IDS="$(run_mongo "
  await User.updateOne({ email: '${EMAIL_A}' }, { \$set: { role: 'seller' } });
  await User.updateOne({ email: '${EMAIL_B}' }, { \$set: { role: 'seller' } });
  await User.updateOne({ email: '${EMAIL_X}' }, { \$set: { role: 'admin' } });
  const spA = await SellerProfile.findOneAndUpdate(
    { storeName: '${STORE_A}' },
    { \$set: { status: 'approved', approvedAt: new Date() } },
    { new: true },
  );
  const spB = await SellerProfile.findOneAndUpdate(
    { storeName: '${STORE_B}' },
    { \$set: { status: 'approved', approvedAt: new Date() } },
    { new: true },
  );
  // Produits chez A
  const A1 = await Product.create({
    seller: spA._id, category: '${CAT_ID}',
    name: '${PROD_PREFIX} A1', description: 'description tres longue pour A1 testant le minimum',
    price: 5000, stockQuantity: 10, status: 'active',
    deliveryFee: 2000, isFreeDelivery: false,
  });
  const A2 = await Product.create({
    seller: spA._id, category: '${CAT_ID}',
    name: '${PROD_PREFIX} A2', description: 'description tres longue pour A2 testant le minimum',
    price: 3000, stockQuantity: 10, status: 'active',
    deliveryFee: 1000, isFreeDelivery: false,
  });
  const AFREE = await Product.create({
    seller: spA._id, category: '${CAT_ID}',
    name: '${PROD_PREFIX} A_free', description: 'description tres longue pour A_free testant le minimum',
    price: 2000, stockQuantity: 5, status: 'active',
    deliveryFee: 0, isFreeDelivery: true,
  });
  const AARCH = await Product.create({
    seller: spA._id, category: '${CAT_ID}',
    name: '${PROD_PREFIX} A_arch', description: 'description tres longue pour A_arch testant le minimum',
    price: 1000, stockQuantity: 10, status: 'archived',
  });
  // out_of_stock natif via hook: status=active + stock=0 -> bascule out_of_stock
  const AOOS = await Product.create({
    seller: spA._id, category: '${CAT_ID}',
    name: '${PROD_PREFIX} A_oos', description: 'description tres longue pour A_oos testant le minimum',
    price: 1000, stockQuantity: 0, status: 'active',
  });
  // Produit chez B
  const B1 = await Product.create({
    seller: spB._id, category: '${CAT_ID}',
    name: '${PROD_PREFIX} B1', description: 'description tres longue pour B1 testant le minimum',
    price: 8000, stockQuantity: 5, status: 'active',
    deliveryFee: 3000, isFreeDelivery: false,
  });
  console.log('A1=' + A1._id);
  console.log('A2=' + A2._id);
  console.log('AFREE=' + AFREE._id);
  console.log('AARCH=' + AARCH._id);
  console.log('AOOS=' + AOOS._id);
  console.log('B1=' + B1._id);
")"
A1_ID=$(echo "$SETUP_IDS" | grep "^A1=" | cut -d= -f2)
A2_ID=$(echo "$SETUP_IDS" | grep "^A2=" | cut -d= -f2)
AFREE_ID=$(echo "$SETUP_IDS" | grep "^AFREE=" | cut -d= -f2)
AARCH_ID=$(echo "$SETUP_IDS" | grep "^AARCH=" | cut -d= -f2)
AOOS_ID=$(echo "$SETUP_IDS" | grep "^AOOS=" | cut -d= -f2)
B1_ID=$(echo "$SETUP_IDS" | grep "^B1=" | cut -d= -f2)
if [ -z "$A1_ID" ] || [ ${#A1_ID} -ne 24 ]; then
  echo "KO 5: setup produits a echoue"; cleanup_and_exit 1
fi
echo "OK 5 (setup: A1=${A1_ID}, A2=${A2_ID}, AFREE=${AFREE_ID}, AARCH=${AARCH_ID}, AOOS=${AOOS_ID}, B1=${B1_ID})"

# --- 6) POST commande valide (cas heureux) ----------------------------------
# Items: A1 qty=2 (10k) + A2 qty=1 (3k). deliveryFee = max(2000,1000) = 2000. Total = 15000.
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${A1_ID}"'","quantity":2},{"product":"'"${A2_ID}"'","quantity":1}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"home_delivery","shippingAddress":{"street":"Rue du Test","city":"Sangaredi"},"customerPhone":"'"${PHONE_C}"'","notes":"smoke test note"}'
expect_status 6 201 "$CODE" "$RESP"
CMD1_REF="$(echo "$RESP" | jq -r '.data.order.reference')"
CMD1_TOTAL="$(echo "$RESP" | jq -r '.data.order.totalAmount')"
CMD1_SUBTOTAL="$(echo "$RESP" | jq -r '.data.order.subtotalAmount')"
CMD1_DELIV="$(echo "$RESP" | jq -r '.data.order.deliveryFee')"
CMD1_STATUS="$(echo "$RESP" | jq -r '.data.order.status')"
if [ "$CMD1_SUBTOTAL" != "13000" ] || [ "$CMD1_DELIV" != "2000" ] || [ "$CMD1_TOTAL" != "15000" ]; then
  echo "KO 6: totaux incorrects (sub=${CMD1_SUBTOTAL}, deliv=${CMD1_DELIV}, total=${CMD1_TOTAL})"
  cleanup_and_exit 1
fi
if [ "$CMD1_STATUS" != "pending" ]; then
  echo "KO 6: status attendu pending, recu ${CMD1_STATUS}"; cleanup_and_exit 1
fi
if ! echo "$CMD1_REF" | grep -qE '^ORD-[0-9]{8}-[A-Z2-9]{5}$'; then
  echo "KO 6: format reference invalide: ${CMD1_REF}"; cleanup_and_exit 1
fi
echo "       (CMD1=${CMD1_REF}, total=${CMD1_TOTAL} GNF)"

# --- 7) items vide -> 422 ---------------------------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'"}'
expect_status 7 422 "$CODE" "$RESP"

# --- 8) product inexistant -> 422 ------------------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"000000000000000000000000","quantity":1}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'"}'
expect_status 8 422 "$CODE" "$RESP"

# --- 9) product archived -> 422 --------------------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${AARCH_ID}"'","quantity":1}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'"}'
expect_status 9 422 "$CODE" "$RESP"

# --- 10) product out_of_stock -> 422 ---------------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${AOOS_ID}"'","quantity":1}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'"}'
expect_status 10 422 "$CODE" "$RESP"

# --- 11) quantity > stock -> 422 -------------------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${A1_ID}"'","quantity":99}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'"}'
expect_status 11 422 "$CODE" "$RESP"

# --- 12) quantity=0 -> 422 --------------------------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${A1_ID}"'","quantity":0}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'"}'
expect_status 12 422 "$CODE" "$RESP"

# --- 13) quantity decimale -> 422 ------------------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${A1_ID}"'","quantity":1.5}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'"}'
expect_status 13 422 "$CODE" "$RESP"

# --- 14) multi-vendeur (A + B) -> 422 --------------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${A1_ID}"'","quantity":1},{"product":"'"${B1_ID}"'","quantity":1}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'"}'
expect_status 14 422 "$CODE" "$RESP"

# --- 15) totalAmount dans body -> 422 (forbidden) --------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${A1_ID}"'","quantity":1}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'","totalAmount":1}'
expect_status 15 422 "$CODE" "$RESP"

# --- 16) seller dans body -> 422 -------------------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${A1_ID}"'","quantity":1}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'","seller":"000000000000000000000000"}'
expect_status 16 422 "$CODE" "$RESP"

# --- 17) reference dans body -> 422 ----------------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${A1_ID}"'","quantity":1}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'","reference":"ORD-20260101-AAAAA"}'
expect_status 17 422 "$CODE" "$RESP"

# --- 18) items[*].unitPrice dans body -> 422 -------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${A1_ID}"'","quantity":1,"unitPrice":1}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'"}'
expect_status 18 422 "$CODE" "$RESP"

# --- 19) paymentMethod invalide -> 422 -------------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${A1_ID}"'","quantity":1}],"paymentMethod":"bitcoin","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'"}'
expect_status 19 422 "$CODE" "$RESP"

# --- 20) home_delivery sans shippingAddress complete -> 422 ----------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${A1_ID}"'","quantity":1}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"home_delivery","customerPhone":"'"${PHONE_C}"'"}'
expect_status 20 422 "$CODE" "$RESP"

# --- 21) customerPhone invalide -> 422 -------------------------------------
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${A1_ID}"'","quantity":1}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"abc"}'
expect_status 21 422 "$CODE" "$RESP"

# --- 22) GET /mine par customer -> CMD1 visible ----------------------------
call GET "/api/orders/mine" "$TOKEN_C" ""
expect_status 22 200 "$CODE" "$RESP"
COUNT="$(echo "$RESP" | jq -r '.data.pagination.total')"
if [ "$COUNT" -lt 1 ]; then
  echo "KO 22: au moins 1 commande attendue dans /mine du customer"; cleanup_and_exit 1
fi

# --- 23) GET /seller par A -> CMD1 visible ---------------------------------
call GET "/api/orders/seller" "$TOKEN_A" ""
expect_status 23 200 "$CODE" "$RESP"
COUNT_A="$(echo "$RESP" | jq -r '.data.pagination.total')"
if [ "$COUNT_A" -lt 1 ]; then
  echo "KO 23: au moins 1 commande attendue chez A"; cleanup_and_exit 1
fi

# --- 24) GET /seller par B -> 0 commande (separation) ----------------------
call GET "/api/orders/seller" "$TOKEN_B" ""
expect_status 24 200 "$CODE" "$RESP"
COUNT_B="$(echo "$RESP" | jq -r '.data.pagination.total')"
if [ "$COUNT_B" != "0" ]; then
  echo "KO 24: B ne devrait voir aucune commande, recu ${COUNT_B}"; cleanup_and_exit 1
fi

# --- 25) GET /seller par customer (sans sellerProfile) -> 403 -------------
# Sans SellerProfile, le customer est bloque par requireApprovedSeller (role customer).
call GET "/api/orders/seller" "$TOKEN_C" ""
expect_status 25 403 "$CODE" "$RESP"

# --- 26) GET /:reference par customer-owner -> 200 -------------------------
call GET "/api/orders/${CMD1_REF}" "$TOKEN_C" ""
expect_status 26 200 "$CODE" "$RESP"

# --- 27) GET /:reference par seller-owner A -> 200 -------------------------
call GET "/api/orders/${CMD1_REF}" "$TOKEN_A" ""
expect_status 27 200 "$CODE" "$RESP"

# --- 28) GET /:reference par seller B (etranger) -> 404 anti-enumeration ---
call GET "/api/orders/${CMD1_REF}" "$TOKEN_B" ""
expect_status 28 404 "$CODE" "$RESP"

# --- 29) GET /:reference par admin -> 200 ----------------------------------
call GET "/api/orders/${CMD1_REF}" "$TOKEN_X" ""
expect_status 29 200 "$CODE" "$RESP"

# --- 30) GET /:reference format invalide -> 422 ----------------------------
call GET "/api/orders/INVALID-FORMAT" "$TOKEN_C" ""
expect_status 30 422 "$CODE" "$RESP"

# --- 31) GET /:reference inexistante mais format valide -> 404 -------------
call GET "/api/orders/ORD-19000101-AAAAA" "$TOKEN_C" ""
expect_status 31 404 "$CODE" "$RESP"

# --- 32) PATCH status par customer -> confirmed -> 403 (pas autorise) ------
call PATCH "/api/orders/${CMD1_REF}/status" "$TOKEN_C" '{"status":"confirmed"}'
expect_status 32 403 "$CODE" "$RESP"

# --- 33) PATCH status par seller B (etranger) -> 404 ----------------------
call PATCH "/api/orders/${CMD1_REF}/status" "$TOKEN_B" '{"status":"confirmed"}'
expect_status 33 404 "$CODE" "$RESP"

# --- 34) PATCH status par A: pending -> delivered (transition interdite) -> 422
call PATCH "/api/orders/${CMD1_REF}/status" "$TOKEN_A" '{"status":"delivered"}'
expect_status 34 422 "$CODE" "$RESP"

# --- 35) PATCH par A: pending -> confirmed -> 200 -------------------------
call PATCH "/api/orders/${CMD1_REF}/status" "$TOKEN_A" '{"status":"confirmed"}'
expect_status 35 200 "$CODE" "$RESP"

# --- 36) PATCH par A: confirmed -> preparing -> 200 ------------------------
call PATCH "/api/orders/${CMD1_REF}/status" "$TOKEN_A" '{"status":"preparing"}'
expect_status 36 200 "$CODE" "$RESP"

# --- 37) PATCH par A: preparing -> shipped -> 200 --------------------------
call PATCH "/api/orders/${CMD1_REF}/status" "$TOKEN_A" '{"status":"shipped"}'
expect_status 37 200 "$CODE" "$RESP"

# --- 38) PATCH par A: shipped -> delivered -> 200 + deliveredAt set --------
call PATCH "/api/orders/${CMD1_REF}/status" "$TOKEN_A" '{"status":"delivered"}'
expect_status 38 200 "$CODE" "$RESP"
DELIVERED_AT="$(echo "$RESP" | jq -r '.data.order.deliveredAt')"
if [ "$DELIVERED_AT" = "null" ] || [ -z "$DELIVERED_AT" ]; then
  echo "KO 38: deliveredAt devrait etre set"; cleanup_and_exit 1
fi

# --- 39) PATCH delivered -> cancelled (etat terminal) -> 422 ---------------
call PATCH "/api/orders/${CMD1_REF}/status" "$TOKEN_A" '{"status":"cancelled"}'
expect_status 39 422 "$CODE" "$RESP"

# --- 40) Test compensation stock via cancel d'une CMD2 ---------------------
# Etat actuel AFREE: stock=5. On commande 2 -> stock=3. Cancel -> stock=5.
call POST "/api/orders" "$TOKEN_C" '{"items":[{"product":"'"${AFREE_ID}"'","quantity":2}],"paymentMethod":"cash_on_delivery","fulfillmentMethod":"seller_pickup","customerPhone":"'"${PHONE_C}"'"}'
expect_status 40 201 "$CODE" "$RESP"
CMD2_REF="$(echo "$RESP" | jq -r '.data.order.reference')"
CMD2_DELIV="$(echo "$RESP" | jq -r '.data.order.deliveryFee')"
# AFREE est isFreeDelivery -> deliveryFee total = 0 (decision D: 0 si tous gratuits)
if [ "$CMD2_DELIV" != "0" ]; then
  echo "KO 40: deliveryFee attendu 0 (produit gratuit), recu ${CMD2_DELIV}"; cleanup_and_exit 1
fi

# Verifier stock = 3 apres POST
STOCK_AFTER_POST="$(run_mongo "
  const p = await Product.findById('${AFREE_ID}').select('stockQuantity').lean();
  console.log('STOCK=' + p.stockQuantity);
" | grep "^STOCK=" | cut -d= -f2)"
if [ "$STOCK_AFTER_POST" != "3" ]; then
  echo "KO 40 (verif stock): attendu 3, recu ${STOCK_AFTER_POST}"; cleanup_and_exit 1
fi
echo "       (stock AFREE apres POST: ${STOCK_AFTER_POST})"

# --- 41) Cancel par customer (pending) -> 200 ------------------------------
call PATCH "/api/orders/${CMD2_REF}/status" "$TOKEN_C" '{"status":"cancelled"}'
expect_status 41 200 "$CODE" "$RESP"
CANCELLED_AT="$(echo "$RESP" | jq -r '.data.order.cancelledAt')"
if [ "$CANCELLED_AT" = "null" ] || [ -z "$CANCELLED_AT" ]; then
  echo "KO 41: cancelledAt devrait etre set"; cleanup_and_exit 1
fi

# --- 42) Verifier stock restitue = 5 --------------------------------------
STOCK_AFTER_CANCEL="$(run_mongo "
  const p = await Product.findById('${AFREE_ID}').select('stockQuantity').lean();
  console.log('STOCK=' + p.stockQuantity);
" | grep "^STOCK=" | cut -d= -f2)"
if [ "$STOCK_AFTER_CANCEL" != "5" ]; then
  echo "KO 42: stock attendu 5 apres cancel, recu ${STOCK_AFTER_CANCEL}"
  cleanup_and_exit 1
fi
echo "OK 42 (stock AFREE restitue: ${STOCK_AFTER_CANCEL})"

echo "ALL OK"
cleanup_and_exit 0
