export const objectWithoutKey = (object, key) => {
  const { [key]: deletedKey, ...otherKeys } = object
  return otherKeys
}
