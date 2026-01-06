-- SkillBridge Seed Data

-- 1. Default User Accounts (Password for all is 'password')
INSERT INTO users (id, email, password, role, first_name, last_name) 
VALUES 
(gen_random_uuid(), 'employee@skillbridge.com', '$2a$10$wSsqt.9XbX5I1.Ue9p5.I.mG7oG2R5m6e4wW1fGj7Y4R9e3yqG7m6', 'EMPLOYEE', 'John', 'Doe'),
(gen_random_uuid(), 'manager@skillbridge.com', '$2a$10$wSsqt.9XbX5I1.Ue9p5.I.mG7oG2R5m6e4wW1fGj7Y4R9e3yqG7m6', 'MANAGER', 'Jane', 'Manager'),
(gen_random_uuid(), 'hr@skillbridge.com', '$2a$10$wSsqt.9XbX5I1.Ue9p5.I.mG7oG2R5m6e4wW1fGj7Y4R9e3yqG7m6', 'HR', 'Admin', 'HR')
ON CONFLICT (email) DO NOTHING;

-- 2. Master Skill Catalog Seeding
INSERT INTO skills (id, name, category, description)
VALUES 
(gen_random_uuid(), 'Java', 'Programming', 'Backend development with Spring Boot'),
(gen_random_uuid(), 'React', 'Frontend', 'Modern UI development with Hooks'),
(gen_random_uuid(), 'Python', 'Data Science', 'Data analysis and scripting'),
(gen_random_uuid(), 'SQL', 'Database', 'Relational database management'),
(gen_random_uuid(), 'Docker', 'DevOps', 'Containerization and scaling'),
(gen_random_uuid(), 'AWS', 'Cloud', 'Cloud infrastructure services'),
(gen_random_uuid(), 'Project Management', 'Agile', 'Sprint planning and team leadership')
ON CONFLICT (name) DO NOTHING;

-- 3. Sample Projects
INSERT INTO projects (id, name, company_name, start_date, end_date, status, employees_required)
VALUES 
(gen_random_uuid(), 'Mobile App Redesign', 'TechCorp Inc.', '2025-01-01', '2025-06-30', 'ACTIVE', 5),
(gen_random_uuid(), 'Cloud Migration', 'FinanceGlobal', '2025-02-15', '2025-12-31', 'ACTIVE', 8)
ON CONFLICT (name) DO NOTHING;
