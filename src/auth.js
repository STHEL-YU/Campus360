const AUTH_KEY = "campus360_auth";
 
export const isAuthed = () => localStorage.getItem(AUTH_KEY) === "true";
export const signIn = () => localStorage.setItem(AUTH_KEY, "true");
export const signOut = () => localStorage.removeItem(AUTH_KEY);
 