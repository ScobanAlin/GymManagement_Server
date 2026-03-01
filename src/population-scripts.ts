import "dotenv/config";
import pool from "./db";
import bcrypt from "bcrypt";
import { createClass } from "./models/classModel";

const populateDatabase = async () => {
  try {
    console.log("🚀 Starting population...");

    const dbInfo = await pool.query("SELECT current_database() AS db, current_user AS user;");
    console.log("🧭 Connected to:", dbInfo.rows[0]);

    const tablesToCount = [
      "users",
      "gyms",
      "groups",
      "classes",
      "students",
      "student_group",
      "payments",
      "notifications",
      "attendance",
    ];

    const logCounts = async (label: string) => {
      const counts = await Promise.all(
        tablesToCount.map(async (table) => {
          const res = await pool.query(`SELECT COUNT(*)::int AS count FROM ${table};`);
          return { table, count: res.rows[0].count };
        })
      );
      console.log(label, counts);
    };

    await logCounts("📊 Counts before truncate:");

    console.log("🧹 Truncating all data...");
    await pool.query(`
      TRUNCATE TABLE
        attendance,
        notifications,
        payments,
        student_group,
        classes,
        students,
        groups,
        gyms,
        users
      RESTART IDENTITY CASCADE;
    `);

    await logCounts("📊 Counts after truncate:");

    // === 0. Insert Users ===
    const seedPassword = process.env.SEED_PASSWORD || "Password123!";
    const passwordHash = await bcrypt.hash(seedPassword, 10);

    const users = [
      { firstName: "Admin", lastName: "User", email: "admin@gym.local", role: "admin" },
      { firstName: "Coach", lastName: "User", email: "coach@gym.local", role: "coach" },
      { firstName: "Coach", lastName: "Two", email: "coach2@gym.local", role: "coach" }
    ];

    for (const user of users) {
      await pool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, status, role)
         VALUES ($1, $2, $3, $4, 'active', $5);`,
        [user.firstName, user.lastName, user.email, passwordHash, user.role]
      );
    }

    console.log("👤 Users inserted:", users.length);

    // === 1. Insert Gyms ===
    const gyms = [
      { name: "Downtown Fitness Center", location: "Iași" },
      { name: "Peak Performance Gym", location: "Cluj-Napoca" },
    ];

    for (const gym of gyms) {
      await pool.query(
        `INSERT INTO gyms (name, location)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING;`,
        [gym.name, gym.location]
      );
    }

    const gymRes = await pool.query("SELECT id FROM gyms ORDER BY id;");
    const gymIds = gymRes.rows.map((r) => r.id);
    console.log("🏋️ Gyms added:", gymIds);

    // === 2. Insert Groups ===
    const groupNames = [
      "Kids Beginner",
      "Kids Intermediate",
      "Teens Performance",
      "Adults Strength",
      "Adults Cardio"
    ];

    for (const name of groupNames) {
      await pool.query(
        `INSERT INTO groups (name)
         VALUES ($1)
         ON CONFLICT DO NOTHING;`,
        [name]
      );
    }

    const groupRes = await pool.query("SELECT id FROM groups ORDER BY id;");
    const groupIds = groupRes.rows.map((r) => r.id);
    console.log("👥 Groups added:", groupIds);

    // === 3. Insert Classes (weekly recurring schedule) ===
    const sampleTimes = [
      { begin: "08:00", end: "10:00" },
      { begin: "10:00", end: "12:00" },
      { begin: "17:00", end: "19:00" },
      { begin: "19:00", end: "21:00" }
    ];

    const todayIso = new Date().toISOString().split("T")[0];
    const recurrenceWeeks = 52;
    let slotIndex = 0;

    for (const groupId of groupIds) {
      for (const gymId of gymIds) {
        const numberOfSessions = 4;

        for (let i = 0; i < numberOfSessions; i++) {
          const slot = sampleTimes[slotIndex % sampleTimes.length];
          slotIndex++;

          await createClass({
            groupId,
            gymId,
            classDate: todayIso,
            beginTime: slot.begin,
            endTime: slot.end,
            recurrenceWeeks,
          });
        }
      }
    }

    const classesRes = await pool.query("SELECT id FROM classes ORDER BY id;");
    const classIds = classesRes.rows.map((r) => r.id);
    console.log("📅 Classes added:", classIds.length);

    // === 4. Insert Students ===
    let studentCounter = 1;
    const studentIds = [];

    for (const groupId of groupIds) {
      for (let i = 0; i < 5; i++) {
        const firstName = `Student${studentCounter}`;
        const lastName = `G${groupId}`;

        const cnp = `${Math.floor(Math.random() * 1e13).toString().padStart(13, "0")}`;
        const dob = `200${Math.floor(Math.random() * 5)}-0${1 + Math.floor(Math.random() * 8)}-1${Math.floor(Math.random() * 9)}`;
        const subType = Math.random() > 0.5 ? "normal" : "premium";

        const studentRes = await pool.query(
          `INSERT INTO students (last_name, first_name, cnp, date_of_birth, subscription_type, status)
           VALUES ($1, $2, $3, $4, $5, 'active')
           RETURNING id;`,
          [lastName, firstName, cnp, dob, subType]
        );

        const newStudentId = studentRes.rows[0].id;
        studentIds.push(newStudentId);

        await pool.query(
          `INSERT INTO student_group (student_id, group_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING;`,
          [newStudentId, groupId]
        );

        studentCounter++;
      }
    }

    console.log(`🧍 Added ${studentIds.length} students.`);

    // === 5. Insert Payments ===
    for (const studentId of studentIds) {
      const numPayments = 1 + Math.floor(Math.random() * 3);

      for (let i = 0; i < numPayments; i++) {
        const currentYear = new Date().getFullYear();
        const randomDate = new Date(currentYear, Math.floor(Math.random() * 12), 10);
        const amount = Math.random() > 0.5 ? 100 : 150;
        const year = randomDate.getFullYear();
        const month = randomDate.getMonth() + 1;
        const date = randomDate.toISOString().split("T")[0];

        await pool.query(
          `INSERT INTO payments (amount, student_id, year, month, payment_date)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING;`,
          [amount, studentId, year, month, date]
        );
      }
    }

    console.log("💸 Payments inserted successfully.");

    // === 6. Insert Notifications ===
    const coachesRes = await pool.query(
      "SELECT id, first_name, last_name FROM users WHERE role = 'coach' ORDER BY id"
    );
    const coachIds = coachesRes.rows.map((r) => r.id);

    const notificationTemplates = [
      "Missed class on {date}",
      "Payment reminder for {month}",
      "Schedule change for next week",
      "Subscription expiring soon",
      "New personal record achieved",
      "Medical note required for absence"
    ];

    for (let i = 0; i < Math.min(20, studentIds.length * 2); i++) {
      const studentId = studentIds[Math.floor(Math.random() * studentIds.length)];
      const groupId = groupIds[Math.floor(Math.random() * groupIds.length)];
      const coachId = coachIds.length > 0 ? coachIds[Math.floor(Math.random() * coachIds.length)] : null;
      const template = notificationTemplates[Math.floor(Math.random() * notificationTemplates.length)];
      const date = new Date();
      date.setDate(date.getDate() + (i % 12));
      const monthName = date.toLocaleString("en-US", { month: "long" });

      const description = template
        .replace("{date}", date.toISOString().split("T")[0])
        .replace("{month}", monthName);

      await pool.query(
        `INSERT INTO notifications (coach_id, student_id, group_id, description, created_at)
         VALUES ($1, $2, $3, $4, $5);`,
        [coachId, studentId, groupId, description, date.toISOString()]
      );
    }

    console.log("🔔 Notifications inserted successfully.");

    // === 7. Insert Attendance Records ===
    const classesQuery = await pool.query(`
      SELECT c.id, c.group_id, c.class_date 
      FROM classes c 
      ORDER BY c.class_date DESC
    `);
    const classes = classesQuery.rows;

    let attendanceCount = 0;
    for (const classItem of classes) {
      const studentsInGroupRes = await pool.query(`
        SELECT s.id
        FROM students s
        JOIN student_group sg ON s.id = sg.student_id
        WHERE sg.group_id = $1 AND s.status = 'active'
      `, [classItem.group_id]);

      const studentsInClass = studentsInGroupRes.rows;

      for (const student of studentsInClass) {
        const attended = Math.random() > 0.2; // 80% attendance rate

        await pool.query(`
          INSERT INTO attendance (class_id, student_id, attended, recorded_at)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (class_id, student_id) DO NOTHING
        `, [classItem.id, student.id, attended, classItem.class_date]);

        attendanceCount++;
      }
    }

    console.log(`✅ Attendance records created: ${attendanceCount}`);
    console.log("✅ Database population complete.");

    await logCounts("📊 Counts after population:");

  } catch (err) {
    console.error("❌ Error populating database:", err);
  } finally {
    await pool.end();
  }
};



export default populateDatabase;
