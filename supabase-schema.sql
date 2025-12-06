-- Track Senpi Database Schema for PostgreSQL

-- Users table (personel)
CREATE TABLE IF NOT EXISTS users (
    nrp VARCHAR(8) PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    pangkat VARCHAR(100),
    kesatuan VARCHAR(255),
    password_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Aktif',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Senpi table
CREATE TABLE IF NOT EXISTS senpi (
    id SERIAL PRIMARY KEY,
    nomor_seri VARCHAR(100) UNIQUE NOT NULL,
    nrp VARCHAR(8) REFERENCES users(nrp) ON DELETE CASCADE,
    jenis VARCHAR(100),
    keterangan TEXT,
    tanggal_terbit_simsa DATE,
    tanggal_expired DATE,
    foto_simsa TEXT,
    foto_senpi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Location tracking table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    nrp VARCHAR(8) REFERENCES users(nrp) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    meta JSONB
);

-- Index for faster location queries
CREATE INDEX IF NOT EXISTS idx_locations_nrp ON locations(nrp);
CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_locations_nrp_timestamp ON locations(nrp, timestamp DESC);

-- Sessions table for active logins
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    nrp VARCHAR(8) REFERENCES users(nrp) ON DELETE CASCADE,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    device_info JSONB
);

-- Admin logs
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_nrp VARCHAR(8),
    action VARCHAR(255),
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photos table (optional, for tracking all photos)
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    nrp VARCHAR(8) REFERENCES users(nrp) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type VARCHAR(50), -- 'simsa' or 'senpi'
    senpi_id INTEGER REFERENCES senpi(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply update trigger to senpi table
DROP TRIGGER IF EXISTS update_senpi_updated_at ON senpi;
CREATE TRIGGER update_senpi_updated_at 
    BEFORE UPDATE ON senpi 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (nrp, nama, pangkat, kesatuan, password_hash, is_admin, status)
VALUES (
    '00000001',
    'Super Admin',
    'KOMBES POL',
    'POLDA METRO JAYA',
    '$2a$10$rQZ3rJ3qK1h4M.xL4ZGqC.hP0y5YzY5vXqQQ1Y3qK1h4M.xL4ZGqC',
    TRUE,
    'Aktif'
)
ON CONFLICT (nrp) DO NOTHING;

-- Create view for latest locations per user
CREATE OR REPLACE VIEW latest_locations AS
SELECT DISTINCT ON (nrp)
    nrp,
    latitude,
    longitude,
    accuracy,
    timestamp,
    meta
FROM locations
ORDER BY nrp, timestamp DESC;

-- Create view for senpi with user details
CREATE OR REPLACE VIEW senpi_with_users AS
SELECT 
    s.*,
    u.nama,
    u.pangkat,
    u.kesatuan,
    CASE 
        WHEN s.tanggal_expired < CURRENT_DATE THEN 'EXPIRED'
        WHEN s.tanggal_terbit_simsa IS NULL THEN 'PENDING'
        ELSE 'AKTIF'
    END as status
FROM senpi s
LEFT JOIN users u ON s.nrp = u.nrp;