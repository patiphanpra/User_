package repository

import "testing"

func TestNextMembershipNo_Empty(t *testing.T) {
	got := nextMembershipNo([]string{})
	want := "M0000001"
	if got != want {
		t.Errorf("nextMembershipNo(empty) = %q, want %q", got, want)
	}
}

func TestNextMembershipNo_SingleExisting(t *testing.T) {
	got := nextMembershipNo([]string{"M0000001"})
	want := "M0000002"
	if got != want {
		t.Errorf("nextMembershipNo = %q, want %q", got, want)
	}
}

func TestNextMembershipNo_PicksMaxNotLast(t *testing.T) {
	// Order in the slice should not matter — it must pick the maximum,
	// not just whatever happens to come last.
	got := nextMembershipNo([]string{"M0000005", "M0000002", "M0000009", "M0000001"})
	want := "M0000010"
	if got != want {
		t.Errorf("nextMembershipNo = %q, want %q", got, want)
	}
}

func TestNextMembershipNo_IgnoresLegacyTimestampIDs(t *testing.T) {
	// Regression test for the exact bug hit during integration testing:
	// legacy members seeded before this feature existed have 13-digit
	// timestamp-based numbers like M1775681286901. These must NOT be
	// treated as sequence numbers, or every subsequent membership_no
	// would inherit that enormous value.
	got := nextMembershipNo([]string{"M1775681286901", "M0000003"})
	want := "M0000004"
	if got != want {
		t.Errorf("nextMembershipNo = %q, want %q (legacy timestamp ID should be ignored)", got, want)
	}
}

func TestNextMembershipNo_IgnoresOldTenDigitSeedFormat(t *testing.T) {
	// The original default-admin-style seed used a 10-digit zero-padded
	// format (M0000000001), distinct from the current 7-digit format
	// (M0000001). These must also be ignored, not just 13-digit IDs.
	got := nextMembershipNo([]string{"M0000000001", "M0000002"})
	want := "M0000003"
	if got != want {
		t.Errorf("nextMembershipNo = %q, want %q (10-digit legacy ID should be ignored)", got, want)
	}
}

func TestNextMembershipNo_IgnoresNonMatchingFormats(t *testing.T) {
	got := nextMembershipNo([]string{"X1234567", "", "M123", "M00000ab", "M0000007"})
	want := "M0000008"
	if got != want {
		t.Errorf("nextMembershipNo = %q, want %q", got, want)
	}
}

func TestNextMembershipNo_AllLegacyNoValidSequential(t *testing.T) {
	// If every existing number is a legacy/non-matching format, the
	// sequence should start fresh at M0000001, not fail or panic.
	got := nextMembershipNo([]string{"M1775681286901", "M0000000999", "M0000001000"})
	want := "M0000001"
	if got != want {
		t.Errorf("nextMembershipNo = %q, want %q", got, want)
	}
}

func TestNextMembershipNo_FormatIsZeroPaddedToSevenDigits(t *testing.T) {
	got := nextMembershipNo([]string{"M9999998"})
	want := "M9999999"
	if got != want {
		t.Errorf("nextMembershipNo = %q, want %q", got, want)
	}
	if len(got) != 8 { // "M" + 7 digits
		t.Errorf("nextMembershipNo = %q, expected length 8 (M + 7 digits), got length %d", got, len(got))
	}
}
