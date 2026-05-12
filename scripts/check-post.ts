import { prisma } from "../lib/db";

async function main() {
  const post = await prisma.blogPost.findFirst({
    where: { slug: "gpt-5-4-a-ia-que-saiu-do-chat-e-botou-a-mao-na-massa-digital" }
  });
  
  if (post) {
    console.log("ID:", post.id);
    console.log("Title:", post.title);
    console.log("Featured Image:", post.featuredImage);
    console.log("Content preview:", post.content?.substring(0, 300));
  } else {
    console.log("Post not found");
  }
  
  await prisma.$disconnect();
}

main();
