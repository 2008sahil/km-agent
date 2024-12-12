const { spawn } = require('child_process');
const { trace } = require('@opentelemetry/api');

let collectorProcess = null;

function restartCollector(configPath) {
    const tracer = trace.getTracer('km-agent-tracer');
    const span = tracer.startSpan('restartCollector', {
        attributes: {
            configPath,
        },
    });

    return new Promise((resolve, reject) => {
        try {
            if (collectorProcess) {
                console.log('Stopping the OTel Collector...');
                span.addEvent('Stopping existing collector process');
                collectorProcess.kill();
            }

            console.log('Starting the OTel Collector...');
            span.addEvent('Starting new collector process');
            collectorProcess = spawn('otelcol', ['--config', configPath]);

            collectorProcess.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`Collector Output: ${output}`);
                span.addEvent('Collector Output', { output });
            });

            collectorProcess.stderr.on('data', (data) => {
                const errorOutput = data.toString();
                console.error(`Collector Error: ${errorOutput}`);
                span.addEvent('Collector Error', { errorOutput });
            });

            collectorProcess.on('close', (code) => {
                if (code !== 0) {
                    const errorMessage = `Collector exited with code ${code}`;
                    console.error(errorMessage);
                    span.recordException(new Error(errorMessage));
                    span.setStatus({ code: 2, message: errorMessage });
                    reject(new Error(errorMessage));
                } else {
                    span.addEvent('Collector process closed successfully');
                    resolve();
                }
                span.end();
            });

            resolve();
        } catch (error) {
            console.error(`Error restarting collector: ${error.message}`);
            span.recordException(error);
            span.setStatus({ code: 2, message: error.message });
            span.end();
            reject(error);
        }
    });
}

module.exports = { restartCollector };
