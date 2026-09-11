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

const historyData = [];

async function apiGet(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }
  return response.json();
}

async function apiPost(path, data) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error('HTTP ' + response.status);
  }

  return response.json();
}

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

function updateMetricValues(data) {
  if (!data) {
    return;
  }

  const soilValue = Math.min(100, Math.max(0, data.soil));
  const tankValue = Math.min(100, Math.max(0, data.tank));
  const batteryValue = Math.min(100, Math.max(0, data.battery));

  metricElements.soil.value.textContent = soilValue;
  metricElements.soil.meter.style.width = soilValue + '%';
  metricElements.soil.status.textContent = (data.soil > 65 ? '+3%' : '+1%');

  metricElements.pump.value.textContent = data.pumpStatus;
  metricElements.pump.meter.style.width = (data.pumpStatus === 'ON' ? 76 : 20) + '%';
  metricElements.pump.status.textContent = data.pumpFlow + ' L/min';

  metricElements.tank.value.textContent = tankValue;
  metricElements.tank.meter.style.width = tankValue + '%';
  metricElements.tank.status.textContent = data.tankLitres + ' L';

  metricElements.battery.value.textContent = batteryValue;
  metricElements.battery.meter.style.width = batteryValue + '%';
  metricElements.battery.status.textContent = 'Solar ' + data.solar + '%';
}

async function syncData() {
  const toast = document.getElementById('toast');
  try {
    const current = await apiGet('/api/system');
    const payload = {
      soil: Math.min(95, Math.max(30, current.soil + Math.round(Math.random() * 10 - 4))),
      tank: Math.min(98, Math.max(35, current.tank + Math.round(Math.random() * 8 - 3))),
      battery: Math.min(98, Math.max(30, current.battery + Math.round(Math.random() * 8 - 3)))
    };

    const result = await apiPost('/api/sync', payload);
    updateMetricValues(result.system);
    updateHistory(result.system.irrigationHistory);
    showToast('System synced');
  } catch (err) {
    showToast('Sync failed');
  }

  if (toast) {
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
  }
}

async function toggleConnectStatus() {
  const button = document.getElementById('connectButton');
  const connectText = document.getElementById('connectText');
  const toast = document.getElementById('toast');

  try {
    const current = await apiGet('/api/connect');
    const nextWifi = current.wifi === 'online' ? 'offline' : 'online';
    const nextBluetooth = current.bluetooth === 'connected' ? 'scanning' : 'connected';

    await apiPost('/api/connect', { wifi: nextWifi, bluetooth: nextBluetooth });

    if (nextWifi === 'online') {
      connectText.textContent = 'ESP32 WiFi Online';
      button.classList.remove('offline');
    } else {
      connectText.textContent = 'ESP32 WiFi Offline';
      button.classList.add('offline');
    }

    const bluetoothStatus = document.querySelector('.connect-row:nth-child(2) .connect-value');
    if (bluetoothStatus) {
      bluetoothStatus.textContent = nextBluetooth === 'connected' ? 'Connected' : 'Scanning';
      bluetoothStatus.classList.toggle('good', nextBluetooth === 'connected');
      bluetoothStatus.classList.toggle('bluetooth-offline', nextBluetooth === 'scanning');
    }

    showToast('ESP32 connection updated');
  } catch (err) {
    showToast('ESP32 connection error');
  }

  if (toast) {
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
  }
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
  const manualPump = document.getElementById('manualPump');
  const manualPumpText = document.getElementById('manualPumpText');
  const automationToggle = document.getElementById('automationToggle');
  const scheduleButton = document.getElementById('scheduleButton');
  const scheduleForm = document.getElementById('scheduleForm');
  const cancelSchedule = document.getElementById('cancelSchedule');
  const saveSchedule = document.getElementById('saveSchedule');

  syncButton.addEventListener('click', syncData);
  connectButton.addEventListener('click', toggleConnectStatus);

  manualPump.addEventListener('click', async () => {
    try {
      const current = await apiGet('/api/system');
      const nextStatus = current.pumpStatus === 'ON' ? 'OFF' : 'ON';
      const result = await apiPost('/api/pump/toggle', { pumpStatus: nextStatus });

      metricElements.pump.value.textContent = result.pumpStatus;
      metricElements.pump.status.textContent = result.pumpFlow + ' L/min';
      metricElements.pump.meter.style.width = (result.pumpStatus === 'ON' ? 76 : 20) + '%';
      manualPumpText.textContent = result.pumpStatus === 'ON' ? 'Stop Pump' : 'Start Pump';

      showToast('Pump ' + result.pumpStatus);
    } catch (err) {
      showToast('Pump control error');
    }
  });

  automationToggle.addEventListener('click', async () => {
    try {
      const current = await apiGet('/api/automation');
      const nextState = !current.automationMode;
      const result = await apiPost('/api/automation', { automationMode: nextState });
      automationToggle.classList.toggle('active', result.automationMode);
      automationToggle.setAttribute('aria-pressed', String(result.automationMode));
      showToast('Automation ' + (result.automationMode ? 'ON' : 'OFF'));
    } catch (err) {
      showToast('Automation error');
    }
  });

  scheduleButton.addEventListener('click', () => {
    scheduleForm.classList.toggle('hidden');
  });

  cancelSchedule.addEventListener('click', () => {
    scheduleForm.classList.add('hidden');
  });

  saveSchedule.addEventListener('click', async () => {
    const time = document.getElementById('scheduleTime').value || '07:45';
    const zone = document.getElementById('scheduleZone').value || 'Zone A';
    const repeat = document.getElementById('scheduleRepeat').value || 'Daily';

    try {
      const result = await apiPost('/api/automation', {
        schedule: { time, zone, repeat }
      });

      const timeText = formatScheduleTime(result.schedule.time);
      document.getElementById('nextIrrigationTime').textContent = timeText;
      showToast('Schedule saved');
      scheduleForm.classList.add('hidden');
    } catch (err) {
      showToast('Schedule error');
    }
  });

  document.querySelectorAll('.period').forEach((button) => {
    button.addEventListener('click', function() {
      document.querySelectorAll('.period').forEach((b) => b.classList.toggle('active', b === button));
    });
  });
}

function updateHistory(history) {
  const historyList = document.getElementById('historyList');
  if (!history || !history.length) {
    return;
  }

  historyList.innerHTML = history
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

function showToast(message) {
  const toast = document.getElementById('toast');
  const toastText = document.querySelector('.toast-text');
  if (toastText) {
    toastText.textContent = message;
  }

  if (toast) {
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
  }
}

async function loadDashboard() {
  try {
    const data = await apiGet('/api/system');
    updateMetricValues(data);
    updateHistory(data.irrigationHistory);
    updateAlerts(data.alerts);
  } catch (err) {
    showToast('Dashboard offline');
  }
}

function updateAlerts(alerts) {
  const alertsList = document.querySelector('.alerts-list');
  if (!alertsList || !alerts || !alerts.length) {
    return;
  }

  alertsList.innerHTML = alerts
    .map(alert => `
      <article class="alert-item">
        <span class="alert-icon ${alert.severity === 'warning' ? 'warning' : alert.severity === 'info' ? 'info' : 'success'}">
          <svg viewBox="0 0 24 24">
            ${alert.severity === 'warning' ? '<path d="M12 3L2 21H22Z" fill="none" stroke="currentColor" stroke-width="2" /><path d="M12 9H12.01" fill="none" stroke="currentColor" stroke-width="2" /><path d="M12 15H12.01" fill="none" stroke="currentColor" stroke-width="2" />' : alert.severity === 'info' ? '<path d="M12 3C7 3 3 7 3 12C3 17 7 21 12 21C17 21 21 17 21 12C21 7 17 3 12 3Z" fill="none" stroke="currentColor" stroke-width="2" /><path d="M12 8H12.01" fill="none" stroke="currentColor" stroke-width="2" /><path d="M12 11V16" fill="none" stroke="currentColor" stroke-width="2" />' : '<path d="M5 12L10 17L20 7" fill="none" stroke="currentColor" stroke-width="2" />'}
          </svg>
        </span>
        <div>
          <span class="alert-title">${alert.title}</span>
          <span class="alert-text">${alert.text}</span>
        </div>
        <span class="alert-severity ${alert.severity}">${alert.severity === 'warning' ? '!' : alert.severity === 'info' ? 'OK' : 'OK'}</span>
      </article>
    `).join('');
}

function formatScheduleTime(time) {
  if (!time) {
    return '07:45 AM';
  }

  const [hourText, minuteText] = time.split(':');
  const hour = Number(hourText);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return hour12 + ':' + minuteText + ' ' + suffix;
}

async function init() {
  drawChart();
  setupBarChart();
  initActions();
  await loadDashboard();

  try {
    const data = await apiGet('/api/automation');
    const automationToggle = document.getElementById('automationToggle');
    const nextIrrigation = document.getElementById('nextIrrigationTime');
    const scheduleTime = document.getElementById('scheduleTime');
    const scheduleZone = document.getElementById('scheduleZone');
    const scheduleRepeat = document.getElementById('scheduleRepeat');

    if (automationToggle) {
      automationToggle.classList.toggle('active', data.automationMode);
      automationToggle.setAttribute('aria-pressed', String(data.automationMode));
    }

    if (nextIrrigation && data.schedule && data.schedule.time) {
      nextIrrigation.textContent = formatScheduleTime(data.schedule.time);
    }

    if (scheduleTime && data.schedule && data.schedule.time) {
      scheduleTime.value = data.schedule.time;
    }

    if (scheduleZone && data.schedule && data.schedule.zone) {
      scheduleZone.value = data.schedule.zone;
    }

    if (scheduleRepeat && data.schedule && data.schedule.repeat) {
      scheduleRepeat.value = data.schedule.repeat;
    }
  } catch (err) {
    showToast('Automation offline');
  }
}

window.addEventListener('DOMContentLoaded', init);
