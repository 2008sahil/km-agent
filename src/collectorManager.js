const { spawn } = require('child_process');

let collectorProcess = null;

function restartCollector(configPath) {
    return new Promise((resolve, reject) => {
        if (collectorProcess) {
            console.log('Stopping the OTel Collector...');
            collectorProcess.kill();
        }

        console.log('Starting the OTel Collector...');
        collectorProcess = spawn('otelcol', ['--config', configPath]);

        collectorProcess.stdout.on('data', (data) => {
            console.log(`Collector Output: ${data}`);
        });

        collectorProcess.stderr.on('data', (data) => {
            console.error(`Collector Error: ${data}`);
        });

        collectorProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Collector exited with code ${code}`));
            } else {
                resolve();
            }
        });

        resolve();
    });
}

module.exports = { restartCollector };