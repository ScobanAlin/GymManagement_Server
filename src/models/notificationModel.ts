import pool from "../db";

export const getAllNotifications = async (search?: string) => {
    const hasSearch = Boolean(search && search.trim());
    const searchValue = `%${search?.trim() || ""}%`;

    const query = `
    SELECT
      n.id,
      n.description,
      n.created_at AS "createdAt",
      n.is_read AS "isRead",
      n.student_id AS "studentId",
      n.group_id AS "groupId",
      n.coach_id AS "coachId",
      s.first_name AS "studentFirstName",
      s.last_name AS "studentLastName",
      g.name AS "groupName",
      u.first_name AS "coachFirstName",
      u.last_name AS "coachLastName"
    FROM notifications n
    LEFT JOIN students s ON n.student_id = s.id
    LEFT JOIN groups g ON n.group_id = g.id
    LEFT JOIN users u ON n.coach_id = u.id
    ${hasSearch ? "WHERE (n.description ILIKE $1 OR s.first_name ILIKE $1 OR s.last_name ILIKE $1 OR g.name ILIKE $1 OR u.first_name ILIKE $1 OR u.last_name ILIKE $1)" : ""}
    ORDER BY n.created_at DESC, n.id DESC
  `;

    const params = hasSearch ? [searchValue] : [];
    const result = await pool.query(query, params);
    return result.rows;
};

export const updateNotificationRead = async (id: number, isRead: boolean) => {
    const result = await pool.query(
        `UPDATE notifications SET is_read = $1 WHERE id = $2 RETURNING id, is_read AS "isRead"`,
        [isRead, id]
    );
    return result.rows[0];
};

export const deleteNotification = async (id: number) => {
    const result = await pool.query(
        `DELETE FROM notifications WHERE id = $1 RETURNING id`,
        [id]
    );
    return result.rows.length > 0;
};

export const createNotification = async (data: {
    description: string;
    studentId?: number | null;
    groupId?: number | null;
    coachId?: number | null;
}) => {
    const result = await pool.query(
        `INSERT INTO notifications (description, student_id, group_id, coach_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, description, student_id AS "studentId", group_id AS "groupId", coach_id AS "coachId", created_at AS "createdAt", is_read AS "isRead"`,
        [data.description, data.studentId ?? null, data.groupId ?? null, data.coachId ?? null]
    );
    return result.rows[0];
};
