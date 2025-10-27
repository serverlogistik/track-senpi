// audit-logger.js - Sistem log aktivitas
class AuditLogger {
    static logActivity(user, action, details = {}) {
        try {
            const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
            
            const logEntry = {
                id: this.generateId(),
                user: user,
                action: action,
                timestamp: new Date().toISOString(),
                details: details,
                userAgent: navigator.userAgent,
                ip: 'local' // Di production bisa pake service get IP
            };
            
            logs.push(logEntry);
            
            // Simpan max 1000 log entries
            if (logs.length > 1000) {
                logs.splice(0, logs.length - 1000);
            }
            
            localStorage.setItem('audit_logs', JSON.stringify(logs));
            
            console.log(`📝 Audit Log: ${user} - ${action}`, details);
            
        } catch (error) {
            console.error('Error saving audit log:', error);
        }
    }
    
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    static getLogs(filter = {}) {
        try {
            const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
            
            if (filter.user) {
                return logs.filter(log => log.user === filter.user);
            }
            
            if (filter.action) {
                return logs.filter(log => log.action === filter.action);
            }
            
            if (filter.date) {
                const targetDate = new Date(filter.date).toDateString();
                return logs.filter(log => 
                    new Date(log.timestamp).toDateString() === targetDate
                );
            }
            
            return logs.reverse(); // Return terbaru dulu
            
        } catch (error) {
            console.error('Error getting audit logs:', error);
            return [];
        }
    }
    
    static clearOldLogs(days = 30) {
        try {
            const logs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            
            const filteredLogs = logs.filter(log => 
                new Date(log.timestamp) > cutoffDate
            );
            
            localStorage.setItem('audit_logs', JSON.stringify(filteredLogs));
            return filteredLogs.length;
            
        } catch (error) {
            console.error('Error clearing old logs:', error);
            return 0;
        }
    }
}

// Global function untuk mudah diakses
function logActivity(user, action, details = {}) {
    AuditLogger.logActivity(user, action, details);
}