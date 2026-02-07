import nodemailer from "nodemailer"; 
const sender_email = process.env.SENDER_EMAIL;
const sender_email_password = process.env.SENDER_EMAIL_PASSWORD;

// need to understand and change this 

export function sendMailAsync(to: string, sub: string, message: string, usermail = sender_email, password = sender_email_password, attachments = []) {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: usermail, pass: password },
    });

    return new Promise((resolve, reject) => {
        transporter.sendMail(
            {
                from: `"Recuro." <${usermail}>`,
                to: to,
                subject: sub,
                html: message,
                attachments: attachments,
            },
            (error: any, info: any) => {
                if (error) {
                    console.error("Error occurred:", error.stack);
                    reject(new Error("email_send_error"));
                } else {
                    console.log(`Email sent to ${to}: `, info.response);
                    resolve(info);
                }
            }
        );
    });
}


