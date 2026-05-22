// ... inside login logic
get().addLog({ 
  userId: user.id, 
  userName: user.name, 
  action: 'Login Success', 
  details: `Staff member ${member.name} logged in`, 
  category: 'System',
  type: 'success' 
});