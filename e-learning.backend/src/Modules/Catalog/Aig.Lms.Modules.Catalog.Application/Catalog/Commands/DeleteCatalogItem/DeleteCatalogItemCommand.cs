using Aig.Lms.Modules.Catalog.Domain.Repositories;

namespace Aig.Lms.Modules.Catalog.Application.Catalog.Commands.DeleteCatalogItem;

public sealed record DeleteCatalogItemCommand(Guid Id);

public sealed class DeleteCatalogItemHandler
{
    private readonly ICatalogRepository _repository;

    public DeleteCatalogItemHandler(ICatalogRepository repository)
    {
        _repository = repository;
    }

    public async Task HandleAsync(
        DeleteCatalogItemCommand command,
        CancellationToken ct = default)
    {
        var item = await _repository.GetByIdAsync(command.Id, ct)
            ?? throw new KeyNotFoundException($"Catalog item '{command.Id}' not found.");

        // item.Delete() throws InvalidOperationException if IsSystem == true
        item.Delete();

        if (await _repository.IsInUseAsync(command.Id, ct))
            throw new InvalidOperationException(
                $"Catalog item '{item.Code}' is in use and cannot be deleted.");

        await _repository.DeleteAsync(item, ct);
    }
}
