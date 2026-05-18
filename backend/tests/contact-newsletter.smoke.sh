#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Smoke test: API contact + newsletter (Jour 20)
#
# Role exact du fichier:
#   Exerce les routes publiques /api/contact et /api/newsletter/subscribe:
#     - validation stricte (email, longueurs)
#     - refus 422 des champs interdits (status, isActive, etc.)
#     - idempotence newsletter (existant actif -> 200 alreadySubscribed)
#     - reactivation newsletter (existant inactif -> 200 reactive)
#     - rate-limit publicFormRateLimiter (10/15min/IP) -> 429 sur 11e
#
# Quand le lancer:
#   - Apres modification des validators/controllers/routes contact ou newsletter,
#     ou du publicFormRateLimiter.
#
# Prerequis:
#   - jq installe.
#   - Serveur sur BASE_URL (defaut http://localhost:5000), redemarre apres
#     modif app.js (pour charger les nouvelles routes ET pour resetter le
#     compteur du rate-limiter si on a deja consume des credits).
#   - MONGODB_URI dans backend/.env (setup inactive + cleanup).
#
# Effet de bord (avant cleanup):
#   - 2 ContactMessage (1 valide en debut + 1 rate-limit boundary).
#   - 1 NewsletterSubscriber (email_n) reactive en fin de smoke.
#   - Cleanup: hard-delete via Mongoose sur emails et patterns timestampes.
#
# IMPORTANT - rate-limit:
#   Le compteur publicFormRateLimiter est PARTAGE entre /api/contact et
#   /api/newsletter (meme instance). Si ce smoke est relance dans les
#   15 minutes suivant un precedent run a > 10 requetes, les premieres
#   requetes echoueront 429. Solution: redemarrer le serveur (reset
#   in-memory store) OU attendre 15 min.
#
# Codes de retour:
#   - 0: tous les scenarios passent.
#   - 1: un scenario echoue.
#   - 2: dependance manquante ou serveur injoignable.
# -----------------------------------------------------------------------------

set -u

BASE_URL="${BASE_URL:-http://localhost:5000}"
EPOCH="$(date +%s)"
EMAIL_C="smoke-c-${EPOCH}@test.local"
EMAIL_C2="smoke-c2-${EPOCH}@test.local"
EMAIL_N="smoke-n-${EPOCH}@test.local"

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
  local method="$1" path="$2" data="$3"
  local args=(-sS -o /tmp/cn_smoke_body.json -w "%{http_code}" -X "$method" -H "Content-Type: application/json")
  if [ -n "$data" ]; then args+=(--data "$data"); fi
  CODE="$(curl "${args[@]}" "${BASE_URL}${path}")"
  RESP="$(cat /tmp/cn_smoke_body.json)"
}

run_mongo() {
  local script="$1"
  ( cd "$(dirname "$0")/.." && node -e "
require('dotenv').config();
const mongoose = require('mongoose');
const ContactMessage = require('./src/models/ContactMessage');
const NewsletterSubscriber = require('./src/models/NewsletterSubscriber');
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
    const c = await ContactMessage.deleteMany({ email: { \$in: ['${EMAIL_C}','${EMAIL_C2}'] } });
    const n = await NewsletterSubscriber.deleteMany({ email: { \$in: ['${EMAIL_N}'] } });
    console.log('cleanup contacts:', c.deletedCount, '| newsletters:', n.deletedCount);
  " || true
  exit "$code"
}

# ============================================================================
# Scenarios CONTACT (1-4)
# ============================================================================

# --- 1) POST /api/contact valide -> 201 -------------------------------------
call POST "/api/contact" "$(cat <<EOF
{"fullName":"Aissatou Smoke","email":"${EMAIL_C}","subject":"Question test","message":"Bonjour, ceci est un message de test smoke long de plus de 10 caracteres."}
EOF
)"
expect_status 1 201 "$CODE" "$RESP"

# --- 2) POST /api/contact email invalide -> 422 ----------------------------
call POST "/api/contact" '{"fullName":"X Y","email":"pas-un-email","subject":"abc","message":"Message valide assez long pour passer le minlength."}'
expect_status 2 422 "$CODE" "$RESP"

# --- 3) POST /api/contact message trop court -> 422 ------------------------
call POST "/api/contact" '{"fullName":"X Y","email":"a@b.com","subject":"abc","message":"trop"}'
expect_status 3 422 "$CODE" "$RESP"

# --- 4) POST /api/contact champ interdit (status) -> 422 -------------------
call POST "/api/contact" '{"fullName":"X Y","email":"a@b.com","subject":"abc","message":"Message valide assez long pour passer le minlength.","status":"resolved"}'
expect_status 4 422 "$CODE" "$RESP"

# ============================================================================
# Scenarios NEWSLETTER (5-9)
# ============================================================================

# --- 5) POST /api/newsletter/subscribe email nouveau -> 201 ----------------
call POST "/api/newsletter/subscribe" "$(cat <<EOF
{"email":"${EMAIL_N}","source":"smoke"}
EOF
)"
expect_status 5 201 "$CODE" "$RESP"
ALREADY="$(echo "$RESP" | jq -r '.data.alreadySubscribed')"
if [ "$ALREADY" != "false" ]; then
  echo "KO 5: alreadySubscribed attendu false sur creation, recu ${ALREADY}"
  cleanup_and_exit 1
fi

# --- 6) POST /api/newsletter/subscribe email deja actif -> 200 idempotent --
call POST "/api/newsletter/subscribe" "$(cat <<EOF
{"email":"${EMAIL_N}"}
EOF
)"
expect_status 6 200 "$CODE" "$RESP"
ALREADY="$(echo "$RESP" | jq -r '.data.alreadySubscribed')"
if [ "$ALREADY" != "true" ]; then
  echo "KO 6: alreadySubscribed attendu true sur re-subscribe actif, recu ${ALREADY}"
  cleanup_and_exit 1
fi

# --- 7) Set inactive via Mongo + POST -> reactivation 200 alreadySubscribed=false
run_mongo "
  await NewsletterSubscriber.updateOne(
    { email: '${EMAIL_N}' },
    { \$set: { isActive: false, unsubscribedAt: new Date() } },
  );
" >/dev/null || { echo "KO 7-pre: deactivation echec"; cleanup_and_exit 1; }

call POST "/api/newsletter/subscribe" "$(cat <<EOF
{"email":"${EMAIL_N}"}
EOF
)"
expect_status 7 200 "$CODE" "$RESP"
ALREADY="$(echo "$RESP" | jq -r '.data.alreadySubscribed')"
if [ "$ALREADY" != "false" ]; then
  echo "KO 7: alreadySubscribed attendu false sur reactivation, recu ${ALREADY}"
  cleanup_and_exit 1
fi

# Verifier en base: isActive=true, unsubscribedAt=null
STATE="$(run_mongo "
  const n = await NewsletterSubscriber.findOne({ email: '${EMAIL_N}' }).lean();
  console.log('isActive=' + n.isActive);
  console.log('unsubscribedAt=' + (n.unsubscribedAt === null ? 'null' : 'set'));
")"
if ! echo "$STATE" | grep -q "isActive=true"; then
  echo "KO 7 (verif base): isActive devrait etre true"; cleanup_and_exit 1
fi
if ! echo "$STATE" | grep -q "unsubscribedAt=null"; then
  echo "KO 7 (verif base): unsubscribedAt devrait etre null"; cleanup_and_exit 1
fi

# --- 8) POST /api/newsletter/subscribe email invalide -> 422 ---------------
call POST "/api/newsletter/subscribe" '{"email":"pas-un-email"}'
expect_status 8 422 "$CODE" "$RESP"

# --- 9) POST /api/newsletter/subscribe champ interdit (isActive) -> 422 ----
call POST "/api/newsletter/subscribe" '{"email":"smoke-zz@test.local","isActive":true}'
expect_status 9 422 "$CODE" "$RESP"

# ============================================================================
# Scenarios RATE-LIMIT (10-11) - EN DERNIER pour ne pas bloquer les autres
# ============================================================================
# Compteur courant: 9 requetes deja consommees (scenarios 1-9). Le limiter
# est limit=10, donc la 10e doit passer et la 11e doit etre 429.

# --- 10) 10e requete: doit encore passer (limite inclusive) ----------------
call POST "/api/contact" "$(cat <<EOF
{"fullName":"Boundary Smoke","email":"${EMAIL_C2}","subject":"Limite","message":"Message limite assez long pour passer le validator de longueur."}
EOF
)"
expect_status 10 201 "$CODE" "$RESP"

# --- 11) 11e requete: doit retourner 429 -----------------------------------
call POST "/api/contact" '{"fullName":"Beyond Smoke","email":"smoke-over@test.local","subject":"Over","message":"Message over la limite assez long pour passer le validator."}'
expect_status 11 429 "$CODE" "$RESP"

echo "ALL OK"
cleanup_and_exit 0
