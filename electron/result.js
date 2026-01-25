export const ok = (data) => ({ ok: true, data });

export const err = (code, message, details) => ({
  ok: false,
  error: {
    code,
    message,
    details,
  },
});

export const isOk = (result) => result?.ok === true;
