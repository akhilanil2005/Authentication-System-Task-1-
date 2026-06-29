export const sendNotificationEmail = async (
  to: string,
  subject: string,
  message: string
) => {
  console.log("Email sent:");
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Message:", message);
};