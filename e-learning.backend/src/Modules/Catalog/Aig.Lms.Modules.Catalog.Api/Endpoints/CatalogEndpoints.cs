using Aig.Lms.Modules.Catalog.Application.Catalog.Commands.CreateCatalogItem;
using Aig.Lms.Modules.Catalog.Application.Catalog.Commands.DeleteCatalogItem;
using Aig.Lms.Modules.Catalog.Application.Catalog.Commands.UpdateCatalogItem;
using Aig.Lms.Modules.Catalog.Application.Catalog.Queries.GetCatalogByType;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;

namespace Aig.Lms.Modules.Catalog.Api.Endpoints;

public static class CatalogEndpoints
{
    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin/catalog")
            .WithTags("Admin Catalog")
            .RequireAuthorization();

        // GET /api/admin/catalog/{type}
        group.MapGet("/{type}", async (
            string type,
            [FromServices] GetCatalogByTypeHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(new GetCatalogByTypeQuery(type), ct);
            return Results.Ok(result);
        })
        .WithName("GetCatalogByType")
        .WithSummary("List all active catalog items for a given type")
        .Produces<IReadOnlyList<CatalogItemDto>>()
        .ProducesProblem(401)
        .RequireAuthorization("Permission:CATALOG_VIEW");

        // POST /api/admin/catalog/{type}
        group.MapPost("/{type}", async (
            string type,
            [FromBody] CreateCatalogItemRequest request,
            [FromServices] CreateCatalogItemHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                var command = new CreateCatalogItemCommand(
                    type,
                    request.Code,
                    request.Name,
                    request.Description,
                    request.SortOrder);

                var result = await handler.HandleAsync(command, ct);
                return Results.Created($"/api/admin/catalog/{result.Type}/{result.Id}", result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
        })
        .WithName("CreateCatalogItem")
        .WithSummary("Create a new catalog item for a given type")
        .Produces<CreateCatalogItemResult>(201)
        .ProducesProblem(409)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:CATALOG_MANAGE");

        // PUT /api/admin/catalog/{type}/{id}
        group.MapPut("/{type}/{id:guid}", async (
            string type,
            Guid id,
            [FromBody] UpdateCatalogItemRequest request,
            [FromServices] UpdateCatalogItemHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                await handler.HandleAsync(
                    new UpdateCatalogItemCommand(id, request.Name, request.Description, request.SortOrder),
                    ct);
                return Results.NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
        })
        .WithName("UpdateCatalogItem")
        .WithSummary("Update a catalog item's name, description, and sort order")
        .Produces(204)
        .ProducesProblem(404)
        .ProducesProblem(409)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:CATALOG_MANAGE");

        // DELETE /api/admin/catalog/{type}/{id}
        group.MapDelete("/{type}/{id:guid}", async (
            string type,
            Guid id,
            [FromServices] DeleteCatalogItemHandler handler,
            CancellationToken ct) =>
        {
            try
            {
                await handler.HandleAsync(new DeleteCatalogItemCommand(id), ct);
                return Results.NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return Results.NotFound(new { error = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { error = ex.Message });
            }
        })
        .WithName("DeleteCatalogItem")
        .WithSummary("Soft-delete a catalog item (blocked if system item or in use)")
        .Produces(204)
        .ProducesProblem(404)
        .ProducesProblem(409)
        .ProducesProblem(401)
        .RequireAuthorization("Permission:CATALOG_MANAGE");

        return app;
    }

    // ---------------------------------------------------------------------------
    // Request bodies
    // ---------------------------------------------------------------------------

    public sealed record CreateCatalogItemRequest(
        string Code,
        string Name,
        string? Description,
        int SortOrder);

    public sealed record UpdateCatalogItemRequest(
        string Name,
        string? Description,
        int SortOrder);
}
