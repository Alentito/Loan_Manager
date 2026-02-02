export const isLoggedIn = () => !!localStorage.getItem('access_token');

export const getUserRole = () => localStorage.getItem('employeeRole') || 'guest';

export const getEmployeeId = () => {
  try {
    const employee = JSON.parse(localStorage.getItem('employeeData'));
    return employee?.id || null;
  } catch {
    return null;
  }
};

export const isAdmin = () => getUserRole() === 'team_manager';
export const isTeamLead = () => getUserRole() === 'team_lead';
export const isTeamManager = () => getUserRole() === 'team_manager';
export const isApprover = () => ['team_lead', 'team_manager'].includes(getUserRole());
