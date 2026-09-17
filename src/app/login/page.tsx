"use client";

import { type FormEvent, type ReactNode, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, completeProfile, fetchCities, fetchStates, sendOtp, verifyOtp } from "@/lib/api";
import { syncCartAfterLogin } from "@/lib/cartActions";
import { setCredentials } from "@/store/slices/authSlice";
import { useAppDispatch } from "@/store/hooks";
import type { Gender, LocationCity, LocationState } from "@/types";
import {
  applyApiFieldErrors,
  digitsOnly,
  validateOtp,
  validatePhone,
  validateProfile,
} from "@/lib/validation";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-error">{message}</p>;
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="industrial-label" htmlFor={htmlFor}>
      {children}
      {required ? (
        <span className="ml-0.5 text-error" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/profile";
  const dispatch = useAppDispatch();
  const [step, setStep] = useState<"phone" | "otp" | "details">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [pincode, setPincode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [states, setStates] = useState<LocationState[]>([]);
  const [cities, setCities] = useState<LocationCity[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const selectedState = useMemo(
    () => states.find((s) => s.code === stateCode) || null,
    [states, stateCode]
  );

  useEffect(() => {
    if (step !== "details") return;
    let cancelled = false;
    setLoadingStates(true);
    fetchStates()
      .then((rows) => {
        if (!cancelled) setStates(rows);
      })
      .catch(() => {
        if (!cancelled) setErrors((e) => ({ ...e, state: "Could not load states. Please retry." }));
      })
      .finally(() => {
        if (!cancelled) setLoadingStates(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step]);

  useEffect(() => {
    if (!stateCode) {
      setCities([]);
      return;
    }
    let cancelled = false;
    setLoadingCities(true);
    fetchCities(stateCode)
      .then((data) => {
        if (!cancelled) setCities(data.cities || []);
      })
      .catch(() => {
        if (!cancelled) setErrors((e) => ({ ...e, city: "Could not load cities for this state." }));
      })
      .finally(() => {
        if (!cancelled) setLoadingCities(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stateCode]);

  const sendOtpHandler = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = digitsOnly(phone, 10);
    const phoneError = validatePhone(cleaned);
    if (phoneError) {
      setErrors({ phone: phoneError });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const data = await sendOtp(cleaned);
      if (data.otp) setDevOtp(data.otp);
      setPhone(cleaned);
      setStep("otp");
    } catch (err) {
      setErrors(
        applyApiFieldErrors(err instanceof ApiError ? err.errors : [], err instanceof ApiError ? err.message : "Could not send OTP. Is the API running?")
      );
    } finally {
      setBusy(false);
    }
  };

  const verifyOtpHandler = async (e: FormEvent) => {
    e.preventDefault();
    const otpError = validateOtp(otp);
    if (otpError) {
      setErrors({ otp: otpError });
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const data = await verifyOtp(phone, digitsOnly(otp, 6));
      dispatch(setCredentials({ token: data.token, user: data.user }));
      await syncCartAfterLogin(data.token);
      if (data.needsProfile) setStep("details");
      else router.push(next);
    } catch (err) {
      setErrors(
        applyApiFieldErrors(err instanceof ApiError ? err.errors : [], err instanceof ApiError ? err.message : "Invalid or expired OTP")
      );
    } finally {
      setBusy(false);
    }
  };

  const completeProfileHandler = async (e: FormEvent) => {
    e.preventDefault();
    const form = {
      name,
      gender,
      email,
      companyName,
      gstin,
      line1,
      line2,
      city,
      state: selectedState?.name || "",
      stateCode,
      pincode,
    };
    const nextErrors = validateProfile(form, selectedState?.gstCode);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setBusy(true);
    setErrors({});
    try {
      const data = await completeProfile({
        phone,
        name: name.trim(),
        gender: gender as Exclude<Gender, "">,
        email: email.trim(),
        companyName: companyName.trim(),
        gstin: gstin.trim().toUpperCase(),
        line1: line1.trim(),
        line2: line2.trim(),
        city,
        state: selectedState!.name,
        stateCode,
        pincode: pincode.trim(),
      });
      dispatch(setCredentials({ token: data.token, user: data.user }));
      await syncCartAfterLogin(data.token);
      router.push(next);
    } catch (err) {
      setErrors(
        applyApiFieldErrors(err instanceof ApiError ? err.errors : [], err instanceof ApiError ? err.message : "Could not save profile")
      );
    } finally {
      setBusy(false);
    }
  };

  const inputClass = (key: string) => `industrial-input ${errors[key] ? "is-invalid" : ""}`;

  return (
    <div className={`mx-auto px-5 py-8 sm:px-6 lg:px-8 ${step === "details" ? "max-w-5xl" : "max-w-lg"}`}>
      <h1 className="font-display mb-2 text-3xl font-bold tracking-tight text-text-primary">Sign In</h1>
      <p className="mb-6 text-base text-text-secondary">Register with your mobile number. We&apos;ll send a one-time OTP.</p>

      {step === "phone" && (
        <form onSubmit={sendOtpHandler} className="space-y-5 rounded-2xl bg-surface p-6 sm:p-8" noValidate>
          <div>
            <FieldLabel htmlFor="login-phone" required>
              Mobile Number
            </FieldLabel>
            <div className="flex gap-2">
              <span className="industrial-input flex w-16 items-center justify-center text-sm text-text-secondary">+91</span>
              <input
                id="login-phone"
                className={inputClass("phone")}
                value={phone}
                onChange={(e) => {
                  setPhone(digitsOnly(e.target.value, 10));
                  setErrors((err) => ({ ...err, phone: "", form: "" }));
                }}
                placeholder="9876543210"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                aria-invalid={Boolean(errors.phone)}
              />
            </div>
            <FieldError message={errors.phone} />
          </div>
          {errors.form ? <p className="text-sm text-error">{errors.form}</p> : null}
          <button disabled={busy} className="vj-btn vj-btn-primary h-12 w-full">
            {busy ? "Sending…" : "Send OTP"}
          </button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtpHandler} className="space-y-5 rounded-2xl bg-surface p-6 sm:p-8" noValidate>
          <p className="text-sm text-text-secondary">OTP sent to +91 {phone}</p>
          {devOtp ? <p className="text-sm font-semibold text-ink-mute">Dev OTP: {devOtp}</p> : null}
          <div>
            <FieldLabel htmlFor="login-otp" required>
              Enter OTP
            </FieldLabel>
            <input
              id="login-otp"
              className={`${inputClass("otp")} text-center tracking-[0.4em]`}
              value={otp}
              onChange={(e) => {
                setOtp(digitsOnly(e.target.value, 6));
                setErrors((err) => ({ ...err, otp: "", form: "" }));
              }}
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-invalid={Boolean(errors.otp)}
            />
            <FieldError message={errors.otp} />
          </div>
          {errors.form ? <p className="text-sm text-error">{errors.form}</p> : null}
          <button disabled={busy} className="vj-btn vj-btn-primary h-12 w-full">
            Verify OTP
          </button>
        </form>
      )}

      {step === "details" && (
        <form onSubmit={completeProfileHandler} className="rounded-2xl bg-surface p-6 sm:p-8" noValidate>
          <p className="mb-5 text-sm font-medium text-text-primary">Complete your buyer profile to continue.</p>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-dim">Personal details</p>
              <div>
                <FieldLabel htmlFor="full-name" required>
                  Full Name
                </FieldLabel>
                <input id="full-name" className={inputClass("name")} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                <FieldError message={errors.name} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="gender" required>
                    Gender
                  </FieldLabel>
                  <select id="gender" className={inputClass("gender")} value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <FieldError message={errors.gender} />
                </div>
                <div>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <input id="email" type="email" className={inputClass("email")} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="Optional" />
                  <FieldError message={errors.email} />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-dim">Company details</p>
              <div>
                <FieldLabel htmlFor="company-name">
                  Company / GST registered name
                </FieldLabel>
                <input id="company-name" className={inputClass("companyName")} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Optional" />
                <FieldError message={errors.companyName} />
              </div>
              <div>
                <FieldLabel htmlFor="gstin">
                  GSTIN
                </FieldLabel>
                <input
                  id="gstin"
                  className={`${inputClass("gstin")} uppercase`}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))}
                  placeholder={selectedState ? `${selectedState.gstCode}AAAAA0000A1Z5` : "24AAAAA0000A1Z5"}
                  maxLength={15}
                />
                <FieldError message={errors.gstin} />
              </div>
            </section>
          </div>

          <section className="mt-5 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-dim">Address</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel htmlFor="line1" required>
                  Address line 1
                </FieldLabel>
                <input id="line1" className={inputClass("line1")} value={line1} onChange={(e) => setLine1(e.target.value)} placeholder="Factory / warehouse / office" />
                <FieldError message={errors.line1} />
              </div>
              <div>
                <FieldLabel htmlFor="line2">Address line 2</FieldLabel>
                <input id="line2" className={inputClass("line2")} value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel htmlFor="state" required>
                  State
                </FieldLabel>
                <select
                  id="state"
                  className={inputClass("state")}
                  value={stateCode}
                  disabled={loadingStates}
                  onChange={(e) => {
                    setStateCode(e.target.value);
                    setCity("");
                    setErrors((err) => ({ ...err, state: "", city: "" }));
                  }}
                >
                  <option value="">{loadingStates ? "Loading states…" : "Select state"}</option>
                  {states.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.state} />
              </div>
              <div>
                <FieldLabel htmlFor="city" required>
                  City
                </FieldLabel>
                <select
                  id="city"
                  className={inputClass("city")}
                  value={city}
                  disabled={!stateCode || loadingCities}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setErrors((err) => ({ ...err, city: "" }));
                  }}
                >
                  <option value="">{!stateCode ? "Select state first" : loadingCities ? "Loading cities…" : "Select city"}</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.city} />
              </div>
              <div>
                <FieldLabel htmlFor="pincode" required>
                  PIN code
                </FieldLabel>
                <input
                  id="pincode"
                  className={inputClass("pincode")}
                  value={pincode}
                  onChange={(e) => setPincode(digitsOnly(e.target.value, 6))}
                  inputMode="numeric"
                  maxLength={6}
                />
                <FieldError message={errors.pincode} />
              </div>
            </div>
          </section>

          {errors.form ? <p className="mt-3 text-sm text-error">{errors.form}</p> : null}
          <button disabled={busy} className="vj-btn vj-btn-primary mt-5 h-12 w-full">
            {busy ? "Saving…" : "Save & Continue"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
