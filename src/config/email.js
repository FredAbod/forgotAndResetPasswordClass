const nodemailer = require('nodemailer');


exports.sendEmail = async ( msg, subject, reciever ) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'pop.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: 'fredrickbolutife@gmail.com',
                pass: "jcggyidxcnymtggw"
            },
            tls: {
                rejectUnauthorized: false
            }
        })
        const info = await transporter.sendMail({
            from: "FredAbod <fredrickbolutife@gmail.com>",
            subject: subject,
            html: msg,
            to: reciever,
        })
        return `Message sent', ${nodemailer.getTestMessageUrl(info)}`
    } catch (err) {
        console.error(err);
        throw new Error("Error sending email");
    }
}