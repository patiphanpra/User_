package handlers

import (
	"testing"
	"time"
)

func mustParseDate(t *testing.T, s string) time.Time {
	t.Helper()
	d, err := time.Parse("2006-01-02", s)
	if err != nil {
		t.Fatalf("failed to parse fixture date %q: %v", s, err)
	}
	return d
}

func TestParseDeathDate_Empty(t *testing.T) {
	now := mustParseDate(t, "2026-06-20")
	_, errMsg := parseDeathDate("", now)
	if errMsg == "" {
		t.Error("expected an error message for empty death_date, got none")
	}
}

func TestParseDeathDate_InvalidFormat(t *testing.T) {
	now := mustParseDate(t, "2026-06-20")
	cases := []string{"20/06/2026", "2026/06/20", "not-a-date", "2026-13-01"}
	for _, c := range cases {
		_, errMsg := parseDeathDate(c, now)
		if errMsg == "" {
			t.Errorf("expected an error message for invalid format %q, got none", c)
		}
	}
}

func TestParseDeathDate_FutureDateRejected(t *testing.T) {
	now := mustParseDate(t, "2026-06-20")
	_, errMsg := parseDeathDate("2026-06-21", now)
	if errMsg == "" {
		t.Error("expected an error for a date after 'now', got none")
	}
}

func TestParseDeathDate_TodayIsAllowed(t *testing.T) {
	now := mustParseDate(t, "2026-06-20")
	_, errMsg := parseDeathDate("2026-06-20", now)
	if errMsg != "" {
		t.Errorf("expected today's date to be accepted, got error: %q", errMsg)
	}
}

func TestParseDeathDate_PastDateAccepted(t *testing.T) {
	now := mustParseDate(t, "2026-06-20")
	got, errMsg := parseDeathDate("2026-02-12", now)
	if errMsg != "" {
		t.Fatalf("expected past date to be accepted, got error: %q", errMsg)
	}
	want := mustParseDate(t, "2026-02-12")
	if !got.Equal(want) {
		t.Errorf("parsed date = %v, want %v", got, want)
	}
}

func TestValidateCertificateFile_TooLarge(t *testing.T) {
	errMsg := validateCertificateFile(11*1024*1024, "application/pdf")
	if errMsg == "" {
		t.Error("expected an error for an 11MB file (limit is 10MB), got none")
	}
}

func TestValidateCertificateFile_AtSizeLimit(t *testing.T) {
	errMsg := validateCertificateFile(10*1024*1024, "application/pdf")
	if errMsg != "" {
		t.Errorf("expected exactly 10MB to be accepted, got error: %q", errMsg)
	}
}

func TestValidateCertificateFile_DisallowedMimeType(t *testing.T) {
	cases := []string{"application/zip", "text/plain", "image/gif", ""}
	for _, mt := range cases {
		errMsg := validateCertificateFile(1024, mt)
		if errMsg == "" {
			t.Errorf("expected an error for disallowed mime type %q, got none", mt)
		}
	}
}

func TestValidateCertificateFile_AllowedMimeTypes(t *testing.T) {
	cases := []string{"image/jpeg", "image/png", "application/pdf"}
	for _, mt := range cases {
		errMsg := validateCertificateFile(1024, mt)
		if errMsg != "" {
			t.Errorf("expected mime type %q to be accepted, got error: %q", mt, errMsg)
		}
	}
}
