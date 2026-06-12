using Aig.Lms.Modules.Catalog.Domain.Repositories;

namespace Aig.Lms.Modules.Catalog.Application.Catalog.Commands.UpdateCatalogItem;

public sealed record UpdateCatalogItemCommand(
    Guid Id,
    string Name,
    string? Description,
    int SortOrder);

public sealed class UpdateCatalogItemHandler
{
    private readonly ICatalogRepository _repository;

    public UpdateCatalogItemHandler(ICatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task HandleAsync(
        UpdateCatalogItemCommand command,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(command.Name))
            throw new InvalidOperationException("Name is required.");

        if (command.Name.Length > 255)
            throw new InvalidOperationException("Name must not exceed 255 characters.");

        var item = await _repository.GetByIdAsync(command.Id, ct)
            ?? throw new KeyNotFoundException($"Catalog item '{command.Id}' not found.");

        item.Update(command.Name, command.Description, command.SortOrder);
        await _repository.UpdateAsync(item, ct);
    }
}
