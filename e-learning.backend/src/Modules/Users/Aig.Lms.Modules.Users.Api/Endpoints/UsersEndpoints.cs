using Aig.Lms.Modules.Users.Application.Users;
using Aig.Lms.Modules.Users.Domain;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace Aig.Lms.Modules.Users.Api.Endpoints;

public static class UsersEndpoints
{
    public static IEndpointRouteBuilder MapUsersEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/users")
            .WithTags("Users")
            .RequireAuthorization();

        // GET /{id}
        group.MapGet("/{id:guid}", async (
            Guid id,
            [FromServices] IUsersRepository repository,
            CancellationToken ct) =>
        {
            var user = await repository.GetByIdAsync(id, ct);
            return user is null ? Results.NotFound() : Results.Ok(user);
        })
        .WithName("GetUserById")
        .WithSummary("Get a user by ID")
        .Produces<User>()
        .ProducesProblem(404)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:USERS_VIEW");

        // GET /  — filter by schoolId, tenantId, roleId, accountType, status, search
        group.MapGet("/", async (
            [FromQuery] Guid? schoolId,
            [FromQuery] Guid? tenantId,
            [FromQuery] Guid? roleId,
            [FromQuery] string? accountType,
            [FromQuery] int page,
            [FromQuery] int pageSize,
            [FromQuery] string? status,
            [FromQuery] string? search,
            [FromServices] IUsersRepository repository,
            CancellationToken ct) =>
        {
            var clampedPage = page < 1 ? 1 : page;
            var clampedSize = pageSize < 1 ? 20 : pageSize > 100 ? 100 : pageSize;

            var items = await repository.ListUsersAsync(schoolId, tenantId, roleId, clampedPage, clampedSize, status, search, accountType, ct);
            var total = await repository.CountUsersAsync(schoolId, tenantId, roleId, status, search, accountType, ct);

            return Results.Ok(new UserListResult(items, total, clampedPage, clampedSize));
        })
        .WithName("ListUsers")
        .WithSummary("List users with optional filters: school, tenant, role, accountType, status, search")
        .Produces<UserListResult>()
        .ProducesProblem(401)
        .RequireAuthorization("Permission:USERS_VIEW");

        // POST /  — create single user
        group.MapPost("/", async (
            HttpContext httpContext,
            [FromBody] CreateUserRequest body,
            [FromServices] CreateUserCommandHandler handler,
            CancellationToken ct) =>
        {
            var (actorId, ip, ua) = ExtractActor(httpContext);
            var command = new CreateUserCommand(
                SchoolId:    body.SchoolId,
                Username:    body.Username,
                Password:    body.Password,
                FullName:    body.FullName,
                Email:       body.Email,
                AvatarUrl:   body.AvatarUrl,
                AccountType: body.AccountType,
                RoleId:      body.RoleId,
                TenantId:    body.TenantId,
                ActorUserId: actorId,
                IpAddress:   ip,
                UserAgent:   ua);
            try
            {
                var result = await handler.HandleAsync(command, ct);
                return Results.Created($"/api/users/{result.UserId}", result);
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
        })
        .WithName("CreateUser")
        .WithSummary("Create a new user for a school")
        .Produces<CreateUserResult>(201)
        .ProducesProblem(400)
        .ProducesProblem(409)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:USERS_CREATE");

        // PUT /{id}  — update user info
        group.MapPut("/{id:guid}", async (
            Guid id,
            HttpContext httpContext,
            [FromBody] UpdateUserRequest body,
            [FromServices] UpdateUserCommandHandler handler,
            CancellationToken ct) =>
        {
            var (actorId, ip, ua) = ExtractActor(httpContext);
            var command = new UpdateUserCommand(id, body.FullName, body.Email, body.Status,
                AccountType: body.AccountType, AvatarUrl: body.AvatarUrl,
                ActorUserId: actorId, IpAddress: ip, UserAgent: ua);
            var result = await handler.HandleAsync(command, ct);

            return result is null
                ? Results.NotFound()
                : Results.Ok(result);
        })
        .WithName("UpdateUser")
        .WithSummary("Update user profile (fullName, email, status)")
        .Produces<UpdateUserResult>()
        .ProducesProblem(404)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:USERS_UPDATE");

        // PATCH /{id}/status
        group.MapPatch("/{id:guid}/status", async (
            Guid id,
            HttpContext httpContext,
            [FromBody] ChangeStatusRequest body,
            [FromServices] ChangeUserStatusCommandHandler handler,
            CancellationToken ct) =>
        {
            var (actorId, ip, ua) = ExtractActor(httpContext);
            var command = new ChangeUserStatusCommand(id, body.Status,
                ActorUserId: actorId, IpAddress: ip, UserAgent: ua);
            var updated = await handler.HandleAsync(command, ct);
            return updated ? Results.NoContent() : Results.NotFound();
        })
        .WithName("ChangeUserStatus")
        .WithSummary("Change user status: ACTIVE | INACTIVE | LOCKED | DISABLED")
        .Produces(204)
        .ProducesProblem(404)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:USERS_CHANGE_STATUS");

        // DELETE /{id}
        group.MapDelete("/{id:guid}", async (
            Guid id,
            [FromServices] IUsersRepository repository,
            CancellationToken ct) =>
        {
            var deleted = await repository.SoftDeleteAsync(id, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .WithName("DeleteUser")
        .WithSummary("Soft-delete a user (is_deleted = true, status = DELETED) — irreversible via API")
        .Produces(204)
        .ProducesProblem(404)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:USERS_DELETE");

        // PATCH /{id}/avatar
        group.MapPatch("/{id:guid}/avatar", async (
            Guid id,
            [FromBody] UpdateAvatarRequest body,
            [FromServices] IUsersRepository repository,
            CancellationToken ct) =>
        {
            var updated = await repository.UpdateAvatarAsync(id, body.AvatarUrl, ct);
            return updated ? Results.NoContent() : Results.NotFound();
        })
        .WithName("UpdateAvatar")
        .WithSummary("Update user avatar URL")
        .Produces(204)
        .ProducesProblem(404)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:USERS_UPDATE");

        // POST /{id}/reset-password
        group.MapPost("/{id:guid}/reset-password", async (
            Guid id,
            HttpContext httpContext,
            [FromBody] ResetPasswordRequest body,
            [FromServices] ResetPasswordCommandHandler handler,
            CancellationToken ct) =>
        {
            var (actorId, ip, ua) = ExtractActor(httpContext);
            var command = new ResetPasswordCommand(id, body.NewPassword,
                ActorUserId: actorId, IpAddress: ip, UserAgent: ua);
            try
            {
                var updated = await handler.HandleAsync(command, ct);
                return updated ? Results.NoContent() : Results.NotFound();
            }
            catch (ArgumentException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        })
        .WithName("ResetUserPassword")
        .WithSummary("Admin resets a user's password. Also clears failed login count and lock.")
        .Produces(204)
        .ProducesProblem(400)
        .ProducesProblem(404)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:USERS_UPDATE");

        // GET /import/template  — download Excel template
        group.MapGet("/import/template", (HttpContext httpContext) =>
        {
            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("Users");

            // Header row
            ws.Cell(1, 1).Value = "Username";
            ws.Cell(1, 2).Value = "Password";
            ws.Cell(1, 3).Value = "FullName";
            ws.Cell(1, 4).Value = "Email";
            ws.Cell(1, 5).Value = "AvatarUrl";
            ws.Cell(1, 6).Value = "RoleCode";

            // Bold header
            var headerRow = ws.Row(1);
            headerRow.Style.Font.Bold = true;

            // Sample data row
            ws.Cell(2, 1).Value = "john.doe";
            ws.Cell(2, 2).Value = "P@ssw0rd!";
            ws.Cell(2, 3).Value = "John Doe";
            ws.Cell(2, 4).Value = "john.doe@example.com";
            ws.Cell(2, 5).Value = "";
            ws.Cell(2, 6).Value = "SCHOOL";

            ws.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            wb.SaveAs(stream);
            stream.Position = 0;

            return Results.File(
                stream.ToArray(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "users_import_template.xlsx");
        })
        .WithName("GetImportTemplate")
        .WithSummary("Download the standard Excel template for bulk user import")
        .Produces<IResult>(200)
        .RequireAuthorization("Permission:USERS_CREATE");

        // POST /import  — bulk import from Excel
        group.MapPost("/import", async (
            HttpContext httpContext,
            [FromQuery] Guid schoolId,
            [FromQuery] Guid? tenantId,
            [FromServices] BulkImportUsersCommandHandler handler,
            CancellationToken ct) =>
        {
            if (!httpContext.Request.HasFormContentType || !httpContext.Request.Form.Files.Any())
                return Results.BadRequest(new { error = "An Excel file must be uploaded as multipart/form-data." });

            var file = httpContext.Request.Form.Files[0];
            if (file.Length == 0)
                return Results.BadRequest(new { error = "Uploaded file is empty." });

            List<ImportUserRow> rows;
            try
            {
                rows = ParseExcel(file.OpenReadStream());
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { error = $"Failed to parse Excel file: {ex.Message}" });
            }

            if (rows.Count == 0)
                return Results.BadRequest(new { error = "No data rows found in the Excel file." });

            var (actorId, ip, ua) = ExtractActor(httpContext);
            var command = new BulkImportUsersCommand(
                Rows:        rows,
                SchoolId:    schoolId,
                TenantId:    tenantId,
                ActorUserId: actorId,
                IpAddress:   ip,
                UserAgent:   ua);

            var result = await handler.HandleAsync(command, ct);
            return Results.Ok(result);
        })
        .WithName("BulkImportUsers")
        .WithSummary("Bulk import users from an Excel file (.xlsx). Returns per-row success/failure report.")
        .Produces<BulkImportUsersResult>()
        .ProducesProblem(400)
        .ProducesProblem(401)
        .DisableAntiforgery()
        .RequireAuthorization("Permission:USERS_CREATE");

        // ── 2.6 — User-Tenant Management ──────────────────────────────────────

        // GET /api/admin/users/{id}/tenants
        group.MapGet("/{id:guid}/tenants", async (
            Guid id,
            [FromServices] GetUserTenantsQueryHandler handler,
            CancellationToken ct) =>
        {
            var tenants = await handler.HandleAsync(new GetUserTenantsQuery(id), ct);
            return Results.Ok(tenants);
        })
        .WithName("GetUserTenants")
        .WithSummary("List tenant assignments for a user (inherited + manual)")
        .Produces<IReadOnlyList<UserTenantDto>>()
        .ProducesProblem(401)
        .RequireAuthorization("Permission:USERS_VIEW");

        // POST /api/admin/users/{id}/tenants
        group.MapPost("/{id:guid}/tenants", async (
            Guid id,
            [FromBody] AssignUserTenantRequest req,
            [FromServices] AssignUserTenantCommandHandler handler,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var (actorId, ip, ua) = ExtractActor(ctx);
            var assigned = await handler.HandleAsync(
                new AssignUserTenantCommand(id, req.TenantId, req.RoleCode, actorId, ip, ua), ct);

            return assigned ? Results.Ok() : Results.Conflict("Tenant already assigned with this role.");
        })
        .WithName("AssignUserTenant")
        .WithSummary("Manually assign a tenant+role to a user")
        .ProducesProblem(401)
        .ProducesProblem(409)
        .RequireAuthorization("Permission:ROLES_ASSIGN");

        // DELETE /api/admin/users/{id}/tenants/{tenantId}
        group.MapDelete("/{id:guid}/tenants/{tenantId:guid}", async (
            Guid id,
            Guid tenantId,
            [FromServices] RemoveUserTenantCommandHandler handler,
            HttpContext ctx,
            CancellationToken ct) =>
        {
            var (actorId, ip, ua) = ExtractActor(ctx);
            var removed = await handler.HandleAsync(
                new RemoveUserTenantCommand(id, tenantId, actorId, ip, ua), ct);

            return removed ? Results.NoContent() : Results.NotFound();
        })
        .WithName("RemoveUserTenant")
        .WithSummary("Revoke a tenant assignment from a user")
        .ProducesProblem(401)
        .ProducesProblem(404)
        .RequireAuthorization("Permission:ROLES_REVOKE");

        // ── 2.7 — Users by School ──────────────────────────────────────────────

        // GET /api/admin/schools/{schoolId}/users  (mounted here for DI convenience)
        app.MapGet("/api/admin/schools/{schoolId:guid}/users", async (
            Guid schoolId,
            [FromQuery] int page,
            [FromQuery] int pageSize,
            [FromQuery] string? status,
            [FromQuery] string? search,
            [FromQuery] string? accountType,
            [FromServices] GetSchoolUsersQueryHandler handler,
            CancellationToken ct) =>
        {
            var clampedPage = page < 1 ? 1 : page;
            var clampedSize = pageSize < 1 ? 20 : pageSize > 100 ? 100 : pageSize;

            var (items, total) = await handler.HandleAsync(
                new GetSchoolUsersQuery(schoolId, clampedPage, clampedSize, status, search, accountType), ct);

            return Results.Ok(new UserListResult(items, total, clampedPage, clampedSize));
        })
        .WithTags("Schools", "Users")
        .WithName("GetSchoolUsers")
        .WithSummary("List users belonging to a school")
        .Produces<UserListResult>()
        .ProducesProblem(401)
        .RequireAuthorization("Permission:USERS_VIEW");

        // ── Tenant members ────────────────────────────────────────────────────
        // GET /api/admin/tenants/{tenantId}/members
        var tenantGroup = app.MapGroup("/api/admin/tenants")
            .WithTags("Users")
            .RequireAuthorization();

        tenantGroup.MapGet("/{tenantId:guid}/members", async (
            Guid tenantId,
            [FromQuery] string? search,
            [FromQuery] int page     = 1,
            [FromQuery] int pageSize = 20,
            [FromServices] GetTenantMembersQueryHandler handler = default!,
            CancellationToken ct = default) =>
        {
            var (items, total) = await handler.HandleAsync(
                new GetTenantMembersQuery(tenantId, search, page, pageSize), ct);

            return Results.Ok(new { items, total, page, pageSize });
        })
        .WithName("GetTenantMembers")
        .WithSummary("List all users assigned to a tenant with their roles (for the tenant role management screen)")
        .Produces<object>()
        .ProducesProblem(401)
        .RequireAuthorization("Permission:USERS_VIEW");

        return app;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static (Guid? ActorId, string? Ip, string? UserAgent) ExtractActor(HttpContext ctx)
    {
        var sub = ctx.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var actorId = Guid.TryParse(sub, out var g) ? (Guid?)g : null;
        var ip = ctx.Connection.RemoteIpAddress?.ToString();
        var ua = ctx.Request.Headers["User-Agent"].ToString();
        return (actorId, ip, ua);
    }

    private static List<ImportUserRow> ParseExcel(Stream stream)
    {
        using var wb = new XLWorkbook(stream);
        var ws = wb.Worksheets.First();

        var rows = new List<ImportUserRow>();
        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;

        for (int r = 2; r <= lastRow; r++) // skip header
        {
            var row = ws.Row(r);

            // Skip completely empty rows
            if (row.IsEmpty()) continue;

            rows.Add(new ImportUserRow(
                RowNumber: r,
                Username:  row.Cell(1).GetValue<string>().Trim().NullIfEmpty(),
                Password:  row.Cell(2).GetValue<string>().Trim().NullIfEmpty(),
                FullName:  row.Cell(3).GetValue<string>().Trim().NullIfEmpty(),
                Email:     row.Cell(4).GetValue<string>().Trim().NullIfEmpty(),
                AvatarUrl: row.Cell(5).GetValue<string>().Trim().NullIfEmpty(),
                RoleCode:  row.Cell(6).GetValue<string>().Trim().NullIfEmpty()));
        }

        return rows;
    }
}

// ─── Request / Response Models ────────────────────────────────────────────────

public sealed record CreateUserRequest(
    Guid? SchoolId,
    string Username,
    string Password,
    string FullName,
    string AccountType,  // Required: One of: LMS_ADMIN, TENANT_ADMIN, SCHOOL
    string? Email = null,
    string? AvatarUrl = null,
    Guid? RoleId = null,
    Guid? TenantId = null);

public sealed record AssignUserTenantRequest(Guid TenantId, string RoleCode);

public sealed record UpdateUserRequest(
    string FullName,
    string? Email,
    string Status,
    string? AccountType = null,
    string? AvatarUrl = null);
public sealed record ChangeStatusRequest(string Status);
public sealed record UpdateAvatarRequest(string AvatarUrl);
public sealed record ResetPasswordRequest(string NewPassword);
public sealed record UserListResult(IReadOnlyList<User> Items, int TotalCount, int Page, int PageSize);

internal static class StringExtensions
{
    internal static string? NullIfEmpty(this string? s) =>
        string.IsNullOrWhiteSpace(s) ? null : s;
}
