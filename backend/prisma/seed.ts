import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding database...");

  // Create Tech Team
  const techTeam = await prisma.team.create({
    data: {
      name: "Tech",
      sections: {
        create: [
          {
            name: "Pre-service",
            tasks: {
              create: [
                { title: "Test microphones", slug: "test-microphones" },
                { title: "Check projector", slug: "check-projector" },
                { title: "Test livestream", slug: "test-livestream" },
              ],
            },
          },
          {
            name: "During service",
            tasks: {
              create: [
                { title: "Record sermon", slug: "record-sermon" },
                { title: "Monitor audio levels", slug: "monitor-audio" },
              ],
            },
          },
          {
            name: "Post-service",
            tasks: {
              create: [
                { title: "Shut down equipment", slug: "shutdown-equipment" },
                { title: "Save recordings", slug: "save-recordings" },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Created team: ${techTeam.name}`);

  // Create Worship Team
  const worshipTeam = await prisma.team.create({
    data: {
      name: "Worship",
      sections: {
        create: [
          {
            name: "Pre-service",
            tasks: {
              create: [
                { title: "Sound check", slug: "sound-check" },
                { title: "Tune instruments", slug: "tune-instruments" },
                { title: "Review setlist", slug: "review-setlist" },
              ],
            },
          },
          {
            name: "During service",
            tasks: {
              create: [{ title: "Lead worship", slug: "lead-worship" }],
            },
          },
          {
            name: "Post-service",
            tasks: {
              create: [{ title: "Pack up instruments", slug: "pack-instruments" }],
            },
          },
        ],
      },
    },
  });

  console.log(`Created team: ${worshipTeam.name}`);

  // Create Welcome Team
  const welcomeTeam = await prisma.team.create({
    data: {
      name: "Welcome",
      sections: {
        create: [
          {
            name: "Pre-service",
            tasks: {
              create: [
                { title: "Set up welcome table", slug: "setup-welcome-table" },
                { title: "Prepare visitor cards", slug: "prepare-visitor-cards" },
              ],
            },
          },
          {
            name: "During service",
            tasks: {
              create: [
                { title: "Greet visitors", slug: "greet-visitors" },
                { title: "Hand out bulletins", slug: "hand-out-bulletins" },
              ],
            },
          },
          {
            name: "Post-service",
            tasks: {
              create: [
                { title: "Collect visitor cards", slug: "collect-visitor-cards" },
                { title: "Clean up welcome area", slug: "cleanup-welcome" },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Created team: ${welcomeTeam.name}`);

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
