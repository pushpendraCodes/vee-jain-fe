"use client";

import { useEffect } from "react";
import { getPushRegistration } from "@/lib/firebase";

export default function PwaRegister() {
  useEffect(() => {
    getPushRegistration().catch(() => {});
  }, []);
  return null;
}
