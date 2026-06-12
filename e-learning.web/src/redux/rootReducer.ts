import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
// slices
import mailReducer from './slices/mail';
import chatReducer from './slices/chat';
import productReducer from './slices/product';
import calendarReducer from './slices/calendar';
import kanbanReducer from './slices/kanban';
import authReducer from './slices/auth';
import adminMasterDataReducer from './slices/adminMasterData';
import cmsContentReducer from './slices/cmsContent';
import learningStructureReducer from './slices/learningStructure';
import localPartnerReducer from './slices/localPartner';
import programTenantReducer from './slices/programTenant';
import reportDashboardReducer from './slices/reportDashboard';
import tenantBrandingReducer from './slices/tenantBranding';
import subscriptionReducer from './slices/subscription';
import tenantMemberReducer from './slices/tenantMember';
import permissionReducer from './slices/permission';
import favoriteReducer from './slices/favorite';
import clientDashboardReducer from './slices/clientDashboard';

// ----------------------------------------------------------------------

const createNoopStorage = () => ({
  getItem(_key: string) {
    return Promise.resolve(null);
  },
  setItem(_key: string, value: any) {
    return Promise.resolve(value);
  },
  removeItem(_key: string) {
    return Promise.resolve();
  },
});

const storage = typeof window !== 'undefined' ? createWebStorage('local') : createNoopStorage();

const rootPersistConfig = {
  key: 'root',
  storage,
  keyPrefix: 'redux-',
  whitelist: ['auth'],
};

const productPersistConfig = {
  key: 'product',
  storage,
  keyPrefix: 'redux-',
  whitelist: ['sortBy', 'checkout'],
};

const cmsContentPersistConfig = {
  key: 'cmsContent',
  storage,
  keyPrefix: 'redux-',
  whitelist: ['activeNodeId', 'activeNodeTitle'],
};

// api
import { apiSlice } from './api/apiSlice';

const rootReducer = combineReducers({
  [apiSlice.reducerPath]: apiSlice.reducer,
  auth: authReducer,
  mail: mailReducer,
  chat: chatReducer,
  calendar: calendarReducer,
  kanban: kanbanReducer,
  adminMasterData: adminMasterDataReducer,
  cmsContent: persistReducer(cmsContentPersistConfig, cmsContentReducer),
  learningStructure: learningStructureReducer,
  localPartner: localPartnerReducer,
  programTenant: programTenantReducer,
  reportDashboard: reportDashboardReducer,
  tenantBranding: tenantBrandingReducer,
  subscription: subscriptionReducer,
  tenantMember: tenantMemberReducer,
  permission: permissionReducer,
  favorite: favoriteReducer,
  clientDashboard: clientDashboardReducer,
  product: persistReducer(productPersistConfig, productReducer),
});

export { rootPersistConfig, rootReducer };
