
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10
});

const sessionStore = new MySQLStore(dbConfig);

app.use(session({
    name: "login.sid",
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1000 * 60 * 60
    }
}));

// Frontend files
app.use(express.static(path.join(__dirname, "public")));

// Protect pages: user must be logged in
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login.html");
    }

    next();
}

// Protect Admin pages
function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== "admin") {
        return res.status(403).send("Access denied. Admin only.");
    }

    next();
}

// Protect User pages
function requireUser(req, res, next) {
    if (!req.session.user || req.session.user.role !== "user") {
        return res.status(403).send("Access denied. User only.");
    }

    next();
}

// Registration
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).send("Invalid registration details.");
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [existing] = await pool.execute(
            "SELECT id FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (existing.length > 0) {
            return res.status(409).send("Email already registered.");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await pool.execute(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
            [name.trim(), normalizedEmail, hashedPassword]
        );

        res.redirect("/login.html");

    } catch (error) {
        console.error(error);
        res.status(500).send("Registration failed.");
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(401).send("Invalid login details.");
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [rows] = await pool.execute(
            "SELECT * FROM users WHERE email = ?",
            [normalizedEmail]
        );

        if (rows.length === 0) {
            return res.status(401).send("Invalid email or password.");
        }

        const user = rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).send("Invalid email or password.");
        }

        // Regenerate session after authentication
        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).send("Session error.");
            }

            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            req.session.save((err) => {
                if (err) {
                    return res.status(500).send("Session error.");
                }

                if (user.role === "admin") {
                    return res.redirect("/admin-dashboard");
                }

                return res.redirect("/user-dashboard");
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).send("Login failed.");
    }
});

app.get("/profile", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "profile.html"));
});

// User Dashboard
app.get("/user-dashboard", requireUser, (req, res) => {
    res.sendFile(
        path.join(__dirname, "views", "user-dashboard.html")
    );
});

// Admin Dashboard
app.get("/admin-dashboard", requireAdmin, (req, res) => {
    res.sendFile(
        path.join(__dirname, "views", "admin-dashboard.html")
    );
});

// User information API
app.get("/api/me", requireLogin, (req, res) => {
    res.json(req.session.user);
});

// Admin: view all users
app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
        const [users] = await pool.execute(
            "SELECT id, name, email, role, created_at FROM users"
        );

        res.json(users);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to fetch users." });
    }
});

// Logout
app.post("/logout", requireLogin, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Logout failed.");
        }

        res.clearCookie("login.sid");
        res.redirect("/login.html");
    });
});

app.get("/api/profile", requireLogin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, name, email, role, mobile, college, created_at FROM users WHERE id = ?",
      [req.session.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Profile not found." });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load profile." });
  }
});

app.put("/api/profile", requireLogin, async (req, res) => {
  try {
    const { name, mobile, college } = req.body;
    if (typeof name !== "string" || !name.trim() || name.trim().length > 100 ||
        (mobile != null && (typeof mobile !== "string" || mobile.length > 20)) ||
        (college != null && (typeof college !== "string" || college.length > 150))) {
      return res.status(400).json({ message: "Please check your profile details." });
    }
    await pool.execute(
      "UPDATE users SET name = ?, mobile = ?, college = ? WHERE id = ?",
      [name.trim(), (mobile || "").trim() || null, (college || "").trim() || null, req.session.user.id]
    );
    req.session.user.name = name.trim();
    res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to save profile." });
  }
});


/*
 * Nexora Jobs Portal Routes
 *
 * Add this block to server.js BEFORE app.listen().
 *
 * Uses your existing:
 * app, pool, path, requireLogin, requireAdmin, requireUser
 */

// ============================================
// JOBS PAGE
// ============================================

app.get("/jobs", requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, "views", "jobs.html"));
});

// ============================================
// GET ALL JOB LISTINGS
// ============================================

app.get("/api/jobs", requireLogin, async (req, res) => {
    try {
        const [jobs] = await pool.execute(
            `SELECT
                j.id,
                j.job_name,
                j.min_cgpa,
                j.offering_ctc,
                j.location,
                j.created_at,
                u.name AS posted_by,
                EXISTS(
                    SELECT 1
                    FROM job_applications a
                    WHERE a.job_id = j.id
                    AND a.user_id = ?
                ) AS applied
             FROM job_listings j
             JOIN users u ON u.id = j.posted_by
             ORDER BY j.created_at DESC`,
            [req.session.user.id]
        );

        res.json(jobs);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to load job listings."
        });
    }
});

// ============================================
// ADMIN: ADD JOB LISTING
// ============================================

app.post("/api/admin/jobs", requireAdmin, async (req, res) => {
    try {
        const {
            job_name,
            min_cgpa,
            offering_ctc,
            location
        } = req.body;

        const cgpa = Number(min_cgpa);
        const ctc = Number(offering_ctc);

        if (
            typeof job_name !== "string" ||
            !job_name.trim() ||
            job_name.trim().length > 150 ||

            typeof location !== "string" ||
            !location.trim() ||
            location.trim().length > 180 ||

            !Number.isFinite(cgpa) ||
            cgpa < 0 ||
            cgpa > 10 ||

            !Number.isFinite(ctc) ||
            ctc <= 0 ||
            ctc > 99999999
        ) {
            return res.status(400).json({
                message: "Enter a valid job name, CGPA (0–10), CTC and location."
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO job_listings
                (job_name, min_cgpa, offering_ctc, location, posted_by)
             VALUES (?, ?, ?, ?, ?)`,
            [
                job_name.trim(),
                cgpa.toFixed(2),
                ctc.toFixed(2),
                location.trim(),
                req.session.user.id
            ]
        );

        res.status(201).json({
            message: "Job listing added.",
            id: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to add job listing."
        });
    }
});

// ============================================
// USER: APPLY FOR JOB
// ============================================

app.post("/api/jobs/:id/apply", requireUser, async (req, res) => {
    try {
        const jobId = Number(req.params.id);
        const applicantCgpa = Number(req.body.applicant_cgpa);

        if (
            !Number.isInteger(jobId) ||
            jobId < 1 ||
            !Number.isFinite(applicantCgpa) ||
            applicantCgpa < 0 ||
            applicantCgpa > 10
        ) {
            return res.status(400).json({
                message: "Enter a valid CGPA between 0 and 10."
            });
        }

        // Check whether the job exists
        const [jobs] = await pool.execute(
            `SELECT id, min_cgpa
             FROM job_listings
             WHERE id = ?`,
            [jobId]
        );

        if (!jobs.length) {
            return res.status(404).json({
                message: "Job listing not found."
            });
        }

        // Validate applicant CGPA
        if (applicantCgpa < Number(jobs[0].min_cgpa)) {
            return res.status(400).json({
                message: `This job requires a minimum CGPA of ${Number(
                    jobs[0].min_cgpa
                ).toFixed(2)}.`
            });
        }

        // Save application
        try {
            await pool.execute(
                `INSERT INTO job_applications
                    (job_id, user_id, applicant_cgpa)
                 VALUES (?, ?, ?)`,
                [
                    jobId,
                    req.session.user.id,
                    applicantCgpa.toFixed(2)
                ]
            );

        } catch (error) {
            // Prevent duplicate applications
            if (error.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                    message: "You have already applied for this job."
                });
            }

            throw error;
        }

        res.status(201).json({
            message: "Application submitted successfully."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to submit application."
        });
    }
});

// ============================================
// ADMIN: VIEW JOB APPLICANTS
// ============================================

app.get(
    "/api/admin/jobs/:id/applications",
    requireAdmin,
    async (req, res) => {
        try {
            const jobId = Number(req.params.id);

            if (!Number.isInteger(jobId) || jobId < 1) {
                return res.status(400).json({
                    message: "Invalid job ID."
                });
            }

            const [applications] = await pool.execute(
                `SELECT
                    a.id,
                    a.applicant_cgpa,
                    a.applied_at,
                    u.name,
                    u.email,
                    u.college
                 FROM job_applications a
                 JOIN users u ON u.id = a.user_id
                 WHERE a.job_id = ?
                 ORDER BY a.applied_at DESC`,
                [jobId]
            );

            res.json(applications);

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Unable to load applications."
            });
        }
    }
);

const multer = require("multer");
const fs = require("fs");
const crypto = require("crypto");

const resumeDirectory = path.join(__dirname, "private_uploads", "resumes");
fs.mkdirSync(resumeDirectory, { recursive: true });
const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, resumeDirectory),
    filename: (_req, _file, cb) => cb(null, `${crypto.randomUUID()}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(file.mimetype) && [".pdf", ".docx"].includes(ext)) return cb(null, true);
    cb(new Error("Only PDF and DOCX files are accepted."));
  }
});

app.get("/statistics", requireUser, (_req, res) => {
  res.sendFile(path.join(__dirname, "views", "statistics.html"));
});
app.get("/resume", requireUser, (_req, res) => {
  res.sendFile(path.join(__dirname, "views", "resume.html"));
});

// Data is scoped to the currently logged-in user. No status categories are assumed.
app.get("/api/statistics", requireUser, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [[apps]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM job_applications WHERE user_id = ?", [userId]
    );
    const [[jobs]] = await pool.execute("SELECT COUNT(*) AS total FROM job_listings");
    const [[thisMonth]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM job_applications WHERE user_id = ? AND applied_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')",
      [userId]
    );
    const [monthly] = await pool.execute(
      `SELECT DATE_FORMAT(applied_at, '%b %Y') AS month, COUNT(*) AS count
       FROM job_applications WHERE user_id = ?
       AND applied_at >= DATE_SUB(CURRENT_DATE, INTERVAL 11 MONTH)
       GROUP BY YEAR(applied_at), MONTH(applied_at)
       ORDER BY YEAR(applied_at), MONTH(applied_at)`, [userId]
    );
    res.json({ totalApplications: Number(apps.total), totalJobs: Number(jobs.total),
      applicationsThisMonth: Number(thisMonth.total), monthly });
  } catch (err) {
    console.error(err); res.status(500).json({ message: "Unable to load statistics." });
  }
});

app.get("/api/resume", requireUser, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT original_name, uploaded_at FROM user_resumes WHERE user_id = ?",
      [req.session.user.id]
    );
    res.json({ resume: rows[0] || null });
  } catch (err) { console.error(err); res.status(500).json({ message: "Unable to load resume." }); }
});

app.post("/api/resume", requireUser, (req, res) => {
  resumeUpload.single("resume")(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ message: uploadErr.message || "Upload failed." });
    if (!req.file) return res.status(400).json({ message: "Select a PDF or DOCX file." });
    try {
      const userId = req.session.user.id;
      const [oldRows] = await pool.execute("SELECT stored_name FROM user_resumes WHERE user_id = ?", [userId]);
      await pool.execute(
        `INSERT INTO user_resumes (user_id, original_name, stored_name, mime_type, file_size)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE original_name=VALUES(original_name), stored_name=VALUES(stored_name),
         mime_type=VALUES(mime_type), file_size=VALUES(file_size), uploaded_at=CURRENT_TIMESTAMP`,
        [userId, path.basename(req.file.originalname), req.file.filename, req.file.mimetype, req.file.size]
      );
      if (oldRows[0] && oldRows[0].stored_name !== req.file.filename) {
        fs.promises.unlink(path.join(resumeDirectory, oldRows[0].stored_name)).catch(() => {});
      }
      res.status(201).json({ message: "Resume uploaded successfully." });
    } catch (err) {
      fs.promises.unlink(req.file.path).catch(() => {});
      console.error(err); res.status(500).json({ message: "Unable to save resume." });
    }
  });
});

app.get("/api/resume/download", requireUser, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT original_name, stored_name FROM user_resumes WHERE user_id = ?", [req.session.user.id]
    );
    if (!rows.length) return res.status(404).send("No resume uploaded.");
    const filePath = path.join(resumeDirectory, rows[0].stored_name);
    if (!fs.existsSync(filePath)) return res.status(404).send("Resume file not found.");
    res.download(filePath, rows[0].original_name);
  } catch (err) { console.error(err); res.status(500).send("Unable to download resume."); }
});

app.delete("/api/resume", requireUser, async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT stored_name FROM user_resumes WHERE user_id = ?", [req.session.user.id]);
    await pool.execute("DELETE FROM user_resumes WHERE user_id = ?", [req.session.user.id]);
    if (rows.length) fs.promises.unlink(path.join(resumeDirectory, rows[0].stored_name)).catch(() => {});
    res.json({ message: "Resume deleted." });
  } catch (err) { console.error(err); res.status(500).json({ message: "Unable to delete resume." }); }
});


app.listen(process.env.PORT || 3000, () => {
    console.log("Server running at http://localhost:3000");
});
