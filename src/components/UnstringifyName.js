/**
* @public
*  Unstringify Person string to Person Object
*
* @param {string} stringName         Person String
* @return {object} nameProperties
*/
// tag::unstringifyName[]
//
export function unstringifyName (stringName) {
  // console.log(text);
  var nameProperties = {};
  // Family Name (nee Maiden Family Name), Given Names with Initials N. b.9999-d.9999
  // Name Parts
  var parts1 = stringName.split(",");
  // First part is Surname precedding a comma
  nameProperties.familyName = parts1[0];
  if (parts1.length > 1) {
    var parts2 = parts1[1].trim().split(" ");
    // Process backwards
    // Is the last part a Year of Birth and Year of Death
    // Middle Parts are Given Names (length of 2 with period is a name initial) - no commas between Given names
    var givenNames = "";
    var nameparts = parts2.reverse();
    for (var j = 0; j < nameparts.length; j++) {
      // console.log (nameparts[j]);
      if (/^b.\d{4}-d.\d{4}/.test(nameparts[j])) {
        var arrayYear = nameparts[j].split("-");
        nameProperties.yearOfBirth = arrayYear[0];
        nameProperties.yearOfDeath = arrayYear[1];
        continue;
      }
      if (/\d{4}/.test(nameparts[j])) {
        nameProperties.yearOfBirth = nameparts[j];
        continue;
      }
      if (nameparts[j].length == 1) {
        if (!(/\w/.test(nameparts[j]))) {continue}
      }
      if (givenNames.length > 0) {
        givenNames = nameparts[j] + " " + givenNames;
      } else {
        givenNames = nameparts[j];
      }
    }
    if (givenNames.length > 0) {
      nameProperties.givenNames = givenNames;
    }
  }
  // console.log (nameProperties);
  return nameProperties;
}