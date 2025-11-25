import { BlobServiceClient } from "@azure/storage-blob";

/**
 * Upload screenshot to Azure Blob Storage
 * Returns the URL where the screenshot is stored
 */
export async function uploadScreenshot(
  base64Image: string,
  postId: string
): Promise<string> {
  try {
    // Extract base64 data (remove data:image/...;base64, prefix)
    const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid base64 image format");
    }

    const imageType = matches[1];
    const imageData = matches[2];
    const buffer = Buffer.from(imageData, "base64");

    // Azure Blob Storage
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName =
      process.env.AZURE_STORAGE_CONTAINER_NAME || "screenshots";

    if (!connectionString) {
      throw new Error("Azure Storage connection string not configured");
    }

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists
    await containerClient.createIfNotExists({ access: "blob" });

    const blobName = `${postId}_${Date.now()}.${imageType}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: `image/${imageType}`,
      },
    });

    return blockBlobClient.url;
  } catch (error) {
    console.error("Error uploading screenshot to Azure:", error);
    throw new Error("Failed to upload screenshot");
  }
}

/**
 * Delete screenshot from Azure Blob Storage
 */
export async function deleteScreenshot(screenshotUrl: string): Promise<void> {
  try {
    if (!screenshotUrl.includes("blob.core.windows.net")) {
      return; // Not an Azure blob URL
    }

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName =
      process.env.AZURE_STORAGE_CONTAINER_NAME || "screenshots";

    if (!connectionString) {
      console.warn("Azure Storage connection string not configured");
      return;
    }

    const blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Extract blob name from URL
    const url = new URL(screenshotUrl);
    const pathParts = url.pathname.split("/");
    const blobName = pathParts[pathParts.length - 1];

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  } catch (error) {
    console.error("Error deleting screenshot from Azure:", error);
    // Don't throw - deletion failure shouldn't block other operations
  }
}
