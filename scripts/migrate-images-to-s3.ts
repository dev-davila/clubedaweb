import { createM3S3Client, getM3BucketConfig, getM3ImageUrl, objectExistsInM3S3 } from "../lib/m3-s3-config";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import { prisma } from "../lib/db";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif"
};

async function uploadLocalFile(localPath: string, s3Key: string): Promise<string> {
  const client = createM3S3Client();
  const { bucketName } = getM3BucketConfig();
  
  const ext = path.extname(localPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
  
  const fileBuffer = fs.readFileSync(localPath);
  
  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType
  }));
  
  return getM3ImageUrl(s3Key);
}

async function migrateLocalImages() {
  const publicImagesDir = path.join(process.cwd(), "public", "images");
  
  if (!fs.existsSync(publicImagesDir)) {
    console.log("No public/images directory found");
    return;
  }
  
  const migrated: { local: string; s3: string }[] = [];
  const failed: { local: string; error: string }[] = [];
  
  async function processDirectory(dir: string, prefix: string = "images") {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        await processDirectory(fullPath, `${prefix}/${item}`);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (Object.keys(CONTENT_TYPES).includes(ext)) {
          const s3Key = `${prefix}/${item}`;
          
          // Check if already exists
          const exists = await objectExistsInM3S3(s3Key);
          if (exists) {
            console.log(`⏭️  Skipping (exists): ${s3Key}`);
            continue;
          }
          
          try {
            const url = await uploadLocalFile(fullPath, s3Key);
            console.log(`✅ Uploaded: ${s3Key} -> ${url}`);
            migrated.push({ local: fullPath, s3: url });
          } catch (error) {
            console.error(`❌ Failed: ${s3Key}`, error);
            failed.push({ local: fullPath, error: String(error) });
          }
        }
      }
    }
  }
  
  await processDirectory(publicImagesDir);
  
  console.log("\n===== Migration Summary =====");
  console.log(`✅ Migrated: ${migrated.length} files`);
  console.log(`❌ Failed: ${failed.length} files`);
  
  return { migrated, failed };
}

async function updateDatabaseReferences() {
  console.log("\n===== Updating Database References =====");
  
  const baseUrl = "https://media2.dev.to/dynamic/image/width=1600,height=900,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fjpvxq7foy6aoq67i5d2l.png";
  
  // Update BlogPost images
  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        { featuredImage: { startsWith: "/images/" } },
        { secondaryImage: { startsWith: "/images/" } }
      ]
    }
  });
  
  console.log(`Found ${posts.length} posts with local image references`);
  
  for (const post of posts) {
    const updates: Record<string, string> = {};
    
    if (post.featuredImage?.startsWith("/images/")) {
      updates.featuredImage = `${baseUrl}${post.featuredImage}`;
    }
    if (post.secondaryImage?.startsWith("/images/")) {
      updates.secondaryImage = `${baseUrl}${post.secondaryImage}`;
    }
    
    if (Object.keys(updates).length > 0) {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: updates
      });
      console.log(`✅ Updated post: ${post.title}`);
    }
  }
  
  // Update Partner logos
  const partners = await prisma.partner.findMany({
    where: {
      logoUrl: { startsWith: "/images/" }
    }
  });
  
  console.log(`Found ${partners.length} partners with local logo references`);
  
  for (const partner of partners) {
    if (partner.logoUrl?.startsWith("/images/")) {
      await prisma.partner.update({
        where: { id: partner.id },
        data: {
          logoUrl: `${baseUrl}${partner.logoUrl}`
        }
      });
      console.log(`✅ Updated partner: ${partner.name}`);
    }
  }
  
  console.log("\n===== Database Update Complete =====");
}

async function main() {
  console.log("🚀 Starting M3Solutions Image Migration to S3");
  console.log("Target bucket: cdn.m3solutions.net.br\n");
  
  try {
    // Step 1: Migrate local files
    await migrateLocalImages();
    
    // Step 2: Update database references
    await updateDatabaseReferences();
    
    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
