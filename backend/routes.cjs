const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User.cjs");
const Quiz = require("./models/Quiz.cjs");
const Attempt = require("./models/Attempt.cjs");
const sendEmail = require("./utils/sendEmail.cjs");
const generateOTP = require("./utils/generateOTP.cjs");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const FACULTY_SECRET = process.env.FACULTY_SECRET || "777";

/*
JWT VERIFY MIDDLEWARE
*/
const verifyToken = (req, res, next) => {

  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "No token provided"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Session expired"
    });
  }

};

async function registerRoutes(httpServer, app) {

  /*
  =========================
  AUTH ROUTES
  =========================
  */

  app.post("/api/auth/register", async (req, res) => {

    try {

      const { email, password, name, role, facultySecret } = req.body;

      if (!email || !password || !name || !role) {
        return res.status(400).json({
          message: "Missing required fields"
        });
      }

      if (!["student", "faculty"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role"
        });
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({
          message: "Email already in use"
        });
      }

      if (role === "faculty" && facultySecret !== FACULTY_SECRET) {

        return res.status(400).json({
          message: "Invalid Faculty Secret"
        });

      }

      const hashedPassword = await bcrypt.hash(password, 8);

      const user = await User.create({

        email,
        password: hashedPassword,
        name,
        role,
        isVerified: role === "faculty" ? true : false,

      });

      // Send verification OTP for student signups only
      if (role !== "faculty") {
        const otp = generateOTP();
        user.verificationCode = otp;
        user.verificationExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        try {
          await sendEmail(
            user.email,
            "QuizHUB Email Verification Code",
            user.name,
            otp,
            "verify"
          );
        } catch (emailErr) {
          console.error("SEND VERIFICATION EMAIL ERROR:", emailErr);
        }
      }

      const userObj = user.toObject();

      delete userObj.password;

      res.status(201).json({ ...userObj, requiresVerification: role !== "faculty" });

    } catch (error) {

      console.error("REGISTER ERROR:", error);

      res.status(500).json({
        message: "Internal server error"
      });

    }

  });


  app.post("/api/auth/login", async (req, res) => {

    try {

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required"
        });
      }

      const user = await User.findOne({ email });

      if (!user) {

        return res.status(404).json({
          message: "No account exists with this email"
        });

      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {

        return res.status(401).json({
          message: "Incorrect password"
        });

      }

      // Block unverified students from logging in
      if (user.role === "student" && !user.isVerified) {
        return res.status(403).json({
          message: "Please verify your email before login"
        });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const userObj = user.toObject();

      delete userObj.password;

      res.status(200).json({
        message: "Login successful",
        user: userObj,
        token,
        role: user.role,
        userId: user._id
      });

    } catch (error) {

      console.error("LOGIN ERROR:", error);

      res.status(500).json({
        message: "Internal server error"
      });

    }

  });


  app.get("/api/auth/me", verifyToken, async (req, res) => {

    try {

      const user = await User.findById(req.userId);

      if (!user) {

        return res.status(404).json({
          message: "User not found"
        });

      }

      const userObj = user.toObject();

      delete userObj.password;

      res.status(200).json(userObj);

    } catch (error) {

      res.status(500).json({
        message: "Internal Server Error"
      });

    }

  });


  /*
  =========================
  QUIZ ROUTES (FIXED)
  =========================
  */

  app.get("/api/quizzes", verifyToken, async (req, res) => {

    try {

      let quizzes;

      if (req.userRole === "faculty") {

        quizzes = await Quiz.find({
          facultyId: req.userId
        })
          .populate("facultyId", "name")
          .sort({ createdAt: -1 })
          .lean();

      } else {

        quizzes = await Quiz.find({ published: { $ne: false } })
          .populate("facultyId", "name")
          .sort({ createdAt: -1 })
          .lean();

      }

      const safeQuizzes = quizzes.map(quiz => ({

        ...quiz,

        id: quiz._id,

        facultyName: quiz.facultyId?.name || "Unknown",

        durationMinutes: quiz.durationMinutes || null,

        hasAccessCode: !!quiz.accessCode,

        questions: (quiz.questions || []).map(q => {

          const { correctAnswerIndex, ...safe } = q;

          return safe;

        })

      }));

      res.status(200).json(safeQuizzes);

    } catch (error) {

      console.error("GET QUIZZES ERROR:", error);

      res.status(500).json({
        message: "Failed to fetch quizzes"
      });

    }

  });


  /*
  CREATE QUIZ
  */

  app.post("/api/quizzes", verifyToken, async (req, res) => {

    try {

      if (req.userRole !== "faculty") {

        return res.status(403).json({
          message: "Faculty only"
        });

      }

      const {

        title,
        description,
        questions,
        availableFrom,
        availableUntil,
        isAlwaysAvailable,
        durationMinutes,
        accessCode

      } = req.body;

      const quiz = await Quiz.create({

        title,
        description,

        questions: questions || [],

        availableFrom: availableFrom || null,

        availableUntil: availableUntil || null,

        isAlwaysAvailable:
          isAlwaysAvailable !== false,

        durationMinutes: durationMinutes || null,

        accessCode: accessCode || null,

        published: true,

        facultyId: req.userId,

        createdAt: new Date()

      });

      res.status(201).json({

        success: true,

        ...quiz.toObject(),

        id: quiz._id,

        quizId: quiz._id

      });

    } catch (error) {

      console.error("CREATE QUIZ ERROR:", error);

      res.status(500).json({
        message: "Failed to create quiz"
      });

    }

  });


  /*
  GET SINGLE QUIZ
  */

  app.get("/api/quizzes/:id", verifyToken, async (req, res) => {

    try {

      const quiz = await Quiz.findById(req.params.id)
        .populate("facultyId", "name")
        .lean();

      if (!quiz) {

        return res.status(404).json({
          message: "Quiz not found"
        });

      }

      const safeQuiz = {

        ...quiz,

        id: quiz._id,

        facultyName: quiz.facultyId?.name || "Unknown",

        durationMinutes: quiz.durationMinutes || null,

        hasAccessCode: !!quiz.accessCode,

        questions: (quiz.questions || []).map(q => {

          const { correctAnswerIndex, ...safe } = q;

          return safe;

        })

      };

      res.json(safeQuiz);

    } catch (error) {

      res.status(500).json({
        message: "Failed to fetch quiz"
      });

    }

  });


  /*
  VALIDATE ACCESS CODE (SECURITY)
  */

  app.post("/api/quizzes/:id/validate-access-code", verifyToken, async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      if (quiz.accessCode) {
        if (req.body.accessCode !== quiz.accessCode) {
          return res.status(403).json({
            success: false,
            message: "Invalid access code"
          });
        }
      }

      // Also check if student is locked
      const lockedAttempt = await Attempt.findOne({
        quizId: quiz._id,
        studentId: req.userId,
        isLocked: true,
      });

      if (lockedAttempt) {
        return res.status(403).json({
          success: false,
          message: "You are locked from this quiz due to violations"
        });
      }

      res.json({ success: true, message: "Access code valid" });
    } catch (error) {
      console.error("VALIDATE ACCESS CODE ERROR:", error);
      res.status(500).json({ message: "Failed to validate access code" });
    }
  });


  /*
  ATTEMPTS ROUTES
  */

  app.post("/api/quizzes/:id/attempts", verifyToken, async (req, res) => {

    try {

      const quiz = await Quiz.findById(req.params.id);

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found"
        });
      }

      const now = new Date();

      if (!quiz.isAlwaysAvailable) {

        if (quiz.availableFrom && now < quiz.availableFrom) {

          return res.status(403).json({
            message: "Quiz not yet available"
          });

        }

        if (quiz.availableUntil && now > quiz.availableUntil) {

          const expDate = new Date(quiz.availableUntil).toLocaleString("en-US", {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit"
          });

          return res.status(403).json({
            message: `Quiz ended on ${expDate}`
          });

        }

      }

      // Check if student is locked from this quiz due to violations
      const lockedAttempt = await Attempt.findOne({
        quizId: quiz._id,
        studentId: req.userId,
        isLocked: true,
      });

      if (lockedAttempt) {
        return res.status(403).json({
          message: "You are blocked from attempting this quiz due to violations"
        });
      }

      // Access code validation
      const { answers = [], terminated, terminationReason, violations: reqViolations, isAutoSubmitted, accessCode: enteredCode, startedAt: clientStartedAt } = req.body;

      if (quiz.accessCode && quiz.accessCode !== enteredCode) {
        return res.status(403).json({
          message: "Invalid access code"
        });
      }

      let score = 0;

      const detailedAnswers = (quiz.questions || []).map((q, i) => {
        const selectedIndex = answers[i];
        const isCorrect = selectedIndex === q.correctAnswerIndex;
        if (isCorrect) score++;

        return {
          questionId: q._id,
          questionText: q.questionText,
          selectedAnswer: (selectedIndex >= 0 && selectedIndex < q.options.length)
            ? q.options[selectedIndex]
            : null,
          correctAnswer: q.options[q.correctAnswerIndex],
          isCorrect,
        };
      });

      // Calculate duration timestamps
      const completedAt = new Date();
      const startedAt = clientStartedAt ? new Date(clientStartedAt) : completedAt;
      let expiresAt = null;
      if (quiz.durationMinutes) {
        expiresAt = new Date(startedAt.getTime() + quiz.durationMinutes * 60 * 1000);
      }

      // Calculate time taken in seconds
      const timeTakenSeconds = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000);

      const attempt = await Attempt.create({

        quizId: quiz._id,

        studentId: req.userId,

        answers: detailedAnswers,

        score,

        totalQuestions: quiz.questions?.length || 0,

        terminated: terminated || false,

        terminationReason: terminationReason || null,

        violations: reqViolations || 0,

        isLocked: (reqViolations >= 4) || false,

        isAutoSubmitted: isAutoSubmitted || false,

        startedAt,

        expiresAt,

        timeTakenSeconds: timeTakenSeconds > 0 ? timeTakenSeconds : null,

        completedAt,

      });

      res.status(201).json(attempt);

    } catch (error) {

      res.status(500).json({
        message: "Failed to submit attempt"
      });

    }

  });


  /*
  =========================
  STUDENT: My Attempts
  =========================
  */

  app.get("/api/my-attempts", verifyToken, async (req, res) => {
    try {
      const attempts = await Attempt.find({ studentId: req.userId })
        .sort({ completedAt: -1 })
        .lean();

      // Populate quiz titles
      const quizIds = [...new Set(attempts.map(a => a.quizId.toString()))];
      const quizzesMap = {};
      const quizzesFound = await Quiz.find({ _id: { $in: quizIds } }).lean();
      quizzesFound.forEach(q => { quizzesMap[q._id.toString()] = q.title; });

      const enriched = attempts.map(a => ({
        ...a,
        id: a._id,
        quizTitle: quizzesMap[a.quizId.toString()] || "Unknown Quiz",
        submittedAt: a.completedAt,
      }));

      res.json(enriched);
    } catch (error) {
      console.error("GET MY ATTEMPTS ERROR:", error);
      res.status(500).json({ message: "Failed to fetch attempts" });
    }
  });


  /*
  =========================
  FACULTY: Attempts for a quiz
  =========================
  */

  app.get("/api/quizzes/:id/attempts", verifyToken, async (req, res) => {
    try {
      if (req.userRole !== "faculty") {
        return res.status(403).json({ message: "Faculty only" });
      }

      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Verify ownership
      if (quiz.facultyId.toString() !== req.userId.toString()) {
        return res.status(403).json({ message: "Not your quiz" });
      }

      const attempts = await Attempt.find({ quizId: req.params.id })
        .sort({ completedAt: -1 })
        .lean();

      // Populate student info
      const studentIds = [...new Set(attempts.map(a => a.studentId.toString()))];
      const studentsMap = {};
      const studentsFound = await User.find({ _id: { $in: studentIds } }).select("name email").lean();
      studentsFound.forEach(s => { studentsMap[s._id.toString()] = s; });

      const enriched = attempts.map(a => {
        const student = studentsMap[a.studentId.toString()] || {};
        return {
          ...a,
          id: a._id,
          studentName: student.name || "Unknown",
          studentEmail: student.email || "Unknown",
          timeTakenSeconds: a.timeTakenSeconds || null,
          attemptedAt: a.completedAt,
          submittedAt: a.completedAt,
        };
      });

      res.json(enriched);
    } catch (error) {
      console.error("GET QUIZ ATTEMPTS ERROR:", error);
      res.status(500).json({ message: "Failed to fetch attempts" });
    }
  });


  /*
  =========================
  VIOLATION TRACKING
  =========================
  */

  app.post("/api/quizzes/:id/record-violation", verifyToken, async (req, res) => {
    try {
      const { violationCount } = req.body;

      // Find existing in-progress attempt or return info
      const existingAttempt = await Attempt.findOne({
        quizId: req.params.id,
        studentId: req.userId,
        isLocked: true,
      });

      if (existingAttempt) {
        return res.status(403).json({
          message: "You are blocked from attempting this quiz due to violations",
          isLocked: true,
        });
      }

      res.json({ violations: violationCount, isLocked: violationCount >= 4 });
    } catch (error) {
      console.error("RECORD VIOLATION ERROR:", error);
      res.status(500).json({ message: "Failed to record violation" });
    }
  });

  /*
  =========================
  CHECK LOCK STATUS
  =========================
  */

  app.get("/api/quizzes/:id/lock-status", verifyToken, async (req, res) => {
    try {
      const lockedAttempt = await Attempt.findOne({
        quizId: req.params.id,
        studentId: req.userId,
        isLocked: true,
      });

      res.json({ isLocked: !!lockedAttempt });
    } catch (error) {
      res.status(500).json({ message: "Failed to check lock status" });
    }
  });


  /*
  =========================
  EMAIL VERIFICATION
  =========================
  */

  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { email, code } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (
        user.verificationCode !== code ||
        user.verificationExpires < Date.now()
      ) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      user.isVerified = true;
      user.verificationCode = undefined;
      user.verificationExpires = undefined;

      await user.save();

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("VERIFY EMAIL ERROR:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });


  /*
  =========================
  RESEND VERIFICATION CODE
  =========================
  */

  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      const otp = generateOTP();
      user.verificationCode = otp;
      user.verificationExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      await sendEmail(
        user.email,
        "QuizHUB Email Verification Code",
        user.name,
        otp,
        "verify"
      );

      res.json({ message: "Verification code resent" });
    } catch (error) {
      console.error("RESEND VERIFICATION ERROR:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });


  /*
  =========================
  FORGOT PASSWORD - SEND RESET CODE
  =========================
  */

  app.post("/api/auth/send-reset-code", async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const otp = generateOTP();
      user.resetCode = otp;
      user.resetCodeExpires = Date.now() + 10 * 60 * 1000;
      await user.save();

      await sendEmail(
        user.email,
        "QuizHUB Password Reset Code",
        user.name,
        otp,
        "reset"
      );

      res.json({ message: "Reset code sent" });
    } catch (error) {
      console.error("SEND RESET CODE ERROR:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });


  /*
  =========================
  RESET PASSWORD
  =========================
  */

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (
        user.resetCode !== code ||
        user.resetCodeExpires < Date.now()
      ) {
        return res.status(400).json({ message: "Invalid or expired code" });
      }

      user.password = await bcrypt.hash(newPassword, 8);
      user.resetCode = undefined;
      user.resetCodeExpires = undefined;

      await user.save();

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("RESET PASSWORD ERROR:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });


  return httpServer;

}

module.exports = { registerRoutes };