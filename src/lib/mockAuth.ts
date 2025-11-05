export interface User {
  email: string;
  credits: number;
}

const isClient = typeof window !== 'undefined';

export const login = (email: string): void => {
  if (!isClient) return;
  
  const user: User = {
    email,
    credits: 150
  };
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUser = (): User | null => {
  if (!isClient) return null;
  
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const getCredits = (): number => {
  if (!isClient) return 0;
  
  const user = getUser();
  return user?.credits || 0;
};

export const useCredits = (amount: number): void => {
  if (!isClient) return;
  
  const user = getUser();
  if (user) {
    user.credits -= amount;
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const addCredits = (amount: number): void => {
  if (!isClient) return;
  
  const user = getUser();
  if (user) {
    user.credits += amount;
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const logout = (): void => {
  if (!isClient) return;
  
  localStorage.removeItem('user');
};
