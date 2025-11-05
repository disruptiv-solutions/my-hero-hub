// Mock session for demo purposes - bypasses authentication
export const getMockSession = () => {
  return {
    user: {
      name: "Demo User",
      email: "demo@example.com",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
    },
    accessToken: "mock_access_token",
    error: null
  };
};

