-- ============================================================
-- Attendance Management System – Initial Schema Migration
-- Target: PostgreSQL 14+
-- ============================================================

-- -----------------------------------------------
-- 1. COMPANIES
-- -----------------------------------------------
CREATE TABLE companies (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL,
    code        VARCHAR(50)     NOT NULL,
    logo_url    VARCHAR(500),
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_companies_code UNIQUE (code)
);

-- -----------------------------------------------
-- 2. BRANCHES
-- -----------------------------------------------
CREATE TABLE branches (
    id          SERIAL          PRIMARY KEY,
    company_id  INT             NOT NULL,
    name        VARCHAR(200)    NOT NULL,
    code        VARCHAR(50)     NOT NULL,
    address     VARCHAR(500),
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_branches_companies  FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT uq_branches_company_code UNIQUE (company_id, code)
);

CREATE INDEX ix_branches_company_id ON branches (company_id);

-- -----------------------------------------------
-- 3. EMPLOYEES
-- -----------------------------------------------
CREATE TABLE employees (
    id                  SERIAL          PRIMARY KEY,
    company_id          INT             NOT NULL,
    branch_id           INT             NOT NULL,
    employee_code       VARCHAR(50)     NOT NULL,
    first_name          VARCHAR(100)    NOT NULL,
    last_name           VARCHAR(100)    NOT NULL,
    email               VARCHAR(256)    NOT NULL,
    password_hash       VARCHAR(256)    NOT NULL,
    phone               VARCHAR(30),
    role                SMALLINT        NOT NULL DEFAULT 0, -- 0=Employee,1=Manager,2=Admin
    profile_image_url   VARCHAR(500),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    refresh_token       VARCHAR(256),
    refresh_token_expiry TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_employees_companies FOREIGN KEY (company_id) REFERENCES companies(id),
    CONSTRAINT fk_employees_branches  FOREIGN KEY (branch_id)  REFERENCES branches(id),
    CONSTRAINT uq_employees_email     UNIQUE (email),
    CONSTRAINT uq_employees_code      UNIQUE (employee_code)
);

CREATE INDEX ix_employees_company_id ON employees (company_id);
CREATE INDEX ix_employees_branch_id  ON employees (branch_id);
CREATE INDEX ix_employees_is_active  ON employees (is_active);

-- -----------------------------------------------
-- 4. ZK DEVICES
-- -----------------------------------------------
CREATE TABLE zk_devices (
    id              SERIAL          PRIMARY KEY,
    branch_id       INT             NOT NULL,
    device_serial   VARCHAR(100)    NOT NULL,
    device_name     VARCHAR(200)    NOT NULL,
    device_key      VARCHAR(256)    NOT NULL,
    last_sync_at    TIMESTAMPTZ,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_zk_devices_branches FOREIGN KEY (branch_id) REFERENCES branches(id),
    CONSTRAINT uq_zk_devices_serial   UNIQUE (device_serial)
);

CREATE INDEX ix_zk_devices_branch_id ON zk_devices (branch_id);

-- -----------------------------------------------
-- 5. ATTENDANCE LOGS
-- -----------------------------------------------
CREATE TABLE attendance_logs (
    id          BIGSERIAL       PRIMARY KEY,
    employee_id INT             NOT NULL,
    branch_id   INT             NOT NULL,
    punch_type  SMALLINT        NOT NULL, -- 0=CheckIn, 1=CheckOut
    punch_time  TIMESTAMPTZ     NOT NULL,
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    source      SMALLINT        NOT NULL DEFAULT 0, -- 0=Mobile,1=ZKDevice,2=Manual,3=Cosec
    device_id   INT,
    notes       VARCHAR(500),
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_attendance_employees FOREIGN KEY (employee_id) REFERENCES employees(id),
    CONSTRAINT fk_attendance_branches  FOREIGN KEY (branch_id)   REFERENCES branches(id),
    CONSTRAINT fk_attendance_devices   FOREIGN KEY (device_id)   REFERENCES zk_devices(id) ON DELETE SET NULL
);

CREATE INDEX ix_attendance_employee_time ON attendance_logs (employee_id, punch_time DESC);
CREATE INDEX ix_attendance_branch_time   ON attendance_logs (branch_id, punch_time DESC);
CREATE INDEX ix_attendance_punch_time    ON attendance_logs (punch_time DESC);

-- -----------------------------------------------
-- 6. DEVICE LOGS
-- -----------------------------------------------
CREATE TABLE device_logs (
    id                  BIGSERIAL       PRIMARY KEY,
    device_id           INT,            -- NULL for pull-based sources (e.g. COSEC) with no registered ZKDevice row
    employee_code       VARCHAR(50)     NOT NULL,
    punch_time          TIMESTAMPTZ     NOT NULL,
    raw_punch_type      INT             NOT NULL,
    is_synced           BOOLEAN         NOT NULL DEFAULT FALSE,
    synced_at           TIMESTAMPTZ,
    attendance_log_id   BIGINT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_device_logs_devices    FOREIGN KEY (device_id)         REFERENCES zk_devices(id) ON DELETE SET NULL,
    CONSTRAINT fk_device_logs_attendance FOREIGN KEY (attendance_log_id) REFERENCES attendance_logs(id)
);

CREATE INDEX ix_device_logs_device_time ON device_logs (device_id, punch_time DESC);
CREATE INDEX ix_device_logs_is_synced   ON device_logs (is_synced);

-- -----------------------------------------------
-- 7. GEO FENCES
-- -----------------------------------------------
CREATE TABLE geo_fences (
    id                SERIAL          PRIMARY KEY,
    branch_id         INT             NOT NULL,
    name              VARCHAR(200)    NOT NULL,
    latitude          DOUBLE PRECISION NOT NULL,
    longitude         DOUBLE PRECISION NOT NULL,
    radius_meters     INT             NOT NULL DEFAULT 100,
    enforce_on_mobile BOOLEAN         NOT NULL DEFAULT TRUE,
    is_active         BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_geo_fences_branches FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE INDEX ix_geo_fences_branch_id ON geo_fences (branch_id);

-- -----------------------------------------------
-- 8. VISITOR LOGS
-- -----------------------------------------------
CREATE TABLE visitor_logs (
    id                BIGSERIAL       PRIMARY KEY,
    branch_id         INT             NOT NULL,
    visitor_name      VARCHAR(200)    NOT NULL,
    visitor_phone     VARCHAR(30),
    visitor_email     VARCHAR(256),
    host_employee_id  INT,
    purpose           VARCHAR(500),
    check_in_time     TIMESTAMPTZ     NOT NULL,
    check_out_time    TIMESTAMPTZ,
    badge_number      VARCHAR(50),
    national_id       VARCHAR(50),
    created_at        TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_visitor_logs_branches  FOREIGN KEY (branch_id)        REFERENCES branches(id),
    CONSTRAINT fk_visitor_logs_employees FOREIGN KEY (host_employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE INDEX ix_visitor_logs_branch_id    ON visitor_logs (branch_id);
CREATE INDEX ix_visitor_logs_check_in     ON visitor_logs (check_in_time DESC);

-- -----------------------------------------------
-- SEED: default company + admin employee
-- -----------------------------------------------
INSERT INTO companies (name, code) VALUES ('MATRIX Corp', 'MATRIX');

INSERT INTO branches (company_id, name, code, address)
VALUES (1, 'Head Office', 'HQ', 'Cairo, Egypt');

-- Password: Admin@123  (BCrypt hash)
INSERT INTO employees (company_id, branch_id, employee_code, first_name, last_name,
                        email, password_hash, role)
VALUES (1, 1, 'EMP-001', 'System', 'Admin',
        'admin@matrix.com',
        '$2a$11$K7rPbYHjAbHqKVGcqbqpheKT.VVpMJMGGEOOhpZ1h.VjYiDfklTHy',
        2);
