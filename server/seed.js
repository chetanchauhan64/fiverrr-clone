import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up database...");
  await prisma.message.deleteMany();
  await prisma.orders.deleteMany();
  await prisma.reviews.deleteMany();
  await prisma.gigs.deleteMany();
  await prisma.user.deleteMany();

  console.log("Seeding data...");

  // Create Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@fiverr.com",
      password: "password123", // In a real app, this would be hashed
      username: "admin_fiverr",
      fullName: "Fiverr Administrator",
      description: "Platform administrator and moderator.",
      isProfileInfoSet: true,
      role: "admin",
    },
  });

  const seller1 = await prisma.user.create({
    data: {
      email: "designer@example.com",
      password: "password123",
      username: "pixel_perfect",
      fullName: "Alice Designer",
      description: "Senior UI/UX designer with 10 years of experience.",
      isProfileInfoSet: true,
      role: "user",
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      email: "coder@example.com",
      password: "password123",
      username: "code_wizard",
      fullName: "Bob Developer",
      description: "Full-stack developer specializing in Next.js and Node.js.",
      isProfileInfoSet: true,
      role: "user",
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: "buyer@example.com",
      password: "password123",
      username: "happy_customer",
      fullName: "Charlie Buyer",
      description: "Entrepreneur looking for great services.",
      isProfileInfoSet: true,
      role: "user",
    },
  });

  // Create Gigs
  const gig1 = await prisma.gigs.create({
    data: {
      title: "I will design a modern minimalist logo",
      description: "Get a high-quality, professional logo that represents your brand identity. Includes multiple concepts and revisions.",
      category: "Design",
      price: 45,
      deliveryTime: 2,
      revisions: 0, // 0 for unlimited or just a number
      features: ["3 Concepts", "Source File", "Vector File", "Social Media Kit"],
      shortDesc: "Professional branding with a unique logo.",
      images: ["https://fiverr-res.cloudinary.com/images/t_main1,q_auto,f_auto,q_auto,f_auto/gigs/116239148/original/3688126b47c0b93850785002ba54032d8495a864/design-minimalist-logo-design.jpg"],
      userId: seller1.id,
    },
  });

  const gig2 = await prisma.gigs.create({
    data: {
      title: "I will build a full-stack Next.js application",
      description: "State-of-the-art web development using Next.js 14, Tailwind CSS, and Prisma. Highly performant and SEO optimized.",
      category: "Web Development",
      price: 250,
      deliveryTime: 7,
      revisions: 3,
      features: ["Responsive Design", "SEO Optimized", "Payment Integration", "Admin Dashboard"],
      shortDesc: "High-end web application development.",
      images: ["https://fiverr-res.cloudinary.com/images/t_main1,q_auto,f_auto,q_auto,f_auto/gigs/292837456/original/f875f14e43e248b6b9075e7a935532381284d7a8/build-your-modern-next-js-website.jpg"],
      userId: seller2.id,
    },
  });

  const gig3 = await prisma.gigs.create({
    data: {
      title: "I will write SEO optimized blog posts",
      description: "Engaging and research-driven articles that rank on Google. 500-1500 words with keywords included.",
      category: "Writing",
      price: 35,
      deliveryTime: 3,
      revisions: 2,
      features: ["Keyword Research", "Topic Research", "SEO Optimization"],
      shortDesc: "Boost your blog with quality content.",
      images: ["https://fiverr-res.cloudinary.com/images/t_main1,q_auto,f_auto,q_auto,f_auto/gigs/210332824/original/555e0d7c49f80a4237d4567d264e1069df259e8f/manage-your-social-media-accounts.jpg"],
      userId: seller1.id,
    },
  });

  const gig4 = await prisma.gigs.create({
    data: {
      title: "I will set up your Facebook and Instagram Ads",
      description: "Drive traffic and sales with highly targeted social media advertising campaigns.",
      category: "Digital Marketing",
      price: 120,
      deliveryTime: 5,
      revisions: 1,
      features: ["Campaign Setup", "Audience Research", "Ad Copywriting"],
      shortDesc: "High conversion social media ads.",
      images: ["https://fiverr-res.cloudinary.com/images/t_main1,q_auto,f_auto,q_auto,f_auto/gigs/154562541/original/034b7f94d9b4b0e5d0d6b6b7a5e8c1e8e8e8e8e8/set-up-your-facebook-and-instagram-ads.jpg"],
      userId: seller2.id,
    },
  });

  // Create Orders
  await prisma.orders.create({
    data: {
      buyerId: buyer.id,
      gigId: gig1.id,
      price: gig1.price,
      isCompleted: true,
      paymentIntent: "pi_completed_1",
    },
  });

  await prisma.orders.create({
    data: {
      buyerId: buyer.id,
      gigId: gig2.id,
      price: gig2.price,
      isCompleted: false,
      paymentIntent: "pi_active_1",
    },
  });

  await prisma.orders.create({
    data: {
      buyerId: admin.id, // Admin as buyer for testing
      gigId: gig3.id,
      price: gig3.price,
      isCompleted: true,
      paymentIntent: "pi_completed_2",
    },
  });

  await prisma.orders.create({
    data: {
      buyerId: seller1.id, // Seller as buyer for testing
      gigId: gig4.id,
      price: gig4.price,
      isCompleted: false,
      paymentIntent: "pi_active_2",
    },
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

