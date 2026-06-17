/**
 * File: frontend/admin/js/auth.js
 * Description: Handles administrator login authentication, session management, and logout flows.
 * Version: 1.1.0
 * Project: BEKCAN CMA (Conference Management App)
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok) {
          adminState.token = data.token;
          adminState.role = data.role;
          localStorage.setItem('admin_token', adminState.token);
          localStorage.setItem('admin_role', adminState.role);
          loginError.classList.add('hidden');
          showDashboard();
        } else {
          loginError.textContent = data.error || 'Login failed';
          loginError.classList.remove('hidden');
        }
      } catch (err) {
        loginError.textContent = 'Connection error';
        loginError.classList.remove('hidden');
      }
    });
  }

  // Logout button handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_role');
      adminState.token = null;
      adminState.role = null;
      dashboardScreen.classList.add('hidden');
      loginScreen.classList.remove('hidden');
    });
  }

  // Auto-dashboard load
  if (adminState.token) {
    showDashboard();
  }
});
