import { query } from "../database/pg.js";

// Create a group and make the creator its admin member.
export const createGroup = async (req, res) => {
  const name = req.body.name;
  const description = req.body.description || null;
  const currency = req.body.currency || "INR";
  const user_id = req.user.id;

  if (!name?.trim()) {
    return res.status(400).json({
      message: "Missing Credential",
    });
  }

  try {
    const groupResult = await query(
      `
      INSERT INTO groups(created_by, name, description, currency)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [user_id, name, description, currency],
    );

    const group_id = groupResult.rows[0].id;

    const groupMemberResult = await query(
      `
      INSERT INTO group_members(group_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [group_id, user_id, "admin"],
    );

    return res.json({
      group: groupResult.rows[0],
      group_members: groupMemberResult.rows[0],
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR",
    });
  }
};

// Get all groups joined by the logged-in user.
export const getGroups = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await query(
      `
      SELECT
        g.id,
        g.name,
        g.description,
        g.currency,
        g.created_at,
        gm.role
      FROM groups g
      JOIN group_members gm
      ON g.id = gm.group_id
      WHERE gm.user_id = $1
      ORDER BY g.created_at ASC
      `,
      [userId],
    );

    return res.status(200).json({
      success: true,
      groups: result.rows,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Get one group and its members.
export const getGroupById = async (req, res) => {
  const id = req.params.id;

  try {
    const group = await query(
      `
      SELECT *
      FROM groups
      WHERE id = $1
      `,
      [id],
    );

    if (group.rows.length === 0) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    const members = await query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        gm.role,
        gm.joined_at
      FROM group_members gm
      JOIN users u
      ON gm.user_id = u.id
      WHERE gm.group_id = $1
      `,
      [id],
    );

    return res.status(200).json({
      group: group.rows[0],
      members: members.rows,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Update group details after confirming the requester is an admin.
export const updateGroup = async (req, res) => {
  const group_id = req.params.id;
  const user_id = req.user.id;
  const { name, description, currency } = req.body;

  try {
    const member = await query(
      `
      SELECT role
      FROM group_members
      WHERE group_id=$1
      AND user_id=$2
      `,
      [group_id, user_id],
    );

    if (member.rows.length === 0) {
      return res.status(403).json({
        message: "You are not a member of this group",
      });
    }

    if (member.rows[0].role !== "admin") {
      return res.status(403).json({
        message: "Only admin can update group",
      });
    }

    const result = await query(
      `
      UPDATE groups
      SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        currency = COALESCE($3, currency),
        updated_at = NOW()
      WHERE id=$4
      RETURNING *
      `,
      [name, description, currency, group_id],
    );

    // =========================
    // Socket notification
    // =========================

    const io = req.app.get("io");

    io.to(`group-${groupId}`).emit("group-updated", {
      group: result.rows[0],
      message: "Group updated",
    });

    return res.status(200).json({
      message: "Group updated",
      group: result.rows[0],
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Delete a group after confirming the requester is an admin.
export const deleteGroup = async (req, res) => {
  const group_id = req.params.id;
  const user_id = req.user.id;

  try {
    const member = await query(
      `
      SELECT role
      FROM group_members
      WHERE group_id=$1
      AND user_id=$2
      `,
      [group_id, user_id],
    );

    if (member.rows.length === 0) {
      return res.status(403).json({
        message: "You are not a member of this group",
      });
    }

    if (member.rows[0].role !== "admin") {
      return res.status(403).json({
        message: "Only admin can delete group",
      });
    }

    const result = await query(
      `
      DELETE FROM groups
      WHERE id=$1
      RETURNING *
      `,
      [group_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Group not found",
      });
    }

    const io = req.app.get("io");

    io.to(`group-${groupId}`).emit("group-deleted", {
      groupId,
      message: "Group deleted",
    });

    return res.status(200).json({
      message: "Group deleted successfully",
      group: result.rows[0],
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// Get all members for a group the logged-in user belongs to.
export const getMembers = async (req, res) => {
  const { groupId } = req.params;
  const user_id = req.user.id;

  try {
    const accessCheck = await query(
      `
      SELECT g.id
      FROM groups g
      JOIN group_members gm
      ON g.id = gm.group_id
      WHERE g.id = $1
      AND gm.user_id = $2
      `,
      [groupId, user_id],
    );

    if (accessCheck.rowCount === 0) {
      return res.status(403).json({
        message: "Unauthorized access.",
      });
    }

    const membersResult = await query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        gm.role,
        gm.joined_at
      FROM group_members gm
      JOIN users u
      ON gm.user_id = u.id
      WHERE gm.group_id = $1
      ORDER BY gm.joined_at ASC
      `,
      [groupId],
    );

    return res.status(200).json({
      members: membersResult.rows,
    });
  } catch (err) {
    console.log("ERROR :", err);

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR.",
    });
  }
};

// Remove a member after confirming the requester is an admin.
export const removeMember = async (req, res) => {
  const { groupId, memberId } = req.params;
  const user_id = req.user.id;

  try {
    const adminCheck = await query(
      `
      SELECT role
      FROM group_members
      WHERE group_id = $1
      AND user_id = $2
      `,
      [groupId, user_id],
    );

    if (adminCheck.rowCount === 0) {
      return res.status(403).json({
        message: "You are not a member of this group.",
      });
    }

    if (adminCheck.rows[0].role !== "admin") {
      return res.status(403).json({
        message: "Only admin can remove members.",
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

    if (memberCheck.rowCount === 0) {
      return res.status(404).json({
        message: "Member not found in this group.",
      });
    }

    if (String(user_id) === String(memberId)) {
      return res.status(400).json({
        message: "Admin cannot remove himself.",
      });
    }

    await query(
      `
      DELETE FROM group_members
      WHERE group_id = $1
      AND user_id = $2
      `,
      [groupId, memberId],
    );

    // =========================
    // Socket notification
    // =========================

    const io = req.app.get("io");

    io.to(`group-${groupId}`).emit("member-removed", {
      userId: memberId,
      message: "A member was removed",
    });

    return res.status(200).json({
      message: "Member removed successfully.",
    });
  } catch (err) {
    console.log("ERROR : ", err);

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR.",
    });
  }
};

// Add a member directly after confirming the requester is an admin.
export const addMember = async (req, res) => {
  //memberid could be email or unique invite code
  const { groupId, memberId } = req.params;
  const user_id = req.user.id;

  try {
    const adminCheck = await query(
      `
      SELECT role
      FROM group_members
      WHERE group_id = $1
      AND user_id = $2
      `,
      [groupId, user_id],
    );

    if (adminCheck.rowCount === 0) {
      return res.status(403).json({
        message: "You are not a member of this group.",
      });
    }

    if (adminCheck.rows[0].role !== "admin") {
      return res.status(403).json({
        message: "Only admin can add members.",
      });
    }

    const userCheck = await query(
      `
      SELECT id
      FROM users
      WHERE invite_id = $1 OR
      email=$1;
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
        message: "User already member of this group.",
      });
    }

    await query(
      `
      INSERT INTO group_members
      (group_id, user_id, role)
      VALUES ($1, $2, $3)
      `,
      [groupId, memberId, "member"],
    );

    return res.status(201).json({
      message: "Member added successfully.",
    });
  } catch (err) {
    console.log("ERROR : ", err);

    return res.status(500).json({
      message: "INTERNAL SERVER ERROR.",
    });
  }
};
