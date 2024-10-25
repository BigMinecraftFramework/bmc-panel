const config = require('../config.json');
const path = require('path');
const { readdirSync, unlinkSync, promises: { readFile, writeFile, rename, copyFile } } = require("fs");
const yaml = require('js-yaml');
const {scaleDeployment} = require("./k8s");

async function getGamemodes() {
    const workingDir = config["bmc-path"] + "/gamemodes";
    let gamemodes = [];

    try {
        const files = readdirSync(workingDir);

        for (const file of files) {
            if (file.endsWith(".yaml")) {
                const name = file.split(".")[0];
                const filePath = path.join(workingDir, file);

                const fileContent = await readFile (filePath, 'utf8');
                const yamlContent = yaml.load(fileContent);
                const isEnabled = !yamlContent.disabled;

                gamemodes.push({
                    name: name,
                    path: filePath,
                    enabled: isEnabled
                });
            }
        }

        return gamemodes;
    } catch (error) {
        throw new Error('Failed to read gamemodes directory');
    }
}

async function getGamemodeContent(name) {
    const workingDir = config["bmc-path"] + "/gamemodes";
    let filePath = path.join(workingDir, `${name}.yaml`);

    if (!await fileExists(filePath)) {
        filePath = path.join(workingDir, `disabled-${name}.yaml`);
    }

    try {
        return await readFile(filePath, 'utf8');
    } catch (error) {
        console.error(error);
        throw new Error('Failed to read gamemode file');
    }
}

async function updateGamemodeContent(name, content) {
    const workingDir = config["bmc-path"] + "/gamemodes";
    let filePath = path.join(workingDir, `${name}.yaml`);

    if (!await fileExists(filePath)) {
        filePath = path.join(workingDir, `disabled-${name}.yaml`);
    }

    try {
        await writeFile(filePath, content, 'utf8');
    } catch (error) {
        throw new Error('Failed to write gamemode file');
    }

    await runApplyScript();
}

async function toggleGamemode(name, enabled) {
    const workingDir = config["bmc-path"] + "/gamemodes";
    const filePath = path.join(workingDir, `${name}.yaml`);

    try {
        let fileContent = await readFile(filePath, 'utf8');
        let yamlContent = yaml.load(fileContent);

        if (enabled) delete yamlContent.disabled;
        else yamlContent.disabled = true;

        fileContent = yaml.dump(yamlContent);
        await writeFile(filePath, fileContent, 'utf8');

        if (enabled) {
            const minimumInstances = yamlContent.minimumInstances || 1; // Default to 1 if not set
            await scaleDeployment(name, minimumInstances);
        } else {
            await scaleDeployment(name, 0);
        }
    } catch (error) {
        console.error('Error in toggleGamemode:', error);
        throw new Error('Failed to toggle gamemode');
    }

    // await runApplyScript();
}


async function deleteGamemode(name)  {
    const workingDir = config["bmc-path"] + "/gamemodes";
    const enabledPath = path.join(workingDir, `${name}.yaml`);
    const disabledPath = path.join(workingDir, `disabled-${name}.yaml`);

    try {
        if (await fileExists(enabledPath)) {
            await unlinkSync(enabledPath);
        } else if (await fileExists(disabledPath)) {
            await unlinkSync(disabledPath);
        }
    } catch (error) {
        console.error(error);
        throw new Error('Failed to delete gamemode');
    }

    await runApplyScript();
}

async function createGamemode(name) {
    const workingDir = config["bmc-path"] + "/gamemodes";
    const examplesDir = config["bmc-path"] + "/examples";
    const sourceFile = path.join(examplesDir, "example-gamemode.yaml");
    const destinationFile = path.join(workingDir, `${name}.yaml`);

    try {
        await copyFile(sourceFile, destinationFile);

        let content = await readFile(destinationFile, 'utf8');
        // More flexible regex that handles optional quotes and whitespace
        content = content.replace(/name:\s*["']?example-gamemode["']?/g, `name: "${name}"`);
        await writeFile(destinationFile, content, 'utf8');

    } catch (error) {
        console.error(error);
        throw new Error('Failed to create gamemode');
    }

    await runApplyScript();
}

async function fileExists(filePath) {
    try {
        await readFile(filePath);
        return true;
    } catch {
        return false;
    }
}

async function runApplyScript() {
    const { exec } = require('child_process');
    const scriptDir = path.join(config["bmc-path"], "scripts");

    exec(`cd ${scriptDir} && ./apply.sh`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }

        // console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}

module.exports = {
    getGamemodes,
    getGamemodeContent,
    updateGamemodeContent,
    toggleGamemode,
    deleteGamemode,
    createGamemode
};