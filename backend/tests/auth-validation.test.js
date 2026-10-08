const test = require('node:test');
const assert = require('node:assert/strict');
const { registerValidators, updateMeValidators } = require('../src/validators/authValidators');
const { runValidators } = require('../src/middlewares/validate');
const { guineaPhoneMatch } = require('../src/models/shared/validators');
const { shouldSkipAuthRateLimit } = require('../src/middlewares/rateLimiters');

async function validate(body, validators = registerValidators) {
  const req = { body: { ...body } };
  let status, response, passed = false;
  const res = { status(code) { status = code; return this; }, json(value) { response = value; } };
  await runValidators(validators)(req, res, () => { passed = true; });
  return { body: req.body, status, response, passed };
}
const valid = { firstName: 'Mamadou', lastName: 'Diallo', email: 'validation@example.com', phone: '612345678', password: 'Une phrase de test seulement!' };

test('noms internationaux, accents composés et séparateurs acceptés', async () => {
  for (const name of ['Élodie', 'N’Diaye', "N'Diaye", 'Jean-Pierre', 'Abdoulaye Mamadou', 'محمد', '张伟', 'E\u0301lodie']) {
    const result = await validate({ ...valid, firstName: name });
    assert.equal(result.passed, true, name);
    assert.equal(result.body.firstName, name.normalize('NFC'));
  }
  const result = await validate({ ...valid, firstName: '  Jean   Pierre  ' });
  assert.equal(result.body.firstName, 'Jean Pierre');
});
test('chiffres, balises, caractères invisibles et mauvais types refusés', async () => {
  for (const field of ['firstName', 'lastName']) {
    for (const value of ['455555555', 'Jean2', 'A\u200bminata', '<script>', '---', '', 'A', 'a'.repeat(81), null, {}, ['Diallo']]) {
      const result = await validate({ ...valid, [field]: value });
      assert.equal(result.status, 422, `${field}: ${typeof value}`);
      assert.ok(result.response.data.errors.some(error => error.field === field));
    }
  }
});
test('9 chiffres avec ou sans indicatif convergent vers le même numéro', async () => {
  for (const phone of ['612345678', '612 34 56 78', '+224612345678', '+224 612 34 56 78', '00224 612-34-56-78', '+224 (612) 34.56.78']) {
    const result = await validate({ ...valid, phone });
    assert.equal(result.passed, true, phone);
    assert.equal(result.body.phone, '+224612345678');
    assert.equal(guineaPhoneMatch(result.body.phone).test(phone), true);
  }
  assert.equal(guineaPhoneMatch('+224612345678').test('+224612345679'), false);
});
test('indicatif erroné, longueur et contenu invalides refusés côté serveur', async () => {
  for (const phone of ['+24612345678', '+225612345678', '61234567', '6123456789', '555555555555555', '0612345678', 'abcdefghi', '+22461234x678', '+224+612345678', '', {}, null, ['612345678']]) {
    const result = await validate({ ...valid, phone });
    assert.equal(result.status, 422, String(phone));
  }
});
test('adresse incomplète et mot de passe court refusés sans fuite des valeurs', async () => {
  const result = await validate({ ...valid, email: 'pppp@bbbb', password: 'secret' });
  assert.equal(result.status, 422);
  assert.deepEqual(new Set(result.response.data.errors.map(e => e.field)), new Set(['email', 'password']));
  assert.ok(!JSON.stringify(result.response).includes('secret'));
  assert.ok(!JSON.stringify(result.response).includes('pppp@bbbb'));
});
test('modification du profil : mêmes règles, anciens champs non soumis ignorés', async () => {
  assert.equal((await validate({ firstName: '1234' }, updateMeValidators)).status, 422);
  assert.equal((await validate({ phone: '+24 612345678' }, updateMeValidators)).status, 422);
  assert.equal((await validate({ avatarUrl: '' }, updateMeValidators)).passed, true);
  const result = await validate({ phone: '612 34 56 78' }, updateMeValidators);
  assert.equal(result.passed, true);
  assert.equal(result.body.phone, '+224612345678');
});

test('le limiteur anti-force brute ne compte pas les lectures de session', () => {
  for (const path of ['/register', '/login', '/forgot-password', '/reset-password']) {
    assert.equal(shouldSkipAuthRateLimit({ method: 'POST', path }), false, path);
    for (const variant of [path + '/', path.toUpperCase(), path.toUpperCase() + '/']) {
      assert.equal(shouldSkipAuthRateLimit({ method: 'POST', path: variant }), false, variant);
    }
  }
  assert.equal(shouldSkipAuthRateLimit({ method: 'GET', path: '/me' }), true);
  assert.equal(shouldSkipAuthRateLimit({ method: 'PATCH', path: '/me' }), true);
  assert.equal(shouldSkipAuthRateLimit({ method: 'POST', path: '/logout' }), true);
});
