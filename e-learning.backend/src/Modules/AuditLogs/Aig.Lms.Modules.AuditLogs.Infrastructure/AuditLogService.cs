using System.Text.Json;
using System.Text.Json.Nodes;
using Aig.Lms.BuildingBlocks.Application.Abstractions;
using Dapper;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Aig.Lms.Modules.AuditLogs.Infrastructure;

public sealed class AuditLogService : IAuditLogService
{
    private readonly string _connectionString;

    public AuditLogService(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
    }

    public async Task LogAsync(AuditLogEntry entry, CancellationToken ct = default)
    {
        var metadata = BuildMetadata(entry);

        const string sql = """
            INSERT INTO audit_log
                (tenant_id, school_id, user_id, action, entity_type, entity_id, metadata)
            VALUES
                (@TenantId, @SchoolId, @ActorUserId, @Action, @EntityType, @EntityId,
                 CASE WHEN @Metadata IS NULL THEN NULL ELSE @Metadata::jsonb END)
            """;

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.ExecuteAsync(new CommandDefinition(sql, new
        {
            entry.TenantId,
            entry.SchoolId,
            entry.ActorUserId,
            entry.Action,
            entry.EntityType,
            entry.EntityId,
            Metadata = metadata
        }, cancellationToken: ct));
    }

    private static string? BuildMetadata(AuditLogEntry entry)
    {
        if (string.IsNullOrWhiteSpace(entry.Metadata)
            && string.IsNullOrWhiteSpace(entry.IpAddress)
            && string.IsNullOrWhiteSpace(entry.UserAgent))
        {
            return null;
        }

        JsonObject metadata = new();

        if (!string.IsNullOrWhiteSpace(entry.Metadata))
        {
            try
            {
                var parsed = JsonNode.Parse(entry.Metadata);
                if (parsed is JsonObject jsonObject)
                {
                    metadata = jsonObject;
                }
                else if (parsed is not null)
                {
                    metadata["payload"] = parsed;
                }
            }
            catch (JsonException)
            {
                metadata["rawMetadata"] = entry.Metadata;
            }
        }

        if (!string.IsNullOrWhiteSpace(entry.IpAddress))
            metadata["ipAddress"] = entry.IpAddress;

        if (!string.IsNullOrWhiteSpace(entry.UserAgent))
            metadata["userAgent"] = entry.UserAgent;

        return metadata.ToJsonString();
    }
}
