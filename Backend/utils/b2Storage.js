const fs = require('fs');
const path = require('path');
const { Upload } = require('@aws-sdk/lib-storage');
const { GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const {
  getS3Client,
  isB2Configured,
  getB2BucketName,
  getB2Region,
  getB2Endpoint,
  verifyB2Connection
} = require('../config/s3Client');

// Local uploads directory fallback for offline development / testing
const LOCAL_STORAGE_DIR = path.join(__dirname, '..', 'uploads', 'datasets');
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

/**
 * Upload a dataset file stream to Backblaze B2 bucket using AWS S3 SDK
 * Falls back to local storage when B2 credentials are not configured
 */
const uploadDatasetFile = async ({ filePath, key, mimeType }) => {
  const bucketName = getB2BucketName();
  const region = getB2Region();

  if (isB2Configured()) {
    const s3Client = getS3Client();
    const fileStream = fs.createReadStream(filePath);

    // Use AWS SDK lib-storage Upload for managed multipart uploads
    const parallelUpload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: key,
        Body: fileStream,
        ContentType: mimeType || (key.endsWith('.json') ? 'application/json' : 'text/csv')
      },
      partSize: 5 * 1024 * 1024, // 5MB part size for S3 multipart
      queueSize: 4
    });

    const result = await parallelUpload.done();

    // Generate storage URL
    const storageUrl = process.env.B2_PUBLIC_URL_PREFIX
      ? `${process.env.B2_PUBLIC_URL_PREFIX.replace(/\/+$/, '')}/${key}`
      : `https://s3.${region}.backblazeb2.com/${bucketName}/${key}`;

    return {
      provider: 'backblaze_b2',
      bucket: bucketName,
      key,
      eTag: result.ETag || null,
      localPath: null,
      storageUrl
    };
  } else {
    // Local storage fallback for dev/testing when B2 keys are not yet configured
    const destFileName = path.basename(key);
    const destPath = path.join(LOCAL_STORAGE_DIR, destFileName);
    await fs.promises.copyFile(filePath, destPath);

    return {
      provider: 'local',
      bucket: 'local',
      key,
      eTag: null,
      localPath: destPath,
      storageUrl: `/uploads/datasets/${destFileName}`
    };
  }
};

/**
 * Retrieve a readable stream for a dataset file from Backblaze B2 (or local file)
 * Optimized for preview: supports S3 Range requests (e.g. 'bytes=0-1048575' for 1MB chunk)
 * to avoid downloading entire gigabyte-scale datasets over the network.
 */
const getDatasetFileStream = async ({ provider, bucket, key, localPath, range = null }) => {
  if (provider === 'backblaze_b2' && isB2Configured()) {
    const s3Client = getS3Client();
    const commandParams = {
      Bucket: bucket || getB2BucketName(),
      Key: key
    };

    if (range) {
      commandParams.Range = range;
    }

    try {
      const response = await s3Client.send(new GetObjectCommand(commandParams));
      return response.Body; // Node.js Readable stream
    } catch (err) {
      // If Range Not Satisfiable (e.g., file size < range), retry fetching full object
      if (range && (err.name === 'InvalidRange' || err.$metadata?.httpStatusCode === 416)) {
        delete commandParams.Range;
        const fallbackResponse = await s3Client.send(new GetObjectCommand(commandParams));
        return fallbackResponse.Body;
      }
      throw err;
    }
  }

  // Check local file path fallback
  if (localPath && fs.existsSync(localPath)) {
    if (range && range.startsWith('bytes=')) {
      const parts = range.replace('bytes=', '').split('-');
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : undefined;
      return fs.createReadStream(localPath, { start, end });
    }
    return fs.createReadStream(localPath);
  }

  // Also check if stored in LOCAL_STORAGE_DIR by key's basename
  if (key) {
    const fallbackPath = path.join(LOCAL_STORAGE_DIR, path.basename(key));
    if (fs.existsSync(fallbackPath)) {
      if (range && range.startsWith('bytes=')) {
        const parts = range.replace('bytes=', '').split('-');
        const start = parseInt(parts[0], 10) || 0;
        const end = parts[1] ? parseInt(parts[1], 10) : undefined;
        return fs.createReadStream(fallbackPath, { start, end });
      }
      return fs.createReadStream(fallbackPath);
    }
  }

  return null;
};

/**
 * Generate a pre-signed download URL or local download URL
 */
const getDownloadUrl = async ({ provider, bucket, key, localPath, expiresIn = 300 }) => {
  if (provider === 'backblaze_b2' && isB2Configured()) {
    const s3Client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket || getB2BucketName(),
      Key: key
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return {
      downloadUrl: presignedUrl,
      expiresInSeconds: expiresIn,
      provider: 'backblaze_b2'
    };
  } else {
    return {
      downloadUrl: `/uploads/datasets/${encodeURIComponent(path.basename(key || localPath || ''))}`,
      expiresInSeconds: null,
      provider: 'local'
    };
  }
};

/**
 * Delete a dataset file from storage
 */
const deleteDatasetFile = async ({ provider, bucket, key, localPath }) => {
  try {
    if (provider === 'backblaze_b2' && isB2Configured()) {
      const s3Client = getS3Client();
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket || getB2BucketName(),
          Key: key
        })
      );
    } else if (localPath && fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
    } else if (key) {
      const fallbackPath = path.join(LOCAL_STORAGE_DIR, path.basename(key));
      if (fs.existsSync(fallbackPath)) {
        await fs.promises.unlink(fallbackPath);
      }
    }
    return true;
  } catch (error) {
    console.error('Storage deletion failed:', error.message);
    return false;
  }
};

module.exports = {
  uploadDatasetFile,
  getDatasetFileStream,
  getDownloadUrl,
  deleteDatasetFile,
  verifyB2Connection,
  LOCAL_STORAGE_DIR
};
