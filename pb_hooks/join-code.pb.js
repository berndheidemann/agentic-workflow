/// <reference path="../node_modules/pocketbase/jsvm.d.ts" />

// REQ-008: Auto-generate join_code for new classes.
// Sync: packages/shared/src/validation/join-code.ts must implement the same logic.
//
// Charset: no confusable characters (no 0/O, no 1/I/L).
// Length: 6 characters.

// Generate a unique join_code before a class record is created.
onRecordCreateRequest((e) => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codeLength = 6;

  // Generate and ensure uniqueness (retry up to 10 times on collision)
  let code = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    // $security.randomStringWithAlphabet uses crypto/rand — cryptographically secure.
    code = $security.randomStringWithAlphabet(codeLength, charset);
    // findRecordsByFilter signature: (collection, filter, sort, limit, offset, params)
    const existing = e.app.findRecordsByFilter('classes', 'join_code = {:code}', '', 1, 0, { code: code });
    if (!existing || existing.length === 0) break;
    code = '';
  }

  if (!code) {
    throw new BadRequestError('Konnte keinen eindeutigen Klassen-Code generieren. Bitte versuche es erneut.');
  }

  e.record.set('join_code', code);
  e.next();
}, 'classes');
