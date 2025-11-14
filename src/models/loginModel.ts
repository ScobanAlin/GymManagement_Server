import db from "../db";
import bcrypt from "bcrypt";


export const checkUserLogin = async (email: string, password: string) => {
    try {
        const query = "SELECT id, last_name, first_name,password_hash, email,role FROM users WHERE email = $1";
        const result = await db.query(query, [email]);



        if (result.rows.length === 0) {
            return null;
        }

        const activequery = "SELECT status FROM users WHERE email = $1";
        const activeresult = await db.query(activequery, [email]);

        if (activeresult.rows[0].status !== 'active') {
            return null;
        }

        const user = result.rows[0];

        console.log("Password:", password);
        console.log("Stored hash:", user.password_hash);

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return null;
        }



        const { password_hash, ...safeUser } = user;
        return safeUser;
    } catch (err) {
        console.error("Error checking user login:", err);
        throw err;
    }
};