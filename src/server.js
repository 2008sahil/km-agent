require('./instruement.js')
const express = require('express');
const bodyParser = require('body-parser');
const { updateConfig } = require('./configHandler');
const { trace } = require('@opentelemetry/api');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

const tracer = trace.getTracer('km-agent-server');

app.post('/config/update', async (req, res) => {
    const span = tracer.startSpan('/config/update');
    try {
        span.setAttribute('http.method', 'POST');
        span.setAttribute('http.route', '/config/update');

        const result = await updateConfig(req.body);

        span.addEvent('Configuration updated successfully');
        res.status(200).json({ message: result });
    } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message });
        res.status(500).json({ error: error.message });
    } finally {
        span.end();
    }
});

app.get('/get', (req, res) => {
    const span = tracer.startSpan('/get');
    try {
        span.setAttribute('http.method', 'GET');
        span.setAttribute('http.route', '/get');
        span.addEvent('Health check request received');
        res.send('status code ok');
    } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message });
        res.status(500).send('Internal Server Error');
    } finally {
        span.end();
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`KloudMate Agent listening on port ${PORT}`);
    const span = tracer.startSpan('server-startup');
    try {
        span.addEvent('Server initialized successfully');
    } catch (error) {
        span.recordException(error);
        span.setStatus({ code: 2, message: error.message });
    } finally {
        span.end();
    }
});
