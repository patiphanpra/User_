package sms

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	sendSMSURL  = "https://api-v2.thaibulksms.com/sms"
	otpRequestURL = "https://otp.thaibulksms.com/v2/otp/request"
	otpVerifyURL  = "https://otp.thaibulksms.com/v2/otp/verify"
)

// Client talks to two related-but-distinct ThaiBulkSMS products:
//   - the plain SMS API (SendText) — used for receipt notifications, where
//     we control the message content ourselves
//   - the OTP API (RequestOTP/VerifyOTP) — used for the forgot-password
//     flow. ThaiBulkSMS generates, sends, and verifies the PIN on their
//     end; we only ever hold an opaque token, never the code itself,
//     which is both simpler and more secure than rolling our own.
//
// Both share the same key/secret credentials.
type Client struct {
	apiKey     string
	apiSecret  string
	sender     string
	httpClient *http.Client
}

func NewClient(apiKey, apiSecret, sender string) *Client {
	return &Client{
		apiKey:     apiKey,
		apiSecret:  apiSecret,
		sender:     sender,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *Client) Enabled() bool {
	return c.apiKey != "" && c.apiSecret != ""
}

type apiErrorResponse struct {
	Message string `json:"message"`
}

func (c *Client) postForm(reqURL string, form url.Values) (*http.Response, error) {
	form.Set("key", c.apiKey)
	form.Set("secret", c.apiSecret)

	req, err := http.NewRequest(http.MethodPost, reqURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, fmt.Errorf("failed to build request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	return c.httpClient.Do(req)
}

func decodeAPIError(resp *http.Response) error {
	var errResp apiErrorResponse
	_ = json.NewDecoder(resp.Body).Decode(&errResp)
	if errResp.Message != "" {
		return fmt.Errorf("sms api error: %s", errResp.Message)
	}
	return fmt.Errorf("sms api returned status %d", resp.StatusCode)
}

// SendText sends a plain-text SMS to the given Thai mobile number. The
// number can be in either local (08xxxxxxxx) or E.164 (+668xxxxxxxx)
// format — ThaiBulkSMS accepts both. Used for receipt notifications,
// where we compose the message ourselves rather than going through the
// OTP-specific flow.
func (c *Client) SendText(phone, text string) error {
	if !c.Enabled() {
		return fmt.Errorf("sms client not configured: THAIBULKSMS_API_KEY/SECRET is empty")
	}
	if phone == "" {
		return fmt.Errorf("recipient phone number is empty")
	}

	form := url.Values{}
	form.Set("msisdn", phone)
	form.Set("message", text)
	if c.sender != "" {
		form.Set("sender", c.sender)
	}

	req, err := http.NewRequest(http.MethodPost, sendSMSURL, strings.NewReader(form.Encode()))
	if err != nil {
		return fmt.Errorf("failed to build sms request: %w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")
	req.SetBasicAuth(c.apiKey, c.apiSecret)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call sms api: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return decodeAPIError(resp)
	}
	return nil
}

type otpRequestResponse struct {
	Data struct {
		Status string `json:"status"`
		Token  string `json:"token"`
	} `json:"data"`
}

// RequestOTP asks ThaiBulkSMS to generate a PIN, send it via SMS to phone,
// and returns an opaque token identifying this OTP attempt. That token —
// not the PIN itself — is what gets passed to VerifyOTP later. ThaiBulkSMS
// owns the PIN's lifecycle entirely (generation, expiry, the actual SMS
// text); we never see or store the code.
func (c *Client) RequestOTP(phone string) (token string, err error) {
	if !c.Enabled() {
		return "", fmt.Errorf("sms client not configured: THAIBULKSMS_API_KEY/SECRET is empty")
	}
	if phone == "" {
		return "", fmt.Errorf("recipient phone number is empty")
	}

	form := url.Values{}
	form.Set("msisdn", phone)

	resp, err := c.postForm(otpRequestURL, form)
	if err != nil {
		return "", fmt.Errorf("failed to call otp request api: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", decodeAPIError(resp)
	}

	var parsed otpRequestResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return "", fmt.Errorf("failed to decode otp request response: %w", err)
	}
	if parsed.Data.Token == "" {
		return "", fmt.Errorf("otp request succeeded but no token was returned")
	}

	return parsed.Data.Token, nil
}

type otpVerifyResponse struct {
	Data struct {
		Status  string `json:"status"`
		Message string `json:"message"`
	} `json:"data"`
}

// VerifyOTP checks a PIN against the attempt identified by token (as
// returned from RequestOTP). Returns nil if the PIN is correct, or an
// error describing why it wasn't (wrong code, expired token, etc.) — the
// error message comes from ThaiBulkSMS and is safe to show to the user.
func (c *Client) VerifyOTP(token, pin string) error {
	if !c.Enabled() {
		return fmt.Errorf("sms client not configured: THAIBULKSMS_API_KEY/SECRET is empty")
	}

	form := url.Values{}
	form.Set("token", token)
	form.Set("pin", pin)

	resp, err := c.postForm(otpVerifyURL, form)
	if err != nil {
		return fmt.Errorf("failed to call otp verify api: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return decodeAPIError(resp)
	}

	var parsed otpVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return fmt.Errorf("failed to decode otp verify response: %w", err)
	}
	if parsed.Data.Status != "success" {
		msg := parsed.Data.Message
		if msg == "" {
			msg = "รหัส OTP ไม่ถูกต้อง"
		}
		return fmt.Errorf("%s", msg)
	}

	return nil
}
