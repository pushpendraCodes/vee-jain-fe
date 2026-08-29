import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/types";

const STORAGE_KEY = "vjain-auth";

export interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
}

function loadAuth(): Pick<AuthState, "token" | "user"> {
  if (typeof window === "undefined") return { token: null, user: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Pick<AuthState, "token" | "user">) : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

function persist(state: Pick<AuthState, "token" | "user">) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const authSlice = createSlice({
  name: "auth",
  initialState: { token: null, user: null, hydrated: false } as AuthState,
  reducers: {
    hydrateAuth(state) {
      const loaded = loadAuth();
      state.token = loaded.token;
      state.user = loaded.user;
      state.hydrated = true;
    },
    setCredentials(state, action: PayloadAction<{ token: string; user: User }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      persist({ token: state.token, user: state.user });
    },
    updateUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      persist({ token: state.token, user: state.user });
    },
    logout(state) {
      state.token = null;
      state.user = null;
      persist({ token: null, user: null });
    },
  },
});

export const { hydrateAuth, setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
