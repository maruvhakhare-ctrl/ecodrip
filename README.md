# ECO DRIP Smart Irrigation Dashboard

ECO DRIP is a static dashboard website for a solar-powered intelligent drip irrigation system designed for the Samsung Solve for Tomorrow project. It presents soil moisture, pump status, tank level, solar charging, and irrigation history for a rural smart farming scenario.

## Project Files

- `index.html` – dashboard layout and content structure
- `styles.css` – responsive UI styling and visual design
- `app.js` – UI behavior, chart rendering, and data simulation

## ESP32 Connectivity

The front-end is designed to be compatible with an ESP32 device connected through WiFi and Bluetooth:

- WiFi can publish sensor readings to a web endpoint
- Bluetooth can be used for local pairing and direct sensor reporting
- The dashboard UI includes ESP32 WiFi/Bluetooth status display and a simulated connection update flow

## Local Run

A simple static web server can serve the folder locally:

```sh
python3 -m http.server 8000
```

Then open:

http://127.0.0.1:8000
