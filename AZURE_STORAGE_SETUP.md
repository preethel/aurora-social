# Azure Blob Storage Integration Guide

## Current Status

Screenshots are currently saved to local storage (`/uploads` directory). This works for single-server deployments but needs Azure Blob Storage for production/cloud environments.

## Setup Azure Blob Storage

### 1. Create Azure Storage Account

```bash
# Using Azure CLI
az storage account create \
  --name aurorasocialstorage \
  --resource-group your-resource-group \
  --location eastus \
  --sku Standard_LRS
```

### 2. Create Container

```bash
az storage container create \
  --name screenshots \
  --account-name aurorasocialstorage \
  --public-access blob
```

### 3. Get Connection String

```bash
az storage account show-connection-string \
  --name aurorasocialstorage \
  --resource-group your-resource-group
```

## Implementation Steps

### 1. Install Azure SDK

```bash
cd server
npm install @azure/storage-blob
```

### 2. Add Environment Variables

Add to `.env`:

```bash
AZURE_STORAGE_CONNECTION_STRING="your-connection-string"
AZURE_STORAGE_CONTAINER_NAME="screenshots"
```

### 3. Update compose.yml

Add environment variables:

```yaml
environment:
  - AZURE_STORAGE_CONNECTION_STRING=${AZURE_STORAGE_CONNECTION_STRING}
  - AZURE_STORAGE_CONTAINER_NAME=screenshots
```

### 4. Update uploadService.ts

Uncomment the Azure implementation code in `/server/services/uploadService.ts`:

```typescript
import { BlobServiceClient } from "@azure/storage-blob";

export async function uploadScreenshot(
  base64Image: string,
  postId: string
): Promise<string> {
  const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Invalid base64 image format");
  }

  const imageType = matches[1];
  const imageData = matches[2];
  const buffer = Buffer.from(imageData, "base64");

  // Azure Blob Storage
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
  const containerName =
    process.env.AZURE_STORAGE_CONTAINER_NAME || "screenshots";

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const blobName = `${postId}_${Date.now()}.${imageType}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: {
      blobContentType: `image/${imageType}`,
    },
  });

  return blockBlobClient.url;
}

export async function deleteScreenshot(screenshotUrl: string): Promise<void> {
  if (!screenshotUrl.includes("blob.core.windows.net")) {
    return; // Not an Azure blob URL
  }

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
  const containerName =
    process.env.AZURE_STORAGE_CONTAINER_NAME || "screenshots";

  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Extract blob name from URL
  const url = new URL(screenshotUrl);
  const blobName = url.pathname.split("/").pop()!;

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}
```

### 5. Remove Local Storage

Once Azure is working, you can:

- Remove the `uploads` volume from `compose.yml`
- Remove the `/uploads` static serving from `server.ts`

## Benefits of Azure Blob Storage

- ✅ Scalable storage
- ✅ CDN integration possible
- ✅ Automatic backups
- ✅ Works with multiple server instances
- ✅ Better performance with global replication

## Testing

1. Upload a screenshot in the UI
2. Check Azure Portal → Storage Account → Container
3. Verify the image URL is accessible
4. Delete the post and verify blob is deleted
