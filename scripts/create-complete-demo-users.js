const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function createDemoUsers() {
  const prisma = new PrismaClient();

  try {
    console.log("🔄 Creating demo users with complete schema...");

    // Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 12);
    const userPassword = await bcrypt.hash("user123", 12);

    // Create admin user first
    const adminUser = await prisma.user.upsert({
      where: { email: "admin@demo.local" },
      update: {},
      create: {
        name: "Demo Admin",
        email: "admin@demo.local",
        password: adminPassword,
        roles: ["ADMIN", "USER"],
        emailVerified: new Date(),
        source: "manual",
        identityProvider: "SIGNTUSK",
      },
    });

    // Create regular user
    const regularUser = await prisma.user.upsert({
      where: { email: "user@demo.local" },
      update: {},
      create: {
        name: "Demo User",
        email: "user@demo.local",
        password: userPassword,
        roles: ["USER"],
        emailVerified: new Date(),
        source: "manual",
        identityProvider: "SIGNTUSK",
      },
    });

    // Create organisation claim first
    const orgClaim = await prisma.organisationClaim.upsert({
      where: { id: "demo-org-claim" },
      update: {},
      create: {
        id: "demo-org-claim",
        teamCount: 10,
        memberCount: 100,
        envelopeItemCount: 1000,
        flags: {},
      },
    });

    // Create demo organisation with admin as owner
    const org = await prisma.organisation.upsert({
      where: { url: "demo-org" },
      update: {},
      create: {
        id: "demo-org-id",
        name: "Demo Organisation",
        url: "demo-org",
        type: "ORGANISATION",
        ownerUserId: adminUser.id,
        organisationClaim: {
          connect: { id: orgClaim.id },
        },
        organisationGlobalSettings: {
          create: {
            id: "demo-org-settings",
            emailDocumentSettings: {},
          },
        },
        organisationAuthenticationPortal: {
          create: {
            id: "demo-org-auth-portal",
          },
        },
      },
    });

    // Create team global settings
    const teamGlobalSettings = await prisma.teamGlobalSettings.create({
      id: "demo-team-settings",
    });

    // Create demo team
    const team = await prisma.team.upsert({
      where: { url: "demo-team" },
      update: {},
      create: {
        name: "Demo Team",
        url: "demo-team",
        organisationId: org.id,
        teamGlobalSettings: {
          connect: { id: teamGlobalSettings.id },
        },
      },
    });

    // Create demo folders
    const documentFolder = await prisma.folder.upsert({
      where: { id: "demo-doc-folder" },
      update: {},
      create: {
        id: "demo-doc-folder",
        name: "Demo Documents",
        userId: adminUser.id,
        teamId: team.id,
        type: "DOCUMENT",
        visibility: "EVERYONE",
      },
    });

    const templateFolder = await prisma.folder.upsert({
      where: { id: "demo-template-folder" },
      update: {},
      create: {
        id: "demo-template-folder",
        name: "Demo Templates",
        userId: adminUser.id,
        teamId: team.id,
        type: "TEMPLATE",
        visibility: "EVERYONE",
      },
    });

    // Create organisation memberships
    await prisma.organisationMember.upsert({
      where: {
        userId_organisationId: {
          userId: adminUser.id,
          organisationId: org.id,
        },
      },
      update: {},
      create: {
        id: "admin-member-id",
        userId: adminUser.id,
        organisationId: org.id,
      },
    });

    await prisma.organisationMember.upsert({
      where: {
        userId_organisationId: {
          userId: regularUser.id,
          organisationId: org.id,
        },
      },
      update: {},
      create: {
        id: "user-member-id",
        userId: regularUser.id,
        organisationId: org.id,
      },
    });

    console.log("✅ Demo users created successfully with complete schema!");
    console.log("");
    console.log("📧 Admin: admin@demo.local / admin123");
    console.log("📧 User:  user@demo.local / user123");
    console.log("");
    console.log("🏢 Organisation: Demo Organisation");
    console.log("👥 Team: Demo Team");
    console.log("📁 Folders: Demo Documents, Demo Templates");
  } catch (error) {
    if (error.code === "P2002") {
      console.log("ℹ️  Demo users already exist");
    } else {
      console.error("❌ Error creating demo users:", error.message);
      console.error("Full error:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createDemoUsers().catch(console.error);
