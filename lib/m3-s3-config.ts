import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// M3Solutions S3 Configuration
// Bucket: cdn.m3solutions.net.br
// Base URL: https://cdn.m3solutions.net.br/

export function getM3BucketConfig() {
  return {
    bucketName: process.env.M3_AWS_BUCKET_NAME ?? "cdn.m3solutions.net.br",
    region: process.env.M3_AWS_REGION ?? "us-east-1",
    baseUrl: "https://cdn.m3solutions.net.br"
  };
}

export function createM3S3Client() {
  const accessKeyId = process.env.M3_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.M3_AWS_SECRET_ACCESS_KEY;
  
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("M3 AWS credentials not configured. Set M3_AWS_ACCESS_KEY_ID and M3_AWS_SECRET_ACCESS_KEY");
  }

  return new S3Client({
    region: process.env.M3_AWS_REGION ?? "us-east-1",
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });
}

// Get public URL for an image in the M3 bucket
export function getM3ImageUrl(key: string): string {
  const { baseUrl } = getM3BucketConfig();
  // Remove leading slash if present
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  return `${baseUrl}/${cleanKey}`;
}

// Upload a file to M3 S3 bucket
export async function uploadToM3S3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = createM3S3Client();
  const { bucketName } = getM3BucketConfig();
  
  // Clean the key
  const cleanKey = key.startsWith("/") ? key.slice(1) : key;
  
  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    Body: buffer,
    ContentType: contentType
  }));
  
  return getM3ImageUrl(cleanKey);
}

// Upload from URL to M3 S3
export async function uploadUrlToM3S3(
  url: string,
  key: string
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
  }
  
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "image/jpeg";
  
  return uploadToM3S3(buffer, key, contentType);
}

// Check if object exists in M3 S3
export async function objectExistsInM3S3(key: string): Promise<boolean> {
  try {
    const client = createM3S3Client();
    const { bucketName } = getM3BucketConfig();
    const cleanKey = key.startsWith("/") ? key.slice(1) : key;
    
    await client.send(new HeadObjectCommand({
      Bucket: bucketName,
      Key: cleanKey
    }));
    return true;
  } catch {
    return false;
  }
}

// List objects in M3 S3
export async function listM3S3Objects(prefix: string = ""): Promise<string[]> {
  const client = createM3S3Client();
  const { bucketName } = getM3BucketConfig();
  
  const result = await client.send(new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix
  }));
  
  return (result.Contents || []).map(item => item.Key || "").filter(Boolean);
}

// Constants for image categories
export const M3_IMAGE_PATHS = {
  partners: "images/partners",
  posts: "images/posts",
  general: "images",
  fallback: "images/fallback"
};
