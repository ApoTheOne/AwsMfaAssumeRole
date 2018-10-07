const readline = require('readline');
const fs = require('fs');
const exec = require('child_process').exec;

const config = 'ama.json';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

if (fs.existsSync(config)) {
    fs.readFile(config, (error, data) => {
        if (error) {
            console.log(error);
        } else {
            let configData = data;
            GetMfaAndRunSts(JSON.parse(data));
        }
    });
} else {
    rl.question('Enter mfa urn :', mfaUrn => {
        //rl.close();
        rl.question('Enter mfa profile :', prof1 => {
            rl.question('Enter assumed profile name :', prof2 => {
                var newCmd = `aws sts get-session-token --serial-number ${mfaUrn} --token-code `;
                // rl.close();
                var configData = {
                    cmd: newCmd,
                    mfaProfile: prof1,
                    assumedProfile: prof2
                };
                fs.writeFile(config, JSON.stringify(configData), err => {
                    console.info('written config file');
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
    rl.question('Enter Mfa Token :', mfaToken => {
        let cmd = configData.cmd + mfaToken;
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
}
function setCred(cred, configData) {
    let username = require('os').userInfo().username;
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
                    console.log(updatedData);
                }
            });
        }
    });
}
