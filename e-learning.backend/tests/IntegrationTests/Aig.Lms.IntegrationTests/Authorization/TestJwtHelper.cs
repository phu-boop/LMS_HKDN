using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Aig.Lms.IntegrationTests.Authorization;

/// <summary>
/// Generates signed JWTs using the dev secret — must match appsettings.Development.json.
/// </summary>
internal static class TestJwtHelper
{
    private const string SecretKey = "dev-super-secret-key-must-be-at-least-32-chars!!";
    private const string Issuer    = "aig-lms";
    private const string Audience  = "aig-lms-clients";

    public static string GenerateToken(Guid userId, params string[] roles)
        => GenerateToken(userId, tenantId: null, roles);

    public static string GenerateToken(Guid userId, Guid? tenantId, params string[] roles)
    {
        var key         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,        userId.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, "test-user"),
            new(JwtRegisteredClaimNames.Jti,        Guid.NewGuid().ToString()),
            new("tenant_id",                        (tenantId ?? Guid.NewGuid()).ToString()),
            new("school_id",                        Guid.NewGuid().ToString()),
            new("full_name",                        "Test User"),
        };

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer:             Issuer,
            audience:           Audience,
            claims:             claims,
            expires:            DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
