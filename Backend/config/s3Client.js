const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');

/**
 * Helper to get Backblaze B2 Application Key ID / Access Key
 */
const getB2KeyId = () => {
  return (
    process.env.B2_KEY_ID ||
    process.env.B2_APPLICATION_KEY_ID ||
    process.env.AWS_ACCESS_KEY_ID ||
    ''
  );
};

/**
 * Helper to get Backblaze B2 Application Key / Secret Key
 */
const getB2ApplicationKey = () => {
  return (
    process.env.B2_APPLICATION_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    ''
  );
};

/**
 * Helper to get Backblaze B2 Bucket Name
 */
const getB2BucketName = () => {
  return (
    process.env.B2_BUCKET_NAME ||
    process.env.AWS_BUCKET_NAME ||
    'nexora-datasets'
  );
};

/**
 * Helper to get Backblaze B2 Region
 */
const getB2Region = () => {
  return (
    process.env.B2_REGION ||
    process.env.AWS_REGION ||
    'us-west-004'
  );
};

/**
 * Helper to get Backblaze B2 S3-Compatible Endpoint
 */
const getB2Endpoint = () => {
  if (process.env.B2_ENDPOINT) {
    return process.env.B2_ENDPOINT;
  }
  const region = getB2Region();
  return `https://s3.${region}.backblazeb2.com`;
};

/**
 * Check whether Backblaze B2 credentials and bucket are configured in the environment
 */
const isB2Configured = () => {
  const keyId = getB2KeyId();
  const appKey = getB2ApplicationKey();
  const bucket = getB2BucketName();

  return Boolean(
    keyId &&
    appKey &&
    bucket &&
    keyId !== 'your_backblaze_application_key_id' &&
    appKey !== 'your_backblaze_application_key'
  );
};

let s3ClientInstance = null;

/**
 * Creates and returns the AWS S3 SDK S3Client configured for Backblaze B2
 */
const getS3Client = () => {
  if (!s3ClientInstance && isB2Configured()) {
    s3ClientInstance = new S3Client({
      endpoint: getB2Endpoint(),
      region: getB2Region(),
      credentials: {
        accessKeyId: getB2KeyId(),
        secretAccessKey: getB2ApplicationKey()
      },
      forcePathStyle: true // Backblaze B2 S3 API requires path-style addressing
    });
  }
  return s3ClientInstance;
};

/**
 * Verify connectivity between the backend and the Backblaze B2 bucket
 * Uses AWS S3 SDK HeadBucketCommand to verify that the bucket exists and credentials have access.
 */
const verifyB2Connection = async () => {
  if (!isB2Configured()) {
    return {
      connected: false,
      configured: false,
      bucket: getB2BucketName(),
      region: getB2Region(),
      endpoint: getB2Endpoint(),
      message: 'Backblaze B2 credentials not configured. Graceful local fallback active.'
    };
  }

  try {
    const client = getS3Client();
    const bucket = getB2BucketName();

    await client.send(new HeadBucketCommand({ Bucket: bucket }));

    return {
      connected: true,
      configured: true,
      bucket,
      region: getB2Region(),
      endpoint: getB2Endpoint(),
      message: `Successfully connected to Backblaze B2 bucket: "${bucket}"`
    };
  } catch (error) {
    return {
      connected: false,
      configured: true,
      bucket: getB2BucketName(),
      region: getB2Region(),
      endpoint: getB2Endpoint(),
      error: error.message,
      message: `Failed to connect to Backblaze B2 bucket "${getB2BucketName()}": ${error.message}`
    };
  }
};

const resetS3Client = () => {
  s3ClientInstance = null;
};

module.exports = {
  getS3Client,
  resetS3Client,
  isB2Configured,
  getB2BucketName,
  getB2Region,
  getB2Endpoint,
  getB2KeyId,
  getB2ApplicationKey,
  verifyB2Connection
};
