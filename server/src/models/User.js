import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      // Never return password in API responses
      select: false,
    },

    // Profile details
    headline: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    phone: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    website: { type: String, default: "" },

    // Skills extracted by AI from CV + manually added
    skills: [{ type: String, trim: true }],

    // Work experience — used for experience_fit scoring
    experience: [
      {
        title: String,
        company: String,
        from: Date,
        to: Date,
        current: { type: Boolean, default: false },
        description: String,
      },
    ],

    // Education
    education: [
      {
        degree: String,
        institution: String,
        year: Number,
        grade: String,
      },
    ],

    // CV file path (stored after upload in Step 9)
    cvPath: { type: String, default: null },
    cvParsed: { type: Boolean, default: false },
    cvUploadedAt: { type: Date, default: null },

    // Jobs the user has saved / applied to
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
    appliedJobs: [
      {
        job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
        appliedAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ["applied", "interviewing", "offered", "rejected"],
          default: "applied",
        },
      },
    ],

    // Preferred job types — used for scoring
    preferences: {
      jobTypes: [
        {
          type: String,
          enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
        },
      ],
      locations: [String],
      salaryMin: { type: Number, default: 0 },
      salaryMax: { type: Number, default: 999999 },
      roles: [String],
    },

    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  },
);

// ── Hash password before saving ───────────────────────────────────────────────
// This runs whenever the password field is modified (create + update)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Cost factor 12 = good security/speed balance
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance method: compare entered password to hashed one ──────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Instance method: return safe user object (no password) ───────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

export default mongoose.model("User", userSchema);
