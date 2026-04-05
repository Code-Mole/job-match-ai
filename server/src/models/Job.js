import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
      default: "Full-time",
    },
    remote: { type: Boolean, default: false },

    // Salary range stored as numbers for filtering
    salaryMin: { type: Number, default: 0 },
    salaryMax: { type: Number, default: 0 },
    // Display string e.g. "$80k–$120k"
    salary: { type: String, default: "" },
    currency: { type: String, default: "USD" },

    description: { type: String, required: true },
    requirements: [String],
    responsibilities: [String],

    // Skills required — this is what the AI scores against user's skills
    skills: [{ type: String, trim: true }],

    // Seniority level — used for experience_fit scoring
    level: {
      type: String,
      enum: ["Junior", "Mid", "Senior", "Lead", "Principal"],
      default: "Mid",
    },
    yearsExp: { type: Number, default: 0 },

    // Company info
    companyLogo: { type: String, default: "" },
    companySize: { type: String, default: "" },
    industry: { type: String, default: "" },
    companyUrl: { type: String, default: "" },

    // Application details
    applyUrl: { type: String, default: "" },
    deadline: { type: Date, default: null },

    // Market data — used in Careers page (Step 6)
    demandTrend: {
      type: String,
      enum: ["Increasing", "Stable", "Decreasing"],
      default: "Stable",
    },

    isActive: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    postedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

// Text index for full-text search on title, description, company
jobSchema.index({ title: "text", description: "text", company: "text" });

export default mongoose.model("Job", jobSchema);
