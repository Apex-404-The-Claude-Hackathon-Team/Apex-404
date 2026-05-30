// Placeholder Ghana NIA / Electoral Commission verification layer.
//
// Production swap-in options:
//   - Ghana NIA API (https://nia.gov.gh) — biometric + voter ID lookup
//   - Smile Identity (smileidentity.com) — supports Ghana voter cards, passports
//
// The function contract is intentionally stable so the controller never changes
// when the underlying provider is swapped. Just replace the body below.

exports.verifyWithNIA = async ({ voterIdNumber, fullName, dateOfBirth, constituency }) => {
  // ── PLACEHOLDER ──────────────────────────────────────────────────────────
  // In production this becomes an authenticated HTTP call to the NIA/EC API.
  // Expected real response shape:
  //   { verified: boolean, confidence: number (0–1), matchedFields: string[] }
  //
  // For the hackathon demo: any well-formed submission auto-approves.

  if (!voterIdNumber || !fullName || !dateOfBirth || !constituency) {
    return { verified: false, confidence: 0, matchedFields: [], method: 'placeholder', ref: null };
  }

  return {
    verified:      true,
    confidence:    1.0,
    matchedFields: ['voterIdNumber', 'fullName', 'dateOfBirth', 'constituency'],
    method:        'placeholder',
    ref:           `DEMO-${Date.now()}`,
  };
};
