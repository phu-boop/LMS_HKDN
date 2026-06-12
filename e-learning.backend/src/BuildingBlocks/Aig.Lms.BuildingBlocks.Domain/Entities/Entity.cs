namespace Aig.Lms.BuildingBlocks.Domain.Entities;

public abstract class Entity<TId>
{
    public TId Id { get; protected init; } = default!;

    protected Entity(TId id) => Id = id;
    protected Entity() { }
}
