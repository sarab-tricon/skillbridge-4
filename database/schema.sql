-- SkillBridge Database Schema (PostgreSQL)
--User table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, 
    active_jti VARCHAR(255),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL
);


CREATE TABLE skills (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(255),
    description TEXT
);


CREATE TABLE employee_skills (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name VARCHAR(255) NOT NULL,
    proficiency_level VARCHAR(50) NOT NULL, 
    status VARCHAR(50) NOT NULL, 
    version BIGINT DEFAULT 0
);


CREATE TABLE projects (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    employees_required INTEGER,
    status VARCHAR(50) NOT NULL 
);


CREATE TABLE project_tech_stack (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tech VARCHAR(255) NOT NULL,
    PRIMARY KEY (project_id, tech)
);


CREATE TABLE allocation_requests (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES users(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    status VARCHAR(50) NOT NULL,
    billing_type VARCHAR(50), 
    manager_comments TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    forwarded_at TIMESTAMP,
    forwarded_by UUID REFERENCES users(id)
);


CREATE TABLE project_assignments (
    id UUID PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES users(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    assignment_status VARCHAR(50) NOT NULL, 
    billing_type VARCHAR(50),
    project_role VARCHAR(255),
    allocation_percent INTEGER CHECK (allocation_percent >= 0 AND allocation_percent <= 100),
    start_date DATE NOT NULL,
    end_date DATE,
    requested_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    version BIGINT DEFAULT 0
);
