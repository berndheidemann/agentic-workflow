/// <reference path="../node_modules/pocketbase/jsvm.d.ts" />

// REQ-008: Progress validation hooks.
// Sync: packages/shared/src/validation/progress-rules.ts must implement the same logic.
//
// Rules:
// 1. Status can only ascend: started → completed (never backward)
// 2. Rate limit: max 60 progress events per hour per user
// 3. Plausibility: suspicious=true if >5 tasks completed in the last minute

const RATE_LIMIT_PER_HOUR = 60;
const SUSPICIOUS_THRESHOLD_PER_MINUTE = 5;

const STATUS_ORDER = { started: 0, completed: 1 };

function isStatusUpgrade(current, next) {
  const currentOrder = STATUS_ORDER[current] ?? -1;
  const nextOrder = STATUS_ORDER[next] ?? -1;
  return nextOrder >= currentOrder;
}

function isSuspiciousRate(completedInLastMinute) {
  return completedInLastMinute > SUSPICIOUS_THRESHOLD_PER_MINUTE;
}

/**
 * Apply rate limiting and plausibility check.
 * Returns the suspicious flag value.
 */
function checkRateAndPlausibility(e) {
  const userId = e.record.get('user_id');
  const now = new Date();

  // Rate limit: count all progress events in the last hour for this user
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneHourAgoStr = oneHourAgo.toISOString().replace('T', ' ').substring(0, 19);

  const recentEvents = e.app.findRecordsByFilter(
    'progress',
    'user_id = {:userId} && created >= {:since}',
    { userId, since: oneHourAgoStr },
  );

  if (recentEvents && recentEvents.length >= RATE_LIMIT_PER_HOUR) {
    throw new BadRequestError('Rate-Limit überschritten. Bitte warte einen Moment.');
  }

  // Plausibility: count completed events in the last minute
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  const oneMinuteAgoStr = oneMinuteAgo.toISOString().replace('T', ' ').substring(0, 19);

  const recentCompleted = e.app.findRecordsByFilter(
    'progress',
    'user_id = {:userId} && status = "completed" && created >= {:since}',
    { userId, since: oneMinuteAgoStr },
  );

  return isSuspiciousRate(recentCompleted ? recentCompleted.length : 0);
}

// Validate and enrich new progress records.
onRecordCreateRequest((e) => {
  const suspicious = checkRateAndPlausibility(e);
  // Server sets suspicious — client cannot override this field
  e.record.set('suspicious', suspicious);
  e.next();
}, 'progress');

// Validate and enrich updated progress records.
onRecordUpdateRequest((e) => {
  // Load the current record from the database to check existing status
  const currentRecord = e.app.findRecordById('progress', e.record.getId());
  const currentStatus = currentRecord.getString('status');
  const nextStatus = e.record.getString('status');

  if (!isStatusUpgrade(currentStatus, nextStatus)) {
    throw new BadRequestError(
      'Status kann nicht zurückgesetzt werden (started → completed, nie zurück).',
    );
  }

  const suspicious = checkRateAndPlausibility(e);
  // Re-evaluate suspicious on every update; once flagged, stays flagged
  if (suspicious || currentRecord.getBool('suspicious')) {
    e.record.set('suspicious', true);
  }

  e.next();
}, 'progress');

// Defense-in-depth: additional validation layer for all progress mutations.
onRecordValidate((e) => {
  // This fires for both create and update.
  // For updates, the pre-update hook already blocked downgrades.
  // This hook provides a secondary check in case the update hook is bypassed.
  const status = e.record.getString('status');
  if (status !== 'started' && status !== 'completed') {
    throw new BadRequestError('Ungültiger Status-Wert.');
  }
}, 'progress');
