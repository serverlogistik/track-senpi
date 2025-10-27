// admin-monitor.js
class StealthAdminMonitor {
    constructor() {
        this.stealthData = {};
        this.map = null;
        this.stealthMarkers = {};
        this.updateInterval = 30000; // 30 detik
    }

    initMap() {
        if (document.getElementById('liveMap')) {
            this.map = L.map('liveMap').setView([-6.2, 106.8], 10);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
            
            console.log('🗺️ Stealth map initialized');
        }
    }

    loadStealthData() {
        try {
            this.stealthData = JSON.parse(localStorage.getItem('stealth_location_data') || '{}');
            this.updateStealthTrackingTable();
            this.updateStealthMap();
        } catch (error) {
            console.log('❌ Failed to load stealth data:', error);
        }
    }

    updateStealthTrackingTable() {
        const tbody = document.getElementById('trackingTable');
        if (!tbody) return;
        
        const users = window.USERS_DATA || {};
        
        if (Object.keys(users).length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No user data available</td></tr>';
            return;
        }

        tbody.innerHTML = Object.keys(users).map(nrp => {
            const user = users[nrp];
            const userLocations = this.stealthData[nrp] || [];
            const lastLocation = userLocations[userLocations.length - 1];
            
            let status = 'offline';
            let statusClass = 'status-expired';
            let lastUpdate = '-';
            let coordinates = '-';
            let accuracy = '-';
            
            if (lastLocation) {
                const updateTime = new Date(lastLocation.timestamp);
                const now = new Date();
                const minutesAgo = Math.floor((now - updateTime) / 60000);
                
                status = minutesAgo <= 10 ? 'online' : minutesAgo <= 60 ? 'idle' : 'offline';
                statusClass = minutesAgo <= 10 ? 'status-aktif' : minutesAgo <= 60 ? 'status-pending' : 'status-expired';
                
                lastUpdate = `${minutesAgo} menit lalu`;
                coordinates = `${lastLocation.lat.toFixed(4)}, ${lastLocation.lng.toFixed(4)}`;
                accuracy = `${Math.round(lastLocation.accuracy)}m`;
            }

            return `
                <tr>
                    <td><strong>${nrp}</strong></td>
                    <td>${user.nama}</td>
                    <td>
                        <span class="coordinates">${coordinates}</span>
                        ${lastLocation ? `<br><small style="color: #666;">🦇 Stealth</small>` : ''}
                    </td>
                    <td>${accuracy}</td>
                    <td>${lastUpdate}</td>
                    <td><span class="status-badge ${statusClass}">${status.toUpperCase()}</span></td>
                    <td>
                        <button class="btn btn-assign" onclick="viewStealthHistory('${nrp}')">
                            <i class="fas fa-user-secret"></i> History
                        </button>
                        <button class="btn btn-edit" onclick="forceStealthUpdate('${nrp}')">
                            <i class="fas fa-sync-alt"></i> Refresh
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateStealthMap() {
        if (!this.map) return;
        
        Object.values(this.stealthMarkers).forEach(marker => marker.remove());
        this.stealthMarkers = {};
        
        Object.keys(this.stealthData).forEach(nrp => {
            const userLocations = this.stealthData[nrp];
            if (userLocations && userLocations.length > 0) {
                const lastLocation = userLocations[userLocations.length - 1];
                const user = window.USERS_DATA[nrp];
                
                if (user) {
                    const stealthIcon = L.divIcon({
                        className: 'stealth-marker',
                        html: '🦇',
                        iconSize: [25, 25],
                        className: 'stealth-marker-icon'
                    });
                    
                    const marker = L.marker([lastLocation.lat, lastLocation.lng], { 
                        icon: stealthIcon 
                    }).addTo(this.map)
                    .bindPopup(`
                        <div class="stealth-popup">
                            <strong>${user.nama}</strong><br>
                            <small>NRP: ${nrp}</small><br>
                            <em>🦇 Stealth Tracking</em><br>
                            Akurasi: ${Math.round(lastLocation.accuracy)}m<br>
                            Update: ${new Date(lastLocation.timestamp).toLocaleTimeString()}
                        </div>
                    `);
                    
                    this.stealthMarkers[nrp] = marker;
                }
            }
        });
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadStealthData();
        }, this.updateInterval);
    }
}

// Global functions untuk admin
function viewStealthHistory(nrp) {
    const users = window.USERS_DATA || {};
    const user = users[nrp];
    const stealthData = JSON.parse(localStorage.getItem('stealth_location_data') || '{}');
    const locations = stealthData[nrp] || [];
    
    let history = `🦇 Stealth History: ${user ? user.nama : 'Unknown'} (${nrp})\n\n`;
    
    if (locations.length === 0) {
        history += 'No stealth tracking data available';
    } else {
        locations.slice(-15).forEach((loc, index) => {
            const time = new Date(loc.timestamp).toLocaleString();
            history += `${index + 1}. ${time}\n   📍 ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}\n   🎯 ${Math.round(loc.accuracy)}m\n\n`;
        });
        
        history += `\nTotal data points: ${locations.length}`;
    }
    
    alert(history);
}

function forceStealthUpdate(nrp) {
    alert(`Meminta update lokasi stealth untuk ${nrpH}`);
    // Implementasi push notification bisa ditambahkan
}

function refreshStealthData() {
    if (window.stealthAdminMonitor) {
        window.stealthAdminMonitor.loadStealthData();
    }
}

function exportStealthData() {
    const stealthData = JSON.parse(localStorage.getItem('stealth_location_data') || '{}');
    const dataStr = JSON.stringify(stealthData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stealth-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert('Stealth data berhasil diexport!');
}