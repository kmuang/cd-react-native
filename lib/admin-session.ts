// In-memory session — cleared on app restart (intentional for PIN security)
let _authenticated = false;

export const adminSession = {
  get isAuthenticated() {
    return _authenticated;
  },
  login() {
    _authenticated = true;
  },
  logout() {
    _authenticated = false;
  },
};
