export const getUserRole = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.employee?.position || 'guest';
};

export const isAdmin = () => getUserRole() === 'admin';
export const isTeamLead = () => getUserRole() === 'team_lead';
export const isTeamManager = () => getUserRole() === 'team_manager';
