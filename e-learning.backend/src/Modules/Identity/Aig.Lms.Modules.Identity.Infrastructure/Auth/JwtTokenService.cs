using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Aig.Lms.Modules.Identity.Application.Auth;
using Aig.Lms.Modules.Identity.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Aig.Lms.Modules.Identity.Infrastructure.Auth;

public sealed class JwtTokenService : ITokenService
{
    private readonly JwtSettings _settings;

    public JwtTokenService(IOptions<JwtSettings> settings)
    {
        _settings = settings.Value;
    }

    public int ExpiresInSeconds => _settings.ExpiryMinutes * 60;
    public int RefreshTokenExpiryDays => _settings.RefreshTokenExpiryDays;
    public int MaxFailedLoginAttempts => _settings.MaxFailedLoginAttempts;
    public int LockoutMinutes => _settings.LockoutMinutes;

    public string GenerateAccessToken(UserAccount user, IReadOnlyList<string> roles, Guid? tenantId = null, string? subdomain = null, Guid? sessionId = null)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, user.Username),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("full_name", user.FullName)
        };

        if (tenantId.HasValue)
            claims.Add(new Claim("tenant_id", tenantId.Value.ToString()));

        if (user.SchoolId.HasValue)
            claims.Add(new Claim("school_id", user.SchoolId.Value.ToString()));

        if (subdomain != null)
            claims.Add(new Claim("subdomain", subdomain));

        if (sessionId.HasValue)
            claims.Add(new Claim("session_id", sessionId.Value.ToString()));

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_settings.ExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    public string HashRefreshToken(string refreshToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexStringLower(bytes);
    }
}
