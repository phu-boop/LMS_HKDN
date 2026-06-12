using Dapper;
using Aig.Lms.Modules.Utils.TypeHandlers;
using Microsoft.Extensions.DependencyInjection;

namespace Aig.Lms.Modules.Utils;

public static class UtilsModule
{
    public static IServiceCollection AddUtils(this IServiceCollection services)
    {
        RegisterDapperTypeHandlers();
        return services;
    }

    private static void RegisterDapperTypeHandlers()
    {
        SqlMapper.AddTypeHandler(new DateOnlyTypeHandler());
    }
}