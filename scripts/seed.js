import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfigPath = path.join(__dirname, "../database.yaml");
const dbConfig = yaml.load(fs.readFileSync(dbConfigPath, "utf8"));

const { sqlite_path: sqlitePath } = dbConfig;

const db = new sqlite3.Database(sqlitePath);

const employees = [
  {
    id: 1,
    full_name: "John Doe",
    email: "john.doe@example.com",
    phone_number: "+1234567890",
    date_of_birth: "1990-05-15",
    job_title: "Software Engineer",
    department: "IT",
    salary: 70000,
    start_date: "2020-01-10",
    end_date: null,
    photo_path: "/uploads/employees/john_doe.jpg",
  },
  {
    id: 2,
    full_name: "Jane Smith",
    email: "jane.smith@example.com",
    phone_number: "+1987654321",
    date_of_birth: "1985-07-22",
    job_title: "HR Manager",
    department: "Human Resources",
    salary: 80000,
    start_date: "2018-09-15",
    end_date: null,
    photo_path: "/uploads/employees/jane_smith.jpg",
  },
  {
    id: 3,
    full_name: "Alice Johnson",
    email: "alice.johnson@example.com",
    phone_number: "+1765432109",
    date_of_birth: "1995-03-10",
    job_title: "Data Analyst",
    department: "Business Intelligence",
    salary: 60000,
    start_date: "2021-06-01",
    end_date: null,
    photo_path: "/uploads/employees/alice_johnson.jpg",
  },
];

const timesheets = [
  {
    employee_id: 1,
    start_time: "2025-02-10 08:00:00",
    end_time: "2025-02-10 17:00:00",
    summary: "Developed new API features",
  },
  {
    employee_id: 2,
    start_time: "2025-02-11 12:00:00",
    end_time: "2025-02-11 17:00:00",
    summary: "Conducted interviews for new hires",
  },
  {
    employee_id: 3,
    start_time: "2025-02-12 07:00:00",
    end_time: "2025-02-12 16:00:00",
    summary: "Analyzed sales data and prepared reports",
  },
];

const insertData = (table, data) => {
  const columns = Object.keys(data[0]).join(", ");
  const placeholders = Object.keys(data[0])
    .map(() => "?")
    .join(", ");

  const insertStmt = db.prepare(
    `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`
  );

  data.forEach((row) => {
    insertStmt.run(Object.values(row));
  });

  insertStmt.finalize();
};

db.serialize(() => {
  insertData("employees", employees);
  insertData("timesheets", timesheets);
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Database seeded successfully.");
  }
});
