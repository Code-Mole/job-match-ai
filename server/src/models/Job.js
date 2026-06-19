import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    company: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    region: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
      default: "Full-time",
    },

    remote: {
      type: Boolean,
      default: false,
    },

    // Salary
    salaryMin: {
      type: Number,
      default: 0,
    },

    salaryMax: {
      type: Number,
      default: 0,
    },

    salary: {
      type: String,
      default: "",
    },

    currency: {
      type: String,
      default: "USD",
    },

    // Job details
    description: {
      type: String,
      required: true,
      default: "No description available",
    },

    requirements: {
      type: [String],
      default: [],
    },

    responsibilities: {
      type: [String],
      default: [],
    },

    // Skills
    skills: {
      type: [String],
      default: [],
    },

    // Experience level
    level: {
      type: String,
      enum: ["Junior", "Mid", "Senior", "Lead", "Principal"],
      default: "Mid",
    },

    yearsExp: {
      type: Number,
      default: 0,
    },

    // Company info
    companyLogo: {
      type: String,
      default: "",
    },

    companySize: {
      type: String,
      default: "",
    },

    industry: {
      type: String,
      default: "",
    },

    companyUrl: {
      type: String,
      default: "",
    },

    // Application
    applyUrl: {
      type: String,
      default: "",
    },

    deadline: {
      type: Date,
      default: null,
    },

    // Market trend
    demandTrend: {
      type: String,
      enum: ["Increasing", "Stable", "Decreasing"],
      default: "Stable",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    postedAt: {
      type: Date,
      default: Date.now,
    },

    // External source
    externalId: {
      type: String,
      unique: true,
      sparse: true,
    },

    /** Normalized title|company|location — dedupes same role across providers */
    fingerprint: {
      type: String,
      trim: true,
      index: true,
    },

    source: {
      type: String,
      enum: ["manual", "adzuna", "remotive", "seed", "admin"],
      default: "manual",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Full-text search index
jobSchema.index({
  title: "text",
  description: "text",
  company: "text",
});

jobSchema.index({ fingerprint: 1 }, { unique: true, sparse: true });

jobSchema.index({ country: 1, isActive: 1, postedAt: -1 });

export default mongoose.model("Job", jobSchema);
