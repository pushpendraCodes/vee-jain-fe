"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Pencil } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateUser } from "@/store/slices/authSlice";
import { ApiError, fetchCities, fetchMe, fetchStates, updateAvatar, updateProfile } from "@/lib/api";
import { applyApiFieldErrors, digitsOnly, validateProfile } from "@/lib/validation";
import { useToast } from "@/components/ui/Toast";
import type { Gender, LocationCity, LocationState, User } from "@/types";

function initials(user: User) {
  const parts = (user.name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return (user.phone || "U").slice(-2);
}

function genderLabel(gender?: string) {
  if (!gender) return "";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-error">{message}</p>;
}

function formatPhone(phone?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits) return `+91 ${digits}`;
  return "";
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-4 border-t border-border-hairline py-3.5 first:border-t-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">{label}</dt>
      <dd className="min-w-0 text-sm font-medium leading-relaxed text-text-primary break-words">
        {value?.trim() || "—"}
      </dd>
    </div>
  );
}

export default function ProfilePageClient() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, token, hydrated } = useAppSelector((s) => s.auth);
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [states, setStates] = useState<LocationState[]>([]);
  const [cities, setCities] = useState<LocationCity[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

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

  const selectedState = useMemo(
    () => states.find((s) => s.code === stateCode) || null,
    [states, stateCode]
  );

  const fillForm = useCallback((next: User) => {
    setName(next.name || "");
    setGender((next.gender as Gender) || "male");
    setEmail(next.email || "");
    setCompanyName(next.company?.name || "");
    setGstin(next.company?.gstin || "");
    setLine1(next.address?.line1 || "");
    setLine2(next.address?.line2 || "");
    setCity(next.address?.city || "");
    setStateCode(next.address?.stateCode || "");
    setPincode(next.address?.pincode || "");
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) router.replace("/login?next=/profile");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!token || !hydrated) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const me = await fetchMe(token);
        if (!cancelled) {
          dispatch(updateUser(me));
          fillForm(me);
        }
      } catch {
        /* keep cached */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, hydrated, dispatch, fillForm]);

  useEffect(() => {
    if (user && !editing) fillForm(user);
  }, [user, editing, fillForm]);

  useEffect(() => {
    if (!editing) return;
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
  }, [editing]);

  useEffect(() => {
    if (!editing || !stateCode) {
      if (!stateCode) setCities([]);
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
  }, [editing, stateCode]);

  if (!hydrated || !user) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-20 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-sage-light" />
        <p className="text-sm text-text-secondary">Checking account…</p>
      </div>
    );
  }

  const inputClass = (key: string) => `industrial-input ${errors[key] ? "is-invalid" : ""}`;
  const addressLine = [user.address?.line1, user.address?.line2].filter(Boolean).join(", ");
  const cityLine = [user.address?.city, user.address?.state, user.address?.pincode]
    .filter(Boolean)
    .join(", ");

  const startEdit = () => {
    fillForm(user);
    setErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    fillForm(user);
    setErrors({});
    setEditing(false);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const form = {
      name,
      gender,
      email,
      companyName,
      gstin,
      line1,
      line2,
      city,
      state: selectedState?.name || user.address?.state || "",
      stateCode,
      pincode,
    };
    const nextErrors = validateProfile(form, selectedState?.gstCode);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      const updated = await updateProfile(token, {
        name: name.trim(),
        gender,
        email: email.trim(),
        companyName: companyName.trim(),
        gstin: gstin.trim().toUpperCase(),
        address: {
          name: name.trim(),
          phone: user.phone,
          line1: line1.trim(),
          line2: line2.trim(),
          city,
          state: selectedState!.name,
          stateCode,
          pincode: pincode.trim(),
        },
      });
      dispatch(updateUser(updated));
      setEditing(false);
      showToast("Profile updated", "Your account details were saved", "success");
    } catch (err) {
      setErrors(
        applyApiFieldErrors(
          err instanceof ApiError ? err.errors : [],
          err instanceof ApiError ? err.message : "Could not save profile"
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const onPickPhoto = async (file?: File | null) => {
    if (!file || !token) return;
    if (!file.type.startsWith("image/")) {
      showToast("Choose an image", "JPG, PNG or WEBP up to 5 MB", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image is too large", "Profile picture must be under 5 MB", "error");
      return;
    }
    setUploading(true);
    try {
      const updated = await updateAvatar(token, file);
      dispatch(updateUser(updated));
      showToast("Photo updated", "Your profile picture is saved", "success");
    } catch (err) {
      showToast(
        "Could not upload photo",
        err instanceof ApiError ? err.message : "Please try again",
        "error"
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="bg-cream">
      <div className="border-b border-border-hairline bg-[#1a1512]">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8 lg:py-12">
          <div className="flex items-center gap-5">
            <div className="relative h-[88px] w-[88px] shrink-0">
              <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full border-2 border-white/15 bg-[#2a2420] text-2xl font-semibold text-[#e0a84a]">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(user)
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1a1512] bg-[#e0a84a] text-[#1a1512] disabled:opacity-70"
                aria-label="Change profile picture"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" strokeWidth={2.2} />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => onPickPhoto(e.target.files?.[0])}
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e0a84a]">Account</p>
              <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {user.name || "Your profile"}
              </h1>
              <p className="mt-1 text-sm text-white/55">{formatPhone(user.phone)}</p>
              {loading ? <p className="mt-1 text-xs text-white/40">Refreshing details…</p> : null}
            </div>
          </div>
          {!editing ? (
            <button
              type="button"
              onClick={startEdit}
              className="inline-flex h-11 items-center gap-2 self-start rounded-full bg-white px-5 text-sm font-semibold text-[#1a1512] transition hover:bg-[#f3f0e9] sm:self-auto"
            >
              <Pencil className="h-4 w-4" />
              Edit profile
            </button>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        {editing ? (
          <form onSubmit={onSave} className="space-y-5" noValidate>
            <section className="rounded-[1.75rem] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-accent">Personal details</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="industrial-label" htmlFor="profile-name">
                    Full name <span className="text-error">*</span>
                  </label>
                  <input id="profile-name" className={inputClass("name")} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                  <FieldError message={errors.name} />
                </div>
                <div>
                  <label className="industrial-label" htmlFor="profile-gender">
                    Gender <span className="text-error">*</span>
                  </label>
                  <select id="profile-gender" className={inputClass("gender")} value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <FieldError message={errors.gender} />
                </div>
                <div>
                  <label className="industrial-label" htmlFor="profile-email">Email</label>
                  <input id="profile-email" type="email" className={inputClass("email")} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  <FieldError message={errors.email} />
                </div>
                <div className="sm:col-span-2">
                  <label className="industrial-label">Mobile</label>
                  <input className="industrial-input" value={formatPhone(user.phone)} disabled />
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-accent">Company details</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="industrial-label" htmlFor="profile-company">Company name</label>
                  <input id="profile-company" className={inputClass("companyName")} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Optional" />
                  <FieldError message={errors.companyName} />
                </div>
                <div>
                  <label className="industrial-label" htmlFor="profile-gstin">GSTIN</label>
                  <input
                    id="profile-gstin"
                    className={`${inputClass("gstin")} uppercase`}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))}
                    placeholder="Optional"
                    maxLength={15}
                  />
                  <FieldError message={errors.gstin} />
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-accent">Address</p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="industrial-label" htmlFor="profile-line1">
                    Address line 1 <span className="text-error">*</span>
                  </label>
                  <input id="profile-line1" className={inputClass("line1")} value={line1} onChange={(e) => setLine1(e.target.value)} />
                  <FieldError message={errors.line1} />
                </div>
                <div>
                  <label className="industrial-label" htmlFor="profile-line2">Address line 2</label>
                  <input id="profile-line2" className={inputClass("line2")} value={line2} onChange={(e) => setLine2(e.target.value)} placeholder="Optional" />
                </div>
                <div>
                  <label className="industrial-label" htmlFor="profile-state">
                    State <span className="text-error">*</span>
                  </label>
                  <select
                    id="profile-state"
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="industrial-label" htmlFor="profile-city">
                      City <span className="text-error">*</span>
                    </label>
                    <select
                      id="profile-city"
                      className={inputClass("city")}
                      value={city}
                      disabled={!stateCode || loadingCities}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setErrors((err) => ({ ...err, city: "" }));
                      }}
                    >
                      <option value="">{!stateCode ? "Select state first" : loadingCities ? "Loading…" : "Select city"}</option>
                      {city && !cities.some((c) => c.name === city) ? <option value={city}>{city}</option> : null}
                      {cities.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.city} />
                  </div>
                  <div>
                    <label className="industrial-label" htmlFor="profile-pin">
                      PIN code <span className="text-error">*</span>
                    </label>
                    <input
                      id="profile-pin"
                      className={inputClass("pincode")}
                      value={pincode}
                      onChange={(e) => setPincode(digitsOnly(e.target.value, 6))}
                      inputMode="numeric"
                      maxLength={6}
                    />
                    <FieldError message={errors.pincode} />
                  </div>
                </div>
              </div>
            </section>

            {errors.form ? <p className="text-sm font-medium text-error">{errors.form}</p> : null}

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={cancelEdit} className="h-11 rounded-full border border-border-hairline bg-white px-6 text-sm font-medium text-text-primary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="h-11 rounded-full bg-forest px-7 text-sm font-semibold text-on-dark disabled:opacity-60">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <section className="rounded-[1.75rem] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-accent">Personal details</p>
              <dl className="mt-2">
                <DetailRow label="Full name" value={user.name} />
                <DetailRow label="Mobile" value={formatPhone(user.phone)} />
                <DetailRow label="Email" value={user.email} />
                <DetailRow label="Gender" value={genderLabel(user.gender)} />
              </dl>
            </section>
            <section className="rounded-[1.75rem] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-accent">Company details</p>
              <dl className="mt-2">
                <DetailRow label="Company" value={user.company?.name} />
                <DetailRow label="GSTIN" value={user.company?.gstin} />
              </dl>
            </section>
            <section className="rounded-[1.75rem] bg-white p-6 shadow-sm sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-accent">Address</p>
              <dl className="mt-2">
                <DetailRow label="Street" value={addressLine} />
                <DetailRow label="City / State" value={cityLine} />
              </dl>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
