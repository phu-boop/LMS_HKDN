using Aig.Lms.Api.Endpoints;
using Aig.Lms.Api.Extensions;
using Aig.Lms.Modules.AuditLogs.Api.Endpoints;
using Aig.Lms.Modules.Authorization.Api.Endpoints;
using Aig.Lms.Modules.Catalog.Api.Endpoints;
using Aig.Lms.Modules.ContentManagement.Api.Endpoints;
using Aig.Lms.Modules.Identity.Api.Endpoints;
using Aig.Lms.Modules.Reports.Api.Endpoints;
using Aig.Lms.Modules.Schools.Api.Endpoints;
using Aig.Lms.Modules.Tenancy.Api.Endpoints;
using Aig.Lms.Modules.Users.Api.Endpoints;
using Microsoft.AspNetCore.Builder;

namespace Aig.Lms.Api;

/// <summary>
/// Central registry of all API endpoints.
/// To add a new module: call app.Map{Module}Endpoints() here.
/// </summary>
public static class AllEndpoints
{
    public static WebApplication MapAllEndpoints(this WebApplication app)
    {
        // Infrastructure
        app.MapHealthEndpoints();
        app.MapApiDocs();

        // === Modules ===
        // Identity — POST /api/identity/auth/login
        app.MapAuthEndpoints();
        app.MapWorkspaceEndpoints();

        // Tenancy — /api/admin/tenants
        app.MapTenantEndpoints();

        // Users — /api/admin/users
        app.MapUsersEndpoints();

        // AuditLogs — /api/admin/audit-logs
        app.MapAuditLogsEndpoints();

        // Authorization — /api/authorization
        app.MapAuthorizationEndpoints();

        // Schools — /api/admin/schools
        app.MapSchoolsEndpoints();

        // Catalog — /api/admin/catalog
        app.MapCatalogEndpoints();

        // Provinces & Wards — /api/provinces
        app.MapProvinceWardEndpoints();

        // Content Management — /api/tenants/{tenantId}/curriculum
        app.MapContentManagementEndpoints();

        // Content Delivery — /api/client/contents/{contentId}/stream-url|view-url|download-url
        app.MapClientCurriculumEndpoints();
        app.MapClientDashboardEndpoints();
        app.MapClientFavoritesEndpoints();
        app.MapClientContentCommentEndpoints();
        app.MapTenantCommentEndpoints();
        app.MapTenantDashboardEndpoints();
        app.MapMediaSignedUrlEndpoints();

        // Reports — /api/admin/reports
        app.MapReportEndpoints();
        app.MapAdminDashboardEndpoints();

        return app;
    }
}
