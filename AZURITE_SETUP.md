# Azurite - Local Azure Storage Emulator

## What is Azurite?

Azurite is an open-source Azure Storage API compatible server (emulator) for local development and testing.

## Setup Complete! ✅

### Services Running:

- **Blob Service**: http://localhost:10000
- **Queue Service**: http://localhost:10001
- **Table Service**: http://localhost:10002

### Default Credentials (Azurite):

- **Account Name**: `devstoreaccount1`
- **Account Key**: `Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==`

### Connection String (Already in .env.example):

```
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;
```

## Quick Start

### 1. Start Services:

```bash
docker compose up -d
```

### 2. Verify Azurite is Running:

```bash
docker ps | grep azurite
docker logs aurora-azurite
```

### 3. Test Upload:

- Create a post with screenshot
- Check Azurite logs: `docker logs -f aurora-azurite`
- Container will be auto-created on first upload

## Browsing Storage

### Option 1: Azure Storage Explorer (Recommended)

1. Download: https://azure.microsoft.com/en-us/products/storage/storage-explorer/
2. Connect to Local Emulator
3. View containers and blobs

### Option 2: VS Code Extension

Install: **Azure Storage** extension

- Connect to local emulator
- Browse containers visually

### Option 3: REST API

```bash
# List containers
curl http://localhost:10000/devstoreaccount1?comp=list

# List blobs in container
curl http://localhost:10000/devstoreaccount1/screenshots?restype=container&comp=list
```

## Switching Between Local & Production

### Local Development (Azurite):

```bash
# .env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://azurite:10000/devstoreaccount1;
```

### Production (Real Azure):

```bash
# .env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=your-account;AccountKey=your-key;EndpointSuffix=core.windows.net
```

## Data Persistence

- Azurite data is stored in Docker volume: `azurite_data`
- Data persists across container restarts
- To reset: `docker volume rm aurora-social_azurite_data`

## Troubleshooting

### Can't connect to Azurite:

```bash
# Check if running
docker ps | grep azurite

# Check logs
docker logs aurora-azurite

# Restart
docker compose restart azurite
```

### Upload fails:

1. Verify connection string in .env
2. Check Azurite logs for errors
3. Ensure container name is valid (lowercase, no special chars)

### Clear all data:

```bash
docker compose down
docker volume rm aurora-social_azurite_data
docker compose up -d
```

## Benefits:

✅ No Azure account needed for development
✅ Fast local testing
✅ Same API as real Azure Storage
✅ Free and offline
✅ Easy to reset/clear data

## Production Deployment:

When deploying to production, just change the connection string in `.env` to your real Azure Storage account. Code remains the same! 🚀
