#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Smoke test: API produits (Jour 18)
#
# Role exact du fichier:
#   Exerce de bout-en-bout les 6 endpoints /api/products/* avec leurs
#   garde-fous (authenticate, requireApprovedSeller, ownership, validators).
#   Couvre cas heureux ET cas interdits: RBAC, ownership cross-vendeur,
#   champs interdits (mass-assignment), prix/stock invalides, currency
#   etrangere, status "out_of_stock" interdit en entree, category inactive
#   ou inexistante, soft-delete idempotent, isFeatured admin-only.
#
# Quand le lancer:
#   - Apres le seed categories (`node src/scripts/seedCategories.js`).
#   - Apres modif des middlewares, validators, routes ou controleur produits.
#
# Prerequis:
#   - jq installe.
#   - Serveur dev sur BASE_URL (defaut http://localhost:5000).
#   - MONGODB_URI dans backend/.env (utilise pour promotions et cleanup).
#   - Au moins une categorie active en base (le seed en cree 14).
#
# Effet de bord (avant cleanup):
#   - Cree 4 users (1 customer, 2 sellers A et B, 1 admin) timestamps.
#   - Cree 2 SellerProfile (A et B) approuves.
#   - Cree 1 categorie ZZ_TEST inactive (pour scenario "categorie inactive").
#   - Cree 1 Product appartenant a A.
#   - Cleanup en fin (hard-delete via Mongoose): users, sellerprofiles,
#     categorie test, produit.
#
# Codes de retour:
#   - 0: tous les scenarios passent.
#   - 1: un scenario echoue.
#   - 2: dependance manquante ou serveur injoignable.
# -----------------------------------------------------------------------------

set -u

BASE_URL="${BASE_URL:-http://localhost:5000}"
EPOCH="$(date +%s)"
EMAIL_CUSTOMER="prod-smoke-c-${EPOCH}@test.local"
EMAIL_A="prod-smoke-a-${EPOCH}@test.local"
EMAIL_B="prod-smoke-b-${EPOCH}@test.local"
EMAIL_ADMIN="prod-smoke-x-${EPOCH}@test.local"
PHONE_BASE="${EPOCH: -7}"
PHONE_C="+22466${PHONE_BASE}"
PHONE_A="+22467${PHONE_BASE}"
PHONE_B="+22468${PHONE_BASE}"
PHONE_X="+22469${PHONE_BASE}"
PASSWORD="Prod-Smoke-1234"
STORE_A="Boutique A ${EPOCH}"
STORE_B="Boutique B ${EPOCH}"
INACTIVE_CAT_NAME="ZZ_TEST_INACTIVE_${EPOCH}"
PRODUCT_NAME="ZZ Smoke Product ${EPOCH}"

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
  local args=(-sS -o /tmp/prod_smoke_body.json -w "%{http_code}" -X "$method")
  if [ -n "$data" ]; then args+=(--data "$data"); fi
  CODE="$(curl "${args[@]}" "${headers[@]}" "${BASE_URL}${path}")"
  RESP="$(cat /tmp/prod_smoke_body.json)"
}

# Helper Node: promotions et cleanup utilisent MongoDB directement.
# Requiert Node >= 24 (driver MongoDB suppose crypto global).
run_mongo() {
  local script="$1"
  ( cd "$(dirname "$0")/.." && node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const SellerProfile = require('./src/models/SellerProfile');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');
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
    const u = await User.deleteMany({ email: { \$in: ['${EMAIL_CUSTOMER}','${EMAIL_A}','${EMAIL_B}','${EMAIL_ADMIN}'] } });
    const sp = await SellerProfile.deleteMany({ storeName: { \$in: ['${STORE_A}','${STORE_B}'] } });
    const cat = await Category.deleteMany({ name: '${INACTIVE_CAT_NAME}' });
    const p = await Product.deleteMany({ name: { \$regex: '^ZZ Smoke Product ${EPOCH}' } });
    console.log('cleanup users:', u.deletedCount, '| sellers:', sp.deletedCount, '| cats:', cat.deletedCount, '| products:', p.deletedCount);
  " || true
  exit "$code"
}

# --- Setup: recuperer une categorie active du seed ---------------------------
ACTIVE_CAT_ID="$(curl -fsS "${BASE_URL}/api/categories?limit=1" | jq -r '.data.items[0].id')"
if [ -z "$ACTIVE_CAT_ID" ] || [ "$ACTIVE_CAT_ID" = "null" ]; then
  echo "KO setup: aucune categorie active trouvee (lancer le seed d'abord)"; exit 2
fi
echo "setup: categorie active = ${ACTIVE_CAT_ID}"

# --- Setup: creer une categorie inactive pour scenario 16 --------------------
INACTIVE_CAT_ID="$(run_mongo "
  const c = await Category.create({ name: '${INACTIVE_CAT_NAME}', isActive: false, sortOrder: 999 });
  console.log(c._id.toString());
" | tail -1)"
if [ -z "$INACTIVE_CAT_ID" ] || [ ${#INACTIVE_CAT_ID} -ne 24 ]; then
  echo "KO setup: creation categorie inactive a echoue"; cleanup_and_exit 1
fi
echo "setup: categorie inactive = ${INACTIVE_CAT_ID}"

# ============================================================================
# Scenarios
# ============================================================================

# --- 1) Anonyme GET /api/products -> 200 ------------------------------------
call GET "/api/products" "" ""
expect_status 1 200 "$CODE" "$RESP"

# --- 2) Anonyme POST /api/products -> 401 ------------------------------------
call POST "/api/products" "" '{"name":"X"}'
expect_status 2 401 "$CODE" "$RESP"

# --- 3) Register customer (jamais promu vendeur) -----------------------------
call POST "/api/auth/register" "" "$(cat <<EOF
{"firstName":"Cust","lastName":"Smoke","email":"${EMAIL_CUSTOMER}","phone":"${PHONE_C}","password":"${PASSWORD}"}
EOF
)"
expect_status 3 201 "$CODE" "$RESP"
TOKEN_C="$(echo "$RESP" | jq -r '.data.token')"

# --- 4) POST avec customer (pas de sellerProfile) -> 403 ---------------------
# requireApprovedSeller renvoie 403 "Acces vendeur requis" car role != seller/admin.
call POST "/api/products" "$TOKEN_C" "$(cat <<EOF
{"name":"${PRODUCT_NAME}","description":"Description longue de test pour smoke","price":10000,"stockQuantity":5,"category":"${ACTIVE_CAT_ID}"}
EOF
)"
expect_status 4 403 "$CODE" "$RESP"

# --- 5) Register vendeur A + candidature vendeur (status pending) -----------
call POST "/api/auth/register" "" "$(cat <<EOF
{"firstName":"Vendeur","lastName":"Alpha","email":"${EMAIL_A}","phone":"${PHONE_A}","password":"${PASSWORD}"}
EOF
)"
expect_status 5 201 "$CODE" "$RESP"
TOKEN_A="$(echo "$RESP" | jq -r '.data.token')"

call POST "/api/sellers/apply" "$TOKEN_A" "$(cat <<EOF
{"storeName":"${STORE_A}","description":"Boutique de smoke test A"}
EOF
)"
expect_status "5b" 201 "$CODE" "$RESP"

# --- 6) POST par vendeur A pending -> 403 (requireApprovedSeller) -----------
# A est customer + SellerProfile pending. Role User est encore "customer" car
# la promotion en "seller" ne se fait qu'a l'approbation.
call POST "/api/products" "$TOKEN_A" "$(cat <<EOF
{"name":"${PRODUCT_NAME}","description":"Description longue de test pour smoke","price":10000,"stockQuantity":5,"category":"${ACTIVE_CAT_ID}"}
EOF
)"
expect_status 6 403 "$CODE" "$RESP"

# --- 7) Promotion vendeur A approved + POST valide -> 201 -------------------
run_mongo "
  await User.updateOne({ email: '${EMAIL_A}' }, { \$set: { role: 'seller' } });
  await SellerProfile.updateOne({ storeName: '${STORE_A}' }, { \$set: { status: 'approved', approvedAt: new Date() } });
  console.log('A approved');
" >/dev/null || { echo "KO 7: promotion A echec"; cleanup_and_exit 1; }

call POST "/api/products" "$TOKEN_A" "$(cat <<EOF
{"name":"${PRODUCT_NAME}","description":"Description longue de test pour smoke","price":10000,"stockQuantity":5,"category":"${ACTIVE_CAT_ID}","status":"active"}
EOF
)"
expect_status 7 201 "$CODE" "$RESP"
PRODUCT_ID="$(echo "$RESP" | jq -r '.data.product.id')"
PRODUCT_SLUG="$(echo "$RESP" | jq -r '.data.product.slug')"
if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" = "null" ]; then
  echo "KO 7: id produit absent"; cleanup_and_exit 1
fi

# Le retour de POST /api/products n'expose pas le seller populated.
# On recupere le slug du SellerProfile de A via /api/sellers/me pour les
# scenarios publics (route /:sellerSlug/:productSlug) plus loin.
call GET "/api/sellers/me" "$TOKEN_A" ""
expect_status "7b" 200 "$CODE" "$RESP"
SELLER_A_SLUG="$(echo "$RESP" | jq -r '.data.sellerProfile.slug')"
if [ -z "$SELLER_A_SLUG" ] || [ "$SELLER_A_SLUG" = "null" ]; then
  echo "KO 7b: sellerSlug introuvable"; cleanup_and_exit 1
fi
echo "         (produit ID=${PRODUCT_ID}, slug=${PRODUCT_SLUG}, sellerSlug=${SELLER_A_SLUG})"

# --- 7c) Verifier que le produit (status=active) est VISIBLE publiquement ---
# Sanity: la route detail public retourne 200 quand status est public.
call GET "/api/products/${SELLER_A_SLUG}/${PRODUCT_SLUG}" "" ""
expect_status "7c" 200 "$CODE" "$RESP"

# --- 8) POST avec slug en body -> 422 (FORBIDDEN_AT_CREATE) -----------------
call POST "/api/products" "$TOKEN_A" '{"name":"ZZ Smoke Product '"${EPOCH}"' alt1","description":"Description suffisamment longue de test","price":100,"stockQuantity":1,"category":"'"${ACTIVE_CAT_ID}"'","slug":"injection-slug"}'
expect_status 8 422 "$CODE" "$RESP"

# --- 9) POST avec seller en body -> 422 -------------------------------------
call POST "/api/products" "$TOKEN_A" '{"name":"ZZ Smoke Product '"${EPOCH}"' alt2","description":"Description suffisamment longue de test","price":100,"stockQuantity":1,"category":"'"${ACTIVE_CAT_ID}"'","seller":"000000000000000000000000"}'
expect_status 9 422 "$CODE" "$RESP"

# --- 10) POST avec isFeatured en body -> 422 (admin-only au create) ---------
call POST "/api/products" "$TOKEN_A" '{"name":"ZZ Smoke Product '"${EPOCH}"' alt3","description":"Description suffisamment longue de test","price":100,"stockQuantity":1,"category":"'"${ACTIVE_CAT_ID}"'","isFeatured":true}'
expect_status 10 422 "$CODE" "$RESP"

# --- 11) POST avec price negatif -> 422 -------------------------------------
call POST "/api/products" "$TOKEN_A" '{"name":"ZZ Smoke Product '"${EPOCH}"' alt4","description":"Description suffisamment longue de test","price":-10,"stockQuantity":1,"category":"'"${ACTIVE_CAT_ID}"'"}'
expect_status 11 422 "$CODE" "$RESP"

# --- 12) POST avec price decimal -> 422 (entier requis) ---------------------
call POST "/api/products" "$TOKEN_A" '{"name":"ZZ Smoke Product '"${EPOCH}"' alt5","description":"Description suffisamment longue de test","price":10.5,"stockQuantity":1,"category":"'"${ACTIVE_CAT_ID}"'"}'
expect_status 12 422 "$CODE" "$RESP"

# --- 13) POST avec stockQuantity negatif -> 422 -----------------------------
call POST "/api/products" "$TOKEN_A" '{"name":"ZZ Smoke Product '"${EPOCH}"' alt6","description":"Description suffisamment longue de test","price":100,"stockQuantity":-1,"category":"'"${ACTIVE_CAT_ID}"'"}'
expect_status 13 422 "$CODE" "$RESP"

# --- 14) POST avec currency USD -> 422 --------------------------------------
call POST "/api/products" "$TOKEN_A" '{"name":"ZZ Smoke Product '"${EPOCH}"' alt7","description":"Description suffisamment longue de test","price":100,"stockQuantity":1,"category":"'"${ACTIVE_CAT_ID}"'","currency":"USD"}'
expect_status 14 422 "$CODE" "$RESP"

# --- 15) POST avec status out_of_stock -> 422 (status derive uniquement) ----
call POST "/api/products" "$TOKEN_A" '{"name":"ZZ Smoke Product '"${EPOCH}"' alt8","description":"Description suffisamment longue de test","price":100,"stockQuantity":1,"category":"'"${ACTIVE_CAT_ID}"'","status":"out_of_stock"}'
expect_status 15 422 "$CODE" "$RESP"

# --- 16) POST avec category inactive -> 422 ---------------------------------
call POST "/api/products" "$TOKEN_A" '{"name":"ZZ Smoke Product '"${EPOCH}"' alt9","description":"Description suffisamment longue de test","price":100,"stockQuantity":1,"category":"'"${INACTIVE_CAT_ID}"'"}'
expect_status 16 422 "$CODE" "$RESP"

# --- 17) POST avec category ObjectId inexistant -> 422 ----------------------
call POST "/api/products" "$TOKEN_A" '{"name":"ZZ Smoke Product '"${EPOCH}"' alt10","description":"Description suffisamment longue de test","price":100,"stockQuantity":1,"category":"000000000000000000000000"}'
expect_status 17 422 "$CODE" "$RESP"

# --- 18) Vendeur B promu approved ; PATCH par B sur produit de A -> 403 -----
call POST "/api/auth/register" "" "$(cat <<EOF
{"firstName":"Vendeur","lastName":"Beta","email":"${EMAIL_B}","phone":"${PHONE_B}","password":"${PASSWORD}"}
EOF
)"
expect_status "18-pre1" 201 "$CODE" "$RESP"
TOKEN_B="$(echo "$RESP" | jq -r '.data.token')"

call POST "/api/sellers/apply" "$TOKEN_B" "$(cat <<EOF
{"storeName":"${STORE_B}","description":"Boutique de smoke test B"}
EOF
)"
expect_status "18-pre2" 201 "$CODE" "$RESP"

run_mongo "
  await User.updateOne({ email: '${EMAIL_B}' }, { \$set: { role: 'seller' } });
  await SellerProfile.updateOne({ storeName: '${STORE_B}' }, { \$set: { status: 'approved', approvedAt: new Date() } });
" >/dev/null || { echo "KO 18-pre: promotion B echec"; cleanup_and_exit 1; }

call PATCH "/api/products/${PRODUCT_ID}" "$TOKEN_B" '{"description":"tentative cross-vendeur depuis B"}'
expect_status 18 403 "$CODE" "$RESP"

# --- 19) DELETE par B sur produit de A -> 403 -------------------------------
call DELETE "/api/products/${PRODUCT_ID}" "$TOKEN_B" ""
expect_status 19 403 "$CODE" "$RESP"

# --- 20) Admin promotion + admin PATCH -> 200 (override ownership) ----------
call POST "/api/auth/register" "" "$(cat <<EOF
{"firstName":"Admin","lastName":"Smoke","email":"${EMAIL_ADMIN}","phone":"${PHONE_X}","password":"${PASSWORD}"}
EOF
)"
expect_status "20-pre" 201 "$CODE" "$RESP"
TOKEN_X="$(echo "$RESP" | jq -r '.data.token')"

run_mongo "
  await User.updateOne({ email: '${EMAIL_ADMIN}' }, { \$set: { role: 'admin' } });
" >/dev/null || { echo "KO 20-pre: promotion admin echec"; cleanup_and_exit 1; }

call PATCH "/api/products/${PRODUCT_ID}" "$TOKEN_X" '{"description":"Description mise a jour par admin smoke"}'
expect_status 20 200 "$CODE" "$RESP"

# --- 21) Vendeur A PATCH avec isFeatured -> 422 (admin-only) ---------------
call PATCH "/api/products/${PRODUCT_ID}" "$TOKEN_A" '{"isFeatured":true}'
expect_status 21 422 "$CODE" "$RESP"

# --- 22) Admin PATCH isFeatured -> 200 -------------------------------------
call PATCH "/api/products/${PRODUCT_ID}" "$TOKEN_X" '{"isFeatured":true}'
expect_status 22 200 "$CODE" "$RESP"
IS_FEATURED="$(echo "$RESP" | jq -r '.data.product.isFeatured')"
if [ "$IS_FEATURED" != "true" ]; then
  echo "KO 22: isFeatured attendu true, recu ${IS_FEATURED}"; cleanup_and_exit 1
fi

# --- 23) PATCH :id non-ObjectId -> 422 -------------------------------------
call PATCH "/api/products/pas-un-objectid" "$TOKEN_A" '{"description":"x"}'
expect_status 23 422 "$CODE" "$RESP"

# --- 24) PATCH :id ObjectId valide inexistant -> 404 -----------------------
call PATCH "/api/products/000000000000000000000000" "$TOKEN_A" '{"description":"Description suffisamment longue x"}'
expect_status 24 404 "$CODE" "$RESP"

# --- 25) DELETE par A (owner) -> 200, status=archived ----------------------
call DELETE "/api/products/${PRODUCT_ID}" "$TOKEN_A" ""
expect_status 25 200 "$CODE" "$RESP"
STATUS="$(echo "$RESP" | jq -r '.data.product.status')"
if [ "$STATUS" != "archived" ]; then
  echo "KO 25: status attendu archived, recu ${STATUS}"; cleanup_and_exit 1
fi

# --- 26) GET public du produit archived -> 404 -----------------------------
call GET "/api/products/${SELLER_A_SLUG}/${PRODUCT_SLUG}" "" ""
expect_status 26 404 "$CODE" "$RESP"

# --- 27) DELETE idempotent -> 200 ------------------------------------------
call DELETE "/api/products/${PRODUCT_ID}" "$TOKEN_A" ""
expect_status 27 200 "$CODE" "$RESP"

echo "ALL OK"
cleanup_and_exit 0
