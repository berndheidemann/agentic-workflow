/// <reference path="../node_modules/pocketbase/jsvm.d.ts" />

// REQ-075: DSGVO-Löschkonzept — Klasse archivieren
//
// Custom API endpoint: POST /api/classes/:classId/archive
//
// Authentication: Requires teacher auth. The authenticated teacher must be
// the creator (created_by) of the class.
//
// Effects (in order):
//   1. Sets class.is_active = false (class remains for teacher reference)
//   2. Finds all students with class_id = classId
//   3. Deletes all progress records for each student
//   4. Deletes all course_unlocks records for each student (user_id-specific)
//   5. Deletes all class-level course_unlocks (class_id match, any user_id)
//   6. Deletes all student user accounts
//
// Returns: { archived: true, deletedStudents: number }
// Errors: 401 (not authenticated), 403 (not owner), 404 (class not found), 500 (server error)

routerAdd("POST", "/api/classes/{classId}/archive", (e) => {
  // ─── 1. Auth check: teacher must be logged in ────────────────────────────────
  const authRecord = e.auth;
  if (!authRecord) {
    throw new UnauthorizedError("Authentifizierung erforderlich.");
  }

  const role = authRecord.getString("role");
  if (role !== "teacher") {
    throw new ForbiddenError("Nur Lehrer können Klassen archivieren.");
  }

  // ─── 2. Load class and verify ownership ─────────────────────────────────────
  const classId = e.request.pathValue("classId");

  let classRecord;
  try {
    classRecord = e.app.findRecordById("classes", classId);
  } catch (_) {
    throw new NotFoundError("Klasse nicht gefunden.");
  }

  const createdBy = classRecord.getString("created_by");
  if (createdBy !== authRecord.id) {
    throw new ForbiddenError("Du hast keine Berechtigung, diese Klasse zu archivieren.");
  }

  // ─── 3. Mark class as inactive ───────────────────────────────────────────────
  classRecord.set("is_active", false);
  e.app.save(classRecord);

  // ─── 4. Find all students in this class ─────────────────────────────────────
  let students;
  try {
    students = e.app.findRecordsByFilter(
      "users",
      "class_id = {:classId}",
      "",
      0,
      0,
      { classId: classId }
    );
  } catch (_) {
    students = [];
  }

  // ─── 5. Delete data for each student ────────────────────────────────────────
  for (const student of students) {
    const studentId = student.id;

    // 5a. Delete progress records
    let progressRecords;
    try {
      progressRecords = e.app.findRecordsByFilter(
        "progress",
        "user_id = {:userId}",
        "",
        0,
        0,
        { userId: studentId }
      );
    } catch (_) {
      progressRecords = [];
    }
    for (const rec of progressRecords) {
      try { e.app.delete(rec); } catch (_) {}
    }

    // 5b. Delete user-specific course_unlocks
    let userUnlocks;
    try {
      userUnlocks = e.app.findRecordsByFilter(
        "course_unlocks",
        "user_id = {:userId}",
        "",
        0,
        0,
        { userId: studentId }
      );
    } catch (_) {
      userUnlocks = [];
    }
    for (const rec of userUnlocks) {
      try { e.app.delete(rec); } catch (_) {}
    }

    // 5c. Delete the student account
    try { e.app.delete(student); } catch (_) {}
  }

  // ─── 6. Delete class-level course_unlocks ───────────────────────────────────
  let classUnlocks;
  try {
    classUnlocks = e.app.findRecordsByFilter(
      "course_unlocks",
      "class_id = {:classId}",
      "",
      0,
      0,
      { classId: classId }
    );
  } catch (_) {
    classUnlocks = [];
  }
  for (const rec of classUnlocks) {
    try { e.app.delete(rec); } catch (_) {}
  }

  // ─── 7. Return result ────────────────────────────────────────────────────────
  e.json(200, {
    archived: true,
    deletedStudents: students.length,
  });
});
