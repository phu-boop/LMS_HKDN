using Aig.Lms.BuildingBlocks.Contracts.Tenancy;
using Aig.Lms.Modules.Identity.Application.Auth;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;

namespace Aig.Lms.Modules.Identity.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/identity/identify", async (
            [FromBody] IdentifyRequest body,
            [FromServices] IdentifyCommandHandler handler,
            CancellationToken ct) =>
        {
            var (result, error) = await handler.HandleAsync(new IdentifyCommand(body.Identifier), ct);

            if (error is not null)
            {
                return error.Code switch
                {
                    "VALIDATION_ERROR" => Results.Json(error, statusCode: 400),
                    _ => Results.Json(error, statusCode: 401)
                };
            }

            return Results.Ok(result);
        })
        .WithTags("Identity")
        .WithName("Identify")
        .WithSummary("Identifier-first lookup — returns nextStep and tenant branding; always responds without revealing user existence")
        .Produces<IdentifyResult>()
        .Produces<IdentifyError>(400)
        .AllowAnonymous();

        var group = app.MapGroup("/api/identity/auth")
            .WithTags("Auth");

        // POST /api/identity/auth/login
        group.MapPost("/login", async (
            [FromBody] LoginCommand command,
            [FromServices] LoginCommandHandler handler,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var enriched = command with
            {
                Domain = command.Domain ?? httpContext.Request.Host.Value,
                UserAgent = string.IsNullOrEmpty(command.UserAgent)
                    ? httpContext.Request.Headers.UserAgent.ToString()
                    : command.UserAgent,
                IpAddress = string.IsNullOrEmpty(command.IpAddress)
                    ? httpContext.Connection.RemoteIpAddress?.ToString()
                    : command.IpAddress
            };

            var (result, error) = await handler.HandleAsync(enriched, ct);

            if (error is not null)
            {
                return error.Code switch
                {
                    "VALIDATION_ERROR" => Results.Json(error, statusCode: 400),
                    "TEMPORARILY_LOCKED" => Results.Json(error, statusCode: 429),
                    "ACCOUNT_LOCKED" or "ACCOUNT_DISABLED" or "ACCOUNT_INACTIVE" or "TENANT_NOT_ASSIGNED"
                        or "CONCURRENT_SESSION_LIMIT" or "SCHOOL_CONTRACT_EXPIRED"
                        => Results.Json(error, statusCode: 403),
                    _ => Results.Json(error, statusCode: 401)
                };
            }

            return Results.Ok(result);
        })
        .WithName("Login")
        .WithSummary("Login — returns JWT access token + refresh token")
        .Produces<LoginResult>()
        .Produces<LoginError>(400)
        .Produces<LoginError>(401)
        .Produces<LoginError>(403)
        .Produces<LoginError>(429)
        .AllowAnonymous();

        // POST /api/identity/auth/refresh
        group.MapPost("/refresh", async (
            [FromBody] RefreshTokenRequest body,
            [FromServices] RefreshTokenCommandHandler handler,
            CancellationToken ct) =>
        {
            var (result, error) = await handler.HandleAsync(new RefreshTokenCommand(body.RefreshToken), ct);

            return error is not null
                ? Results.Json(error, statusCode: 401)
                : Results.Ok(result);
        })
        .WithName("RefreshToken")
        .WithSummary("Exchange a valid refresh token for a new access token + rotated refresh token")
        .Produces<LoginResult>()
        .Produces<LoginError>(401)
        .AllowAnonymous();

        // POST /api/identity/auth/logout
        group.MapPost("/logout", async (
            [FromBody] LogoutRequest body,
            [FromServices] LogoutCommandHandler handler,
            CancellationToken ct) =>
        {
            await handler.HandleAsync(new LogoutCommand(body.RefreshToken), ct);
            return Results.NoContent();
        })
        .WithName("Logout")
        .WithSummary("Revoke the refresh token session (logout)")
        .Produces(204)
        .AllowAnonymous();

        // POST /api/identity/auth/change-password
        group.MapPost("/change-password", async (
            [FromBody] ChangePasswordRequest body,
            [FromServices] ChangePasswordCommandHandler handler,
            ClaimsPrincipal user,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var ipAddress = httpContext.Connection.RemoteIpAddress?.ToString();
            var userAgent = httpContext.Request.Headers.UserAgent.ToString();
            var command = new ChangePasswordCommand(
                userId,
                body.CurrentPassword,
                body.NewPassword,
                body.RefreshToken,
                ipAddress,
                userAgent);
            var result = await handler.HandleAsync(command, ct);

            return result.Succeeded
                ? Results.Ok(new { message = "Password changed successfully.", revokedSessionCount = result.RevokedSessionCount })
                : Results.BadRequest(new { error = result.Error });
        })
        .WithName("ChangePassword")
        .WithSummary("Change the current user's password — revokes all other active sessions")
        .Produces(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .RequireAuthorization();

        // POST /api/identity/auth/reset-password
        group.MapPost("/reset-password", async (
            [FromBody] ResetPasswordRequest body,
            [FromServices] ResetPasswordCommandHandler handler,
            CancellationToken ct) =>
        {
            var command = new ResetPasswordCommand(body.UserId, body.NewPassword);
            var result = await handler.HandleAsync(command, ct);

            return result.Succeeded
                ? Results.Ok(new { message = "Password has been reset. All active sessions revoked." })
                : Results.BadRequest(new { error = result.Error });
        })
        .WithName("ResetPassword")
        .WithSummary("Admin reset a user's password — revokes all sessions, forces re-login")
        .Produces(200)
        .ProducesProblem(400)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:USERS_UPDATE");

        // GET /api/identity/auth/sessions — current user's active sessions
        group.MapGet("/sessions", async (
            [FromServices] GetSessionsQueryHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var sessions = await handler.HandleAsync(new GetSessionsQuery(userId, ActiveOnly: true), ct);
            return Results.Ok(sessions);
        })
        .WithName("GetMySessions")
        .WithSummary("List all active sessions for the current user")
        .Produces<IReadOnlyList<SessionDto>>()
        .RequireAuthorization();

        // DELETE /api/identity/auth/sessions/{sessionId} — revoke own session
        group.MapDelete("/sessions/{sessionId:guid}", async (
            Guid sessionId,
            [FromServices] RevokeSessionCommandHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await handler.HandleAsync(new RevokeSessionCommand(sessionId, userId, IsAdmin: false), ct);

            return result.Succeeded
                ? Results.NoContent()
                : Results.NotFound(new { error = result.Error });
        })
        .WithName("RevokeMySession")
        .WithSummary("Revoke one of the current user's own sessions")
        .Produces(204)
        .ProducesProblem(404)
        .RequireAuthorization();

        // DELETE /api/identity/auth/sessions — logout everywhere (revoke all other sessions, keep current)
        group.MapDelete("/sessions", async (
            [FromBody] RevokeAllOtherSessionsRequest body,
            [FromServices] RevokeAllOtherSessionsCommandHandler handler,
            ClaimsPrincipal user,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var userId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await handler.HandleAsync(new RevokeAllOtherSessionsCommand(
                UserId: userId,
                CurrentRefreshToken: body.RefreshToken,
                IpAddress: httpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent: httpContext.Request.Headers.UserAgent.ToString()), ct);

            return Results.Ok(new { revokedCount = result.RevokedCount });
        })
        .WithName("RevokeAllOtherSessions")
        .WithSummary("Logout everywhere — revoke all other active sessions, keep current session")
        .Produces(200)
        .RequireAuthorization();

        // GET /api/identity/auth/admin/sessions/{userId} — admin: list all sessions for a user
        group.MapGet("/admin/sessions/{userId:guid}", async (
            Guid userId,
            [FromQuery] bool activeOnly,
            [FromServices] GetSessionsQueryHandler handler,
            CancellationToken ct) =>
        {
            var sessions = await handler.HandleAsync(new GetSessionsQuery(userId, activeOnly), ct);
            return Results.Ok(sessions);
        })
        .WithName("AdminGetUserSessions")
        .WithSummary("Admin: list sessions for any user (active or full history)")
        .Produces<IReadOnlyList<SessionDto>>()
        .RequireAuthorization("Permission:USERS_UPDATE");

        // DELETE /api/identity/auth/admin/sessions/{sessionId} — admin: revoke any session
        group.MapDelete("/admin/sessions/{sessionId:guid}", async (
            Guid sessionId,
            [FromServices] RevokeSessionCommandHandler handler,
            ClaimsPrincipal user,
            CancellationToken ct) =>
        {
            var adminId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await handler.HandleAsync(new RevokeSessionCommand(sessionId, adminId, IsAdmin: true), ct);

            return result.Succeeded
                ? Results.NoContent()
                : Results.NotFound(new { error = result.Error });
        })
        .WithName("AdminRevokeSession")
        .WithSummary("Admin: force-revoke any user session")
        .Produces(204)
        .ProducesProblem(404)
        .RequireAuthorization("Permission:USERS_UPDATE");

        // DELETE /api/identity/auth/admin/sessions/users/{userId} — admin: revoke ALL sessions of a user
        group.MapDelete("/admin/sessions/users/{userId:guid}", async (
            Guid userId,
            [FromServices] AdminRevokeAllUserSessionsCommandHandler handler,
            ClaimsPrincipal admin,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var adminId = Guid.Parse(admin.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await handler.HandleAsync(new AdminRevokeAllUserSessionsCommand(
                TargetUserId: userId,
                AdminId: adminId,
                IpAddress: httpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent: httpContext.Request.Headers.UserAgent.ToString()), ct);

            return result.Succeeded
                ? Results.NoContent()
                : Results.NotFound(new { error = result.Error });
        })
        .WithName("AdminRevokeAllUserSessions")
        .WithSummary("Admin: force-revoke ALL active sessions for a specific user")
        .Produces(204)
        .ProducesProblem(404)
        .RequireAuthorization("Permission:USERS_UPDATE");

        return app;
    }
}

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword, string? RefreshToken = null);
public sealed record IdentifyRequest(string Identifier, string? Domain = null);
public sealed record RefreshTokenRequest(string RefreshToken);
public sealed record LogoutRequest(string RefreshToken);
public sealed record ResetPasswordRequest(Guid UserId, string NewPassword);
public sealed record RevokeAllOtherSessionsRequest(string RefreshToken);
