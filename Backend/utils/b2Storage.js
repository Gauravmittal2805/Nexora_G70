const fs = require('fs');
const path = require('path');
const { Upload } = require('@aws-sdk/lib-storage');
const { GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getS3Client, isB2Configured } = require('../config/s3Client');

// Local uploads directory fallback
const LOCAL_STORAGE_DIR = path.join(__dirname, '..', 'uploads', 'datasets');
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

/**
 * Upload a dataset file stream to Backblaze B2 or local storage
 */
const uploadDatasetFile = async ({ filePath, key, mimeType }) => {
  if (isB2Configured()) {
    const s3Client = getS3Client();
    const fileStream = fs.createReadStream(filePath);

    const parallelUpload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.B2_BUCKET_NAME,
        Key: key,
        Body: fileStream,
        ContentType: mimeType
      },
      partSize: 5 * 1024 * 1024, // 5MB part size for S3 multipart
      queueSize: 4
    });

    const result = await parallelUpload.done();

    return {
      provider: 'backblaze_b2',
      bucket: process.env.B2_BUCKET_NAME,
      key,
      eTag: result.ETag || null,
      localPath: null
    };
  } else {
    // Local storage fallback for dev/testing when B2 keys are not yet added
    const destPath = path.join(LOCAL_STORAGE_DIR, path.basename(key));
    await fs.promises.copyFile(filePath, destPath);

    return {
      provider: 'local',
      bucket: 'local',
      key,
      eTag: null,
      localPath: destPath
    };
  }
};

/**
 * Generate a pre-signed download URL or local download URL
 */
const getDownloadUrl = async ({ provider, bucket, key, localPath, expiresIn = 300 }) => {
  if (provider === 'backblaze_b2' && isB2Configured()) {
    const s3Client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket || process.env.B2_BUCKET_NAME,
      Key: key
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return {
      downloadUrl: presignedUrl,
      expiresInSeconds: expiresIn,
      provider: 'backblaze_b2'
    };
  } else {
    // Return relative API download endpoint
    return {
      downloadUrl: `/api/datasets/file/${encodeURIComponent(key)}`,
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
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucket || process.env.B2_BUCKET_NAME,
        Key: key
      }));
    } else if (localPath && fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
    }
    return true;
  } catch (error) {
    console.error('Storage deletion failed:', error.message);
    return false;
  }
};

module.exports = {
  uploadDatasetFile,
  getDownloadUrl,
  deleteDatasetFile,
  LOCAL_STORAGE_DIR
};
