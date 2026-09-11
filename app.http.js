const metricElements = {
  soil: {
    value: document.getElementById('soilValue'),
    meter: document.getElementById('soilMeter'),
    status: document.getElementById('soilChange')
  },
  pump: {
    value: document.getElementById('pumpValue'),
    meter: document.getElementById('pumpMeter'),
    status: document.getElementById('pumpChange')
  },
  tank: {
    value: document.getElementById('tankValue'),
    meter: document.getElementById('tankMeter'),
    status: document.getElementById('tankChange')
  },
  battery: {
    value: document.getElementById('batteryValue'),
    meter: document.getElementById('batteryMeter'),
    status: document.getElementById('batteryChange')
  }
};

const historyData = [
  { time: '06:30', event: 'Zone A watered', duration: '14 min' },
  { time: '05:45', event: 'Pump cycle complete', duration: '11 min' },
  { time: '04:15', event: 'Moisture check', duration: 'Normal' },
  { time: '02:00', event: 'Low battery threshold', duration: 'Info' }
];

function drawChart() {
  const canvas = document.getElementById('moistureChart');
  const ctx = canvas.getContext('2d');

  const width = canvas.width;
  const height = canvas.height;
  const padding = { left: 40, right: 24, top: 30, bottom: 50 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const points = [50, 60, 62, 70, 65, 75, 68, 72, 78, 74, 70, 68];

  ctx.clearRect(0, 0, width, height);

  // draw background grid
  ctx.strokeStyle = '#dce9dd';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i += 1) {
    const y = padding.top + (plotHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // draw axis labels
  ctx.fillStyle = '#607866';
  ctx.font = '11px Inter';
  ctx.textAlign = 'left';
  for (let i = 0; i < 5; i += 1) {
    const v = 100 - (i * 25);
    ctx.fillText(v + '%', 8, padding.top + (plotHeight / 4) * i + 4);
  }

  // draw water event points
  ctx.strokeStyle = '#37b36b';
  ctx.lineWidth = 3;
  ctx.beginPath();

  points.forEach((value, index) => {
    const x = padding.left + (plotWidth / (points.length - 1)) * index;
    const y = padding.top + plotHeight - (value / 100) * plotHeight;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // fill area underneath line
  const first = { x: padding.left, y: padding.top + plotHeight - (points[0] / 100) * plotHeight };
  const last = { x: padding.left + plotWidth, y: padding.top + plotHeight - (points[points.length - 1] / 100) * plotHeight };

  const fillGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  fillGradient.addColorStop(0, 'rgba(55,179,107,0.30)');
  fillGradient.addColorStop(1, 'rgba(55,179,107,0.02)');

  ctx.strokeStyle = 'transparent';
  ctx.fillStyle = fillGradient;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);

  points.forEach((value, index) => {
    const x = padding.left + (plotWidth / (points.length - 1)) * index;
    const y = padding.top + plotHeight - (value / 100) * plotHeight;
    ctx.lineTo(x, y);
  });

  ctx.lineTo(last.x, padding.top + plotHeight);
  ctx.lineTo(first.x, padding.top + plotHeight);
  ctx.closePath();
  ctx.fill();

  // draw watering event markers
  ctx.fillStyle = '#59b4d3';
  for (let i = 0; i < points.length; i += 4) {
    const x = padding.left + (plotWidth / (points.length - 1)) * i;
    const y = padding.top + plotHeight - (points[i] / 100) * plotHeight;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // x-axis labels
  const labels = ['6a', '7a', '8a', '9a', '10a', '11a', '12p'];
  ctx.fillStyle = '#607866';
  ctx.textAlign = 'center';
  labels.forEach((label, i) => {
    const x = padding.left + (plotWidth / (labels.length - 1)) * i;
    ctx.fillText(label, x, height - 12);
  });
}

function updateMetricValues() {
  const data = {
    soil: { value: 68, status: '+3%', meter: 68 },
    pump: { value: 'ON', status: '24 L/min', meter: 76 },
    tank: { value: 72, status: '1200 L', meter: 72 },
    battery: { value: 86, status: 'Solar 92%', meter: 86 }
  };

  metricElements.soil.value.textContent = data.soil.value;
  metricElements.soil.meter.style.width = data.soil.meter + '%';
  metricElements.soil.status.textContent = data.soil.status;

  metricElements.pump.value.textContent = data.pump.value;
  metricElements.pump.meter.style.width = data.pump.meter + '%';
  metricElements.pump.status.textContent = data.pump.status;

  metricElements.tank.value.textContent = data.tank.value;
  metricElements.tank.meter.style.width = data.tank.meter + '%';
  metricElements.tank.status.textContent = data.tank.status;

  metricElements.battery.value.textContent = data.battery.value;
  metricElements.battery.meter.style.width = data.battery.meter + '%';
  metricElements.battery.status.textContent = data.battery.status;
}

function syncData() {
  const toast = document.getElementById('toast');
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2000);

  const soil = 67 + Math.round(Math.random() * 7);
  const tank = 68 + Math.round(Math.random() * 10);
  const battery = 84 + Math.round(Math.random() * 10);

  metricElements.soil.value.textContent = Math.min(100, soil);
  metricElements.soil.meter.style.width = Math.min(100, soil) + '%';

  metricElements.tank.value.textContent = Math.min(100, tank);
  metricElements.tank.meter.style.width = Math.min(100, tank) + '%';

  metricElements.battery.value.textContent = Math.min(100, battery);
  metricElements.battery.meter.style.width = Math.min(100, battery) + '%';
}

function toggleConnectStatus() {
  const button = document.getElementById('connectButton');
  const connectText = document.getElementById('connectText');
  const toast = document.getElementById('toast');

  if (connectText.textContent.includes('Online')) {
    connectText.textContent = 'ESP32 WiFi Offline';
    button.classList.add('offline');
  } else {
    connectText.textContent = 'ESP32 WiFi Online';
    button.classList.remove('offline');
  }

  const bluetoothStatus = document.querySelector('.connect-row:nth-child(2) .connect-value');
  if (bluetoothStatus && bluetoothStatus.textContent.includes('Connected')) {
    bluetoothStatus.textContent = 'Scanning';
    bluetoothStatus.classList.toggle('good', false);
    bluetoothStatus.classList.add('bluetooth-offline');
  } else {
    bluetoothStatus.textContent = 'Connected';
    bluetoothStatus.classList.toggle('bluetooth-offline', false);
    bluetoothStatus.classList.add('good');
  }

  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2000);
}

function setupBarChart() {
  const bars = Array.from(document.querySelectorAll('.bar'));
  bars.forEach((bar, index) => {
    const height = Number(bar.dataset.height);
    const computedHeight = Math.max(20, height * 1.8) + 'px';
    bar.style.height = computedHeight;
    bar.style.setProperty('--bar-height', computedHeight);
    if (index === 5) {
      bar.style.background = '#37b36b';
    }
  });
}

function initActions() {
  const syncButton = document.getElementById('syncButton');
  const connectButton = document.getElementById('connectButton');

  syncButton.addEventListener('click', syncData);
  connectButton.addEventListener('click', toggleConnectStatus);

  try {
    if ('bluetooth' in navigator && typeof navigator.bluetooth.getDevices === 'function') {
      navigator.bluetooth.getDevices().then((devices) => {
        const device = devices.find((d) => d.name && d.name.toLowerCase().includes('esp32'));
        if (device) {
          document.querySelector('.connect-value.good').textContent = 'Online';
        }
      }).catch(() => {});
    }
  } catch (e) {
    // Browser may not support Web Bluetooth; UI still remains usable as a static dashboard.
  }

  document.querySelectorAll('.period').forEach((button) => {
    button.addEventListener('click', function() {
      document.querySelectorAll('.period').forEach((b) => b.classList.toggle('active', b === button));
    });
  });
}

function updateHistory() {
  const historyList = document.getElementById('historyList');
  historyList.innerHTML = historyData
    .map(item => `
      <article class="history-item">
        <span class="history-time">${item.time}</span>
        <span class="history-line">
          <span class="history-dot"></span>
          <span class="history-text">${item.event}</span>
        </span>
        <span class="history-duration">${item.duration}</span>
      </article>
    `).join('');
}

function init() {
  updateMetricValues();
  drawChart();
  setupBarChart();
  updateHistory();
  initActions();
}

window.addEventListener('DOMContentLoaded', init);
