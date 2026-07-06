export const unauthorized_response = () => ({
  error: {
    type: "unauthenticated",
    message: "Authentication is required",
  },
});

export const error_response = (type: string, message: string) => ({
  error: {
    type,
    message,
  },
});
