import { query } from "../database/pg.js";

// Create an invitation after confirming the requester is a group admin.
export const createInvitation = async (req, res) => {
  const groupId = req.params.groupId;
  const { memberId } = req.body;
  const userId = req.user.id;

  try {
    const groupCheck = await query(
      `
      SELECT id
      FROM groups
      WHERE id = $1
      `,
      [groupId],
    );

    if (groupCheck.rowCount === 0) {
      return res.status(404).json({
        message: "Group not found.",
      });
    }

    const adminCheck = await query(
      `
      SELECT role
      FROM group_members
      WHERE group_id = $1
      AND user_id = $2
      `,
      [groupId, userId],
    );

    if (adminCheck.rowCount === 0) {
      return res.status(403).json({
        message: "You are not a member of this group.",
      });
    }

    if (adminCheck.rows[0].role !== "admin") {
      return res.status(403).json({
        message: "Only admin can send invitation.",
      });
    }

    const userCheck = await query(
      `
      SELECT id
      FROM users
      WHERE id = $1
      `,
      [memberId],
    );

    if (userCheck.rowCount === 0) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const memberCheck = await query(
      `
      SELECT *
      FROM group_members
      WHERE group_id = $1
      AND user_id = $2
      `,
      [groupId, memberId],
    );

    if (memberCheck.rowCount > 0) {
      return res.status(400).json({
        message: "User already in group.",
      });
    }

    const inviteCheck = await query(
      `
      SELECT *
      FROM group_invitations
      WHERE group_id=$1
      AND invited_user=$2
      AND status='pending'
      `,
      [groupId, memberId],
    );

    if (inviteCheck.rowCount > 0) {
      return res.status(400).json({
        message: "Invitation already sent.",
      });
    }

    await query(
      `
      INSERT INTO group_invitations
      (
        group_id,
        invited_by,
        invited_user,
        status
      )
      VALUES ($1, $2, $3, $4)
      `,
      [groupId, userId, memberId, "pending"],
    );

    return res.status(201).json({
      message: "Invitation sent successfully.",
    });
  } catch (err) {
    console.log("ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error.",
    });
  }
};

// Get pending invitations for the logged-in user.
export const getInvitations = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await query(
      `
      SELECT
        i.id,
        i.status,
        i.created_at,
        g.id AS group_id,
        g.name AS group_name,
        u.id AS invited_by_id,
        u.name AS invited_by_name,
        u.email AS invited_by_email
      FROM group_invitations i
      JOIN groups g
      ON i.group_id = g.id
      JOIN users u
      ON i.invited_by = u.id
      WHERE i.invited_user = $1
      AND i.status = 'pending'
      ORDER BY i.created_at DESC
      `,
      [userId],
    );

    return res.status(200).json({
      invitations: result.rows,
    });
  } catch (err) {
    console.log("ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error.",
    });
  }
};

// Reject a pending invitation owned by the logged-in user.
export const rejectInvitation = async (req, res) => {
  const { invitationId } = req.params;
  const userId = req.user.id;

  try {
    const result = await query(
      `
      UPDATE group_invitations
      SET status = 'rejected'
      WHERE id = $1
      AND invited_user = $2
      AND status = 'pending'
      RETURNING *
      `,
      [invitationId, userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Invitation not found or already processed.",
      });
    }

    return res.status(200).json({
      message: "Invitation rejected.",
    });
  } catch (err) {
    console.log("ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error.",
    });
  }
};

// Accept an invitation and add the user as a group member.
export const acceptInvitation = async (req, res) => {
  const { invitationId } = req.params;
  const userId = req.user.id;

  try {
    const invitation = await query(
      `
      SELECT *
      FROM group_invitations
      WHERE id = $1
      AND invited_user = $2
      `,
      [invitationId, userId],
    );

    if (invitation.rowCount === 0) {
      return res.status(404).json({
        message: "Invitation not found.",
      });
    }

    const invite = invitation.rows[0];

    if (invite.status !== "pending") {
      return res.status(400).json({
        message: "Invitation already processed.",
      });
    }

    await query(
      `
      INSERT INTO group_members
      (
        group_id,
        user_id,
        role
      )
      VALUES ($1, $2, $3)
      `,
      [invite.group_id, userId, "member"],
    );

    await query(
      `
      UPDATE group_invitations
      SET status = 'accepted'
      WHERE id = $1
      `,
      [invitationId],
    );

    return res.status(200).json({
      message: "Invitation accepted.",
    });
  } catch (err) {
    console.log("ERROR:", err);

    return res.status(500).json({
      message: "Internal Server Error.",
    });
  }
};
