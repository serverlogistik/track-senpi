-- Update admin user dengan password yang benar
-- Password: Asuedan00@
-- NRP: 00030948

DELETE FROM users WHERE nrp IN ('00000001', '00030948');

INSERT INTO users (nrp, nama, pangkat, kesatuan, password_hash, is_admin, status)
VALUES (
    '00030948',
    'Admin',
    'BHARADA',
    'RESIMEN 3 PASUKAN PELOPOR',
    '$2a$10$N8v5P3YzF7mKp2wQ9tR4.egXC5Z8yGvJ3mKp7wN9tR5.O5YzF3xK6',
    TRUE,
    'Aktif'
)
ON CONFLICT (nrp) DO UPDATE SET
    nama = EXCLUDED.nama,
    pangkat = EXCLUDED.pangkat,
    kesatuan = EXCLUDED.kesatuan,
    password_hash = EXCLUDED.password_hash,
    is_admin = EXCLUDED.is_admin,
    status = EXCLUDED.status;
