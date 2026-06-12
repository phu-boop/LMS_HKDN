using Aig.Lms.Modules.Catalog.Application.Catalog.Commands.CreateCatalogItem;
using Aig.Lms.Modules.Catalog.Application.Catalog.Commands.DeleteCatalogItem;
using Aig.Lms.Modules.Catalog.Application.Catalog.Commands.UpdateCatalogItem;
using Aig.Lms.Modules.Catalog.Application.Catalog.Queries.GetCatalogByType;
using Aig.Lms.Modules.Catalog.Domain.Entities;
using Aig.Lms.Modules.Catalog.Domain.Repositories;
using FluentAssertions;
using NSubstitute;

namespace Aig.Lms.UnitTests.Catalog;

public sealed class CatalogCommandHandlerTests
{
    // =========================================================
    // GetCatalogByTypeHandler
    // =========================================================

    [Fact]
    public async Task GetCatalogByTypeHandler_WithItems_ReturnsSortedList()
    {
        var repo = Substitute.For<ICatalogRepository>();
        repo.GetByTypeAsync("DOCUMENT_TYPE", default)
            .Returns([
                MakeItem(Guid.NewGuid(), "DOCUMENT_TYPE", "EXERCISE", "Bài tập", sortOrder: 2),
                MakeItem(Guid.NewGuid(), "DOCUMENT_TYPE", "CONTRACT", "Hợp đồng", sortOrder: 1),
            ]);

        var handler = new GetCatalogByTypeHandler(repo);
        var result = await handler.HandleAsync(new GetCatalogByTypeQuery("DOCUMENT_TYPE"));

        result.Should().HaveCount(2);
        result[0].Code.Should().Be("CONTRACT");   // sort_order 1 first
        result[1].Code.Should().Be("EXERCISE");
    }

    [Fact]
    public async Task GetCatalogByTypeHandler_EmptyType_ReturnsEmpty()
    {
        var repo = Substitute.For<ICatalogRepository>();
        var handler = new GetCatalogByTypeHandler(repo);

        var result = await handler.HandleAsync(new GetCatalogByTypeQuery("   "));

        result.Should().BeEmpty();
        await repo.DidNotReceive().GetByTypeAsync(Arg.Any<string>());
    }

    [Fact]
    public async Task GetCatalogByTypeHandler_NormalizesTypeToUppercase()
    {
        var repo = Substitute.For<ICatalogRepository>();
        repo.GetByTypeAsync("DOCUMENT_TYPE", default).Returns([]);
        var handler = new GetCatalogByTypeHandler(repo);

        await handler.HandleAsync(new GetCatalogByTypeQuery("document_type"));

        await repo.Received(1).GetByTypeAsync("DOCUMENT_TYPE", default);
    }

    // =========================================================
    // CreateCatalogItemHandler
    // =========================================================

    [Fact]
    public async Task CreateCatalogItemHandler_ValidCommand_CreatesItem()
    {
        var repo = Substitute.For<ICatalogRepository>();
        repo.ExistsByCodeAsync("DOCUMENT_TYPE", "NEW_TYPE", ct: default).Returns(false);

        var handler = new CreateCatalogItemHandler(repo);
        var result = await handler.HandleAsync(new CreateCatalogItemCommand(
            "DOCUMENT_TYPE", "NEW_TYPE", "Loại mới", "Mô tả", 5));

        result.Type.Should().Be("DOCUMENT_TYPE");
        result.Code.Should().Be("NEW_TYPE");
        result.Name.Should().Be("Loại mới");
        await repo.Received(1).AddAsync(Arg.Any<CatalogItem>(), default);
    }

    [Fact]
    public async Task CreateCatalogItemHandler_DuplicateCode_ThrowsInvalidOperationException()
    {
        var repo = Substitute.For<ICatalogRepository>();
        repo.ExistsByCodeAsync("DOCUMENT_TYPE", "CONTRACT", ct: default).Returns(true);

        var handler = new CreateCatalogItemHandler(repo);
        var act = () => handler.HandleAsync(new CreateCatalogItemCommand(
            "DOCUMENT_TYPE", "CONTRACT", "Hợp đồng", null, 0));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*already exists*");
    }

    [Fact]
    public async Task CreateCatalogItemHandler_EmptyCode_ThrowsInvalidOperationException()
    {
        var repo = Substitute.For<ICatalogRepository>();
        var handler = new CreateCatalogItemHandler(repo);

        var act = () => handler.HandleAsync(new CreateCatalogItemCommand(
            "DOCUMENT_TYPE", "  ", "Name", null, 0));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Code is required*");
    }

    [Fact]
    public async Task CreateCatalogItemHandler_EmptyName_ThrowsInvalidOperationException()
    {
        var repo = Substitute.For<ICatalogRepository>();
        var handler = new CreateCatalogItemHandler(repo);

        var act = () => handler.HandleAsync(new CreateCatalogItemCommand(
            "DOCUMENT_TYPE", "CODE", "", null, 0));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Name is required*");
    }

    [Fact]
    public async Task CreateCatalogItemHandler_NormalizesCodeToUppercase()
    {
        var repo = Substitute.For<ICatalogRepository>();
        repo.ExistsByCodeAsync("DISPLAY_LABEL", "FEATURED", ct: default).Returns(false);

        var handler = new CreateCatalogItemHandler(repo);
        var result = await handler.HandleAsync(new CreateCatalogItemCommand(
            "display_label", "featured", "Nổi bật", null, 0));

        result.Type.Should().Be("DISPLAY_LABEL");
        result.Code.Should().Be("FEATURED");
    }

    // =========================================================
    // UpdateCatalogItemHandler
    // =========================================================

    [Fact]
    public async Task UpdateCatalogItemHandler_ValidCommand_UpdatesItem()
    {
        var item = MakeItem(Guid.NewGuid(), "DOCUMENT_TYPE", "CONTRACT", "Hợp đồng");
        var repo = Substitute.For<ICatalogRepository>();
        repo.GetByIdAsync(item.Id, default).Returns(item);

        var handler = new UpdateCatalogItemHandler(repo);
        await handler.HandleAsync(new UpdateCatalogItemCommand(item.Id, "Hợp Đồng Mới", "Mô tả mới", 2));

        await repo.Received(1).UpdateAsync(Arg.Is<CatalogItem>(x =>
            x.Name == "Hợp Đồng Mới" && x.SortOrder == 2), default);
    }

    [Fact]
    public async Task UpdateCatalogItemHandler_NotFound_ThrowsKeyNotFoundException()
    {
        var repo = Substitute.For<ICatalogRepository>();
        repo.GetByIdAsync(Arg.Any<Guid>(), default).Returns((CatalogItem?)null);

        var handler = new UpdateCatalogItemHandler(repo);
        var act = () => handler.HandleAsync(new UpdateCatalogItemCommand(Guid.NewGuid(), "X", null, 0));

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task UpdateCatalogItemHandler_EmptyName_ThrowsInvalidOperationException()
    {
        var repo = Substitute.For<ICatalogRepository>();
        var handler = new UpdateCatalogItemHandler(repo);

        var act = () => handler.HandleAsync(new UpdateCatalogItemCommand(Guid.NewGuid(), "  ", null, 0));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Name is required*");
    }

    // =========================================================
    // DeleteCatalogItemHandler
    // =========================================================

    [Fact]
    public async Task DeleteCatalogItemHandler_UserItem_NotInUse_DeletesItem()
    {
        var item = MakeItem(Guid.NewGuid(), "DOCUMENT_TYPE", "CUSTOM", "Custom", isSystem: false);
        var repo = Substitute.For<ICatalogRepository>();
        repo.GetByIdAsync(item.Id, default).Returns(item);
        repo.IsInUseAsync(item.Id, default).Returns(false);

        var handler = new DeleteCatalogItemHandler(repo);
        await handler.HandleAsync(new DeleteCatalogItemCommand(item.Id));

        await repo.Received(1).DeleteAsync(Arg.Any<CatalogItem>(), default);
    }

    [Fact]
    public async Task DeleteCatalogItemHandler_SystemItem_ThrowsInvalidOperationException()
    {
        var item = MakeItem(Guid.NewGuid(), "DOCUMENT_TYPE", "CONTRACT", "Hợp đồng", isSystem: true);
        var repo = Substitute.For<ICatalogRepository>();
        repo.GetByIdAsync(item.Id, default).Returns(item);

        var handler = new DeleteCatalogItemHandler(repo);
        var act = () => handler.HandleAsync(new DeleteCatalogItemCommand(item.Id));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*system item*");

        await repo.DidNotReceive().DeleteAsync(Arg.Any<CatalogItem>(), default);
    }

    [Fact]
    public async Task DeleteCatalogItemHandler_ItemInUse_ThrowsInvalidOperationException()
    {
        var item = MakeItem(Guid.NewGuid(), "DOCUMENT_TYPE", "CUSTOM", "Custom", isSystem: false);
        var repo = Substitute.For<ICatalogRepository>();
        repo.GetByIdAsync(item.Id, default).Returns(item);
        repo.IsInUseAsync(item.Id, default).Returns(true);

        var handler = new DeleteCatalogItemHandler(repo);
        var act = () => handler.HandleAsync(new DeleteCatalogItemCommand(item.Id));

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*in use*");

        await repo.DidNotReceive().DeleteAsync(Arg.Any<CatalogItem>(), default);
    }

    [Fact]
    public async Task DeleteCatalogItemHandler_NotFound_ThrowsKeyNotFoundException()
    {
        var repo = Substitute.For<ICatalogRepository>();
        repo.GetByIdAsync(Arg.Any<Guid>(), default).Returns((CatalogItem?)null);

        var handler = new DeleteCatalogItemHandler(repo);
        var act = () => handler.HandleAsync(new DeleteCatalogItemCommand(Guid.NewGuid()));

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    // =========================================================
    // Domain: CatalogItem
    // =========================================================

    [Fact]
    public void CatalogItem_Create_NormalizesCodeAndType()
    {
        var item = CatalogItem.Create("display_label", "  featured  ", "Nổi bật");

        item.Type.Should().Be("DISPLAY_LABEL");
        item.Code.Should().Be("FEATURED");
        item.IsSystem.Should().BeFalse();
        item.IsActive.Should().BeTrue();
        item.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public void CatalogItem_Delete_SystemItem_Throws()
    {
        var item = MakeItem(Guid.NewGuid(), "DOCUMENT_TYPE", "CONTRACT", "Hợp đồng", isSystem: true);

        var act = item.Delete;

        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*system item*");
    }

    [Fact]
    public void CatalogItem_Delete_UserItem_SetsIsDeletedTrue()
    {
        var item = MakeItem(Guid.NewGuid(), "DOCUMENT_TYPE", "CUSTOM", "Custom", isSystem: false);

        item.Delete();

        item.IsDeleted.Should().BeTrue();
    }

    // =========================================================
    // Helpers
    // =========================================================

    private static CatalogItem MakeItem(
        Guid id,
        string type,
        string code,
        string name,
        int sortOrder = 0,
        bool isSystem = false) =>
        CatalogItem.Reconstitute(
            id, type, code, name,
            description: null,
            sortOrder,
            isSystem,
            isActive: true,
            isDeleted: false,
            createdAt: DateTime.UtcNow,
            updatedAt: DateTime.UtcNow);
}
