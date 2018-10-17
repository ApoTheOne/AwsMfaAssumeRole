const readline = require('readline');
const fs = require('fs');
const exec = require('child_process').exec;
const { promisify } = require('util');

const inputReader = require('./inputReader');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const execAsync = promisify(exec);

const username = require('os').userInfo().username;
const configFile = `C:/users/${username}/.aws/ama.json`;

async function execute() {
    if (fs.existsSync(configFile)) {
        try {
            const configData = JSON.parse(await readFileAsync(configFile));
            await getMfaRunStsSetCred(configData);
        } catch (err) {
            console.log(err, null, 2);
        }
    } else {
        const configData = {};
        try {
            configData.mfaUrn = await inputReader.readMfaUrn();
            configData.mfaProfile = await inputReader.readMfaProfile();
            configData.assumedProfile = await inputReader.readAssumedProfile();
            configData.cmd = `aws sts get-session-token --serial-number ${
                configData.mfaUrn
            } --token-code `;
            await writeFileAsync(
                configFile,
                JSON.stringify({
                    cmd: configData.cmd,
                    mfaProfile: configData.mfaProfile,
                    assumedProfile: configData.assumedProfile
                })
            );
            getMfaRunStsSetCred(configData);
        } catch (err) {
            console.log(err, null, 2);
        }
    }
}

const getMfaRunStsSetCred = async function getMfaRunStsSetCred(configData) {
    const mfaToken = await inputReader.readMfaToken();
    const outPut = await execAsync(configData.cmd + mfaToken);
    if (outPut.stdout) {
        const creds = JSON.parse(outPut.stdout);
        setCred(creds.Credentials, configData);
    } else if (outPut.stderr) {
        console.log(outPut.stderr, null, 2);
    }
};

const setCred = async function setCred(cred, configData) {
    const path = `C:/users/${username}/.aws/credentials`;
    let data = await readFileAsync(path);
    data = data.toString();
    let oldData = data.substring(
        data.indexOf(`[${configData.mfaProfile}]`),
        data.indexOf(`[${configData.assumedProfile}]`)
    );
    let updatedData = `[${configData.mfaProfile}]
aws_access_key_id = ${cred.AccessKeyId}
aws_secret_access_key = ${cred.SecretAccessKey}
aws_session_token = ${cred.SessionToken}

`;
    data = data.replace(oldData, updatedData);

    try {
        await writeFileAsync(path, data);
        console.log(
            `\nCredentials updated successfully and are valid till ${cred.Expiration.toString()}`
        );
    } catch (error) {
        console.error(error, null, 2);
    }
    process.exit();
};

execute();
