import "dotenv/config";
import pool from "./db";

const populateAttendance = async () => {
    try {
        console.log("🗓️ Starting attendance population...");

        // Get all classes
        const classesRes = await pool.query(`
      SELECT c.id, c.group_id, c.class_date 
      FROM classes c 
      ORDER BY c.class_date DESC
    `);
        const classes = classesRes.rows;

        if (classes.length === 0) {
            console.log("⚠️ No classes found. Add classes before creating attendance records.");
            return;
        }

        console.log(`Found ${classes.length} classes.`);

        let totalRecords = 0;

        for (const classItem of classes) {
            // Get all students in this class's group
            const studentsRes = await pool.query(`
        SELECT s.id 
        FROM students s
        JOIN student_group sg ON s.id = sg.student_id
        WHERE sg.group_id = $1 AND s.status = 'active'
      `, [classItem.group_id]);

            const students = studentsRes.rows;

            if (students.length === 0) {
                continue;
            }

            // Create attendance records for each student
            for (const student of students) {
                // 80% chance of attendance, 20% chance of absence
                const attended = Math.random() > 0.2;

                try {
                    await pool.query(`
            INSERT INTO attendance (class_id, student_id, attended, recorded_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (class_id, student_id) DO NOTHING
          `, [
                        classItem.id,
                        student.id,
                        attended,
                        new Date(classItem.class_date).toISOString()
                    ]);

                    totalRecords++;
                } catch (err) {
                    // Skip if already exists
                    continue;
                }
            }
        }

        console.log(`✅ Inserted ${totalRecords} attendance records.`);
    } catch (err) {
        console.error("❌ Error populating attendance:", err);
    } finally {
        await pool.end();
    }
};

populateAttendance();
