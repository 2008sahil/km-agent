const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { restartCollector } = require('./collectorManager');
const yaml = require('js-yaml');

const CONFIG_PATH = path.resolve(__dirname, '../config/config.yaml');
const TEMP_CONFIG_PATH = path.resolve(__dirname, '../config/temp_config.yaml');
const BASE_CONFIG_PATH = path.resolve(__dirname, '../config/baseConfig.yaml');

async function updateConfig(userProvidedConfig) {
    const baseConfig = await fs.readFile(BASE_CONFIG_PATH, 'utf8');


    const mergedConfig = mergeConfig(baseConfig, userProvidedConfig);


    await fs.writeFile(TEMP_CONFIG_PATH, mergedConfig, 'utf8');

    if (!await validateConfig(TEMP_CONFIG_PATH)) {
        await fs.unlink(TEMP_CONFIG_PATH);
        throw new Error('Invalid configuration');
    }

    await fs.rename(TEMP_CONFIG_PATH, CONFIG_PATH);

    await restartCollector(CONFIG_PATH);

    return 'Configuration updated and collector restarted successfully';
}

function mergeConfig(baseConfig, userConfig) {
    const baseParsed = parseYaml(baseConfig);
    const userParsed = (userConfig);

    console.log("User Config:", baseParsed);
    console.log("Merged Config:", userParsed);

    baseParsed.service.pipelines = {
        ...baseParsed.service.pipelines,
        ...userParsed.service?.pipelines,
    };

    baseParsed.receivers = {
        ...baseParsed.receivers,
        ...userParsed.receivers,
    };

    baseParsed.processors = {
        ...baseParsed.processors,
        ...userParsed.processors,
    };

    baseParsed.exporters = {
        ...baseParsed.exporters,
        ...userParsed.exporters,
    };

    return stringifyYaml(baseParsed);
}

async function validateConfig(configPath) {
    return new Promise((resolve) => {
        exec(`otelcol validate --config=${configPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Validation failed: ${stderr}`);
                return resolve(false);
            }
            console.log(`Validation successful: ${stdout}`);
            resolve(true);
        });
    });
}

function parseYaml(yamlStr) {
    return yaml.load(yamlStr);
}

function stringifyYaml(jsonObj) {
    return yaml.dump(jsonObj, { noRefs: true });
}

module.exports = { updateConfig };
