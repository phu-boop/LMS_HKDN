using Aig.Lms.Modules.Reports.Domain;

namespace Aig.Lms.Modules.Reports.Application.Interfaces;

public interface IReportRepository
{
    Task<Report> GetOverviewAsync(CancellationToken ct = default);
    Task<ActiveSessionResult> GetActiveSessionsAsync(CancellationToken ct = default);
}
