using Microsoft.AspNetCore.Builder;

namespace Aig.Lms.Api.Authorization;

public static class PermissionEndpointExtensions
{
    /// <summary>
    /// Requires the caller to have the specified permission code.
    /// Usage: .RequirePermission("USERS_CREATE")
    /// </summary>
    public static TBuilder RequirePermission<TBuilder>(this TBuilder builder, string permissionCode)
        where TBuilder : IEndpointConventionBuilder
    {
        return builder.RequireAuthorization($"Permission:{permissionCode}");
    }
}
