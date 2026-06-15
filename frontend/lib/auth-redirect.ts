const DEFAULT_LOGIN_REDIRECT = "/?login=success"

export function isSafeInternalRedirect(value: string) {
  return value.startsWith("/") && !value.startsWith("//")
}

export function getRedirectFromSearch(search: string) {
  const redirect = new URLSearchParams(search).get("redirect") || ""
  return isSafeInternalRedirect(redirect) ? redirect : DEFAULT_LOGIN_REDIRECT
}

export function getCurrentInternalPath() {
  if (typeof window === "undefined") {
    return "/"
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}` || "/"
}

export function buildLoginUrl(redirectTo = getCurrentInternalPath()) {
  const redirect = isSafeInternalRedirect(redirectTo) ? redirectTo : "/"
  return `/login?redirect=${encodeURIComponent(redirect)}`
}
