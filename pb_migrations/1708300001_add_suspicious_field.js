/// <reference path="../node_modules/pocketbase/jsvm.d.ts" />

// REQ-008: Add `suspicious` boolean field to progress collection.
// Separate migration to avoid modifying existing records on running instances.
// Sync: TypeScript types in packages/shared/src/schema/collections.ts must match.

migrate(
  (app) => {
    const progress = app.findCollectionByNameOrId("progress");

    progress.fields.add(
      new BoolField({
        name: "suspicious",
        required: false,
      }),
    );

    app.save(progress);
  },

  // DOWN (rollback)
  (app) => {
    const progress = app.findCollectionByNameOrId("progress");
    const field = progress.fields.getByName("suspicious");
    if (field) {
      progress.fields.removeById(field.getId());
      app.save(progress);
    }
  },
);
