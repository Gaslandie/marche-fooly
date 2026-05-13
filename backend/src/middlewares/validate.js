const { validationResult } = require("express-validator");

/**
 * Execute la liste de validators express-validator puis renvoie une 422
 * uniforme si au moins une regle a echoue. Aucun mot de passe n'est
 * jamais inclus dans la reponse: seuls les noms de champs et messages
 * sont exposes.
 */
const runValidators = (validators) => async (req, res, next) => {
  for (const validator of validators) {
    await validator.run(req);
  }

  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  return res.status(422).json({
    success: false,
    message: "Donnees invalides",
    data: { errors },
  });
};

module.exports = {
  runValidators,
};
