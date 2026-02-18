/// <reference path="../node_modules/pocketbase/jsvm.d.ts" />

// REQ-003: PocketBase Schema — Collections, Fields, Indexes, API Rules
// Collections created in order: classes → users (auth) → course_unlocks → progress
// Sync: TypeScript types in packages/shared/src/schema/collections.ts must match this schema.

migrate(
  (app) => {
    // ─── 1. classes ────────────────────────────────────────────────────────────
    const classes = new Collection({
      type: "base",
      name: "classes",
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.role = "teacher"',
      updateRule: '@request.auth.role = "teacher"',
      deleteRule: null,
      fields: [
        {
          type: "text",
          name: "name",
          required: true,
        },
        {
          type: "text",
          name: "join_code",
          required: true,
        },
        {
          type: "text",
          name: "school_year",
          required: true,
        },
        {
          type: "bool",
          name: "is_active",
          required: false,
        },
        {
          type: "relation",
          name: "created_by",
          required: true,
          // Will be patched after users collection exists
          collectionId: "_pb_users_auth_",
          maxSelect: 1,
          cascadeDelete: false,
        },
      ],
      indexes: ["CREATE UNIQUE INDEX idx_classes_join_code ON classes (join_code)"],
    });
    app.save(classes);

    // ─── 2. users (Auth Collection) ─────────────────────────────────────────────
    // PocketBase Auth collections have built-in: id, email, emailVisibility,
    // verified, password, tokenKey, username, created, updated
    // We add: role, class_id, display_name
    const users = new Collection({
      type: "auth",
      name: "users",
      // Auth rules — students can view/update their own record; teachers see all
      listRule: '@request.auth.id != ""',
      viewRule: 'id = @request.auth.id || @request.auth.role = "teacher"',
      createRule: "",
      updateRule: 'id = @request.auth.id || @request.auth.role = "teacher"',
      deleteRule: null,
      fields: [
        {
          type: "select",
          name: "role",
          required: true,
          values: ["student", "teacher"],
          maxSelect: 1,
        },
        {
          type: "relation",
          name: "class_id",
          required: false,
          collectionId: classes.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          type: "text",
          name: "display_name",
          required: false,
        },
      ],
      // Auth options: username + password login (PINs for students, passwords for teachers)
      // minPasswordLength = 4 to allow 4-digit PINs for students
      passwordAuth: {
        enabled: true,
        identityFields: ["username", "email"],
      },
      indexes: [],
    });
    app.save(users);

    // Patch classes.created_by to point to the real users collection id
    const classesCollection = app.findCollectionByNameOrId("classes");
    for (const field of classesCollection.fields) {
      if (field.name === "created_by") {
        field.collectionId = users.id;
      }
    }
    app.save(classesCollection);

    // ─── 3. course_unlocks ──────────────────────────────────────────────────────
    const courseUnlocks = new Collection({
      type: "base",
      name: "course_unlocks",
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.role = "teacher"',
      updateRule: '@request.auth.role = "teacher"',
      deleteRule: null,
      fields: [
        {
          type: "relation",
          name: "class_id",
          required: true,
          collectionId: classes.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          // nullable: user_id is for future individual unlocking
          type: "relation",
          name: "user_id",
          required: false,
          collectionId: users.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          type: "text",
          name: "course",
          required: true,
        },
        {
          type: "text",
          name: "module",
          required: true,
        },
        {
          type: "bool",
          name: "is_unlocked",
          required: false,
        },
        {
          type: "relation",
          name: "unlocked_by",
          required: true,
          collectionId: users.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          type: "autodate",
          name: "unlocked_at",
          onCreate: true,
          onUpdate: false,
        },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_course_unlocks_unique ON course_unlocks (class_id, COALESCE(user_id, ''), course, module)",
      ],
    });
    app.save(courseUnlocks);

    // ─── 4. progress ────────────────────────────────────────────────────────────
    const progress = new Collection({
      type: "base",
      name: "progress",
      listRule:
        '@request.auth.id != "" && (user_id = @request.auth.id || @request.auth.role = "teacher")',
      viewRule:
        '@request.auth.id != "" && (user_id = @request.auth.id || @request.auth.role = "teacher")',
      createRule: '@request.auth.id != "" && user_id = @request.auth.id',
      updateRule: '@request.auth.id != "" && user_id = @request.auth.id',
      deleteRule: null,
      fields: [
        {
          type: "relation",
          name: "user_id",
          required: true,
          collectionId: users.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          type: "text",
          name: "course",
          required: true,
        },
        {
          type: "text",
          name: "lesson",
          required: true,
        },
        {
          type: "text",
          name: "exercise",
          required: true,
        },
        {
          type: "select",
          name: "status",
          required: true,
          values: ["started", "completed"],
          maxSelect: 1,
        },
        {
          type: "number",
          name: "score",
          required: false,
        },
        {
          type: "number",
          name: "max_score",
          required: false,
        },
        {
          type: "number",
          name: "attempts",
          required: false,
        },
        {
          type: "date",
          name: "completed_at",
          required: false,
        },
      ],
      // UNIQUE constraint: one progress record per user/course/lesson/exercise
      indexes: [
        "CREATE UNIQUE INDEX idx_progress_unique ON progress (user_id, course, lesson, exercise)",
      ],
    });
    app.save(progress);
  },

  // ─── DOWN (rollback) ─────────────────────────────────────────────────────────
  (app) => {
    for (const name of ["progress", "course_unlocks", "users", "classes"]) {
      try {
        const col = app.findCollectionByNameOrId(name);
        app.delete(col);
      } catch (_) {
        // collection may not exist — skip
      }
    }
  },
);
