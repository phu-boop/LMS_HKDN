type AuthRefreshHooks = {
  onAccessTokenRefreshed: (accessToken: string) => void;
  onSessionCleared: () => void;
};

let hooks: AuthRefreshHooks | null = null;

export function registerAuthRefreshHooks(next: AuthRefreshHooks | null) {
  hooks = next;
}

export function notifyAccessTokenRefreshed(accessToken: string) {
  hooks?.onAccessTokenRefreshed(accessToken);
}

export function notifySessionCleared() {
  hooks?.onSessionCleared();
}
