if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js');
  });
}

const date = new Date();
document.getElementById('todayDate').textContent = date.toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric'
});

const connectButtons = Array.from(document.querySelectorAll('.connect-btn'));
const deviceStatus = document.getElementById('deviceStatus');

const toast = document.createElement('div');
toast.className = 'toast';
toast.innerHTML = '<span class="toast-message">System ready</span>';
document.body.appendChild(toast);

function showToast(message) {
  toast.querySelector('.toast-message').textContent = message;
  toast.classList.add('visible');
  setTimeout(() => {
    toast.classList.remove('visible');
  }, 1600);
}

const actionButtons = Array.from(document.querySelectorAll('[data-action]'));
actionButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;

    if (action === 'addTask') {
      const taskPanel = document.querySelector('.task-list');
      const task = document.createElement('article');
      task.className = 'task-row';
      task.innerHTML = '<span class="task-check"><input type="checkbox" /></span>' +
        '<span class="task-name">New irrigation check</span>' +
        '<span class="task-time">Now</span>';
      taskPanel.appendChild(task);
      showToast('Task added');
    }

    if (action === 'date') {
      showToast('Farm date selected');
    }

    if (action === 'range') {
      showToast('Range update');
    }

    if (action === 'tank') {
      showToast('Tank inspection');
    }

    if (action === 'taskAdd') {
      showToast('Work order added');
    }

    if (action === 'resolveAlert') {
      showToast('Alert resolved');
    }

    if (action === 'viewAlert') {
      showToast('Alert details');
    }
  });
});

connectButtons.forEach((button) => {
  button.addEventListener('click', () => {
    connectButtons.forEach((btn) => btn.classList.toggle('active', btn === button));

    const selectedNetwork = button.dataset.network;
    if (selectedNetwork === 'wifi') {
      deviceStatus.textContent = 'Farm Node 07 / WiFi';
      connectButtons[0].textContent = 'Connected';
      connectButtons[1].textContent = 'Bluetooth';
      showToast('WiFi connected');
    } else if (selectedNetwork === 'bluetooth') {
      deviceStatus.textContent = 'Farm Node 07 / Bluetooth';
      connectButtons[1].textContent = 'Connected';
      connectButtons[0].textContent = 'WiFi';
      showToast('Bluetooth connected');
    }
  });
});

function updateTelemetry() {
  const soil = document.getElementById('soilValue');
  const tank = document.getElementById('tankValue');
  const solar = document.getElementById('solarValue');
  const temp = document.getElementById('tempValue');
  const weatherTemp = document.getElementById('weatherTemp');

  const soilValue = Math.round(60 + Math.random() * 18);
  const waterValue = Math.round(70 + Math.random() * 16);

  soil.textContent = `${soilValue}%`;
  tank.textContent = `${waterValue}%`;
  solar.textContent = Math.round(36 + Math.random() * 18);
  temp.textContent = `${Math.round(23 + Math.random() * 8)}°`;
  weatherTemp.textContent = temp.textContent.replace('°', '');

  const bars = Array.from(document.querySelectorAll('.bar-fill'));
  bars.forEach((bar) => {
    if (bar.classList.contains('soil-fill')) {
      bar.style.width = `${soilValue}%`;
    }
    if (bar.classList.contains('water-fill')) {
      bar.style.width = `${waterValue}%`;
    }
  });
}

setInterval(updateTelemetry, 2400);
