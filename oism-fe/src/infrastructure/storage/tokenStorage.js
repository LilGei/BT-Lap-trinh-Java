const TOKEN_KEY = 'token';

export const tokenStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),

  getUser: () => {
    const role = localStorage.getItem('user_role');
    const username = localStorage.getItem('username');
    return role ? { role, username } : null;
  },

  setSession: ({ token, role, username }) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (role) localStorage.setItem('user_role', role);
    if (username) localStorage.setItem('username', username);
  },

  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
  },
};