FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files first for layer caching
COPY Aig.Lms.sln ./
COPY src/Api/Aig.Lms.Api/Aig.Lms.Api.csproj src/Api/Aig.Lms.Api/
COPY src/BuildingBlocks/Aig.Lms.BuildingBlocks.Application/Aig.Lms.BuildingBlocks.Application.csproj src/BuildingBlocks/Aig.Lms.BuildingBlocks.Application/
COPY src/BuildingBlocks/Aig.Lms.BuildingBlocks.Contracts/Aig.Lms.BuildingBlocks.Contracts.csproj src/BuildingBlocks/Aig.Lms.BuildingBlocks.Contracts/
COPY src/BuildingBlocks/Aig.Lms.BuildingBlocks.Domain/Aig.Lms.BuildingBlocks.Domain.csproj src/BuildingBlocks/Aig.Lms.BuildingBlocks.Domain/
COPY src/BuildingBlocks/Aig.Lms.BuildingBlocks.Infrastructure/Aig.Lms.BuildingBlocks.Infrastructure.csproj src/BuildingBlocks/Aig.Lms.BuildingBlocks.Infrastructure/
COPY src/SharedKernel/Aig.Lms.SharedKernel/Aig.Lms.SharedKernel.csproj src/SharedKernel/Aig.Lms.SharedKernel/
COPY src/Workers/Aig.Lms.Workers.BackgroundJobs/Aig.Lms.Workers.BackgroundJobs.csproj src/Workers/Aig.Lms.Workers.BackgroundJobs/
COPY src/Workers/Aig.Lms.Workers.MediaPipeline/Aig.Lms.Workers.MediaPipeline.csproj src/Workers/Aig.Lms.Workers.MediaPipeline/

# Copy all module project files
COPY src/Modules/ src/Modules/

RUN dotnet restore src/Api/Aig.Lms.Api/Aig.Lms.Api.csproj

# Copy everything and publish
COPY . .
RUN dotnet publish src/Api/Aig.Lms.Api/Aig.Lms.Api.csproj -c Release -o /app/publish --no-restore /p:ErrorOnDuplicatePublishOutputFiles=false

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN apt-get update \
	&& apt-get install -y --no-install-recommends wget ffmpeg \
	&& rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .

EXPOSE 5294
ENV ASPNETCORE_URLS=http://+:5294
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Aig.Lms.Api.dll"]
