const STORAGE_KEY = 'balletSessions';

export const saveBalletSession = (sessionData) => {
  const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const newSession = { id: Date.now().toString(), ...sessionData };
  sessions.push(newSession);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  return newSession;
};

export const getBalletSessions = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
};

export const deleteBalletSession = (sessionId) => {
  const sessions = getBalletSessions().filter((s) => s.id !== sessionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};
