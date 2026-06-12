import { createContext, ReactNode, useEffect, useLayoutEffect, useReducer, useCallback, useRef } from 'react';
// config
import { HOST_API_URL } from '../config';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
// utils
import axios from '@/utils/axios';
import {
  extractAuthTokens,
  parseLoginResponse,
  resolveAuthUser,
  userFromAccessToken,
} from '../utils/authTokens';
import buildAuthenticatedUser from '../utils/buildAuthenticatedUser';
import { getToken } from '../utils/cacheStorage';
import { isValidToken, setSession } from '../utils/jwt';
import { registerAuthRefreshHooks } from '../utils/authRefreshHooks';
import { dispatch as reduxDispatch } from '@/redux/store';
import { clearAuthState, setAuthState } from '@/redux/slices/auth';
import { setBranding, clearBranding } from '@/redux/slices/tenantBranding';
// services
import adminUserService from '@/services/adminUserService';
// @types
import { ActionMap, AuthState, AuthUser, JWTContextType } from '../@types/auth';

// ----------------------------------------------------------------------

enum Types {
  Initial = 'INITIALIZE',
  Login = 'LOGIN',
  Logout = 'LOGOUT',
  Register = 'REGISTER',
}

const isProduction = process.env.NODE_ENV === 'production';

async function getClientIpAddress(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    if (!response.ok) return null;
    const data = (await response.json()) as { ip?: string };
    return data.ip ?? null;
  } catch {
    return null;
  }
}

type JWTAuthPayload = {
  [Types.Initial]: {
    isAuthenticated: boolean;
    user: AuthUser;
  };
  [Types.Login]: {
    user: AuthUser;
  };
  [Types.Logout]: undefined;
  [Types.Register]: {
    user: AuthUser;
  };
};

export type JWTActions = ActionMap<JWTAuthPayload>[keyof ActionMap<JWTAuthPayload>];

const initialState: AuthState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
};

const JWTReducer = (state: AuthState, action: JWTActions) => {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        isAuthenticated: action.payload.isAuthenticated,
        isInitialized: true,
        user: action.payload.user,
      };
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
      };

    case 'REGISTER':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
      };

    default:
      return state;
  }
};

const AuthContext = createContext<JWTContextType | null>(null);

// ----------------------------------------------------------------------

type AuthProviderProps = {
  children: ReactNode;
};

function AuthProvider({ children }: AuthProviderProps) {
  const initializedRef = useRef(false);

  const [state, dispatch] = useReducer(JWTReducer, initialState);

  useLayoutEffect(() => {
    registerAuthRefreshHooks({
      onAccessTokenRefreshed: (accessToken) => {
        const user = userFromAccessToken(accessToken);
        if (user) {
          reduxDispatch(setAuthState({ isAuthenticated: true, isInitialized: true, user }));
          dispatch({ type: Types.Login, payload: { user } });
          return;
        }
        setSession(null);
        reduxDispatch(clearAuthState());
        dispatch({ type: Types.Logout });
      },
      onSessionCleared: () => {
        reduxDispatch(clearAuthState());
        dispatch({ type: Types.Logout });
      },
    });
    return () => registerAuthRefreshHooks(null);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      try {
        if (typeof window !== 'undefined') {
          // ── Token Transfer (Localhost SSO) ───────────────────────────
          // On localhost, subdomains cannot share cookies. We transfer the token via URL once.
          const urlParams = new URLSearchParams(window.location.search);
          const urlToken = urlParams.get('accessToken');
          const urlRefresh = urlParams.get('refreshToken');

          if (urlToken) {
            setSession(urlToken, urlRefresh);
            // Clean up URL
            urlParams.delete('accessToken');
            urlParams.delete('refreshToken');
            const newSearch = urlParams.toString();
            const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;
            window.history.replaceState(null, '', newUrl);
          }
        }

        if (!HOST_API_URL) {
          setSession(null);
          reduxDispatch(clearAuthState());
          dispatch({
            type: Types.Initial,
            payload: {
              isAuthenticated: false,
              user: null,
            },
          });
          return;
        }

        const accessToken = typeof window !== 'undefined' ? getToken() : '';

        if (accessToken && isValidToken(accessToken)) {
          setSession(accessToken);
          const baseUser = userFromAccessToken(accessToken);
          
          if (baseUser && baseUser.id) {
            try {
              const response = await axios.get(API_ENDPOINTS.userById(baseUser.id));
              const data = response.data?.data ?? response.data;
              if (data) {
                const user = buildAuthenticatedUser({
                  ...baseUser,
                  displayName: data.fullName ?? baseUser.displayName,
                  email: data.email ?? baseUser.email,
                  phoneNumber: data.phone ?? baseUser.phoneNumber,
                  photoURL: data.avatarUrl ?? baseUser.photoURL,
                  avatarUrl: data.avatarUrl ?? baseUser.avatarUrl,
                });
                reduxDispatch(setAuthState({ isAuthenticated: true, isInitialized: true, user }));
                dispatch({
                  type: Types.Initial,
                  payload: {
                    isAuthenticated: true,
                    user,
                  },
                });
              } else {
                throw new Error("Profile data is empty");
              }
            } catch (profileErr) {
              console.error('Failed to fetch profile during initialize:', profileErr);
              // Fallback to base user from token if API call fails
              reduxDispatch(setAuthState({ isAuthenticated: true, isInitialized: true, user: baseUser }));
              dispatch({
                type: Types.Initial,
                payload: {
                  isAuthenticated: true,
                  user: baseUser,
                },
              });
            }
          } else {
             // Fallback if token doesn't have ID
             reduxDispatch(setAuthState({ isAuthenticated: true, isInitialized: true, user: baseUser }));
             dispatch({
               type: Types.Initial,
               payload: {
                 isAuthenticated: true,
                 user: baseUser,
               },
             });
          }
        } else {
          reduxDispatch(clearAuthState());
          dispatch({
            type: Types.Initial,
            payload: {
              isAuthenticated: false,
              user: null,
            },
          });
        }
      } catch (err) {
        console.error(err);
        setSession(null);
        reduxDispatch(clearAuthState());
        dispatch({
          type: Types.Initial,
          payload: {
            isAuthenticated: false,
            user: null,
          },
        });
      }
    };

    initialize();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!HOST_API_URL) {
      throw new Error(
        isProduction
          ? 'Service is temporarily unavailable.'
          : 'Chưa cấu hình NEXT_PUBLIC_HOST_API_URL trong .env — restart `yarn dev`. Không có URL backend thì code dừng trước khi gọi axios (Network: 0 request XHR).'
      );
    }

    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : '';
    const ipAddress = await getClientIpAddress();

    const response = await axios.post(
      API_ENDPOINTS.authLogin,
      {
        username: email,
        password,
        domain: typeof window !== 'undefined' ? window.location.hostname : '',
        userAgent,
        ipAddress,
      },
      { headers: { 'x-skip-auth': 'true' } }
    );

    return response.data;
  }, []);

  const register = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    if (!HOST_API_URL) {
      throw new Error(isProduction ? 'Service is temporarily unavailable.' : 'Chưa cấu hình NEXT_PUBLIC_HOST_API_URL trong .env — restart `yarn dev`.');
    }

    const response = await axios.post(
      API_ENDPOINTS.authRegister,
      {
        email,
        password,
        firstName,
        lastName,
      },
      { headers: { 'x-skip-auth': 'true' } }
    );

    const parsed = parseLoginResponse(response.data);
    setSession(parsed.accessToken, parsed.refreshToken ?? null);
    reduxDispatch(
      setAuthState({ isAuthenticated: true, isInitialized: true, user: parsed.user })
    );

    dispatch({
      type: Types.Initial,
      payload: {
        user: parsed.user,
        isAuthenticated: true,
      },
    });
  }, []);

  const logout = useCallback(async () => {
    setSession(null);
    reduxDispatch(clearAuthState());
    reduxDispatch(clearBranding());
    dispatch({ type: Types.Logout });
  }, []);

  const getProfile = useCallback(async () => {
    const userId = state.user?.id;
    if (!userId) {
      console.error('Cannot fetch profile: user ID not found');
      return state.user;
    }
    try {
      const response = await axios.get(API_ENDPOINTS.userById(userId));
      const data = response.data?.data ?? response.data;
      if (data) {
        const user = buildAuthenticatedUser({
          ...state.user,
          displayName: data.fullName ?? state.user?.displayName,
          email: data.email ?? state.user?.email,
          phoneNumber: data.phone ?? state.user?.phoneNumber,
          photoURL: data.avatarUrl ?? state.user?.photoURL,
          avatarUrl: data.avatarUrl ?? state.user?.avatarUrl,
        });
        reduxDispatch(setAuthState({ isAuthenticated: true, isInitialized: true, user }));
        dispatch({
          type: Types.Initial,
          payload: {
            isAuthenticated: true,
            user,
          },
        });
        return user;
      }
    } catch (error) {
      console.error('Failed to get profile:', error);
    }
    return state.user;
  }, [state.user]);

  const updateProfile = useCallback(async (fullName: string, email: string, avatarUrl?: string | null) => {
    const userId = state.user?.id;
    if (!userId) {
      throw new Error('User ID not found');
    }

    let profileData: any = null;
    try {
      const response = await axios.get(API_ENDPOINTS.userById(userId));
      profileData = response.data?.data ?? response.data;
    } catch (err) {
      console.error('Failed to pre-fetch profile data:', err);
    }

    const payload = {
      fullName,
      email: email || (profileData?.email ?? state.user?.email ?? null),
      status: profileData?.status ?? (state.user as any)?.status ?? 'ACTIVE',
      accountType: profileData?.accountType ?? state.user?.role ?? null,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : (profileData?.avatarUrl ?? state.user?.avatarUrl ?? null),
    };

    await axios.put(API_ENDPOINTS.userUpdate(userId), payload);

    if (avatarUrl !== undefined && avatarUrl !== null) {
      try {
        await axios.patch(API_ENDPOINTS.userAvatar(userId), {
          avatarUrl: avatarUrl.trim()
        });
      } catch (err) {
        console.error('Failed to update user avatar:', err);
      }
    }

    const updatedUser = await getProfile();
    return updatedUser;
  }, [state.user, getProfile]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        method: 'jwt',
        login,
        logout,
        register,
        getProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
