# ===== Build Stage =====
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY Backend.sln ./
COPY ArtVerify.API/ArtVerify.API.csproj ArtVerify.API/
COPY ArtVerify.Application/ArtVerify.Application.csproj ArtVerify.Application/
COPY ArtVerify.Domain/ArtVerify.Domain.csproj ArtVerify.Domain/
COPY ArtVerify.Infrastructure/ArtVerify.Infrastructure.csproj ArtVerify.Infrastructure/

# Restore dependencies
RUN dotnet restore

# Copy everything and build
COPY . .
RUN dotnet publish ArtVerify.API/ArtVerify.API.csproj -c Release -o /app/publish

# ===== Runtime Stage =====
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "ArtVerify.API.dll"]
