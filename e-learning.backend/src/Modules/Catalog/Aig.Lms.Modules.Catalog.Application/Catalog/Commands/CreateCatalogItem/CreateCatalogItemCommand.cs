using Aig.Lms.Modules.Catalog.Domain.Entities;
using Aig.Lms.Modules.Catalog.Domain.Repositories;

namespace Aig.Lms.Modules.Catalog.Application.Catalog.Commands.CreateCatalogItem;

public sealed record CreateCatalogItemCommand(
    string Type,
    string Code,
    string Name,
    string? Description,
    int SortOrder);

public sealed record CreateCatalogItemResult(
    Guid Id,
    string Type,
    string Code,
    string Name);

public sealed class CreateCatalogItemHandler
{
    private readonly ICatalogRepository _repository;

    public CreateCatalogItemHandler(ICatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task<CreateCatalogItemResult> HandleAsync(
        CreateCatalogItemCommand command,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Type))
            throw new InvalidOperationException("Catalog type is required.");

        if (string.IsNullOrWhiteSpace(command.Code))
            throw new InvalidOperationException("Code is required.");

        if (string.IsNullOrWhiteSpace(command.Name))
            throw new InvalidOperationException("Name is required.");

        if (command.Code.Length > 100)
            throw new InvalidOperationException("Code must not exceed 100 characters.");

        if (command.Name.Length > 255)
            throw new InvalidOperationException("Name must not exceed 255 characters.");

        var type = command.Type.Trim().ToUpperInvariant();
        var code = command.Code.Trim().ToUpperInvariant();

        if (await _repository.ExistsByCodeAsync(type, code, ct: ct))
            throw new InvalidOperationException(
                $"A catalog item with code '{code}' already exists in type '{type}'.");

        var item = CatalogItem.Create(type, code, command.Name, command.Description, command.SortOrder);
        await _repository.AddAsync(item, ct);

        return new CreateCatalogItemResult(item.Id, item.Type, item.Code, item.Name);
    }
}
