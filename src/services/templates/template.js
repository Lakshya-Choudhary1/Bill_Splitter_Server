// Email used when a new user needs to verify their account.
export const verificationTemplate = (name, token) => {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Verify Email</title>
  </head>
  <body style="font-family: Arial, sans-serif; background: #f5f7fb; padding: 40px;">
    <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
      <h2 style="color: #2563eb;">Bill Splitter</h2>
      <h3>Hello ${name}</h3>
      <p>
        Welcome to Bill Splitter. Please verify your email address to activate
        your account.
      </p>
      <div style="background: #eef2ff; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
        <h1 style="letter-spacing: 8px; color: #2563eb;">${token}</h1>
      </div>
      <p>This verification code will expire in <b>15 minutes</b>.</p>
      <p style="color: #666;">
        If you did not create this account, you can ignore this email.
      </p>
      <hr>
      <small>&copy; Bill Splitter</small>
    </div>
  </body>
</html>
  `;
};

// Email used when a user requests a password reset link.
export const forgotPasswordTemplate = (email, link) => {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
  </head>
  <body style="font-family: Arial, sans-serif; background: #f5f7fb; padding: 40px;">
    <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
      <h2 style="color: #2563eb;">Bill Splitter</h2>
      <h3>Password Reset Request</h3>
      <p>We received a request to reset your password.</p>
      <a href="${link}" style="display: block; background: #2563eb; color: white; padding: 14px; text-align: center; border-radius: 8px; text-decoration: none; margin: 25px 0;">
        Reset Password
      </a>
      <p>This link will expire in <b>15 minutes</b>.</p>
      <p>Email: <b>${email}</b></p>
      <p style="color: #666;">
        If you did not request this password reset, ignore this email.
      </p>
      <hr>
      <small>&copy; Bill Splitter</small>
    </div>
  </body>
</html>
  `;
};
