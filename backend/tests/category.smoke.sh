#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Smoke test: API categories (Jour 17)
#
# Role exact du fichier:
#   Exerce de bout-en-bout les 5 endpoints /api/categories/* avec leurs
#   garde-fous (authenticate, requireRole("admin"), validators). On verifie
#   les cas heureux ET les cas interdits (RBAC, validation, soft-delete,
#   cycle parentCategory).
#
# Quand le lancer:
#   - Apres le seed initial (`node src/scripts/seedCategories.js`).
#   - Apres modif des middlewares, validators ou routes categories.
#
# Prerequis:
#   - jq installe.
#   - Serveur dev sur BASE_URL (defaut http://localhost:5000).
#   - MONGODB_URI dans backend/.env (utilise pour promouvoir un user en admin).
#
# Effet de bord:
#   - Cree un compte customer-puis-admin avec email timestampe.
#   - Cree une categorie de test, la modifie, puis la soft-delete.
#   - Cleanup en fin: hard-delete du user de test ET de la categorie de test.
#
# Codes de retour:
#   - 0: tous les scenarios passent.
#   - 1: un scenario echoue (numero + reponse affiches).
#   - 2: dependance manquante ou serveur injoignable.
# -----------------------------------------------------------------------------

set -u

BASE_URL="${BASE_URL:-http://localhost:5000}"
EPOCH="$(date +%s)"
EMAIL="cat-smoke-${EPOCH}@test.local"
PHONE="+22465${EPOCH: -7}"
PASSWORD="Cat-Smoke-1234"
CAT_NAME="ZZ Test Categorie ${EPOCH}"
CAT_NAME_SHORT="Z"

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
  local args=(-sS -o /tmp/cat_smoke_body.json -w "%{http_code}" -X "$method")
  if [ -n "$data" ]; then args+=(--data "$data"); fi
  CODE="$(curl "${args[@]}" "${headers[@]}" "${BASE_URL}${path}")"
  RESP="$(cat /tmp/cat_smoke_body.json)"
}

# Helper Node: promotion admin et cleanup utilisent MongoDB directement.
# Requiert Node >= 24 (driver MongoDB >= 6 suppose crypto global, dispo
# nativement depuis Node 19; on standardise sur Node 24 via .nvmrc).
run_mongo() {
  local script="$1"
  ( cd "$(dirname "$0")/.." && node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
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
    const u = await User.deleteOne({ email: '${EMAIL}' });
    const c = await Category.deleteMany({ name: { \$regex: '^ZZ Test Categorie ${EPOCH}' } });
    console.log('cleanup users:', u.deletedCount, '| categories:', c.deletedCount);
  " || true
  exit "$code"
}

# --- 1) POST sans token -> 401 ----------------------------------------------
call POST "/api/categories" "" '{"name":"X"}'
expect_status 1 401 "$CODE" "$RESP"

# --- 2) Register customer ---------------------------------------------------
call POST "/api/auth/register" "" "$(cat <<EOF
{"firstName":"Cat","lastName":"Smoke","email":"${EMAIL}","phone":"${PHONE}","password":"${PASSWORD}"}
EOF
)"
expect_status 2 201 "$CODE" "$RESP"
TOKEN="$(echo "$RESP" | jq -r '.data.token')"
USER_ID="$(echo "$RESP" | jq -r '.data.user.id')"
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "KO 2: token manquant"; cleanup_and_exit 1
fi

# --- 3) POST avec customer -> 403 (requireRole admin) -----------------------
call POST "/api/categories" "$TOKEN" "$(cat <<EOF
{"name":"${CAT_NAME}"}
EOF
)"
expect_status 3 403 "$CODE" "$RESP"

# --- 4) Promotion admin via Mongo -------------------------------------------
run_mongo "
  const r = await User.updateOne({ email: '${EMAIL}' }, { \$set: { role: 'admin' } });
  if (r.modifiedCount !== 1) { console.error('promotion echec'); process.exit(1); }
  console.log('promu admin');
" >/dev/null || { echo "KO 4: promotion admin a echoue"; cleanup_and_exit 1; }
echo "OK 4 (promotion admin)"

# --- 5) POST admin valide -> 201 --------------------------------------------
# Le token n'a pas change mais authenticate.js recharge le User depuis Mongo
# a chaque requete, donc le role admin est pris en compte immediatement.
call POST "/api/categories" "$TOKEN" "$(cat <<EOF
{"name":"${CAT_NAME}","description":"Cree par smoke test"}
EOF
)"
expect_status 5 201 "$CODE" "$RESP"
CAT_ID="$(echo "$RESP" | jq -r '.data.category.id')"
CAT_SLUG="$(echo "$RESP" | jq -r '.data.category.slug')"
if [ -z "$CAT_ID" ] || [ "$CAT_ID" = "null" ]; then
  echo "KO 5: id manquant dans la reponse"; cleanup_and_exit 1
fi

# --- 6) POST name en doublon -> 409 -----------------------------------------
call POST "/api/categories" "$TOKEN" "$(cat <<EOF
{"name":"${CAT_NAME}"}
EOF
)"
expect_status 6 409 "$CODE" "$RESP"

# --- 7) POST name trop court -> 422 -----------------------------------------
call POST "/api/categories" "$TOKEN" "$(cat <<EOF
{"name":"${CAT_NAME_SHORT}"}
EOF
)"
expect_status 7 422 "$CODE" "$RESP"

# --- 8) POST avec slug en body -> 422 (champ interdit) -----------------------
call POST "/api/categories" "$TOKEN" '{"name":"ZZ Smoke Slug","slug":"injection-slug"}'
expect_status 8 422 "$CODE" "$RESP"

# --- 9) POST avec parentCategory inexistant -> 422 ---------------------------
# 24 zeros = ObjectId valide mais inexistant.
call POST "/api/categories" "$TOKEN" "$(cat <<EOF
{"name":"ZZ Smoke Parent ${EPOCH}","parentCategory":"000000000000000000000000"}
EOF
)"
expect_status 9 422 "$CODE" "$RESP"

# --- 10) PATCH id non-ObjectId -> 422 ---------------------------------------
call PATCH "/api/categories/pas-un-objectid" "$TOKEN" '{"description":"x"}'
expect_status 10 422 "$CODE" "$RESP"

# --- 11) PATCH id valide mais inexistant -> 404 -----------------------------
call PATCH "/api/categories/000000000000000000000000" "$TOKEN" '{"description":"x"}'
expect_status 11 404 "$CODE" "$RESP"

# --- 12) PATCH cycle: categorie comme son propre parent -> 422 ---------------
call PATCH "/api/categories/${CAT_ID}" "$TOKEN" "$(cat <<EOF
{"parentCategory":"${CAT_ID}"}
EOF
)"
expect_status 12 422 "$CODE" "$RESP"

# --- 13) PATCH valide -> 200 -------------------------------------------------
call PATCH "/api/categories/${CAT_ID}" "$TOKEN" '{"description":"Description mise a jour par smoke","sortOrder":99}'
expect_status 13 200 "$CODE" "$RESP"

# --- 14) GET listing public -> 200 + structure paginee ----------------------
call GET "/api/categories?limit=50" "" ""
expect_status 14 200 "$CODE" "$RESP"
TOTAL="$(echo "$RESP" | jq -r '.data.pagination.total')"
if [ -z "$TOTAL" ] || [ "$TOTAL" = "null" ]; then
  echo "KO 14: total manquant"; cleanup_and_exit 1
fi

# --- 15) DELETE valide -> 200 (soft-delete) ---------------------------------
call DELETE "/api/categories/${CAT_ID}" "$TOKEN" ""
expect_status 15 200 "$CODE" "$RESP"
IS_ACTIVE="$(echo "$RESP" | jq -r '.data.category.isActive')"
if [ "$IS_ACTIVE" != "false" ]; then
  echo "KO 15: isActive attendu false, recu ${IS_ACTIVE}"; cleanup_and_exit 1
fi

# --- 16) GET /:slug du soft-deleted -> 404 (filtre isActive:true) -----------
call GET "/api/categories/${CAT_SLUG}" "" ""
expect_status 16 404 "$CODE" "$RESP"

# --- 17) DELETE idempotent (deja soft-deleted) -> 200 -----------------------
call DELETE "/api/categories/${CAT_ID}" "$TOKEN" ""
expect_status 17 200 "$CODE" "$RESP"

echo "ALL OK"
cleanup_and_exit 0
