using ArtVerify.API.Extensions;
using ArtVerify.API.Middleware;
using ArtVerify.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// Add memory cache
builder.Services.AddMemoryCache();

// Add application services
builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration);

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactClient", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Serve static files from wwwroot
app.UseStaticFiles();
app.MapGet("/health", () => "healthy");


// Ensure wwwroot directory exists
var wwwrootPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(wwwrootPath))
{
    Directory.CreateDirectory(wwwrootPath);

    // Create images directory
    var imagesPath = Path.Combine(wwwrootPath, "images");
    Directory.CreateDirectory(imagesPath);

    // Create placeholder image
    var placeholderPath = Path.Combine(imagesPath, "placeholder.jpg");
    if (!File.Exists(placeholderPath))
    {
        // Create a simple placeholder image
        var placeholderSvg = @"<svg width='400' height='300' xmlns='http://www.w3.org/2000/svg'>
            <rect width='100%' height='100%' fill='#f0f0f0'/>
            <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' 
                  fill='#666' font-family='Arial, sans-serif' font-size='16' font-weight='bold'>
                Artwork Image
            </text>
            <text x='50%' y='60%' dominant-baseline='middle' text-anchor='middle' 
                  fill='#999' font-family='Arial, sans-serif' font-size='12'>
                No image available
            </text>
        </svg>";
        await File.WriteAllTextAsync(placeholderPath, placeholderSvg);
    }
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseCors("ReactClient");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Apply migrations automatically
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.Migrate(); // This will apply any pending migrations
        Console.WriteLine("Database migrated successfully");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
    }
}

Console.WriteLine("Application started successfully");
Console.WriteLine("Swagger UI: http://localhost:5000/swagger");
Console.WriteLine("API: http://localhost:5000/api");
Console.WriteLine($"WebRootPath: {app.Environment.WebRootPath}");
Console.WriteLine($"ContentRootPath: {app.Environment.ContentRootPath}");

app.Run();