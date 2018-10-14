const readline = require('readline');

const rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout
});

const readMfaUrn = async function() {
   return new Promise(resolve =>
       rl.question('Enter mfa urn : ', mfaUrn => {
           resolve(mfaUrn);
       })
   );
};
const readMfaProfile = async function() {
   return new Promise(resolve =>
       rl.question('Enter mfa profile name : ', mfaProfileName => {
           resolve(mfaProfileName);
       })
   );
};
const readAssumedProfile = async function() {
   return new Promise(resolve =>
       rl.question('Enter assumed profile name : ', assumedProfileName => {
           resolve(assumedProfileName);
       })
   );
};
const readMfaToken = function() {
   return new Promise(resolve => {
       rl.question('Enter mfa token : ', mfaToken => resolve(mfaToken));
   });
};

module.exports = {
   readMfaUrn,
   readMfaProfile,
   readAssumedProfile,
   readMfaToken
};