const os = require('os');
const process = require('process');
const { MeterProvider } = require('@opentelemetry/sdk-metrics');
const { Resource } = require('@opentelemetry/resources');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-proto');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

const resource = new Resource({
  'service.name': 'km-agent',
});

const metricExporter = new OTLPMetricExporter({
  url: 'http://localhost:4350/v1/metrics',
});

const meterProvider = new MeterProvider({ resource });
meterProvider.addMetricReader(new PeriodicExportingMetricReader({ exporter: metricExporter ,exportIntervalMillis: 5000}));

const meter = meterProvider.getMeter('km-agent-metrics');


const uptimeCounter = meter.createCounter('agent_uptime', {
  description: 'Time the agent has been running',
});


const cpuUsageGauge = meter.createObservableGauge('agent_cpu_usage', {
  description: 'CPU usage of the agent process in percentage',
});
cpuUsageGauge.addCallback((observableResult) => {
  const cpuUsage = process.cpuUsage();
  const totalCpuTime = cpuUsage.user + cpuUsage.system;
  observableResult.observe((totalCpuTime / 1e6) / os.cpus().length);
});

const memoryUsageGauge = meter.createObservableGauge('agent_memory_usage', {
  description: 'Memory usage of the agent process in bytes',
});
memoryUsageGauge.addCallback((observableResult) => {
  const memoryUsage = process.memoryUsage();
  observableResult.observe(memoryUsage.rss);
});

const heartbeatCounter = meter.createCounter('agent_heartbeat', {
  description: 'Heartbeat of the agent to indicate it is alive',
});

setInterval(() => {
  heartbeatCounter.add(1);
  uptimeCounter.add(1);
}, 1000);



