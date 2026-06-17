namespace Attendance.API.DTOs.Cosec;

public class CosecPunchEntry
{
    // Local (device timezone) timestamp, exactly as reported by COSEC — not yet converted to UTC.
    public DateTime PunchTime { get; set; }

    // Special Function ID reported by COSEC for this punch slot (1=Official In,2=Official Out,
    // 3=ShortLeave In,4=ShortLeave Out,5=Regular In,6=Regular Out,7=Lunch In,8=Lunch Out,
    // 9=Overtime In,10=Overtime Out). 0 when not reported.
    public int SpfId { get; set; }
}

public class CosecAttendanceRecord
{
    public string UserId { get; set; } = string.Empty;
    public List<CosecPunchEntry> Punches { get; set; } = [];
}

public class CosecSyncResult
{
    public int RecordsFetched { get; set; }
    public int PunchesProcessed { get; set; }
    public int PunchesSkipped { get; set; }
    public List<string> Errors { get; set; } = [];
}
