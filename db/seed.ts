import { db } from "./index";
import * as schema from "@shared/schema";

async function seed() {
  try {
    console.log("Seeding database...");
    
    // We're now using filesystem-based content instead of database storage
    // No seeding is required since all content is read from markdown files
    
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
