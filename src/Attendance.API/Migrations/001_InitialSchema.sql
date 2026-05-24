-- ============================================================
-- Attendance Management System – Initial Schema Migration
-- Target: SQL Server 2019+
-- ============================================================

-- -----------------------------------------------
-- 1. COMPANIES
-- -----------------------------------------------
CREATE TABLE Companies (
    Id          INT             IDENTITY(1,1) PRIMARY KEY,
    Name        NVARCHAR(200)   NOT NULL,
    Code        NVARCHAR(50)    NOT NULL,
    LogoUrl     NVARCHAR(500)   NULL,
    IsActive    BIT             NOT NULL DEFAULT 1,
    CreatedAt   DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT UQ_Companies_Code UNIQUE (Code)
);

-- -----------------------------------------------
-- 2. BRANCHES
-- -----------------------------------------------
CREATE TABLE Branches (
    Id          INT             IDENTITY(1,1) PRIMARY KEY,
    CompanyId   INT             NOT NULL,
    Name        NVARCHAR(200)   NOT NULL,
    Code        NVARCHAR(50)    NOT NULL,
    Address     NVARCHAR(500)   NULL,
    IsActive    BIT             NOT NULL DEFAULT 1,
    CreatedAt   DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Branches_Companies  FOREIGN KEY (CompanyId) REFERENCES Companies(Id),
    CONSTRAINT UQ_Branches_CompanyCode UNIQUE (CompanyId, Code)
);

CREATE INDEX IX_Branches_CompanyId ON Branches (CompanyId);

-- -----------------------------------------------
-- 3. EMPLOYEES
-- -----------------------------------------------
CREATE TABLE Employees (
    Id                  INT             IDENTITY(1,1) PRIMARY KEY,
    CompanyId           INT             NOT NULL,
    BranchId            INT             NOT NULL,
    EmployeeCode        NVARCHAR(50)    NOT NULL,
    FirstName           NVARCHAR(100)   NOT NULL,
    LastName            NVARCHAR(100)   NOT NULL,
    Email               NVARCHAR(256)   NOT NULL,
    PasswordHash        NVARCHAR(256)   NOT NULL,
    Phone               NVARCHAR(30)    NULL,
    Role                TINYINT         NOT NULL DEFAULT 0, -- 0=Employee, 1=Manager, 2=Admin
    ProfileImageUrl     NVARCHAR(500)   NULL,
    IsActive            BIT             NOT NULL DEFAULT 1,
    RefreshToken        NVARCHAR(256)   NULL,
    RefreshTokenExpiry  DATETIME2       NULL,
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Employees_Companies  FOREIGN KEY (CompanyId) REFERENCES Companies(Id),
    CONSTRAINT FK_Employees_Branches   FOREIGN KEY (BranchId)  REFERENCES Branches(Id),
    CONSTRAINT UQ_Employees_Email      UNIQUE (Email),
    CONSTRAINT UQ_Employees_Code       UNIQUE (EmployeeCode)
);

CREATE INDEX IX_Employees_CompanyId  ON Employees (CompanyId);
CREATE INDEX IX_Employees_BranchId   ON Employees (BranchId);
CREATE INDEX IX_Employees_IsActive   ON Employees (IsActive);

-- -----------------------------------------------
-- 4. ZK DEVICES
-- -----------------------------------------------
CREATE TABLE ZKDevices (
    Id              INT             IDENTITY(1,1) PRIMARY KEY,
    BranchId        INT             NOT NULL,
    DeviceSerial    NVARCHAR(100)   NOT NULL,
    DeviceName      NVARCHAR(200)   NOT NULL,
    DeviceKey       NVARCHAR(256)   NOT NULL,
    LastSyncAt      DATETIME2       NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_ZKDevices_Branches    FOREIGN KEY (BranchId) REFERENCES Branches(Id),
    CONSTRAINT UQ_ZKDevices_Serial      UNIQUE (DeviceSerial)
);

CREATE INDEX IX_ZKDevices_BranchId ON ZKDevices (BranchId);

-- -----------------------------------------------
-- 5. ATTENDANCE LOGS
-- -----------------------------------------------
CREATE TABLE AttendanceLogs (
    Id          BIGINT          IDENTITY(1,1) PRIMARY KEY,
    EmployeeId  INT             NOT NULL,
    BranchId    INT             NOT NULL,
    PunchType   TINYINT         NOT NULL, -- 0=CheckIn, 1=CheckOut
    PunchTime   DATETIME2       NOT NULL,
    Latitude    FLOAT           NULL,
    Longitude   FLOAT           NULL,
    Source      TINYINT         NOT NULL DEFAULT 0, -- 0=Mobile, 1=ZKDevice, 2=Manual
    DeviceId    INT             NULL,
    IsValid     BIT             NOT NULL DEFAULT 1,
    Notes       NVARCHAR(500)   NULL,
    CreatedAt   DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_AttendanceLogs_Employees  FOREIGN KEY (EmployeeId) REFERENCES Employees(Id),
    CONSTRAINT FK_AttendanceLogs_Branches   FOREIGN KEY (BranchId)   REFERENCES Branches(Id),
    CONSTRAINT FK_AttendanceLogs_ZKDevices  FOREIGN KEY (DeviceId)   REFERENCES ZKDevices(Id)
);

CREATE INDEX IX_AttendanceLogs_Employee_Time ON AttendanceLogs (EmployeeId, PunchTime DESC);
CREATE INDEX IX_AttendanceLogs_Branch_Time   ON AttendanceLogs (BranchId, PunchTime DESC);
CREATE INDEX IX_AttendanceLogs_PunchTime     ON AttendanceLogs (PunchTime DESC);

-- -----------------------------------------------
-- 6. DEVICE LOGS (raw ZK device entries)
-- -----------------------------------------------
CREATE TABLE DeviceLogs (
    Id                  BIGINT          IDENTITY(1,1) PRIMARY KEY,
    DeviceId            INT             NOT NULL,
    EmployeeCode        NVARCHAR(50)    NOT NULL,
    PunchTime           DATETIME2       NOT NULL,
    RawPunchType        INT             NOT NULL,
    IsSynced            BIT             NOT NULL DEFAULT 0,
    SyncedAt            DATETIME2       NULL,
    AttendanceLogId     BIGINT          NULL,
    CreatedAt           DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_DeviceLogs_ZKDevices      FOREIGN KEY (DeviceId)        REFERENCES ZKDevices(Id),
    CONSTRAINT FK_DeviceLogs_AttendanceLogs FOREIGN KEY (AttendanceLogId) REFERENCES AttendanceLogs(Id)
);

CREATE INDEX IX_DeviceLogs_Device_Time ON DeviceLogs (DeviceId, PunchTime DESC);
CREATE INDEX IX_DeviceLogs_IsSynced    ON DeviceLogs (IsSynced);

-- -----------------------------------------------
-- 7. GEO FENCES
-- -----------------------------------------------
CREATE TABLE GeoFences (
    Id              INT             IDENTITY(1,1) PRIMARY KEY,
    BranchId        INT             NOT NULL,
    Name            NVARCHAR(200)   NOT NULL,
    Latitude        FLOAT           NOT NULL,
    Longitude       FLOAT           NOT NULL,
    RadiusMeters    INT             NOT NULL DEFAULT 100,
    EnforceOnMobile BIT             NOT NULL DEFAULT 1,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_GeoFences_Branches FOREIGN KEY (BranchId) REFERENCES Branches(Id) ON DELETE CASCADE
);

CREATE INDEX IX_GeoFences_BranchId ON GeoFences (BranchId);

-- -----------------------------------------------
-- 8. VISITOR LOGS
-- -----------------------------------------------
CREATE TABLE VisitorLogs (
    Id              BIGINT          IDENTITY(1,1) PRIMARY KEY,
    BranchId        INT             NOT NULL,
    VisitorName     NVARCHAR(200)   NOT NULL,
    VisitorPhone    NVARCHAR(30)    NULL,
    VisitorEmail    NVARCHAR(256)   NULL,
    HostEmployeeId  INT             NULL,
    Purpose         NVARCHAR(500)   NULL,
    CheckInTime     DATETIME2       NOT NULL,
    CheckOutTime    DATETIME2       NULL,
    BadgeNumber     NVARCHAR(50)    NULL,
    NationalId      NVARCHAR(50)    NULL,
    CreatedAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_VisitorLogs_Branches  FOREIGN KEY (BranchId)       REFERENCES Branches(Id),
    CONSTRAINT FK_VisitorLogs_Employees FOREIGN KEY (HostEmployeeId) REFERENCES Employees(Id) ON DELETE SET NULL
);

CREATE INDEX IX_VisitorLogs_BranchId    ON VisitorLogs (BranchId);
CREATE INDEX IX_VisitorLogs_CheckInTime ON VisitorLogs (CheckInTime DESC);

-- -----------------------------------------------
-- SEED: default company + admin employee
-- -----------------------------------------------
INSERT INTO Companies (Name, Code) VALUES (N'MATRIX Corp', 'MATRIX');

INSERT INTO Branches (CompanyId, Name, Code, Address)
VALUES (1, N'Head Office', 'HQ', N'Cairo, Egypt');

-- Password: Admin@123  (BCrypt hash)
INSERT INTO Employees (CompanyId, BranchId, EmployeeCode, FirstName, LastName,
                        Email, PasswordHash, Role)
VALUES (1, 1, 'EMP-001', N'System', N'Admin',
        'admin@matrix.com',
        '$2a$11$K7rPbYHjAbHqKVGcqbqpheKT.VVpMJMGGEOOhpZ1h.VjYiDfklTHy', -- Admin@123
        2); -- Admin role
