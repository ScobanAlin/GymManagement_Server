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
        `
        INSERT INTO gyms (name, location, capacity)
        VALUES ($1, $2, $3);
      `,
        [gym.name, gym.location, gym.capacity]
      );
    }

    const gymRes = await pool.query("SELECT id FROM gyms ORDER BY id ASC;");
    const gymIds = gymRes.rows.map((r) => r.id);
    console.log("🏋️ Gyms added:", gymIds);

    // === 2. Insert Groups (2 per gym) ===
    const groups = [];
    for (const gymId of gymIds) {
      groups.push(
        { gym_id: gymId, name: "Morning Strength", begin_time: "08:00", end_time: "10:00" },
        { gym_id: gymId, name: "Evening Cardio", begin_time: "18:00", end_time: "20:00" }
      );
    }

    for (const g of groups) {
      await pool.query(
        `
        INSERT INTO groups (gym_id, name, begin_time, end_time)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING;
      `,
        [g.gym_id, g.name, g.begin_time, g.end_time]
      );
    }

    const groupRes = await pool.query("SELECT id, gym_id FROM groups ORDER BY id ASC;");
    const groupIds = groupRes.rows.map((r) => r.id);
    console.log("👥 Groups added:", groupIds);

    // === 3. Insert Students (5 per group) ===
    let studentCounter = 1;
    const studentIds: number[] = [];

    for (const group of groupRes.rows) {
      for (let i = 0; i < 5; i++) {
        const firstName = `Student${studentCounter}`;
        const lastName = `Group${group.id}`;
        const cnp = `${Math.floor(Math.random() * 1e13)
          .toString()
          .padStart(13, "0")}`;
        const dob = `200${Math.floor(Math.random() * 5)}-0${
          1 + Math.floor(Math.random() * 8)
        }-1${Math.floor(Math.random() * 9)}`;
        const subType = Math.random() > 0.5 ? "normal" : "premium";

        const insertStudent = await pool.query(
          `
          INSERT INTO students (last_name, first_name, cnp, date_of_birth, subscription_type, status)
          VALUES ($1, $2, $3, $4, $5, 'active')
          RETURNING id;
        `,
          [lastName, firstName, cnp, dob, subType]
        );

        const studentId = insertStudent.rows[0].id;
        studentIds.push(studentId);

        // Link student to group
        await pool.query(
          `
          INSERT INTO student_group (student_id, group_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING;
        `,
          [studentId, group.id]
        );

        studentCounter++;
      }
    }

    console.log(`🧍 Added ${studentIds.length} students.`);

    // === 4. Insert Payments ===
    const months = ["January", "February", "March", "April", "May"];
    for (const studentId of studentIds) {
      const numPayments = 1 + Math.floor(Math.random() * 3); // 1–3 payments
      for (let i = 0; i < numPayments; i++) {
        const month = months[Math.floor(Math.random() * months.length)];
        const amount = Math.random() > 0.5 ? 100 : 150;
        const date = new Date(2025, Math.floor(Math.random() * 12), 10)
          .toISOString()
          .split("T")[0];

        await pool.query(
          `
          INSERT INTO payments (amount, student_id, month, payment_date)
          VALUES ($1, $2, $3, $4);
        `,
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

if (require.main === module) {
  populateDatabase();
}

export default populateDatabase;
