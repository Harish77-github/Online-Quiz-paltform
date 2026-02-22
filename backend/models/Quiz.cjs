const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswerIndex: { type: Number, required: true },
});

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questions: [QuestionSchema],
  availableFrom: {
    type: Date,
    default: null
  },
  availableUntil: {
    type: Date,
    default: null
  },
  isAlwaysAvailable: {
    type: Boolean,
    default: true
  },
  durationMinutes: { type: Number, default: null },
  accessCode: { type: String, default: null },
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Quiz", QuizSchema);
