export const logout = async () => {
  const refresh_token = localStorage.getItem('refresh_token');
  const access_token = localStorage.getItem('access_token');

  if (refresh_token && access_token) {
    try {
      await fetch('http://localhost:8000/api/employees/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({ refresh_token }),
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  localStorage.clear();
  window.location.href = '/employee-login';
};
