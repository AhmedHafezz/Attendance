using Attendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Attendance.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<AttendanceLog> AttendanceLogs => Set<AttendanceLog>();
    public DbSet<ZKDevice> ZKDevices => Set<ZKDevice>();
    public DbSet<DeviceLog> DeviceLogs => Set<DeviceLog>();
    public DbSet<GeoFence> GeoFences => Set<GeoFence>();
    public DbSet<VisitorLog> VisitorLogs => Set<VisitorLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Company>(e =>
        {
            e.HasIndex(c => c.Code).IsUnique();
            e.Property(c => c.Name).HasMaxLength(200).IsRequired();
            e.Property(c => c.Code).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<Branch>(e =>
        {
            e.HasIndex(b => new { b.CompanyId, b.Code }).IsUnique();
            e.Property(b => b.Name).HasMaxLength(200).IsRequired();
            e.Property(b => b.Code).HasMaxLength(50).IsRequired();
            e.HasOne(b => b.Company).WithMany(c => c.Branches).HasForeignKey(b => b.CompanyId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Employee>(e =>
        {
            e.HasIndex(emp => emp.Email).IsUnique();
            e.HasIndex(emp => emp.EmployeeCode).IsUnique();
            e.Property(emp => emp.Email).HasMaxLength(256).IsRequired();
            e.Property(emp => emp.EmployeeCode).HasMaxLength(50).IsRequired();
            e.Property(emp => emp.FirstName).HasMaxLength(100).IsRequired();
            e.Property(emp => emp.LastName).HasMaxLength(100).IsRequired();
            e.HasOne(emp => emp.Company).WithMany(c => c.Employees).HasForeignKey(emp => emp.CompanyId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(emp => emp.Branch).WithMany(b => b.Employees).HasForeignKey(emp => emp.BranchId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AttendanceLog>(e =>
        {
            e.HasIndex(a => new { a.EmployeeId, a.PunchTime });
            e.HasIndex(a => a.PunchTime);
            e.HasOne(a => a.Employee).WithMany(emp => emp.AttendanceLogs).HasForeignKey(a => a.EmployeeId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.Branch).WithMany(b => b.AttendanceLogs).HasForeignKey(a => a.BranchId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(a => a.Device).WithMany(d => d.AttendanceLogs).HasForeignKey(a => a.DeviceId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ZKDevice>(e =>
        {
            e.HasIndex(d => d.DeviceSerial).IsUnique();
            e.Property(d => d.DeviceSerial).HasMaxLength(100).IsRequired();
            e.Property(d => d.DeviceName).HasMaxLength(200).IsRequired();
            e.Property(d => d.DeviceKey).HasMaxLength(256).IsRequired();
            e.HasOne(d => d.Branch).WithMany(b => b.ZKDevices).HasForeignKey(d => d.BranchId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DeviceLog>(e =>
        {
            e.HasIndex(dl => new { dl.DeviceId, dl.PunchTime });
            e.HasIndex(dl => dl.IsSynced);
            e.Property(dl => dl.EmployeeCode).HasMaxLength(50).IsRequired();
            e.HasOne(dl => dl.Device).WithMany(d => d.DeviceLogs).HasForeignKey(dl => dl.DeviceId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<GeoFence>(e =>
        {
            e.Property(g => g.Name).HasMaxLength(200).IsRequired();
            e.HasOne(g => g.Branch).WithMany(b => b.GeoFences).HasForeignKey(g => g.BranchId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<VisitorLog>(e =>
        {
            e.Property(v => v.VisitorName).HasMaxLength(200).IsRequired();
            e.HasOne(v => v.Branch).WithMany(b => b.VisitorLogs).HasForeignKey(v => v.BranchId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(v => v.HostEmployee).WithMany(emp => emp.HostedVisitors).HasForeignKey(v => v.HostEmployeeId).OnDelete(DeleteBehavior.SetNull);
        });
    }
}
