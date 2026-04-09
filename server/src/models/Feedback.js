import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["job_match", "skill_gap", "chat", "general"],
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
    referenceId: { type: String }, // jobId, chatMessageId, etc.
    metadata: { type: Object },
  },
  { timestamps: true },
);

export default mongoose.model("Feedback", feedbackSchema);
