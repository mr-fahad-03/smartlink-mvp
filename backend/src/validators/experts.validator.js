const { z } = require("zod");

const optimizeProfileSchema = z.object({
  approvedCategoryTags: z.array(z.string().trim()).default([]),
  approvedServiceTags: z.array(z.string().trim()).default([]),
  voice: z.enum(["professional", "friendly", "direct"]).default("professional"),
});

const expertApplicationSubmitSchema = z.object({
  fullName: z.string().trim().min(2),
  professionalTitle: z.string().trim().min(2),
  businessName: z.string().trim().min(2),
  workEmail: z.string().trim().email(),
  phoneNumber: z.string().trim().optional().default(""),
  primaryLocation: z.string().trim().min(2),
  mainSpecialization: z.string().trim().min(2),
  hourlyRate: z.string().trim().optional().default(""),
  shortBio: z.string().trim().min(10),
  availabilityStatus: z.string().trim().min(2),
  maxClientsPerWeek: z.string().trim().optional().default(""),
  preferredWorkTypes: z.string().trim().optional().default(""),
  governmentIdUploaded: z.union([z.boolean(), z.string()]).default(false),
  professionalHeadshotUploaded: z.union([z.boolean(), z.string()]).default(false),
  referenceContactsReady: z.union([z.boolean(), z.string()]).default(false),
  businessLicenseAttached: z.union([z.boolean(), z.string()]).default(false),
  certificationsProvided: z.union([z.boolean(), z.string()]).default(false),
});

module.exports = {
  optimizeProfileSchema,
  expertApplicationSubmitSchema,
};
