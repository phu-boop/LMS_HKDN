// This file exists only to satisfy the Sdk.Web project type requirement.
// The Catalog module is hosted inside Aig.Lms.Api — it does not run standalone.
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddOpenApi();
var app = builder.Build();
app.Run();
