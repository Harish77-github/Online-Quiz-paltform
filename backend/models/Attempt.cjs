const mongoose = require("mongoose");

const DetailedAnswerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId },
  questionText: { type: String, required: true },
  selectedAnswer: { type: String, default: null },
  correctAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
}, { _id: false });

const AttemptSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: [DetailedAnswerSchema],
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  terminated: { type: Boolean, default: false },
  terminationReason: { type: String },
  violations: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  isAutoSubmitted: { type: Boolean, default: false },
  startedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  timeTakenSeconds: { type: Number, default: null },
  completedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Attempt", AttemptSchema);
