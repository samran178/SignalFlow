# SignalFlow: Real-Time Infrastructure & Telemetry Monitor

SignalFlow is a production-ready infrastructure monitoring dashboard engineered to stream live, stateful system metrics from multi-node clusters. Built using an asynchronous architecture, the platform opens a persistent WebSocket connection between the backend cluster simulator and a React frontend. Telemetry data—including real-time CPU spikes, memory distribution, request volumes, and sudden server anomalies—is pushed instantly to the client interface without the overhead of traditional polling mechanisms.

The system is highly optimized to handle fast data streaming loops smoothly without degrading browser paint cycles.

## 🚀 Key Features

* **Bi-Directional Persistent Streaming:** Implements stateful WebSockets to establish a continuous pipeline, pushing metric packets to the frontend with sub-100ms latency.
* **Dynamic Data Visualizations:** Uses the Recharts library to draw live, animating time-series area charts that handle high refresh rates seamlessly.
* **Automated Threshold Alert Engine:** Features a background server worker that watches data packet thresholds and instantly triggers persistent "System Alerts" if a simulated node drops or encounters an error.
* **Stateful Aggregation Counters:** Tracks network-wide vitals, providing a live node count alongside warning indices and resource saturation statistics across a localized fleet.

## 🛠️ Tech Stack

* **Frontend UI Framework:** React (Vite.js build architecture)
* **Styling Engine:** Tailwind CSS
* **Data Visualization:** Recharts (Time-Series Optimization)
* **Backend Runtime & Logic:** Node.js (Express) OR Python (FastAPI)
* **Real-Time Layer:** Native WebSockets / Socket.io

## 📂 Project Structure

```text
├── src/
│   ├── components/      # UI widgets (LiveFleetOverview, TelemetryChart, SystemAlerts)
│   ├── hooks/           # useWebSocket logic for state management
│   ├── App.jsx          # Dashboard layout orchestration
│   └── index.css        # Tailwind configurations
├── server.js            # Telemetry generation engine and WebSocket server
├── package.json         # Locked project dependencies
└── README.md            # Project documentation
