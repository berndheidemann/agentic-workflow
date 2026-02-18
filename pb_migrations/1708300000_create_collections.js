/// <reference path="../node_modules/pocketbase/jsvm.d.ts" />

// REQ-003: PocketBase Schema — Collections, Fields, Indexes, API Rules
// PocketBase 0.36+: "users" auth collection exists by default — we extend it.
// Collections created: classes, course_unlocks, progress (+ users extended)
// Sync: TypeScript types in packages/shared/src/schema/collections.ts must match this schema.

migrate(
  (app) => {
    // ─── 1. Extend default "users" auth collection ──────────────────────────────
    // PocketBase 0.36 ships with a default "users" auth collection.
    // We add our custom fields: role, class_id, display_name.
    const users = app.findCollectionByNameOrId("users");

    // Set API rules
    users.listRule = '@request.auth.id != ""';
    users.viewRule = 'id = @request.auth.id || @request.auth.role = "teacher"';
    users.createRule = "";
    users.updateRule = 'id = @request.auth.id || @request.auth.role = "teacher"';
    users.deleteRule = null;

    // Add custom fields (in addition to built-in: id, email, etc.)
    // PB 0.36: "username" is NOT a default field on auth collections.
    // We add it explicitly so it can be used as an identity field.
    users.fields.add(
      new TextField({
        name: "username",
        required: true,
        primaryKey: false,
      }),
      new SelectField({
        name: "role",
        required: true,
        values: ["student", "teacher"],
        maxSelect: 1,
      }),
      new TextField({
        name: "display_name",
        required: false,
      }),
    );

    // Add unique index on username (required for identityFields)
    users.addIndex("idx_users_username", true, "username", "");

    // Save fields first — identityFields validation needs the fields to exist
    app.save(users);

    // Now configure password auth with both identity fields
    const usersWithFields = app.findCollectionByNameOrId("users");
    usersWithFields.passwordAuth.enabled = true;
    usersWithFields.passwordAuth.identityFields = ["username", "email"];

    app.save(usersWithFields);

    // ─── 2. classes ─────────────────────────────────────────────────────────────
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
          collectionId: users.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_classes_join_code ON classes (join_code)",
      ],
    });
    app.save(classes);

    // Now add class_id relation to users (needs classes.id)
    const usersUpdated = app.findCollectionByNameOrId("users");
    usersUpdated.fields.add(
      new RelationField({
        name: "class_id",
        required: false,
        collectionId: classes.id,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    );
    app.save(usersUpdated);

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
      indexes: [
        "CREATE UNIQUE INDEX idx_progress_unique ON progress (user_id, course, lesson, exercise)",
      ],
    });
    app.save(progress);
  },

  // ─── DOWN (rollback) ─────────────────────────────────────────────────────────
  (app) => {
    // Delete custom collections (order matters: dependants first)
    for (const name of ["progress", "course_unlocks", "classes"]) {
      try {
        const col = app.findCollectionByNameOrId(name);
        app.delete(col);
      } catch (_) {
        // collection may not exist — skip
      }
    }

    // Remove custom fields from users (don't delete the collection itself)
    try {
      const users = app.findCollectionByNameOrId("users");
      for (const fieldName of ["role", "class_id", "display_name"]) {
        const field = users.fields.getByName(fieldName);
        if (field) {
          users.fields.removeById(field.getId());
        }
      }
      app.save(users);
    } catch (_) {
      // users collection may be in unexpected state — skip
    }
  },
);
