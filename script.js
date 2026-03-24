/* ===== SolarIrri Dashboard — script.js ===== */

(function () {
    'use strict';

    // ——— Auth Gate ———
    // Uncomment below to enforce login (disabled for easy preview)
    // if (!sessionStorage.getItem('solarirri_auth')) {
    //     window.location.href = 'login.html';
    //     return;
    // }

    // ——— DOM References ———
    const $ = (sel) => document.getElementById(sel);
    const clockEl          = $('clock');
    const moistureValue    = $('moistureValue');
    const moistureBar      = $('moistureBar');
    const tempValue        = $('tempValue');
    const tempStatus       = $('tempStatus');
    const humidityValue    = $('humidityValue');
    const humidityBar      = $('humidityBar');
    const wattsValue       = $('wattsValue');
    const wattsBar         = $('wattsBar');
    const wattsPercent     = $('wattsPercent');
    const voltageValue     = $('voltageValue');
    const batteryLevel     = $('batteryLevel');
    const batteryPct       = $('batteryPct');
    const batteryStatusEl  = $('batteryStatus');
    const toggleAutoInput  = $('toggleAuto').querySelector('input');
    const togglePumpInput  = $('togglePump').querySelector('input');
    const pumpDesc         = $('pumpDesc');
    const zoneButtonsCont  = $('zoneButtons');
    const irrigationStatus = $('irrigationStatus');
    const irrigationLabel  = $('irrigationLabel');
    const waterAnimation   = $('waterAnimation');
    const logList          = $('logList');
    const clearLogsBtn     = $('clearLogsBtn');
    const forecastCards    = $('forecastCards');
    const uptimeValue      = $('uptimeValue');
    const waterSavedValue  = $('waterSavedValue');
    const energyGenValue   = $('energyGenValue');
    const logoutBtn        = $('logoutBtn');

    // Crop Health
    const ndviProgress     = $('ndviProgress');
    const ndviValueEl      = $('ndviValue');
    const ndviStatusEl     = $('ndviStatus');
    const pestBar          = $('pestBar');
    const pestLevel        = $('pestLevel');

    // Water Analytics
    const wsTodayVal       = $('wsTodayVal');
    const wsWeekVal        = $('wsWeekVal');
    const wsEfficiency     = $('wsEfficiency');
    const waterCanvas      = $('waterChart');

    // ——— State ———
    let state = {
        moisture: 62,
        temperature: 28.5,
        humidity: 55,
        watts: 245,
        voltage: 24.1,
        battery: 78,
        batteryCharging: true,
        autoMode: true,
        pumpOn: false,
        activeZone: 1,
        irrigating: false,
        uptimeMinutes: 754,
        waterSaved: 148,
        energyGen: 3.2,
        ndvi: 0.72,
        pestRisk: 25,
        waterToday: 24,
        waterWeek: 156,
        waterEfficiency: 87,
        waterHistory: [18, 22, 30, 26, 19, 24, 24]
    };

    // ——— Utilities ———
    function pad(n) { return String(n).padStart(2, '0'); }

    function formatTime(d) {
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }

    function shortTime() {
        const d = new Date();
        return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    function rand(min, max) { return Math.random() * (max - min) + min; }

    // ——— Clock ———
    function updateClock() {
        clockEl.textContent = formatTime(new Date());
    }
    setInterval(updateClock, 1000);
    updateClock();

    // ——— Background Particles ———
    (function initParticles() {
        const container = document.getElementById('bgParticles');
        const colors = ['rgba(16,185,129,0.15)', 'rgba(245,158,11,0.1)', 'rgba(59,130,246,0.1)'];
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            const size = rand(2, 6);
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = rand(0, 100) + '%';
            p.style.background = colors[Math.floor(rand(0, colors.length))];
            p.style.animationDuration = rand(12, 28) + 's';
            p.style.animationDelay = rand(0, 15) + 's';
            container.appendChild(p);
        }
    })();

    // ——— Logging ———
    const LOG_MAX = 40;
    const initialLogs = [
        { type: 'info',    msg: 'System initialized successfully' },
        { type: 'success', msg: 'Solar panels connected — output normal' },
        { type: 'info',    msg: `Auto-mode enabled for Zone ${state.activeZone}` },
        { type: 'success', msg: 'Battery charging at 78%' },
    ];

    function addLog(type, msg) {
        const li = document.createElement('li');
        li.className = `log-item log-${type}`;
        li.innerHTML = `<span class="log-time">${shortTime()}</span><span class="log-msg">${msg}</span>`;
        logList.prepend(li);
        // Trim
        while (logList.children.length > LOG_MAX) {
            logList.removeChild(logList.lastChild);
        }
    }

    initialLogs.reverse().forEach(l => addLog(l.type, l.msg));

    clearLogsBtn.addEventListener('click', () => {
        logList.innerHTML = '';
        addLog('info', 'Logs cleared');
    });

    // ——— Render Helpers ———
    function renderEnv() {
        moistureValue.textContent = Math.round(state.moisture);
        moistureBar.style.width = state.moisture + '%';
        tempValue.textContent = state.temperature.toFixed(1);
        // Temp status
        if (state.temperature < 15) { tempStatus.textContent = 'Cool'; tempStatus.style.color = 'var(--accent-cyan)'; tempStatus.style.background = 'rgba(6,182,212,0.15)'; }
        else if (state.temperature < 30) { tempStatus.textContent = 'Warm'; tempStatus.style.color = 'var(--accent-amber)'; tempStatus.style.background = 'var(--accent-amber-glow)'; }
        else { tempStatus.textContent = 'Hot'; tempStatus.style.color = 'var(--accent-red)'; tempStatus.style.background = 'var(--accent-red-glow)'; }
        humidityValue.textContent = Math.round(state.humidity);
        humidityBar.style.width = state.humidity + '%';
    }

    function renderSolar() {
        wattsValue.textContent = Math.round(state.watts);
        const pct = Math.round((state.watts / 400) * 100);
        wattsBar.style.width = pct + '%';
        wattsPercent.textContent = pct;
        voltageValue.textContent = state.voltage.toFixed(1);
        batteryLevel.style.width = state.battery + '%';
        batteryPct.textContent = Math.round(state.battery) + '%';
        if (state.battery < 20) {
            batteryLevel.style.background = 'linear-gradient(90deg, var(--accent-red), #f87171)';
            batteryPct.style.color = 'var(--accent-red)';
        } else if (state.battery < 50) {
            batteryLevel.style.background = 'linear-gradient(90deg, var(--accent-amber), #fbbf24)';
            batteryPct.style.color = 'var(--accent-amber)';
        } else {
            batteryLevel.style.background = 'linear-gradient(90deg, var(--accent-green), #34d399)';
            batteryPct.style.color = 'var(--accent-green)';
        }
        batteryStatusEl.textContent = state.batteryCharging ? '⚡ Charging' : '🔋 Discharging';
        batteryStatusEl.className = 'battery-status ' + (state.batteryCharging ? 'charging' : 'discharging');
    }

    function renderIrrigation() {
        const active = state.pumpOn || (state.autoMode && state.moisture < 40);
        state.irrigating = active;
        irrigationStatus.classList.toggle('active', active);
        irrigationLabel.textContent = active ? `💧 Irrigating Zone ${state.activeZone}` : 'Irrigation Idle';
    }

    function renderStats() {
        const h = Math.floor(state.uptimeMinutes / 60);
        const m = state.uptimeMinutes % 60;
        uptimeValue.textContent = `${h}h ${pad(m)}m`;
        waterSavedValue.textContent = `${state.waterSaved} L`;
        energyGenValue.textContent = `${state.energyGen.toFixed(1)} kWh`;
    }

    // ——— Controls ———
    toggleAutoInput.addEventListener('change', () => {
        state.autoMode = toggleAutoInput.checked;
        addLog(state.autoMode ? 'success' : 'warning', `Auto irrigation ${state.autoMode ? 'enabled' : 'disabled'}`);
        renderIrrigation();
    });

    togglePumpInput.addEventListener('change', () => {
        state.pumpOn = togglePumpInput.checked;
        pumpDesc.textContent = `Manual override — currently ${state.pumpOn ? 'ON' : 'OFF'}`;
        addLog(state.pumpOn ? 'info' : 'info', `Water pump manually turned ${state.pumpOn ? 'ON' : 'OFF'}`);
        renderIrrigation();
    });

    zoneButtonsCont.addEventListener('click', (e) => {
        const btn = e.target.closest('.zone-btn');
        if (!btn) return;
        zoneButtonsCont.querySelectorAll('.zone-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.activeZone = Number(btn.dataset.zone);
        addLog('info', `Switched to Zone ${state.activeZone}`);
        renderIrrigation();
    });

    // ——— Simulation ———
    function simulateData() {
        // Moisture drifts
        state.moisture += rand(-2, 1.5);
        if (state.irrigating) state.moisture += rand(1, 3);
        state.moisture = clamp(state.moisture, 10, 95);

        // Temperature
        state.temperature += rand(-0.4, 0.4);
        state.temperature = clamp(state.temperature, 8, 45);

        // Humidity
        state.humidity += rand(-1.5, 1.5);
        state.humidity = clamp(state.humidity, 15, 95);

        // Solar — varies with simulated sun position
        const hourFrac = new Date().getHours() + new Date().getMinutes() / 60;
        const sunFactor = Math.max(0, Math.sin((hourFrac - 5) / 14 * Math.PI)); // peak around noon
        state.watts = clamp(sunFactor * 400 + rand(-30, 30), 0, 400);
        state.voltage = clamp(18 + sunFactor * 10 + rand(-0.5, 0.5), 0, 32);

        // Battery
        if (state.watts > 50) {
            state.battery += rand(0.05, 0.3);
            state.batteryCharging = true;
        } else {
            state.battery -= rand(0.05, 0.2);
            state.batteryCharging = false;
        }
        state.battery = clamp(state.battery, 0, 100);

        // Stats
        state.uptimeMinutes++;
        if (state.irrigating) state.waterSaved += rand(0, 0.3);
        state.energyGen += state.watts / 400 * rand(0.001, 0.01);

        // Auto-irrigation events
        if (state.autoMode && state.moisture < 40 && !state.irrigating) {
            addLog('warning', `Low moisture detected (${Math.round(state.moisture)}%) — auto irrigating Zone ${state.activeZone}`);
        }
        if (state.battery < 20) {
            addLog('error', `Battery low (${Math.round(state.battery)}%) — consider reducing load`);
        }

        // Crop Health
        state.ndvi += rand(-0.02, 0.02);
        state.ndvi = clamp(state.ndvi, 0.1, 0.95);
        state.pestRisk += rand(-1.5, 1.5);
        state.pestRisk = clamp(state.pestRisk, 5, 90);

        // Water Analytics
        if (state.irrigating) state.waterToday += rand(0.1, 0.5);
        state.waterEfficiency = clamp(state.waterEfficiency + rand(-0.3, 0.3), 60, 98);

        renderEnv();
        renderSolar();
        renderIrrigation();
        renderStats();
        renderCropHealth();
        renderWaterStats();
    }

    // ——— 5-Day Forecast ———
    (function initForecast() {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const icons = ['☀️', '⛅', '🌤️', '☁️', '🌧️'];
        const temps = [
            { hi: 32, lo: 21 },
            { hi: 30, lo: 19 },
            { hi: 28, lo: 18 },
            { hi: 25, lo: 17 },
            { hi: 27, lo: 20 },
        ];

        // Pick today's day
        const today = new Date().getDay(); // 0=Sun
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 0; i < 5; i++) {
            const dayIdx = (today + i) % 7;
            const card = document.createElement('div');
            card.className = 'forecast-card';
            card.innerHTML = `
                <div class="forecast-day">${i === 0 ? 'Today' : dayNames[dayIdx]}</div>
                <div class="forecast-icon">${icons[i]}</div>
                <div class="forecast-temp">${temps[i].hi}° <small>/ ${temps[i].lo}°</small></div>
            `;
            forecastCards.appendChild(card);
        }
    })();

    // ——— Crop Health Render ———
    function renderCropHealth() {
        // NDVI ring: circumference = 2*PI*42 ≈ 263.9
        const circumference = 263.9;
        const offset = circumference - (state.ndvi * circumference);
        ndviProgress.style.strokeDashoffset = offset;
        ndviValueEl.textContent = state.ndvi.toFixed(2);

        if (state.ndvi >= 0.6) {
            ndviStatusEl.textContent = '🌿 Healthy';
            ndviStatusEl.className = 'ndvi-status good';
            ndviProgress.style.stroke = 'var(--accent-green)';
            ndviValueEl.style.color = 'var(--accent-green)';
        } else if (state.ndvi >= 0.35) {
            ndviStatusEl.textContent = '⚠ Moderate';
            ndviStatusEl.className = 'ndvi-status moderate';
            ndviProgress.style.stroke = 'var(--accent-amber)';
            ndviValueEl.style.color = 'var(--accent-amber)';
        } else {
            ndviStatusEl.textContent = '🔴 Poor';
            ndviStatusEl.className = 'ndvi-status poor';
            ndviProgress.style.stroke = 'var(--accent-red)';
            ndviValueEl.style.color = 'var(--accent-red)';
        }

        pestBar.style.width = state.pestRisk + '%';
        if (state.pestRisk < 35) {
            pestLevel.textContent = 'Low';
            pestLevel.style.color = 'var(--accent-green)';
        } else if (state.pestRisk < 65) {
            pestLevel.textContent = 'Medium';
            pestLevel.style.color = 'var(--accent-amber)';
        } else {
            pestLevel.textContent = 'High';
            pestLevel.style.color = 'var(--accent-red)';
        }
    }

    // ——— Water Analytics Render ———
    function renderWaterStats() {
        wsTodayVal.textContent = Math.round(state.waterToday);
        wsWeekVal.textContent = Math.round(state.waterWeek + state.waterToday);
        wsEfficiency.textContent = Math.round(state.waterEfficiency) + '%';
    }

    // ——— Water Chart (Canvas) ———
    function drawWaterChart() {
        const ctx = waterCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = waterCanvas.parentElement.getBoundingClientRect();
        waterCanvas.width = rect.width * dpr;
        waterCanvas.height = 140 * dpr;
        waterCanvas.style.width = rect.width + 'px';
        waterCanvas.style.height = '140px';
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = 140;
        const data = state.waterHistory;
        const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const today = new Date().getDay(); // 0=Sun
        const dayLabels = [];
        for (let i = 6; i >= 0; i--) {
            const d = (today - i + 7) % 7;
            dayLabels.push(days[d === 0 ? 6 : d - 1]);
        }

        const maxVal = Math.max(...data) * 1.3;
        const barW = Math.min(28, (w - 60) / 7 - 8);
        const startX = 35;
        const chartH = h - 30;
        const gap = (w - startX - 10) / 7;

        ctx.clearRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = 5 + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(w - 10, y);
            ctx.stroke();
        }

        // Bars
        data.forEach((val, i) => {
            const barH = (val / maxVal) * chartH;
            const x = startX + gap * i + (gap - barW) / 2;
            const y = 5 + chartH - barH;

            // Gradient bar
            const grad = ctx.createLinearGradient(x, y, x, y + barH);
            grad.addColorStop(0, 'rgba(99,102,241,0.9)');
            grad.addColorStop(1, 'rgba(59,130,246,0.4)');
            ctx.fillStyle = grad;

            // Rounded rect
            const r = Math.min(4, barW / 2);
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + barW - r, y);
            ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
            ctx.lineTo(x + barW, y + barH);
            ctx.lineTo(x, y + barH);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.fill();

            // Value label
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.font = '500 9px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(val + 'L', x + barW / 2, y - 4);

            // Day label
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '500 9px Inter, sans-serif';
            ctx.fillText(dayLabels[i], x + barW / 2, h - 4);
        });
    }

    // ——— Logout ———
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('solarirri_auth');
        sessionStorage.removeItem('solarirri_user');
        window.location.href = 'login.html';
    });

    // ——— Initial Render & Start Simulation ———
    renderEnv();
    renderSolar();
    renderIrrigation();
    renderStats();
    renderCropHealth();
    renderWaterStats();
    drawWaterChart();
    window.addEventListener('resize', drawWaterChart);

    // Simulate every 3 seconds
    setInterval(simulateData, 3000);

    // Periodic system log events
    const randomEvents = [
        { type: 'info', msg: 'Sensor heartbeat received' },
        { type: 'success', msg: 'Data synced to cloud' },
        { type: 'info', msg: 'Solar tracker adjusted panel angle' },
        { type: 'success', msg: 'Firmware up to date' },
        { type: 'info', msg: 'Scheduled soil analysis complete' },
    ];

    setInterval(() => {
        if (Math.random() < 0.4) {
            const evt = randomEvents[Math.floor(Math.random() * randomEvents.length)];
            addLog(evt.type, evt.msg);
        }
    }, 8000);

})();
