export const IN_MOBILE = /^[6-9]\d{9}$/;
export const PINCODE = /^[1-9]\d{5}$/;
export const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PERSON_NAME = /^[A-Za-z][A-Za-z .']{1,79}$/;
export const OTP = /^\d{6}$/;

export function digitsOnly(value: string, max = 10) {
  return value.replace(/\D/g, "").slice(0, max);
}

export function validatePhone(phone: string): string | null {
  const cleaned = digitsOnly(phone, 10);
  if (!cleaned) return "Mobile number is required";
  if (cleaned.length !== 10) return "Enter a 10-digit mobile number";
  if (!IN_MOBILE.test(cleaned)) return "Indian mobile numbers start with 6, 7, 8 or 9";
  return null;
}

export function validateOtp(otp: string): string | null {
  const cleaned = digitsOnly(otp, 6);
  if (!cleaned) return "OTP is required";
  if (!OTP.test(cleaned)) return "OTP must be 6 digits";
  return null;
}

export type ProfileForm = {
  name: string;
  gender: string;
  email: string;
  companyName: string;
  gstin: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
};

export function validateProfile(form: ProfileForm, gstCode?: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = form.name.trim();
  if (name.length < 2) errors.name = "Enter your full name";
  else if (!PERSON_NAME.test(name)) errors.name = "Name can only contain letters, spaces, and apostrophes";

  if (!["male", "female", "other"].includes(form.gender)) errors.gender = "Select a gender";

  const email = form.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address";

  if (form.companyName.trim() && form.companyName.trim().length < 2) {
    errors.companyName = "Enter a valid company name";
  }

  const gstin = form.gstin.trim().toUpperCase();
  if (gstin) {
    if (!GSTIN.test(gstin)) errors.gstin = "Enter a valid 15-character GSTIN";
    else if (gstCode && gstin.slice(0, 2) !== gstCode) {
      errors.gstin = `GSTIN should start with ${gstCode} for the selected state`;
    }
  }

  if (form.line1.trim().length < 3) errors.line1 = "Enter street / factory address";
  if (!form.stateCode) errors.state = "Select a state";
  if (!form.city) errors.city = "Select a city";
  if (!PINCODE.test(form.pincode.trim())) errors.pincode = "PIN code must be a 6-digit number";

  return errors;
}

export function applyApiFieldErrors(
  issues: Array<{ path?: string; message?: string }>,
  fallback?: string
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const issue of issues || []) {
    const path = String(issue.path || "").split(".").pop() || "";
    if (path && issue.message) next[path] = issue.message;
  }
  if (!Object.keys(next).length && fallback) next.form = fallback;
  return next;
}
