-- Fallback data seeding (hashed passwords for 'password')
INSERT INTO users (id, email, password, role) 
VALUES (gen_random_uuid(), 'employee@skillbridge.com', '$2a$10$wSsqt.9XbX5I1.Ue9p5.I.mG7oG2R5m6e4wW1fGj7Y4R9e3yqG7m6', 'EMPLOYEE')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password, role) 
VALUES (gen_random_uuid(), 'manager@skillbridge.com', '$2a$10$wSsqt.9XbX5I1.Ue9p5.I.mG7oG2R5m6e4wW1fGj7Y4R9e3yqG7m6', 'MANAGER')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (id, email, password, role) 
VALUES (gen_random_uuid(), 'hr@skillbridge.com', '$2a$10$wSsqt.9XbX5I1.Ue9p5.I.mG7oG2R5m6e4wW1fGj7Y4R9e3yqG7m6', 'HR')
ON CONFLICT (email) DO NOTHING;
