using System.Security.Claims;
using Aig.Lms.Modules.Identity.Application.Auth;
using Npgsql;
using Dapper;
using Microsoft.Extensions.Configuration;

namespace Aig.Lms.Api.Middleware;

/// <summary>
/// Middleware to check if the user's session has been revoked.
/// Reads the session_id claim from JWT and validates against the database.
/// Returns 401 Unauthorized if session is REVOKED or not found.
/// </summary>
public class SessionRevocationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SessionRevocationMiddleware> _logger;

    public SessionRevocationMiddleware(
        RequestDelegate next,
        IConfiguration configuration,
        ILogger<SessionRevocationMiddleware> logger)
    {
        _next = next;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Only check authenticated requests
        if (context.User?.Identity?.IsAuthenticated != true)
        {
            await _next(context);
            return;
        }

        // Extract session_id claim
        var sessionIdClaim = context.User.FindFirst("session_id");
        if (sessionIdClaim is null)
        {
            // No session_id claim, allow through (might be legacy tokens or public endpoints)
            _logger.LogDebug("No session_id claim found in token");
            await _next(context);
            return;
        }

        if (!Guid.TryParse(sessionIdClaim.Value, out var sessionId))
        {
            _logger.LogWarning("Invalid session_id format: {SessionId}", sessionIdClaim.Value);
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "Invalid session." });
            return;
        }

        // Check if session is still active
        var isSessionActive = await IsSessionActiveAsync(sessionId);
        if (!isSessionActive)
        {
            _logger.LogInformation(
                "Session {SessionId} for user {UserId} has been revoked",
                sessionId,
                context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsJsonAsync(new { error = "Your session has been revoked. Please log in again." });
            return;
        }

        await _next(context);
    }

    private async Task<bool> IsSessionActiveAsync(Guid sessionId)
    {
        try
        {
            var connectionString = _configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

            const string sql = """
                SELECT status::TEXT
                FROM user_session
                WHERE id = @SessionId
                LIMIT 1
                """;

            await using var conn = new NpgsqlConnection(connectionString);
            var status = await conn.QueryFirstOrDefaultAsync<string?>(
                new CommandDefinition(sql, new { SessionId = sessionId }));

            return status == "ACTIVE";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking session status for session {SessionId}", sessionId);
            // On database error, deny access for security
            return false;
        }
    }
}

/// <summary>
/// Extension method to add SessionRevocationMiddleware to the pipeline.
/// </summary>
public static class SessionRevocationMiddlewareExtensions
{
    public static IApplicationBuilder UseSessionRevocation(this IApplicationBuilder app)
    {
        return app.UseMiddleware<SessionRevocationMiddleware>();
    }
}
