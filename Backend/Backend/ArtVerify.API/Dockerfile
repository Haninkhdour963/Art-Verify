# ===== Build stage =====
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# نسخ الحل والمشاريع
COPY Backend.sln ./
COPY ArtVerify.API/ArtVerify.API.csproj ./ArtVerify.API/
COPY ArtVerify.Application/ArtVerify.Application.csproj ./ArtVerify.Application/
COPY ArtVerify.Domain/ArtVerify.Domain.csproj ./ArtVerify.Domain/
COPY ArtVerify.Infrastructure/ArtVerify.Infrastructure.csproj ./ArtVerify.Infrastructure/

RUN dotnet restore

# نسخ كل الملفات وبناء المشروع
COPY . .
WORKDIR /src/ArtVerify.API
RUN dotnet publish -c Release -o /app/publish

# ===== Runtime stage =====
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "ArtVerify.API.dll"]
