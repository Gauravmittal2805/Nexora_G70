const { S3Client } = require('@aws-sdk/client-s3');

const isB2Configured = () => {
  return Boolean(
    process.env.B2_KEY_ID &&
    process.env.B2_APPLICATION_KEY &&
    process.env.B2_BUCKET_NAME
  );
};

let s3Client = null;

if (isB2Configured()) {
  s3Client = new S3Client({
    endpoint: process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com',
    region: process.env.B2_REGION || 'us-west-004',
    credentials: {
      accessKeyId: process.env.B2_KEY_ID,
      secretAccessKey: process.env.B2_APPLICATION_KEY
    },
    forcePathStyle: true
  });
}

const getS3Client = () => {
  if (!s3Client && isB2Configured()) {
    s3Client = new S3Client({
      endpoint: process.env.B2_ENDPOINT || 'https://s3.us-west-004.backblazeb2.com',
      region: process.env.B2_REGION || 'us-west-004',
      credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY
      },
      forcePathStyle: true
    });
  }
  return s3Client;
};

module.exports = {
  getS3Client,
  isB2Configured
};
