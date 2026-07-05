import { jwtDecode } from "jwt-decode";

export const isTokenExpired = (token: string) => {
  try {
    const decoded = jwtDecode(token);

    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return true;
    }

    return false;
  } catch (error) {
    return true;
  }
};