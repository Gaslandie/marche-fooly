#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Smoke test: scenario vendeur (Jour 16)
#
# Role exact du fichier:
#   Exerce de bout-en-bout les 3 endpoints /api/sellers/* avec leurs garde-fous
#   (authenticate, requireRole, requireApprovedSeller, validators). C'est un
#   smoke-test, pas un test exhaustif: on verifie que le cablage tient, que
#   chaque middleware repond le bon code HTTP, et que le contrat JSON est
#   coherent. Si tout passe ici, on a une bonne confiance qu'un client front
#   peut se brancher dessus sans surprise.
#
# Quand le lancer:
#   - Apres demarrage du serveur dev (npm run dev) sur PORT=5000.
#   - Apres toute modif des middlewares vendeur, des validators, du routeur
#     /api/sellers, ou de la chaine authenticate.
#
# Prerequis:
#   - jq installe (parser JSON pour extraire le token et l'id).
#   - MongoDB Atlas accessible (le .env du backend est correctement charge).
#   - Le serveur dev tourne sur BASE_URL (par defaut http://localhost:5000).
#
# Effet de bord:
#   Cree des comptes de test dans MongoDB Atlas avec un email timestampe:
#     smoke-<epoch>@test.local et smoke-orphan-<epoch>@test.local.
#   A purger manuellement depuis Atlas (ou on automatisera plus tard avec
#   une base de test dediee).
#
# Convention de sortie:
#   - "OK <n>" sur une ligne quand un scenario passe.
#   - "KO <n>" + dump de la reponse + exit 1 au premier scenario qui echoue.
#   - "ALL OK" en fin si les 8 scenarios passent.
#
# Codes de retour:
#   - 0: tous les scenarios sont passes.
#   - 1: un scenario a echoue (le numero et la reponse sont affiches).
#   - 2: dependance manquante (jq) ou serveur injoignable.
# -----------------------------------------------------------------------------

set -u

BASE_URL="${BASE_URL:-http://localhost:5000}"
EPOCH="$(date +%s)"
EMAIL="smoke-${EPOCH}@test.local"
EMAIL_ORPHAN="smoke-orphan-${EPOCH}@test.local"
PHONE="+22462${EPOCH: -7}"
PHONE_ORPHAN="+22463${EPOCH: -7}"
PASSWORD="Smoke-Test-1234"

# --- Prerequis ---------------------------------------------------------------
if ! command -v jq >/dev/null 2>&1; then
  echo "KO: jq est requis (apt install jq)"; exit 2
fi
if ! curl -fsS "${BASE_URL}/" >/dev/null 2>&1; then
  echo "KO: serveur injoignable sur ${BASE_URL}"; exit 2
fi

# --- Helpers ----------------------------------------------------------------
# expect_status <numero scenario> <code attendu> <code recu> <corps>
expect_status() {
  local n="$1" expected="$2" got="$3" body="$4"
  if [ "$got" = "$expected" ]; then
    echo "OK ${n} (HTTP ${got})"
  else
    echo "KO ${n}: attendu ${expected}, recu ${got}"
    echo "Reponse: ${body}"
    exit 1
  fi
}

# call <METHOD> <PATH> <TOKEN_ou_vide> <JSON_ou_vide>
# Ecrit la reponse dans la variable globale RESP et le code dans CODE.
call() {
  local method="$1" path="$2" token="$3" data="$4"
  local headers=(-H "Content-Type: application/json")
  if [ -n "$token" ]; then
    headers+=(-H "Authorization: Bearer ${token}")
  fi
  local args=(-sS -o /tmp/seller_smoke_body.json -w "%{http_code}" -X "$method")
  if [ -n "$data" ]; then
    args+=(--data "$data")
  fi
  CODE="$(curl "${args[@]}" "${headers[@]}" "${BASE_URL}${path}")"
  RESP="$(cat /tmp/seller_smoke_body.json)"
}

# --- 1) Anonyme bloque par authenticate -------------------------------------
call POST "/api/sellers/apply" "" '{"storeName":"Anonymous Store"}'
expect_status 1 401 "$CODE" "$RESP"

# --- 2) Register d'un client de test ----------------------------------------
call POST "/api/auth/register" "" "$(cat <<EOF
{"firstName":"Smoke","lastName":"Tester","email":"${EMAIL}","phone":"${PHONE}","password":"${PASSWORD}"}
EOF
)"
expect_status 2 201 "$CODE" "$RESP"
TOKEN="$(echo "$RESP" | jq -r '.data.token')"
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "KO 2: token absent de la reponse register"; echo "$RESP"; exit 1
fi

# --- 3) Candidature vendeur valide ------------------------------------------
# Le slug est unique et derive du storeName: on timestamp pour eviter une
# collision d'index entre deux runs successifs (sinon Mongo renvoie 11000
# que le controller mappe sur 409 "candidature existe deja").
call POST "/api/sellers/apply" "$TOKEN" "$(cat <<EOF
{"storeName":"Boutique Smoke ${EPOCH}","description":"Test de candidature"}
EOF
)"
expect_status 3 201 "$CODE" "$RESP"
STATUS_FIELD="$(echo "$RESP" | jq -r '.data.sellerProfile.status')"
if [ "$STATUS_FIELD" != "pending" ]; then
  echo "KO 3: status attendu 'pending', recu '${STATUS_FIELD}'"; exit 1
fi

# --- 4) Double candidature refusee ------------------------------------------
call POST "/api/sellers/apply" "$TOKEN" '{"storeName":"Boutique Smoke 2"}'
expect_status 4 409 "$CODE" "$RESP"

# --- 5) Lecture de sa fiche --------------------------------------------------
call GET "/api/sellers/me" "$TOKEN" ""
expect_status 5 200 "$CODE" "$RESP"
STATUS_FIELD="$(echo "$RESP" | jq -r '.data.sellerProfile.status')"
if [ "$STATUS_FIELD" != "pending" ]; then
  echo "KO 5: status attendu 'pending', recu '${STATUS_FIELD}'"; exit 1
fi

# --- 6) PATCH /me bloque pour role=customer (requireRole) --------------------
call PATCH "/api/sellers/me" "$TOKEN" '{"description":"tentative interdite"}'
expect_status 6 403 "$CODE" "$RESP"

# --- 7) Validator: storeName trop court (1 caractere) ------------------------
# Le compte deja inscrit est en doublon; on doit donc tester le validator
# AVANT que la regle metier 409 ne s'applique. Pour cela on inscrit un
# nouveau user "orphelin" qui n'a pas encore de SellerProfile.
# Le backend renvoie 422 pour les erreurs de validation (cf. runValidators
# dans middlewares/validate.js): convention coherente avec le reste de l'API.
call POST "/api/auth/register" "" "$(cat <<EOF
{"firstName":"Orphan","lastName":"Tester","email":"${EMAIL_ORPHAN}","phone":"${PHONE_ORPHAN}","password":"${PASSWORD}"}
EOF
)"
expect_status "7-pre" 201 "$CODE" "$RESP"
TOKEN_ORPHAN="$(echo "$RESP" | jq -r '.data.token')"

call POST "/api/sellers/apply" "$TOKEN_ORPHAN" '{"storeName":"x"}'
expect_status 7 422 "$CODE" "$RESP"

# --- 8) GET /me pour un user sans SellerProfile ------------------------------
call GET "/api/sellers/me" "$TOKEN_ORPHAN" ""
expect_status 8 404 "$CODE" "$RESP"

echo "ALL OK"
