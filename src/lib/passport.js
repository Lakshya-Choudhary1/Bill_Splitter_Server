import { nanoid } from "nanoid";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import env from "../config/env.js";
import { query } from "../database/pg.js";

passport.use(
  "googleStrategy",
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false);
        }

        const name = profile.displayName;
        const avatar = profile.photos?.[0]?.value;

        const result = await query(
          `
          SELECT
            id,
            name,
            email,
            is_verified,
            upi_id,
            avatar_url,
            invite_code,
            currency
          FROM users
          WHERE email=$1
          `,
          [email],
        );

        let user;

        if (result.rowCount > 0) {
          user = result.rows[0];

          // Convert an existing local account into a verified Google account.
          await query(
            `
            UPDATE users
            SET
              auth_provider='google',
              is_verified=true,
              avatar_url=$1
            WHERE id=$2
            `,
            [avatar, user.id],
          );
        } else {
          const invite_code = nanoid(env.INVITE_CODE_LENGTH);

          const newUser = await query(
            `
            INSERT INTO users
            (
              name,
              email,
              avatar_url,
              auth_provider,
              is_verified,
              invite_code
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING
              id,
              name,
              email,
              is_verified,
              upi_id,
              avatar_url,
              invite_code,
              currency
            `,
            [name, email, avatar, "google", true, invite_code],
          );

          user = newUser.rows[0];
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

// Store only the user id in the session cookie.
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Restore the current user from the database for session requests.
passport.deserializeUser(async (id, done) => {
  try {
    const result = await query(
      `
      SELECT
        id,
        name,
        email,
        is_verified,
        upi_id,
        avatar_url,
        invite_code,
        currency
      FROM users
      WHERE id=$1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return done(null, false);
    }

    return done(null, result.rows[0]);
  } catch (err) {
    return done(err, null);
  }
});
