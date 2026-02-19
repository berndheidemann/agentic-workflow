/// <reference path="../node_modules/pocketbase/jsvm.d.ts" />

// REQ-008: Validate PIN and join_code on user registration.
// REQ-013: Resolve join_code to class_id server-side to avoid unauthenticated
//          client-side class lookups (classes collection requires auth to list).
// Sync: packages/shared/src/validation/pin.ts and join-code.ts must implement the same logic.
//
// Validation rules:
// - PIN (password): exactly 4 digits (0-9)
// - join_code: must reference an existing active class (if provided)

// Validate user creation (registration).
onRecordCreateRequest((e) => {
  // Admin/superuser requests bypass PIN validation and role enforcement.
  // Teachers are created by admins directly — they use real passwords, not PINs.
  if (e.hasSuperuserAuth()) {
    e.next();
    return;
  }

  // PIN validation: password must be exactly 4 digits
  var password = e.requestInfo().body["password"] || "";
  if (!/^\d{4}$/.test(password)) {
    throw new BadRequestError('PIN muss genau 4 Ziffern enthalten.');
  }

  // Force role to "student" — teacher accounts are created by admins only.
  // This prevents role escalation: a client cannot self-assign role="teacher".
  e.record.set('role', 'student');

  // join_code resolution: resolve the human-readable join_code to a class_id.
  // This is done server-side so unauthenticated clients do not need read access
  // to the classes collection.
  const joinCode = e.requestInfo().body['join_code'];
  if (joinCode) {
    let classRecords;
    try {
      classRecords = e.app.findRecordsByFilter(
        'classes',
        'join_code = {:code} && is_active = true',
        '',
        1,
        0,
        { code: joinCode },
      );
    } catch (_) {
      throw new BadRequestError('Klassen-Code ungültig oder Klasse nicht gefunden.');
    }

    if (!classRecords || classRecords.length === 0) {
      throw new BadRequestError('Klassen-Code nicht gefunden oder Klasse nicht aktiv.');
    }

    e.record.set('class_id', classRecords[0].id);
  } else {
    // Legacy path: if class_id was set directly (e.g. by admin), validate it.
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
  }

  e.next();
}, 'users');
