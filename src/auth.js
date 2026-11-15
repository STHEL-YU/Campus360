const KEYS = {
  admin: "campus360_admin_auth",
  student: "campus360_student_auth",
};
const ADMIN_PROFILE_KEY = "campus360_admin_profile";
const STUDENT_PROFILE_KEY = "campus360_student_profile";

// Check authentication independently
export const isAuthed = (role) => {
  if (role) {
    if (!KEYS[role]) return false;
    return localStorage.getItem(KEYS[role]) === "true";
  }

  return Object.values(KEYS).some(
    (key) => localStorage.getItem(key) === "true",
  );
};

// Get authentication status for a specific role
export const getUserRole = () => {
  if (isAuthed("admin")) return "admin";
  if (isAuthed("student")) return "student";
  return null;
};

// Sign in independently
export const signIn = (role = "student", user = null) => {
  if (!KEYS[role]) {
    throw new Error(`Invalid user role: ${role}`);
  }

  localStorage.setItem(KEYS[role], "true");
  if (role === "admin" && user) {
    localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(user));
  }
  if (role === "student" && user) {
    localStorage.setItem(STUDENT_PROFILE_KEY, JSON.stringify(user));
  }
};

export const getAdminProfile = () => {
  const savedProfile = localStorage.getItem(ADMIN_PROFILE_KEY);
  if (!savedProfile) return null;

  try {
    return JSON.parse(savedProfile);
  } catch {
    return null;
  }
};

export const getStudentProfile = () => {
  const savedProfile = localStorage.getItem(STUDENT_PROFILE_KEY);
  if (!savedProfile) return null;

  try {
    return JSON.parse(savedProfile);
  } catch {
    return null;
  }
};

export const updateStudentProfile = (updates) => {
  const currentProfile = getStudentProfile();
  if (!currentProfile) return;

  localStorage.setItem(
    STUDENT_PROFILE_KEY,
    JSON.stringify({ ...currentProfile, ...updates }),
  );
};

// Sign out independently
export const signOut = (role) => {
  if (role) {
    if (!KEYS[role]) {
      throw new Error(`Invalid user role: ${role}`);
    }

    localStorage.removeItem(KEYS[role]);
    if (role === "admin") {
      localStorage.removeItem(ADMIN_PROFILE_KEY);
    }
    if (role === "student") {
      localStorage.removeItem(STUDENT_PROFILE_KEY);
    }
  } else {
    Object.values(KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem(ADMIN_PROFILE_KEY);
    localStorage.removeItem(STUDENT_PROFILE_KEY);
  }
};
