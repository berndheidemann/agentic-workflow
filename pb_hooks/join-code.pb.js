/// <reference path="../node_modules/pocketbase/jsvm.d.ts" />

// REQ-008: Auto-generate join_code for new classes.
// Sync: packages/shared/src/validation/join-code.ts must implement the same logic.
//
// Charset: no confusable characters (no 0/O, no 1/I/L).
// Length: 6 characters.

const JOIN_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const JOIN_CODE_LENGTH = 6;

function generateJoinCode() {
  let code = '';
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += JOIN_CODE_CHARSET[Math.floor(Math.random() * JOIN_CODE_CHARSET.length)];
  }
  return code;
}

function isValidJoinCode(code) {
  if (!code || code.length !== JOIN_CODE_LENGTH) return false;
  return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/.test(code);
}

// Generate a unique join_code before a class record is created.
onRecordCreateRequest((e) => {
  // Generate and ensure uniqueness (retry up to 10 times on collision)
  let code = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    code = generateJoinCode();
    const existing = e.app.findRecordsByFilter('classes', 'join_code = {:code}', { code });
    if (!existing || existing.length === 0) break;
    code = '';
  }

  if (!code) {
    throw new BadRequestError('Konnte keinen eindeutigen Klassen-Code generieren. Bitte versuche es erneut.');
  }

  e.record.set('join_code', code);
  e.next();
}, 'classes');
