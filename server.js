const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      student_name VARCHAR(150) NOT NULL,
      roll_number VARCHAR(50) UNIQUE NOT NULL,
      department VARCHAR(100) NOT NULL,
      year_of_study VARCHAR(30) NOT NULL,
      email VARCHAR(180) DEFAULT '',
      phone VARCHAR(40) DEFAULT '',
      address TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/students", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM students ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Could not fetch students:", error.message);
    res.status(500).json({ error: "Could not load students. Check database setup." });
  }
});

app.post("/api/students", async (req, res) => {
  const { student_name, roll_number, department, year_of_study, email = "", phone = "", address = "" } = req.body;
  if (![student_name, roll_number, department, year_of_study].every(v => String(v || "").trim())) {
    return res.status(400).json({ error: "Name, roll number, department and year are required." });
  }
  try {
    const result = await pool.query(
      `INSERT INTO students (student_name, roll_number, department, year_of_study, email, phone, address)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [student_name.trim(), roll_number.trim(), department.trim(), year_of_study.trim(), email.trim(), phone.trim(), address.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Could not add student:", error.message);
    res.status(error.code === "23505" ? 409 : 500).json({
      error: error.code === "23505" ? "That roll number already exists." : "Could not save student."
    });
  }
});

app.put("/api/students/:id", async (req, res) => {
  const { student_name, roll_number, department, year_of_study, email = "", phone = "", address = "" } = req.body;
  if (![student_name, roll_number, department, year_of_study].every(v => String(v || "").trim())) {
    return res.status(400).json({ error: "Name, roll number, department and year are required." });
  }
  try {
    const result = await pool.query(
      `UPDATE students SET student_name=$1, roll_number=$2, department=$3, year_of_study=$4,
       email=$5, phone=$6, address=$7 WHERE id=$8 RETURNING *`,
      [student_name.trim(), roll_number.trim(), department.trim(), year_of_study.trim(), email.trim(), phone.trim(), address.trim(), req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Student not found." });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Could not update student:", error.message);
    res.status(error.code === "23505" ? 409 : 500).json({
      error: error.code === "23505" ? "That roll number already exists." : "Could not update student."
    });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM students WHERE id=$1 RETURNING id", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Student not found." });
    res.json({ message: "Student deleted." });
  } catch (error) {
    console.error("Could not delete student:", error.message);
    res.status(500).json({ error: "Could not delete student." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

initializeDatabase()
  .then(() => app.listen(PORT, () => console.log(`Student Details app running on port ${PORT}`)))
  .catch(error => {
    console.error("Database initialization failed:", error.message);
    process.exit(1);
  });
