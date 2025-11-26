import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

/**
 * Upload screenshot to Azure Blob Storage
 * Returns the URL where the screenshot is stored (with SAS token for private containers)
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

    // Ensure container exists (without public access requirement)
    await containerClient.createIfNotExists();

    const blobName = `${postId}_${Date.now()}.${imageType}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: {
        blobContentType: `image/${imageType}`,
      },
    });

    // Generate SAS URL for private access (valid for 10 years)
    const sasUrl = await generateBlobSASUrl(
      connectionString,
      containerName,
      blobName
    );

    return sasUrl;
  } catch (error) {
    console.error("Error uploading screenshot to Azure:", error);
    throw new Error("Failed to upload screenshot");
  }
}

/**
 * Generate SAS URL for blob with read permissions
 */
async function generateBlobSASUrl(
  connectionString: string,
  containerName: string,
  blobName: string
): Promise<string> {
  // Parse connection string to get account name and key
  const accountNameMatch = connectionString.match(/AccountName=([^;]+)/);
  const accountKeyMatch = connectionString.match(/AccountKey=([^;]+)/);

  if (!accountNameMatch || !accountKeyMatch) {
    throw new Error("Invalid connection string format");
  }

  const accountName = accountNameMatch[1];
  const accountKey = accountKeyMatch[1];

  const sharedKeyCredential = new StorageSharedKeyCredential(
    accountName,
    accountKey
  );

  // SAS token valid for 10 years
  const expiresOn = new Date();
  expiresOn.setFullYear(expiresOn.getFullYear() + 10);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse("r"), // Read only
      expiresOn,
    },
    sharedKeyCredential
  ).toString();

  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
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
