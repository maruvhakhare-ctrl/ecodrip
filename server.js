const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const port = process.env.PORT || 8080;
const rootDir = __dirname;

const sensorData = {
  soil: 68,
  pumpStatus: 'ON',
  pumpFlow: 24,
  tank: 72,
  tankLitres: 1200,
  battery: 86,
  solar: 92,
  wifi: 'online',
  bluetooth: 'connected',
  automationMode: true,
  schedule: {
    time: '07:45',
    repeat: 'Daily',
    zone: 'Zone A'
  },
  irrigationHistory: [
    { time: '06:30', event: 'Zone A watered', duration: '14 min' },
    { time: '05:45', event: 'Pump cycle complete', duration: '11 min' },
    { time: '04:15', event: 'Moisture check', duration: 'Normal' },
    { time: '02:00', event: 'Low battery threshold', duration: 'Info' }
  ],
  alerts: [
    { title: 'Water Tank Low', text: 'Tank level is below 30%', severity: 'warning' },
    { title: 'Solar Charging', text: 'Charging voltage stable', severity: 'info' },
    { title: 'Irrigation Complete', text: 'Pump switched off automatically', severity: 'success' }
  ]
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, payload, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

function readFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const requestPath = requestUrl.pathname;

  if (requestPath === '/api/system') {
    if (req.method === 'GET') {
      sendJson(res, sensorData);
      return;
    }
  }

  if (requestPath === '/api/sync') {
    if (req.method === 'POST') {
      const body = await parseBody(req);
      sensorData.soil = body.soil ?? Math.min(95, Math.max(45, sensorData.soil + Math.round(Math.random() * 10 - 4)));
      sensorData.tank = body.tank ?? Math.min(100, Math.max(30, sensorData.tank + Math.round(Math.random() * 8 - 3)));
      sensorData.battery = body.battery ?? Math.min(100, Math.max(20, sensorData.battery + Math.round(Math.random() * 8 - 3)));
      sensorData.solar = Math.min(100, Math.max(70, sensorData.solar + Math.round(Math.random() * 8 - 4)));
      sensorData.pumpFlow = body.pumpFlow ?? sensorData.pumpFlow;
      sensorData.pumpStatus = sensorData.soil < 60 ? 'ON' : 'OFF';
      sensorData.tankLitres = Math.round((sensorData.tank / 100) * 1600);
      sendJson(res, { ok: true, system: sensorData });
      return;
    }
  }

  if (requestPath === '/api/pump/toggle') {
    if (req.method === 'POST') {
      const body = await parseBody(req);
      sensorData.pumpStatus = body.pumpStatus === 'OFF' ? 'OFF' : 'ON';
      sensorData.pumpFlow = sensorData.pumpStatus === 'ON' ? 24 : 0;
      sensorData.irrHistory = sensorData.irrHistory ?? sensorData.irrigationHistory;
      sendJson(res, { ok: true, pumpStatus: sensorData.pumpStatus, pumpFlow: sensorData.pumpFlow });
      return;
    }
  }

  if (requestPath === '/api/connect') {
    if (req.method === 'GET') {
      sendJson(res, { wifi: sensorData.wifi, bluetooth: sensorData.bluetooth, esp32: 'online' });
      return;
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      sensorData.wifi = body.wifi || sensorData.wifi;
      sensorData.bluetooth = body.bluetooth || sensorData.bluetooth;
      sendJson(res, { ok: true, wifi: sensorData.wifi, bluetooth: sensorData.bluetooth });
      return;
    }
  }

  if (requestPath === '/api/automation') {
    if (req.method === 'GET') {
      sendJson(res, { automationMode: sensorData.automationMode, schedule: sensorData.schedule });
      return;
    }

    if (req.method === 'POST') {
      const body = await parseBody(req);
      if (typeof body.automationMode === 'boolean') {
        sensorData.automationMode = body.automationMode;
      }

      if (body.schedule) {
        sensorData.schedule = {
          time: body.schedule.time || sensorData.schedule.time,
          repeat: body.schedule.repeat || sensorData.schedule.repeat,
          zone: body.schedule.zone || sensorData.schedule.zone
        };
      }

      sendJson(res, { ok: true, automationMode: sensorData.automationMode, schedule: sensorData.schedule });
      return;
    }
  }

  if (requestPath.startsWith('/api/')) {
    sendJson(res, { ok: false, error: 'Endpoint not found' }, 404);
    return;
  }

  const safePath = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = path.normalize(path.join(rootDir, safePath));

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  readFile(res, filePath);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`ECO DRIP server listening on http://127.0.0.1:${port}`);
});
