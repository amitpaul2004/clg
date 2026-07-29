/**
 * Dashboard Real-Time Simulation
 */

const CyberDashboard = (function() {
  
  const events = [
    "Encrypted Ping Received",
    "ICE Defense Test Run",
    "Handshake Authorized",
    "Data Packet Intercepted",
    "Node Sync Completed",
    "Firewall Breach Attempt",
    "Neural Uplink Established",
    "Proxy Connection Bypassed",
    "Ghost Protocol Triggered",
    "Subroutine Terminated",
    "Crypto-hash Verified",
    "Unauthorized Access Blocked"
  ];

  const locations = [
    "192.168.1.104 (Neo-Tokyo)",
    "Localhost ::1",
    "10.0.4.77 (Sector 7G)",
    "203.0.113.42 (Night City)",
    "198.51.100.8 (Orbital Station)",
    "Unknown / Proxy",
    "172.16.254.1 (Corporate Grid)",
    "10.9.8.7 (Underground)"
  ];

  const statuses = [
    { text: "SUCCESS", class: "cyber-badge" },
    { text: "PASSED", class: "cyber-badge cyber-badge--tertiary" },
    { text: "ACTIVE", class: "cyber-badge" },
    { text: "WARNING", class: "cyber-badge cyber-badge--secondary" },
    { text: "DENIED", class: "cyber-badge" },
    { text: "SECURE", class: "cyber-badge cyber-badge--tertiary" }
  ];

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  function randomFloat(min, max, decimals) {
    const val = (Math.random() * (max - min) + min);
    return parseFloat(val.toFixed(decimals));
  }

  function updateMetrics() {
    // Neural Sync Rate: 95.0% to 99.9%
    const syncVal = document.getElementById('metric-sync-val');
    const syncBar = document.getElementById('metric-sync-bar');
    if (syncVal && syncBar) {
      const sync = randomFloat(95, 99.9, 1);
      syncVal.textContent = sync + '%';
      syncBar.style.width = sync + '%';
    }

    // Active Tunnels: 3 to 8
    const tunnelsVal = document.getElementById('metric-tunnels-val');
    const tunnelsBar = document.getElementById('metric-tunnels-bar');
    if (tunnelsVal && tunnelsBar) {
      if (Math.random() > 0.7) { // Only update occasionally
        const tunnels = randomInt(3, 8);
        tunnelsVal.textContent = tunnels + ' NODES';
        tunnelsBar.style.width = (tunnels / 10 * 100) + '%';
      }
    }

    // Latency: 5ms to 60ms
    const latencyVal = document.getElementById('metric-latency-val');
    const latencyBar = document.getElementById('metric-latency-bar');
    if (latencyVal && latencyBar) {
      const latency = randomInt(5, 60);
      latencyVal.textContent = latency + ' MS';
      // Lower is better, but bar width is relative
      latencyBar.style.width = (latency / 100 * 100) + '%';
      
      // Turn red if latency is high
      if (latency > 45) {
        latencyVal.style.color = "var(--color-destructive)";
        latencyBar.style.backgroundColor = "var(--color-destructive)";
      } else {
        latencyVal.style.color = "var(--color-foreground)";
        latencyBar.style.backgroundColor = "var(--color-foreground)";
      }
    }
  }

  function addLogEntry() {
    const tbody = document.getElementById('realtime-logs-body');
    if (!tbody) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    
    const event = events[randomInt(0, events.length - 1)];
    const loc = locations[randomInt(0, locations.length - 1)];
    const status = statuses[randomInt(0, statuses.length - 1)];

    const tr = document.createElement('tr');
    tr.style.animation = 'cyber-glitch-anim 0.3s ease-out forwards';
    tr.innerHTML = `
      <td>${timeString}</td>
      <td>${event}</td>
      <td>${loc}</td>
      <td><span class="${status.class}">${status.text}</span></td>
    `;

    // Insert at the top
    tbody.insertBefore(tr, tbody.firstChild);

    // Keep max 5 rows
    while (tbody.children.length > 5) {
      tbody.removeChild(tbody.lastChild);
    }
  }

  function init() {
    // Start metrics interval (every 1.5 seconds)
    setInterval(updateMetrics, 1500);

    // Start logs interval (random between 2 and 6 seconds)
    function scheduleNextLog() {
      const delay = randomInt(2000, 6000);
      setTimeout(() => {
        addLogEntry();
        scheduleNextLog();
      }, delay);
    }
    scheduleNextLog();
  }

  return { init };
})();

// Auto-init if on dashboard
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('page-dashboard')) {
    CyberDashboard.init();
  }
});
