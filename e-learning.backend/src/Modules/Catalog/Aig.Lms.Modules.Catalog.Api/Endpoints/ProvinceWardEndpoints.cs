using Aig.Lms.Modules.Catalog.Application.ProvinceWard.Queries.GetAllProvinces;
using Aig.Lms.Modules.Catalog.Application.ProvinceWard.Queries.GetWardsByProvinceId;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Aig.Lms.Modules.Catalog.Api.Endpoints;

public static class ProvinceWardEndpoints
{
    public static IEndpointRouteBuilder MapProvinceWardEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/provinces")
            .WithTags("Provinces & Wards");

        // GET /api/provinces
        group.MapGet("/", async (
            [FromServices] GetAllProvincesHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetAllProvincesQuery(), ct);
            return Results.Ok(result);
        })
        .WithName("GetAllProvinces")
        .WithSummary("List all provinces")
        .Produces<IReadOnlyList<ProvinceDto>>();

        // GET /api/provinces/{provinceId}/wards
        group.MapGet("/{provinceId:int}/wards", async (
            int provinceId,
            [FromServices] GetWardsByProvinceIdHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetWardsByProvinceIdQuery(provinceId), ct);
            return Results.Ok(result);
        })
        .WithName("GetWardsByProvinceId")
        .WithSummary("List all wards of a province")
        .Produces<IReadOnlyList<WardDto>>();

        return app;
    }
}
