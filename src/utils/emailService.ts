import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASS || "",
    },
});

export const sendPaymentReminderEmail = async (
    to: string,
    studentName: string,
    month: string,
    year: number
) => {
    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "gym@example.com",
        to,
        subject: `Payment Reminder - ${month} ${year}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #3498db; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0;">Payment Reminder</h1>
                </div>
                <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 16px; color: #333;">Dear <strong>${studentName}</strong>,</p>
                    <p style="font-size: 16px; color: #333;">
                        This is a friendly reminder that your gym membership payment for 
                        <strong>${month} ${year}</strong> is pending.
                    </p>
                    <p style="font-size: 16px; color: #333;">
                        Please make your payment at your earliest convenience.
                    </p>
                    <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #856404; font-weight: 600;">
                            ⚠️ Payment Due: ${month} ${year}
                        </p>
                    </div>
                    <p style="font-size: 14px; color: #666; margin-top: 30px;">
                        Best regards,<br/>
                        <strong>Gym Management Team</strong>
                    </p>
                </div>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

export const sendNotificationEmail = async (
    to: string,
    coachName: string,
    notificationDescription: string,
    unreadCount: number
) => {
    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER || "gym@example.com",
        to,
        subject: `New Notification from Coach ${coachName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #2ecc71; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="margin: 0;">🔔 New Notification</h1>
                </div>
                <div style="background-color: #f8f9fa; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
                    <p style="font-size: 16px; color: #333;">
                        You have a new notification from coach <strong>${coachName}</strong>:
                    </p>
                    <div style="background-color: #ffffff; border-left: 4px solid #2ecc71; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; font-size: 15px; color: #333;">${notificationDescription}</p>
                    </div>
                    <div style="background-color: #e8f4fd; border: 1px solid #3498db; border-radius: 6px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #1a5276; font-weight: 600;">
                            📬 You currently have <strong>${unreadCount}</strong> unread message${unreadCount !== 1 ? 's' : ''} in your inbox.
                        </p>
                    </div>
                    <p style="font-size: 14px; color: #666; margin-top: 30px;">
                        Best regards,<br/>
                        <strong>Gym Management Team</strong>
                    </p>
                </div>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
};

export default transporter;
