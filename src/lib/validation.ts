// Kiểm tra phía client, khớp các quy tắc của backend (RegisterRequestValidator) để báo lỗi sớm.
// Backend vẫn là nơi quyết định cuối cùng.

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export function validatePassword(password: string): string | undefined {
  if (password.length < 8) return "Mật khẩu tối thiểu 8 ký tự.";
  if (!/[A-Z]/.test(password)) return "Mật khẩu cần ít nhất một chữ hoa.";
  if (!/[a-z]/.test(password)) return "Mật khẩu cần ít nhất một chữ thường.";
  if (!/[0-9]/.test(password)) return "Mật khẩu cần ít nhất một chữ số.";
  if (!/[^a-zA-Z0-9]/.test(password)) return "Mật khẩu cần ít nhất một ký tự đặc biệt.";
  return undefined;
}
