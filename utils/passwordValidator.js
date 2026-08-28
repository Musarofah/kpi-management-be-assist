/**
 * Memvalidasi format password:
 * - Minimal 8 karakter
 * - Mengandung setidaknya 1 huruf kapital (A-Z)
 * - Mengandung setidaknya 1 simbol / karakter khusus
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password wajib diisi',
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password minimal harus 8 karakter',
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password harus mengandung setidaknya 1 huruf kapital',
    };
  }

  // Symbol regex (karakter khusus)
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    return {
      isValid: false,
      message: 'Password harus mengandung setidaknya 1 simbol khusus (!@#$%^&* dll)',
    };
  }

  return {
    isValid: true,
    message: 'Password valid',
  };
};

module.exports = { validatePassword };
