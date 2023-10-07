// eslint-disable-next-line import/no-extraneous-dependencies
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // mail trap is a good email dev tool

  // 1) create transporter  (service that sends email)
  try {
    console.log(process.env.EMAIL_HOST);
    console.log(process.env.EMAIL_PORT);
    console.log(process.env.EMAIL_USERNAME);
    console.log(process.env.EMAIL_PASSWORD);

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      // activate in gmail 'less secure app' option
    });

    // 2) define email options
    const mailOptions = {
      from: 'Jason Chen <admin@test.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      // html:
    };

    // 3) send email
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log(err);
  }
};

module.exports = sendEmail;
