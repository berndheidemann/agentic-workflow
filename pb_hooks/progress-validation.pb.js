/// <reference path="../node_modules/pocketbase/jsvm.d.ts" />

// REQ-008: Progress validation hooks.
// Sync: packages/shared/src/validation/progress-rules.ts must implement the same logic.
//
// Rules:
// 1. Status can only ascend: started → completed (never backward)
// 2. Rate limit: max 60 progress events per hour per user
// 3. Plausibility: suspicious=true if >5 tasks completed in the last minute

// Validate and enrich new progress records.
onRecordCreateRequest((e) => {
  var RATE_LIMIT_PER_HOUR = 60;
  var SUSPICIOUS_THRESHOLD_PER_MINUTE = 5;

  var userId = e.record.get("user_id");
  var now = new Date();

  // Rate limit: count all progress events in the last hour for this user
  var oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  var oneHourAgoStr = oneHourAgo.toISOString().replace("T", " ").substring(0, 19);

  var recentEvents = e.app.findRecordsByFilter(
    "progress",
    "user_id = {:userId} && created >= {:since}",
    "",
    0,
    0,
    { userId: userId, since: oneHourAgoStr }
  );

  if (recentEvents && recentEvents.length >= RATE_LIMIT_PER_HOUR) {
    throw new BadRequestError("Rate-Limit überschritten. Bitte warte einen Moment.");
  }

  // Plausibility: count completed events in the last minute
  var oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  var oneMinuteAgoStr = oneMinuteAgo.toISOString().replace("T", " ").substring(0, 19);

  var recentCompleted = e.app.findRecordsByFilter(
    "progress",
    'user_id = {:userId} && status = "completed" && created >= {:since}',
    "",
    0,
    0,
    { userId: userId, since: oneMinuteAgoStr }
  );

  var suspicious = recentCompleted ? recentCompleted.length > SUSPICIOUS_THRESHOLD_PER_MINUTE : false;
  e.record.set("suspicious", suspicious);
  e.next();
}, "progress");

// Validate and enrich updated progress records.
onRecordUpdateRequest((e) => {
  var STATUS_ORDER = { started: 0, completed: 1 };
  var RATE_LIMIT_PER_HOUR = 60;
  var SUSPICIOUS_THRESHOLD_PER_MINUTE = 5;

  // Load the current record from the database to check existing status
  var currentRecord = e.app.findRecordById("progress", e.record.getId());
  var currentStatus = currentRecord.getString("status");
  var nextStatus = e.record.getString("status");

  var currentOrder = STATUS_ORDER[currentStatus] !== undefined ? STATUS_ORDER[currentStatus] : -1;
  var nextOrder = STATUS_ORDER[nextStatus] !== undefined ? STATUS_ORDER[nextStatus] : -1;

  if (nextOrder < currentOrder) {
    throw new BadRequestError(
      "Status kann nicht zurückgesetzt werden (started → completed, nie zurück)."
    );
  }

  var userId = e.record.get("user_id");
  var now = new Date();
  var oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  var oneHourAgoStr = oneHourAgo.toISOString().replace("T", " ").substring(0, 19);

  var recentEvents = e.app.findRecordsByFilter(
    "progress",
    "user_id = {:userId} && created >= {:since}",
    "",
    0,
    0,
    { userId: userId, since: oneHourAgoStr }
  );

  if (recentEvents && recentEvents.length >= RATE_LIMIT_PER_HOUR) {
    throw new BadRequestError("Rate-Limit überschritten. Bitte warte einen Moment.");
  }

  var oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  var oneMinuteAgoStr = oneMinuteAgo.toISOString().replace("T", " ").substring(0, 19);

  var recentCompleted = e.app.findRecordsByFilter(
    "progress",
    'user_id = {:userId} && status = "completed" && created >= {:since}',
    "",
    0,
    0,
    { userId: userId, since: oneMinuteAgoStr }
  );

  var suspicious = recentCompleted ? recentCompleted.length > SUSPICIOUS_THRESHOLD_PER_MINUTE : false;
  if (suspicious || currentRecord.getBool("suspicious")) {
    e.record.set("suspicious", true);
  }

  e.next();
}, "progress");

// Defense-in-depth: additional validation layer for all progress mutations.
onRecordValidate((e) => {
  var status = e.record.getString("status");
  if (status !== "started" && status !== "completed") {
    throw new BadRequestError("Ungültiger Status-Wert.");
  }
}, "progress");
