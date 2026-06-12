import { createContext, ReactNode, useEffect, useReducer, useState } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, DocumentData } from 'firebase/firestore';
// @types
import {
  ActionMap,
  AuthState,
  AuthUser,
  FirebaseContextType,
} from '../@types/auth';
//
import { FIREBASE_API } from '../config';
import buildAuthenticatedUser from '../utils/buildAuthenticatedUser';

// ----------------------------------------------------------------------

/** Only used if you switch to Firebase auth — add real admin emails here */
const ADMIN_EMAILS: string[] = [];

const firebaseApp = initializeApp(FIREBASE_API);

const AUTH = getAuth(firebaseApp);

const DB = getFirestore(firebaseApp);

const initialState: AuthState = {
  isAuthenticated: false,
  isInitialized: false,
  user: null,
};

enum Types {
  Initial = 'INITIALISE',
}

type FirebaseAuthPayload = {
  [Types.Initial]: {
    isAuthenticated: boolean;
    user: AuthUser;
  };
};

type FirebaseActions = ActionMap<FirebaseAuthPayload>[keyof ActionMap<FirebaseAuthPayload>];

const reducer = (state: AuthState, action: FirebaseActions) => {
  if (action.type === 'INITIALISE') {
    const { isAuthenticated, user } = action.payload;
    return {
      ...state,
      isAuthenticated,
      isInitialized: true,
      user,
    };
  }

  return state;
};

const AuthContext = createContext<FirebaseContextType | null>(null);

const mapFirebaseUser = (user: any, profile?: DocumentData, role = '') =>
  buildAuthenticatedUser({
    ...user,
    id: user?.uid,
    email: user?.email,
    displayName: user?.displayName ?? profile?.displayName ?? user?.email,
    photoURL: user?.photoURL ?? profile?.photoURL ?? null,
    role,
    username: user?.email ?? null,
    tenantId: profile?.tenantId ?? null,
    schoolId: profile?.schoolId ?? null,
  });

// ----------------------------------------------------------------------

type AuthProviderProps = {
  children: ReactNode;
};

function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const [profile, setProfile] = useState<DocumentData | undefined>();

  useEffect(
    () =>
      onAuthStateChanged(AUTH, async (user) => {
        if (user) {
          const userRef = doc(DB, 'users', user.uid);

          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            setProfile(docSnap.data());
          }

          const role = user?.email && ADMIN_EMAILS.includes(user.email) ? 'admin' : '';
          dispatch({
            type: Types.Initial,
            payload: { isAuthenticated: true, user: mapFirebaseUser(user, docSnap.data(), role) },
          });
        } else {
          dispatch({
            type: Types.Initial,
            payload: { isAuthenticated: false, user: null },
          });
        }
      }),
    [dispatch]
  );

  const login = (email: string, password: string) =>
    signInWithEmailAndPassword(AUTH, email, password);

  const register = (email: string, password: string, firstName: string, lastName: string) =>
    createUserWithEmailAndPassword(AUTH, email, password).then(async (res) => {
      const userRef = doc(collection(DB, 'users'), res.user?.uid);

      await setDoc(userRef, {
        uid: res.user?.uid,
        email,
        displayName: `${firstName} ${lastName}`,
      });
    });

  const logout = () => signOut(AUTH);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        method: 'firebase',
        user: state.user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
