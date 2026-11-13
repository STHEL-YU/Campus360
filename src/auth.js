const KEYS = {
  admin: "campus360_admin_auth",
  student: "campus360_student_auth",
};

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
export const signIn = (role = "student") => {
  if (!KEYS[role]) {
    throw new Error(`Invalid user role: ${role}`);
  }

  localStorage.setItem(KEYS[role], "true");
};

// Sign out independently
export const signOut = (role) => {
  if (role) {
    if (!KEYS[role]) {
      throw new Error(`Invalid user role: ${role}`);
    }

    localStorage.removeItem(KEYS[role]);
  } else {
    Object.values(KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }
};
