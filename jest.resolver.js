/**
 * jsdom resolves package `exports` with the "browser" condition, and bson 7
 * (pulled in by mongoose 9) ships an ESM-only browser build, so every suite
 * that loads it died on "Unexpected token 'export'". Only bson is given the
 * node conditions here; turning them on for the whole jsdom environment sent
 * other packages (e.g. @ant-design/icons) to ESM-only `node` targets instead.
 *
 * Resolution still starts from the requiring file, so the mongodb 4 driver
 * (next-auth adapter) keeps its bson 4 and mongoose's driver keeps bson 7.
 */
module.exports = (request, options) => {
  if (request === 'bson' || request.startsWith('bson/')) {
    return options.defaultResolver(request, {
      ...options,
      conditions: ['node', 'require', 'default'],
    })
  }
  return options.defaultResolver(request, options)
}
