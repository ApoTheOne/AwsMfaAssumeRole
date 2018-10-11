const readline = require('readline');
const fs = require('fs');
const exec = require('child_process').exec;

const username = require('os').userInfo().username;
const config = `C:/users/${username}/.aws/ama.json`;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

if (fs.existsSync(config)) {
    fs.readFile(config, (error, data) => {
        if (error) {
            console.log(error);
        } else {
            GetMfaAndRunSts(JSON.parse(data));
        }
    });
} else {
    rl.question('Enter mfa urn :', mfaUrn => {
        rl.question('Enter mfa profile :', prof1 => {
            rl.question('Enter assumed profile name :', prof2 => {
                var newCmd = `aws sts get-session-token --serial-number ${mfaUrn} --token-code `;
                var configData = {
                    cmd: newCmd,
                    mfaProfile: prof1,
                    assumedProfile: prof2
                };
                fs.writeFile(config, JSON.stringify(configData), err => {
                    console.info('Written config file successfully!');
                    if (err) {
                        console.log(err);
                    } else {
                        GetMfaAndRunSts(configData);
                    }
                });
            });
        });
    });
}

function GetMfaAndRunSts(configData) {
    rl.stdoutMuted = true;
    rl.question('Enter Mfa Token :', mfaToken => {
        let cmd = configData.cmd + mfaToken;
        rl.close();
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.log(error);
            } else if (stderr) {
                console.log(stderr);
            } else {
                setCred(JSON.parse(stdout).Credentials, configData);
            }
        });
    });
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
        if (rl.stdoutMuted) {
            rl.output.write('*');
        } else {
            rl.output.write(stringToWrite);
        }
        rl.history = rl.history.slice(1);
    };
}
function setCred(cred, configData) {
    let path = `C:/users/${username}/.aws/credentials`;
    fs.readFile(path, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            let updatedData = data.toString();
            let oldStr = updatedData.substring(
                updatedData.indexOf(`[${configData.mfaProfile}]`),
                updatedData.indexOf(`[${configData.assumedProfile}]`)
            );
            let newStr = `[${configData.mfaProfile}]
aws_access_key_id = ${cred.AccessKeyId}
aws_secret_access_key = ${cred.SecretAccessKey}
aws_session_token = ${cred.SessionToken}

`;
            updatedData = updatedData.replace(oldStr, newStr);
            fs.writeFile(path, updatedData, err => {
                if (err) console.log(err);
                else {
                    console.info(
                        `\nCredentials updated successfully and are valid till ${cred.Expiration.toString()}`
                    );
                    process.exit();
                }
            });
        }
    });
}
