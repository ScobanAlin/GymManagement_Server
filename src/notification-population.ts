import "dotenv/config";
import pool from "./db";

const populateNotifications = async () => {
    try {
        console.log("🔔 Starting notification population...");

        const studentsRes = await pool.query(
            "SELECT id, first_name, last_name FROM students ORDER BY id"
        );
        const groupsRes = await pool.query("SELECT id, name FROM groups ORDER BY id");
        const coachesRes = await pool.query(
            "SELECT id, first_name, last_name FROM users WHERE role = 'coach' ORDER BY id"
        );

        const students = studentsRes.rows;
        const groups = groupsRes.rows;
        const coaches = coachesRes.rows;

        if (students.length === 0) {
            console.log("⚠️ No students found. Add students before creating notifications.");
            return;
        }

        const templates = [
            "Missed class on {date}",
            "Payment reminder for {month}",
            "Schedule change for next week",
            "Subscription expiring soon",
            "New personal record achieved",
            "Medical note required for absence"
        ];

        const insertCount = Math.min(30, students.length * 3);

        for (let i = 0; i < insertCount; i++) {
            const student = students[Math.floor(Math.random() * students.length)];
            const group = groups.length > 0 ? groups[Math.floor(Math.random() * groups.length)] : null;
            const coach = coaches.length > 0 ? coaches[Math.floor(Math.random() * coaches.length)] : null;
            const template = templates[Math.floor(Math.random() * templates.length)];
            const createdAt = new Date(Date.now() - i * 86400000);
            const monthName = createdAt.toLocaleString("en-US", { month: "long" });

            const description = template
                .replace("{date}", createdAt.toISOString().split("T")[0])
                .replace("{month}", monthName);

            await pool.query(
                `INSERT INTO notifications (coach_id, student_id, group_id, description, created_at)
         VALUES ($1, $2, $3, $4, $5);`,
                [coach?.id || null, student.id, group?.id || null, description, createdAt.toISOString()]
            );
        }

        console.log(`✅ Inserted ${insertCount} notifications.`);
    } catch (err) {
        console.error("❌ Error populating notifications:", err);
    } finally {
        await pool.end();
    }
};

populateNotifications();
