const nodemailer = require('nodemailer');
// Create a transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'vrevankar@wpi.edu', // Your Outlook email address
        pass: '' // Your Outlook password or application-specific password
    }
});

exports.sendMail = (message) => {
    // Email message options
    let mailOptions = {
        from: 'vrevankar@wpi.edu', // Sender address
        to: "vinayakrevankar1996@gmail.com", // List of recipients
        subject: 'Job Available', // Subject line
        html: message
    };

    // Send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}