/**
 * Options communes Mongoose.
 * On les centralise pour garder des sorties API coherentes et limiter le bruit.
 */
const createSchemaOptions = (overrides = {}) => ({
  timestamps: true,
  versionKey: false,
  minimize: false,
  ...overrides,
});

module.exports = {
  createSchemaOptions,
};
