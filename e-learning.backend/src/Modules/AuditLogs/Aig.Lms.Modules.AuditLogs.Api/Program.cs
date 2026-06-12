using Aig.Lms.Modules.AuditLogs.Api.Endpoints;
using Aig.Lms.Modules.AuditLogs.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add AuditLogs module services
builder.Services.AddAuditLogsModule(builder.Configuration);

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Map endpoints
app.MapAuditLogsEndpoints();

app.Run();
