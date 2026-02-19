/// <reference path="../node_modules/pocketbase/jsvm.d.ts" />

// Seed: Create initial teacher account for testing/smoke-tests
// Teachers log in with username + password (no PIN validation).
// The PIN validation hook only applies to student registrations (onRecordCreateRequest).
// Teacher accounts are created via admin/migration, bypassing the hook.
// Password: "1234" (4-digit PIN for smoke tests — change in production!)

migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  const record = new Record(collection);
  record.set("username", "testlehrer");
  record.set("email", "testlehrer@lernplattform.local");
  record.set("role", "teacher");
  record.setPassword("1234");

  app.save(record);
}, (app) => {
  try {
    const record = app.findFirstRecordByData("users", "username", "testlehrer");
    app.delete(record);
  } catch (_) {
    // ignore if not found
  }
});
