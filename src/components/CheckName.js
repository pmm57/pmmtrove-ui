export function useCheckName(stringPerson) {
    // Edit the person name and change tooltip , anything not recognised mark in red
    var newTooltip = '';
    // Family Name (nee Maiden Family Name), Given Names with Initials N. b.9999
    // First part is Surname and Maiden name - preceding a comma
    var commaParts = stringPerson.split(",");
    if (commaParts[0].replace(/[^0-9]/g,"").length > 1) {
      newTooltip = 'Family name includes digits';
    } else {
      // Is there a Maiden Name
      var familyNames = commaParts[0].split("(");
      newTooltip = 'FamilyName = ' + familyNames[0];
      if (familyNames.length > 1) {
        var tempMn = familyNames[1].replace('nee','');
        var strMn = tempMn.replace(')','');
        newTooltip += '\nMaidenName = ' + strMn;
      }
      if (commaParts.length == 2) { // too many commas if more than 2 parts so ignore that
        var givenNameParts = commaParts[1].split(" ");
        var yearOfBirth = '';
        var yearOfDeath = '';
        var givenNames = '';
        if (/^b.\d{4}-d.\d{4}/.test(givenNameParts[givenNameParts.length - 1])) {
          var arrayYear = givenNameParts.pop();
          // <!--console.log ('Validate Name has dob dod', arrayYear);-->
          yearOfBirth = arrayYear[0];
          yearOfDeath = arrayYear[1];
          givenNames = givenNameParts.join(' ');
        } else {
          if (/^b\.\d{4}/.test(givenNameParts[givenNameParts.length - 1])) {
            yearOfBirth = givenNameParts.pop();
            // <!--console.log ('Validate dob ', yearOfBirth);-->
            if (yearOfBirth.length < 7) {
              // <!--console.log ('Validate Name has dob ', yearOfBirth);-->
              givenNames = givenNameParts.join(' ');
              // Good Year of Birth
            } else {
              newTooltip += '\nYear of Birth not matched';
              givenNames = yearOfBirth; // Force Error
            }
          } else {
            givenNames = commaParts[1];
          }
        }
        if (givenNames.replace(/[^0-9]/g,"").length > 1) {
          newTooltip += '\nGiven Name or Year of Birth not matched';
        } else {
          newTooltip = '';
          // if (yearOfBirth.length == 0) {
          //   newTooltip += '\nYear of Birth not found';
          // } 
        }
      } else {
        if (commaParts.length == 1) {
          newTooltip += '\n - Need GivenName or Initial';
        }else {
          newTooltip += '\nGivenName/s has comma';
        }
      }
    }
    return newTooltip;
  }