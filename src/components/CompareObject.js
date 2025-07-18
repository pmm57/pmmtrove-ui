/**
* @public
* This method returns an array of compared object properties that are different
*
* @param {obj} obj1    First Object to compare
* @param {obj} obj2    Second Object to Compare 
* @returns {array} diffs  An Array of object property names that have different values
*/
// tag::getObjDiff[]
export function getObjDiff(obj1, obj2) {
  const diffs = new Set();
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  for (const key of allKeys) {
    const val1 = obj1[key];
    const val2 = obj2[key];
    const bothObjects = typeof val1 === 'object' && val1 !== null &&
                        typeof val2 === 'object' && val2 !== null;
    if (bothObjects) {
      const nestedDiffs = getDifferences(val1, val2);
      if (nestedDiffs.length > 0) {
        diffs.add(key);
      }
    } else if (val1 !== val2) {
      diffs.add(key);
    }
  }
  return Array.from(diffs);
}
// end::getObjDiff[]
/**
* @public
* This method compares an array of objects and returns an array of compared object properties that are different
*
* @param {array} arr1    First array of Objects to compare
* @param {array} arr2    Second array of Object to Compare 
* @returns {array} diffs  An Array of object property names that have different values
*/
// tag::getObjArrayDiff[]
export function getObjArrayDiff(arr1, arr2) {
  const differences = [];
  const maxLength = Math.max(arr1.length, arr2.length);
  for (let i = 0; i < maxLength; i++) {
    const obj1 = arr1[i] || {};
    const obj2 = arr2[i] || {};
    const diffProps = getObjDiff(obj1, obj2);
    differences.push({ index: i, differences: diffProps });
  }
  return differences;
}
// end::getObjDiff[]