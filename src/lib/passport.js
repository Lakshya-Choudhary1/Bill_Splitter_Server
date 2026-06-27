import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { query } from "../database/pg.js";
import { nanoid } from "nanoid";
import env from "../config/env.js";

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

        console.log(profile);

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
            invite_code
          FROM users
          WHERE email=$1
          `,
          [email],
        );

        let user;

        if (result.rowCount > 0) {
          user = result.rows[0];

          // if local user later logs in with google
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
            VALUES($1,$2,$3,$4,$5,$6)
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

        // sends user to serializeUser
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    },
  ),
);

// session storage
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// restore user on every request
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

    done(null, result.rows[0]);
  } catch (err) {
    done(err, null);
  }
});
