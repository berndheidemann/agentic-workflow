/// <reference path="../node_modules/pocketbase/jsvm.d.ts" />

// REQ-008: Validate PIN and join_code on user registration.
// Sync: packages/shared/src/validation/pin.ts and join-code.ts must implement the same logic.
//
// Validation rules:
// - PIN (password): exactly 4 digits (0-9)
// - join_code: must reference an existing active class (if provided)

function isValidPin(pin) {
  return /^\d{4}$/.test(pin);
}

// Validate user creation (registration).
onRecordCreateRequest((e) => {
  // PIN validation: password must be exactly 4 digits
  const password = e.requestInfo().body['password'] || '';
  if (!isValidPin(password)) {
    throw new BadRequestError('PIN muss genau 4 Ziffern enthalten.');
  }

  // join_code validation: if provided, the referenced class must exist and be active
  const classId = e.record.get('class_id');
  if (classId) {
    let classRecord;
    try {
      classRecord = e.app.findRecordById('classes', classId);
    } catch (_) {
      throw new BadRequestError('Klassen-Code ungültig oder Klasse nicht gefunden.');
    }

    if (!classRecord.getBool('is_active')) {
      throw new BadRequestError('Diese Klasse ist nicht mehr aktiv.');
    }
  }

  e.next();
}, 'users');
