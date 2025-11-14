import "dotenv/config";
import pool from "./db";

const populateDatabase = async () => {
  try {
    console.log("🚀 Starting population...");

    // === 1. Insert Gyms ===
    const gyms = [
      { name: "Downtown Fitness Center", location: "Iași", capacity: 120 },
      { name: "Peak Performance Gym", location: "Cluj-Napoca", capacity: 100 },
    ];

    for (const gym of gyms) {
      await pool.query(
        `INSERT INTO gyms (name, location, capacity)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING;`,
        [gym.name, gym.location, gym.capacity]
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

    // === 3. Insert Classes (scheduled sessions) ===
    const sampleTimes = [
      { begin: "08:00", end: "10:00" },
      { begin: "10:00", end: "12:00" },
      { begin: "17:00", end: "19:00" },
      { begin: "19:00", end: "21:00" }
    ];

    for (const groupId of groupIds) {
      for (const gymId of gymIds) {
        const numberOfSessions = 4;

        for (let i = 0; i < numberOfSessions; i++) {
          const date = `2025-02-${String(5 + i).padStart(2, "0")}`;
          const slot = sampleTimes[Math.floor(Math.random() * sampleTimes.length)];

          await pool.query(
            `INSERT INTO classes (group_id, gym_id, class_date, begin_time, end_time)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING;`,
            [groupId, gymId, date, slot.begin, slot.end]
          );
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
    const months = ["January", "February", "March", "April", "May"];

    for (const studentId of studentIds) {
      const numPayments = 1 + Math.floor(Math.random() * 3);

      for (let i = 0; i < numPayments; i++) {
        const month = months[Math.floor(Math.random() * months.length)];
        const amount = Math.random() > 0.5 ? 100 : 150;
        const date = new Date(2025, Math.floor(Math.random() * 12), 10)
          .toISOString()
          .split("T")[0];

        await pool.query(
          `INSERT INTO payments (amount, student_id, month, payment_date)
           VALUES ($1, $2, $3, $4);`,
          [amount, studentId, month, date]
        );
      }
    }

    console.log("💸 Payments inserted successfully.");
    console.log("✅ Database population complete.");

  } catch (err) {
    console.error("❌ Error populating database:", err);
  } finally {
    await pool.end();
  }
};



export default populateDatabase;
