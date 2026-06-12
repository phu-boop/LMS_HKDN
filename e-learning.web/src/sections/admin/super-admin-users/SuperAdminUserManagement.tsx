import { useMemo, useState, useEffect, useCallback } from 'react';
// @mui
import {
  Box,
  Tab,
  Tabs,
  Card,
  Stack,
  Table,
  Button,
  Avatar,
  Dialog,
  Select,
  Tooltip,
  MenuItem,
  TableRow,
  TableBody,
  TableCell,
  Container,
  TextField,
  IconButton,
  InputLabel,
  Typography,
  DialogTitle,
  FormControl,
  DialogActions,
  DialogContent,
  TableContainer,
  TablePagination,
  InputAdornment,
  Alert,
} from '@mui/material';
import { useSnackbar } from 'notistack';
// hooks
import useTable, { getComparator, emptyRows } from '../../../hooks/useTable';
import useResponsive from '../../../hooks/useResponsive';
// api
import axios from '../../../utils/axios';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
// @types
import type {
  SuperAdminManagedUser,
  SuperAdminUserStatus,
  UserAuditLogEntry,
} from '../../../@types/superAdminUser';
// _mock_
import { _superAdminUsersInitial, _superAdminAuditInitial } from '../../../_mock/_superAdmin';
// redux
import { useDispatch, useSelector } from '../../../redux/store';
import { fetchAdminMasterData } from '../../../redux/slices/adminMasterData';
// utils
import uuidv4 from '../../../utils/uuidv4';
import { fDateTime } from '../../../utils/formatTime';
import { sanitizeUiMessage } from '../../../utils/sanitizeUiMessage';
// components
import Iconify from '../../../components/Iconify';
import Scrollbar from '../../../components/Scrollbar';
import Label from '../../../components/Label';
import { TableNoData, TableEmptyRows, TableHeadCustom, TableSkeleton } from '../../../components/table';

// ----------------------------------------------------------------------

const ACTOR_LABEL = 'Super Admin (demo)';

const STATUS_FILTER = ['all', 'active', 'locked'] as const;

const USER_TABLE_HEAD = [
  { id: 'username', label: 'Người dùng', align: 'left' as const },
  { id: 'tenantName', label: 'Trường / Chương trình', align: 'left' as const },
  { id: 'roleName', label: 'Vai trò', align: 'left' as const },
  { id: 'status', label: 'Trạng thái', align: 'center' as const },
  { id: 'actions', label: '', align: 'right' as const, width: 80 },
];

const AUDIT_TABLE_HEAD = [
  { id: 'at', label: 'Thời gian', align: 'left' as const },
  { id: 'actorLabel', label: 'Người thực hiện', align: 'left' as const },
  { id: 'action', label: 'Hành động', align: 'center' as const },
  { id: 'userLabel', label: 'Tài khoản', align: 'left' as const },
  { id: 'detail', label: 'Chi tiết', align: 'left' as const },
];

function isUUID(str: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str) || /^[0-9a-f]{24}$/i.test(str);
}

function LazyNameFetcher({ id, type, fallback }: { id: string; type: 'school' | 'tenant'; fallback: string }) {
  const [name, setName] = useState(fallback);

  useEffect(() => {
    if (!id || !isUUID(id)) return;
    
    // If it's a UUID, it means the name wasn't found in Redux. Let's fetch it lazily.
    const fetchName = async () => {
      try {
        if (type === 'school') {
          const res = await axios.get(API_ENDPOINTS.schoolById(id));
          if (res.data && res.data.name) {
            setName(res.data.name);
          }
        } else if (type === 'tenant') {
          // Fallback to list API if tenantById doesn't exist, or try direct
          const res = await axios.get(`/api/admin/tenants/${id}`).catch(() => null);
          if (res?.data && res.data.name) {
            setName(res.data.name);
          }
        }
      } catch (err) {
        // ignore
      }
    };
    fetchName();
  }, [id, type]);

  // If it's still a UUID, maybe hide it to avoid ugly UI, or return fallback
  if (isUUID(name)) return <>{'—'}</>;
  return <>{name || '—'}</>;
}

function schoolMatchesTenant(schoolTenantId: string | undefined, tenantId: string): boolean {
  if (!tenantId) return true;
  if (tenantId === 'null_tenant') return true;
  if (!schoolTenantId || !schoolTenantId.trim()) return true;
  return schoolTenantId === tenantId;
}

function actionLabel(action: UserAuditLogEntry['action']) {
  switch (action) {
    case 'CREATE':
      return 'Tạo mới';
    case 'UPDATE':
      return 'Cập nhật';
    case 'LOCK':
      return 'Khóa';
    case 'UNLOCK':
      return 'Mở khóa';
    default:
      return action;
  }
}

function getRoleOptionValue(role: { id: string; code?: string }) {
  return (role.code?.trim() || role.id).trim();
}

function extractUsersFromResponse(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'));
  }
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const candidates = [d.items, d.data, d.results, (d.data as Record<string, unknown> | undefined)?.items];
    for (const c of candidates) {
      const rows = extractUsersFromResponse(c);
      if (rows.length) return rows;
    }
  }
  return [];
}

function apiErrorMessage(error: unknown, fallback = 'Không thể tạo tài khoản'): string {
  const maybe = error as
    | {
        response?: {
          data?: { message?: string; title?: string; error?: string; detail?: string } | string;
        };
        message?: string;
      }
    | undefined;
  const data = maybe?.response?.data;
  if (typeof data === 'string' && data.trim()) {
    const cleaned = sanitizeUiMessage(data);
    return cleaned || fallback;
  }
  if (data && typeof data === 'object') {
    const msg = data.message ?? data.title ?? data.error ?? data.detail;
    if (typeof msg === 'string' && msg.trim()) {
      const cleaned = sanitizeUiMessage(msg);
      return cleaned || fallback;
    }
  }
  if (typeof maybe?.message === 'string' && maybe.message.trim()) {
    const cleaned = sanitizeUiMessage(maybe.message);
    return cleaned || fallback;
  }
  return sanitizeUiMessage(fallback) || fallback;
}

function isValidEmail(email: string) {
  if (!email) return false;
  const v = email.trim();
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
  return re.test(v);
}

type FormState = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  avatarFile: File | null;
  tenantId: string;
  schoolId: string;
  roleId: string;
  status: SuperAdminUserStatus;
};

const emptyForm = (): FormState => ({
  username: '',
  password: '',
  fullName: '',
  email: '',
  avatarUrl: '',
  avatarFile: null,
  tenantId: '',
  schoolId: '',
  roleId: '',
  status: 'active',
});

// ----------------------------------------------------------------------

export type SuperAdminUserManagementProps = {
  initialTab?: 'users' | 'audit';
};

export default function SuperAdminUserManagement({
  initialTab = 'users',
}: SuperAdminUserManagementProps) {
  const { enqueueSnackbar } = useSnackbar();
  const isMobile = useResponsive('down', 'sm');

  const [tab, setTab] = useState(initialTab === 'audit' ? 1 : 0);

  useEffect(() => {
    setTab(initialTab === 'audit' ? 1 : 0);
  }, [initialTab]);

  const [users, setUsers] = useState<SuperAdminManagedUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<UserAuditLogEntry[]>([]);

  const dispatch = useDispatch();
  const {
    roles,
    tenants,
    schools,
    loaded,
    isLoading,
    error: masterDataError,
  } = useSelector((state) => state.adminMasterData);

  const [search, setSearch] = useState('');
  const [filterTenant, setFilterTenant] = useState<string>('all');
  const [filterSchool, setFilterSchool] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<typeof STATUS_FILTER[number]>('all');

  const {
    dense,
    page,
    order,
    orderBy,
    rowsPerPage,
    setPage,
    onSort,
    onChangePage,
    onChangeRowsPerPage,
  } = useTable({ defaultOrderBy: 'username', defaultRowsPerPage: 10 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm());

  useEffect(() => {
    dispatch(fetchAdminMasterData());
  }, [dispatch]);

  const fetchUsersList = useCallback(async () => {
    setIsUsersLoading(true);
    const params: Record<string, string | number> = {
      page: 1,
      pageSize: 1000,
    };
    if (filterSchool !== 'all') params.schoolId = filterSchool;
    if (filterTenant !== 'all') params.tenantId = filterTenant;
    if (filterRole !== 'all') params.accountType = filterRole;
    if (filterStatus !== 'all') params.status = filterStatus.toUpperCase();
    const keyword = search.trim();
    if (keyword) params.search = keyword;
    try {
      const res = await axios.get(API_ENDPOINTS.usersCreate, { params });
      const rows = extractUsersFromResponse(res.data);
      const mapped = rows.map((raw) => {
        const id = String(raw.id ?? uuidv4());
        let schoolId = String(raw.schoolId ?? '');
        let tenantId = String(raw.tenantId ?? '');

        const accountType = String(raw.accountType ?? '');
        const matchedRole = roles.find((r) => r.code === accountType.toUpperCase());
        const roleId = matchedRole?.id || '';
        const schoolName =
          schools.find((s) => s.id === schoolId)?.name ||
          schoolId;
        const tenantName =
          tenants.find((t) => t.id === tenantId)?.name ||
          tenantId;
        const roleName = matchedRole ? matchedRole.name : roleId;
        const statusRaw = String(raw.status ?? '').toLowerCase();
        const status: SuperAdminUserStatus = statusRaw === 'locked' || statusRaw === 'inactive' ? 'locked' : 'active';
        const now = new Date().toISOString();
        return {
          id,
          username: String(raw.username ?? ''),
          fullName: String(raw.fullName ?? ''),
          email: String(raw.email ?? ''),
          avatarUrl: String(raw.avatarUrl ?? ''),
          roleId,
          roleName,
          schoolId,
          schoolName,
          tenantId,
          tenantName,
          status,
          accountType,
          createdAt: String(raw.createdAt ?? now),
          updatedAt: String(raw.updatedAt ?? now),
        } satisfies SuperAdminManagedUser;
      });
      setUsers(mapped);
    } catch (error) {
      enqueueSnackbar(apiErrorMessage(error, 'Không tải được danh sách tài khoản'), { variant: 'error' });
    } finally {
      setIsUsersLoading(false);
    }
  }, [
    filterSchool,
    filterTenant,
    filterRole,
    filterStatus,
    search,
    schools,
    tenants,
    roles,
    enqueueSnackbar,
  ]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.adminAuditLogs);
      const data = res.data?.items ?? res.data ?? [];
      setAuditLogs(data);
    } catch (error) {
      enqueueSnackbar('Không tải được lịch sử hoạt động', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (!loaded) return;
    fetchUsersList();
    if (tab === 1) fetchAuditLogs();
  }, [loaded, fetchUsersList, fetchAuditLogs, tab]);

  useEffect(() => {
    if (!loaded) return;
    if (!roles.length) enqueueSnackbar('Không tải được danh sách vai trò', { variant: 'warning' });
    if (!tenants.length) enqueueSnackbar('Không tải được danh sách tenant', { variant: 'warning' });
    if (!schools.length) enqueueSnackbar('Không tải được danh sách trường', { variant: 'warning' });
  }, [loaded, roles.length, tenants.length, schools.length, enqueueSnackbar]);

  useEffect(() => {
    if (!masterDataError) return;
    enqueueSnackbar(sanitizeUiMessage(masterDataError), { variant: 'error' });
  }, [masterDataError, enqueueSnackbar]);

  useEffect(() => {
    if (!roles.length) return;
    if (
      filterRole !== 'all' &&
      !roles.some((r) => getRoleOptionValue(r) === filterRole)
    ) {
      setFilterRole('all');
    }
  }, [roles, filterRole]);

  const allSchoolOptions = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; tenantId: string; tenantName?: string }>();
    schools.forEach((s) => {
      if (!s.id) return;
      byId.set(s.id, { id: s.id, name: s.name, tenantId: s.tenantId, tenantName: s.tenantName });
    });
    users.forEach((u) => {
      if (!u.schoolId) return;
      if (byId.has(u.schoolId)) return;
      byId.set(u.schoolId, {
        id: u.schoolId,
        name: u.schoolName || u.schoolId,
        tenantId: u.tenantId || '',
        ...(u.tenantName ? { tenantName: u.tenantName } : {}),
      });
    });
    return [...byId.values()];
  }, [schools, users]);

  useEffect(() => {
    if (!tenants.length) return;
    if (filterTenant !== 'all' && !tenants.some((t) => t.id === filterTenant)) {
      setFilterTenant('all');
      setFilterSchool('all');
    }
  }, [tenants, filterTenant]);

  useEffect(() => {
    if (filterSchool === 'all') return;
    const ok = allSchoolOptions.some((s) => s.id === filterSchool && schoolMatchesTenant(s.tenantId, filterTenant === 'all' ? '' : filterTenant));
    if (!ok) setFilterSchool('all');
  }, [allSchoolOptions, filterSchool, filterTenant]);

  const dialogRoleOptions = useMemo(() => {
    const base = [...roles];
    if (dialogMode === 'edit' && form.roleId && !base.some((r) => r.id === form.roleId)) {
      const label = users.find((u) => u.id === editingId)?.roleName || form.roleId;
      base.push({ id: form.roleId, name: label });
    }
    return base;
  }, [roles, dialogMode, form.roleId, editingId, users]);

  const dialogTenantOptions = useMemo(() => {
    const base = [...tenants];
    if (dialogMode === 'edit' && form.tenantId && form.tenantId !== 'null_tenant' && !base.some((t) => t.id === form.tenantId)) {
      const label = users.find((u) => u.id === editingId)?.tenantName || form.tenantId;
      base.push({ id: form.tenantId, name: label });
    }
    return base;
  }, [tenants, dialogMode, form.tenantId, editingId, users, form.roleId, roles]);

  const dialogSchoolOptions = useMemo(() => {
    const base = allSchoolOptions.filter((s) => schoolMatchesTenant(s.tenantId, form.tenantId));
    if (dialogMode === 'edit' && form.schoolId && form.schoolId !== 'null_school' && !base.some((s) => s.id === form.schoolId)) {
      const label = users.find((u) => u.id === editingId)?.schoolName || form.schoolId;
      base.push({ id: form.schoolId, name: label, tenantId: form.tenantId });
    }
    return base;
  }, [allSchoolOptions, form.tenantId, form.schoolId, dialogMode, editingId, users, form.roleId, roles]);

  useEffect(() => {
    if (!form.roleId) {
      setForm((f) => ({ ...f, tenantId: '', schoolId: '' }));
      return;
    }

    const selectedRole = dialogRoleOptions.find((r) => r.id === form.roleId);
    const roleNameNormalized = (selectedRole?.name || '').toUpperCase().trim();
    const roleIdNormalized = (selectedRole?.id || '').toUpperCase().trim();
    const roleCodeNormalized = (selectedRole?.code || '').toUpperCase().trim();

    const isLmsAdmin = (
      roleIdNormalized === 'LMS_ADMIN' || 
      roleIdNormalized.includes('LMS_ADMIN') || 
      roleIdNormalized.includes('LMS-ADMIN') || 
      roleCodeNormalized === 'LMS_ADMIN' ||
      roleCodeNormalized.includes('LMS_ADMIN') ||
      roleCodeNormalized.includes('LMS-ADMIN') ||
      roleNameNormalized === 'LMS ADMIN' || 
      roleNameNormalized === 'LMS_ADMIN'
    );

    const isTenantAdmin = (
      roleIdNormalized === 'TENANT_ADMIN' || 
      roleIdNormalized.includes('TENANT_ADMIN') || 
      roleIdNormalized.includes('TENANT-ADMIN') || 
      roleCodeNormalized === 'TENANT_ADMIN' ||
      roleCodeNormalized.includes('TENANT_ADMIN') ||
      roleCodeNormalized.includes('TENANT-ADMIN') ||
      roleNameNormalized === 'TENANT ADMIN' || 
      roleNameNormalized === 'TENANT_ADMIN'
    );

    if (isLmsAdmin) {
      setForm((f) => ({ ...f, tenantId: '', schoolId: '' }));
    } else if (isTenantAdmin) {
      setForm((f) => ({
        ...f,
        schoolId: '',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.roleId, dialogRoleOptions, dialogTenantOptions]);

  const appendAudit = useCallback((partial: Omit<UserAuditLogEntry, 'id' | 'at'>) => {
    const entry: UserAuditLogEntry = {
      id: uuidv4(),
      at: new Date().toISOString(),
      ...partial,
    };
    setAuditLogs((prev) => [entry, ...prev]);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filterTenant !== 'all' && u.tenantId !== filterTenant) return false;
      if (filterSchool !== 'all' && u.schoolId !== filterSchool) return false;
      if (filterRole !== 'all') {
        const accountTypeValue = (u.accountType || u.roleId).toUpperCase().trim();
        if (accountTypeValue !== filterRole.toUpperCase().trim()) return false;
      }
      if (filterStatus !== 'all' && u.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !u.username.toLowerCase().includes(q) &&
          !u.fullName.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [users, filterTenant, filterSchool, filterRole, filterStatus, search]);

  const sortedUsers = useMemo(() => {
    const key = orderBy as any;
    const comparator = getComparator(order, key) as any;
    return [...filteredUsers].sort(comparator);
  }, [filteredUsers, order, orderBy]);

  const dataInPage = sortedUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  useEffect(() => {
    setPage(0);
  }, [search, filterTenant, filterSchool, filterRole, filterStatus, setPage]);

  const handleSort = (id: string) => {
    if (id === 'actions') return;
    onSort(id);
  };

  const openCreate = () => {
    setDialogMode('create');
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
    if (isLoading) {
      enqueueSnackbar('Danh mục đang tải — đợi vài giây rồi thử chọn Tenant/Trường/Vai trò', {
        variant: 'info',
      });
    }
    if (!isLoading && loaded && (!tenants.length || !allSchoolOptions.length || !roles.length)) {
      enqueueSnackbar(
        'Chưa tải đủ danh sách chương trình, trường hoặc vai trò. Thử tải lại trang hoặc đăng nhập lại.',
        { variant: 'warning' }
      );
    }
    if (!isLoading && !loaded) {
      dispatch(fetchAdminMasterData());
    }
  };

  const selectedRoleForSave = dialogRoleOptions.find((r) => r.id === form.roleId);
  const roleNameNormalizedForSave = (selectedRoleForSave?.name || '').toUpperCase().trim();
  const roleIdNormalizedForSave = (selectedRoleForSave?.id || '').toUpperCase().trim();
  const roleCodeNormalizedForSave = (selectedRoleForSave?.code || '').toUpperCase().trim();

  const isLmsAdminForSave = !!form.roleId && (
    roleIdNormalizedForSave === 'LMS_ADMIN' || 
    roleIdNormalizedForSave.includes('LMS_ADMIN') || 
    roleIdNormalizedForSave.includes('LMS-ADMIN') || 
    roleCodeNormalizedForSave === 'LMS_ADMIN' ||
    roleCodeNormalizedForSave.includes('LMS_ADMIN') ||
    roleCodeNormalizedForSave.includes('LMS-ADMIN') ||
    roleNameNormalizedForSave === 'LMS ADMIN' || 
    roleNameNormalizedForSave === 'LMS_ADMIN'
  );

  const isTenantAdminForSave = !!form.roleId && (
    roleIdNormalizedForSave === 'TENANT_ADMIN' || 
    roleIdNormalizedForSave.includes('TENANT_ADMIN') || 
    roleIdNormalizedForSave.includes('TENANT-ADMIN') || 
    roleCodeNormalizedForSave === 'TENANT_ADMIN' ||
    roleCodeNormalizedForSave.includes('TENANT_ADMIN') ||
    roleCodeNormalizedForSave.includes('TENANT-ADMIN') ||
    roleNameNormalizedForSave === 'TENANT ADMIN' || 
    roleNameNormalizedForSave === 'TENANT_ADMIN'
  );

  const createSaveDisabled =
    dialogMode === 'create' && (
      !form.username.trim() ||
      !form.password.trim() ||
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.roleId.trim() ||
      (!isLmsAdminForSave && !form.tenantId.trim()) ||
      (!isLmsAdminForSave && !isTenantAdminForSave && !form.schoolId.trim())
    );

  const openEdit = (user: SuperAdminManagedUser) => {
    const selectedRole = roles.find((r) => {
      const accountTypeValue = (user.accountType || user.roleId).toUpperCase().trim();
      return (
        getRoleOptionValue(r).toUpperCase() === accountTypeValue ||
        r.id.toUpperCase() === user.roleId.toUpperCase().trim()
      );
    });

    setDialogMode('edit');
    setEditingId(user.id);
    setForm({
      username: user.username,
      password: '',
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      avatarFile: null,
      tenantId: user.tenantId || 'null_tenant',
      schoolId: user.schoolId || 'null_school',
      roleId: selectedRole?.id || user.roleId || user.accountType || '',
      status: user.status,
    });
    setDialogOpen(true);
  };

  const handleFormTenantChange = (tenantId: string) => {
    const firstSchool = allSchoolOptions.find((s) => schoolMatchesTenant(s.tenantId, tenantId));
    setForm((f) => ({
      ...f,
      tenantId,
      schoolId: firstSchool?.id ?? '',
    }));
  };

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      enqueueSnackbar('Họ tên và email là bắt buộc', { variant: 'warning' });
      return;
    }
    if (!isValidEmail(form.email)) {
      enqueueSnackbar('Định dạng email không hợp lệ', { variant: 'warning' });
      return;
    }
    if (!form.roleId.trim()) {
      enqueueSnackbar('Vui lòng chọn vai trò', { variant: 'warning' });
      return;
    }

    const selectedRole = dialogRoleOptions.find((r) => r.id === form.roleId);
    const roleName = selectedRole?.name ?? '';
    const roleNameNormalized = roleName.toUpperCase().trim();
    const roleIdNormalized = (selectedRole?.id || '').toUpperCase().trim();
    const roleCodeNormalized = (selectedRole?.code || '').toUpperCase().trim();

    const isLmsAdmin = (
      roleIdNormalized === 'LMS_ADMIN' || 
      roleIdNormalized.includes('LMS_ADMIN') || 
      roleIdNormalized.includes('LMS-ADMIN') || 
      roleCodeNormalized === 'LMS_ADMIN' ||
      roleCodeNormalized.includes('LMS_ADMIN') ||
      roleCodeNormalized.includes('LMS-ADMIN') ||
      roleNameNormalized === 'LMS ADMIN' || 
      roleNameNormalized === 'LMS_ADMIN'
    );

    const isTenantAdmin = (
      roleIdNormalized === 'TENANT_ADMIN' || 
      roleIdNormalized.includes('TENANT_ADMIN') || 
      roleIdNormalized.includes('TENANT-ADMIN') || 
      roleCodeNormalized === 'TENANT_ADMIN' ||
      roleCodeNormalized.includes('TENANT_ADMIN') ||
      roleCodeNormalized.includes('TENANT-ADMIN') ||
      roleNameNormalized === 'TENANT ADMIN' || 
      roleNameNormalized === 'TENANT_ADMIN'
    );

    const tenant = tenants.find((t) => t.id === form.tenantId);
    const school = allSchoolOptions.find((s) => s.id === form.schoolId);

    if (!isLmsAdmin) {
      if (!tenant) {
        enqueueSnackbar('Vui lòng chọn tenant', { variant: 'warning' });
        return;
      }
      if (!isTenantAdmin && !school) {
        enqueueSnackbar('Vui lòng chọn trường học', { variant: 'warning' });
        return;
      }
    }

    if (dialogMode === 'create') {
      if (!form.username.trim()) {
        enqueueSnackbar('Username là bắt buộc', { variant: 'warning' });
        return;
      }
      if (!form.password.trim()) {
        enqueueSnackbar('Mật khẩu là bắt buộc', { variant: 'warning' });
        return;
      }
      try {
        const accountType = selectedRole?.code || roleName.toUpperCase().replace(/\s+/g, '_');
        const payload = {
          schoolId: isLmsAdmin || isTenantAdmin ? null : school?.id || null,
          username: form.username.trim(),
          password: form.password,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          avatarUrl: form.avatarUrl.trim(),
          avatar: form.avatarUrl.trim(),
          roleId: form.roleId,
          tenantId: isLmsAdmin ? null : tenant?.id || null,
          accountType,
        };
        const response = await axios.post(API_ENDPOINTS.usersCreate, payload);
        const created = (response.data ?? {}) as Record<string, unknown>;
        const id = String(created.userId ?? uuidv4());
        
        if (form.avatarUrl) {
          try {
            await axios.patch(API_ENDPOINTS.userAvatar(id), {
              avatarUrl: form.avatarUrl.trim()
            });
          } catch (err) {
            console.error('Failed to update avatar after create', err);
          }
        }
        
        const ts = new Date().toISOString();
        const row: SuperAdminManagedUser = {
          id,
          username: String(created.username ?? payload.username),
          fullName: String(created.fullName ?? payload.fullName),
          email: String(created.email ?? payload.email),
          avatarUrl: String(created.avatarUrl ?? payload.avatarUrl),
          roleId: form.roleId,
          roleName: roleName || String(created.roleName ?? ''),
          schoolId: school?.id || '',
          schoolName: school?.name || '',
          tenantId: tenant?.id || '',
          tenantName: tenant?.name || '',
          status: form.status,
          accountType,
          createdAt: ts,
          updatedAt: ts,
        };
        setUsers((prev) => [row, ...prev]);
        appendAudit({
          actorLabel: ACTOR_LABEL,
          action: 'CREATE',
          userId: id,
          userLabel: row.username,
          detail: `Tạo tài khoản: ${row.fullName} (${row.email})`,
        });
        enqueueSnackbar('Đã tạo tài khoản', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar(apiErrorMessage(error), { variant: 'error' });
        return;
      }
    } else if (editingId) {
      try {
        const payload = {
          fullName: form.fullName.trim(),
          email: form.email.trim() || null,
          status: form.status === 'active' ? 'ACTIVE' : 'LOCKED',
          accountType: selectedRole?.code || form.roleId || null,
        };
        await axios.put(API_ENDPOINTS.userUpdate(editingId), payload);

        if (form.avatarUrl !== undefined) {
          try {
            await axios.patch(API_ENDPOINTS.userAvatar(editingId), {
              avatarUrl: form.avatarUrl.trim()
            });
          } catch (err) {
            console.error('Failed to update avatar during edit', err);
          }
        }

        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== editingId) return u;
            const prevSnap = { ...u };
            const updated: SuperAdminManagedUser = {
              ...u,
              fullName: form.fullName.trim(),
              email: form.email.trim(),
              avatarUrl: form.avatarUrl.trim(),
              roleId: form.roleId,
              roleName: roleName || u.roleName,
              schoolId: school?.id || '',
              schoolName: school?.name || '',
              tenantId: tenant?.id || '',
              tenantName: tenant?.name || '',
              status: form.status,
              accountType: selectedRole?.code || form.roleId,
              updatedAt: new Date().toISOString(),
            };
            const changes: string[] = [];
            if (prevSnap.fullName !== updated.fullName) changes.push('họ tên');
            if (prevSnap.email !== updated.email) changes.push('email');
            if (prevSnap.roleId !== updated.roleId) changes.push('vai trò');
            if (prevSnap.tenantId !== updated.tenantId) changes.push('tenant');
            if (prevSnap.schoolId !== updated.schoolId) changes.push('trường');
            if (prevSnap.status !== updated.status)
              changes.push(`trạng thái → ${updated.status === 'locked' ? 'khóa' : 'hoạt động'}`);
            appendAudit({
              actorLabel: ACTOR_LABEL,
              action: 'UPDATE',
              userId: editingId,
              userLabel: updated.username,
              detail: changes.length ? `Cập nhật: ${changes.join(', ')}` : 'Không đổi dữ liệu',
            });
            return updated;
          })
        );
        enqueueSnackbar('Đã cập nhật tài khoản', { variant: 'success' });
      } catch (error) {
        enqueueSnackbar(apiErrorMessage(error, 'Không thể cập nhật tài khoản'), { variant: 'error' });
        return;
      }
    }
    setDialogOpen(false);
  };

  const toggleLock = async (user: SuperAdminManagedUser) => {
    const next: SuperAdminUserStatus = user.status === 'active' ? 'locked' : 'active';
    const apiStatus = next === 'locked' ? 'LOCKED' : 'ACTIVE';
    try {
      await axios.patch(API_ENDPOINTS.userStatus(user.id), { status: apiStatus });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, status: next, updatedAt: new Date().toISOString() } : u
        )
      );
      appendAudit({
        actorLabel: ACTOR_LABEL,
        action: next === 'locked' ? 'LOCK' : 'UNLOCK',
        userId: user.id,
        userLabel: user.username,
        detail: next === 'locked' ? 'Khóa đăng nhập' : 'Mở khóa đăng nhập',
      });
      enqueueSnackbar(next === 'locked' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', {
        variant: 'success',
      });
    } catch (error) {
      enqueueSnackbar(apiErrorMessage(error, 'Không thể cập nhật trạng thái tài khoản'), { variant: 'error' });
    }
  };

  const handleDeleteSession = async (user: SuperAdminManagedUser) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy toàn bộ phiên đăng nhập của tài khoản ${user.username}?`)) return;
    try {
      await axios.delete(API_ENDPOINTS.adminSessionDelete(user.id));
      enqueueSnackbar(`Đã hủy toàn bộ phiên đăng nhập của ${user.username}`, { variant: 'success' });
      appendAudit({
        actorLabel: ACTOR_LABEL,
        action: 'UPDATE',
        userId: user.id,
        userLabel: user.username,
        detail: 'Hủy toàn bộ phiên đăng nhập',
      });
    } catch (error) {
      enqueueSnackbar(apiErrorMessage(error, 'Không thể hủy phiên đăng nhập'), { variant: 'error' });
    }
  };

  const selectedRole = dialogRoleOptions.find((r) => r.id === form.roleId);
  const roleNameNormalized = (selectedRole?.name || '').toUpperCase().trim();
  const roleIdNormalized = (selectedRole?.id || '').toUpperCase().trim();
  const roleCodeNormalized = (selectedRole?.code || '').toUpperCase().trim();

  const hasSelectedRole = !!form.roleId;

  const isLmsAdmin = hasSelectedRole && (
    roleIdNormalized === 'LMS_ADMIN' || 
    roleIdNormalized.includes('LMS_ADMIN') || 
    roleIdNormalized.includes('LMS-ADMIN') || 
    roleCodeNormalized === 'LMS_ADMIN' ||
    roleCodeNormalized.includes('LMS_ADMIN') ||
    roleCodeNormalized.includes('LMS-ADMIN') ||
    roleNameNormalized === 'LMS ADMIN' || 
    roleNameNormalized === 'LMS_ADMIN'
  );

  const isTenantAdmin = hasSelectedRole && (
    roleIdNormalized === 'TENANT_ADMIN' || 
    roleIdNormalized.includes('TENANT_ADMIN') || 
    roleIdNormalized.includes('TENANT-ADMIN') || 
    roleCodeNormalized === 'TENANT_ADMIN' ||
    roleCodeNormalized.includes('TENANT_ADMIN') ||
    roleCodeNormalized.includes('TENANT-ADMIN') ||
    roleNameNormalized === 'TENANT ADMIN' || 
    roleNameNormalized === 'TENANT_ADMIN'
  );

  const isTenantDisabled = !hasSelectedRole || isLmsAdmin;
  const isSchoolDisabled = !hasSelectedRole || isLmsAdmin || isTenantAdmin;

  return (
    <>
      <Card>
        <Stack spacing={2} sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ md: 'center' }}
            justifyContent="space-between"
          >
            <Typography variant="h6">Tài khoản người dùng</Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={openCreate}
            >
              Tạo tài khoản
            </Button>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
            <TextField
              size="small"
              label="Tìm kiếm"
              placeholder="Username, họ tên, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 240, flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Chương trình</InputLabel>
              <Select
                label="Chương trình"
                value={filterTenant}
                onChange={(e) => {
                  setFilterTenant(e.target.value);
                }}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {tenants.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Trường</InputLabel>
              <Select
                label="Trường"
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {allSchoolOptions
                  .filter((s) => schoolMatchesTenant(s.tenantId, filterTenant === 'all' ? '' : filterTenant))
                  .map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Vai trò</InputLabel>
              <Select
                label="Vai trò"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={getRoleOptionValue(r)}>
                    {r.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                label="Trạng thái"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof STATUS_FILTER[number])}
              >
                <MenuItem value="all">Tất cả</MenuItem>
                <MenuItem value="active">Đang hoạt động</MenuItem>
                <MenuItem value="locked">Đã khóa</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table size={dense ? 'small' : 'medium'} sx={{ minWidth: isMobile ? 'auto' : 960 }}>
              {!isMobile && (
                <TableHeadCustom
                  order={order}
                  orderBy={orderBy}
                  headLabel={USER_TABLE_HEAD}
                  rowCount={filteredUsers.length}
                  onSort={handleSort}
                />
              )}
              <TableBody>
                {isUsersLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableSkeleton key={index} sx={{ height: dense ? 52 : 72 }} />
                  ))
                ) : (
                  <>
                    {dataInPage.map((row) => {
                      if (isMobile) {
                        return (
                          <TableRow key={row.id} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                            <TableCell colSpan={12} sx={{ p: 2 }}>
                              <Stack spacing={1.5}>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                  <Avatar src={row.avatarUrl || undefined} alt={row.fullName} sx={{ width: 40, height: 40 }}>
                                    {row.fullName.charAt(0)}
                                  </Avatar>
                                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    <Typography variant="subtitle2" noWrap>{row.username}</Typography>
                                    <Typography variant="body2" color="text.secondary" noWrap>{row.fullName}</Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }} noWrap>{row.email}</Typography>
                                  </Box>
                                  <Label color={row.status === 'active' ? 'success' : 'error'} sx={{ alignSelf: 'flex-start' }}>
                                    {row.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                                  </Label>
                                </Stack>

                                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1.5, p: 1.5, bgcolor: 'background.neutral', borderRadius: 1 }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                      Trường học
                                    </Typography>
                                    <Typography variant="body2" noWrap>
                                      {row.schoolName && !isUUID(row.schoolName) ? row.schoolName : <LazyNameFetcher id={row.schoolId} type="school" fallback={row.schoolName} />}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 'bold' }}>
                                      Vai trò
                                    </Typography>
                                    <Typography variant="body2">{row.roleName || row.accountType || row.roleId}</Typography>
                                  </Box>
                                </Box>

                                <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<Iconify icon="eva:edit-fill" />}
                                    onClick={() => openEdit(row)}
                                  >
                                    Sửa
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color={row.status === 'active' ? 'warning' : 'success'}
                                    startIcon={<Iconify icon={row.status === 'active' ? 'eva:lock-fill' : 'eva:unlock-fill'} />}
                                    onClick={() => toggleLock(row)}
                                  >
                                    {row.status === 'active' ? 'Khóa' : 'Mở khóa'}
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    startIcon={<Iconify icon="eva:log-out-fill" />}
                                    onClick={() => handleDeleteSession(row)}
                                  >
                                    Hủy phiên
                                  </Button>
                                </Stack>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return (
                        <TableRow hover key={row.id}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar src={row.avatarUrl || undefined} alt={row.fullName}>
                                {row.fullName.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">{row.username}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  {row.fullName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                                  {row.email}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {row.schoolName && !isUUID(row.schoolName) ? row.schoolName : <LazyNameFetcher id={row.schoolId} type="school" fallback={row.schoolName} />}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {row.tenantName && !isUUID(row.tenantName) ? row.tenantName : <LazyNameFetcher id={row.tenantId} type="tenant" fallback={row.tenantName} />}
                            </Typography>
                          </TableCell>
                          <TableCell>{row.roleName || row.accountType || row.roleId}</TableCell>
                          <TableCell align="center">
                            <Label color={row.status === 'active' ? 'success' : 'error'}>
                              {row.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                            </Label>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Sửa">
                              <IconButton color="primary" onClick={() => openEdit(row)}>
                                <Iconify icon="eva:edit-fill" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={row.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}>
                              <IconButton
                                color={row.status === 'active' ? 'warning' : 'success'}
                                onClick={() => toggleLock(row)}
                              >
                                <Iconify
                                  icon={row.status === 'active' ? 'eva:lock-fill' : 'eva:unlock-fill'}
                                />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Hủy toàn bộ phiên đăng nhập">
                              <IconButton color="error" onClick={() => handleDeleteSession(row)}>
                                <Iconify icon="eva:log-out-fill" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {!isMobile && (
                      <TableEmptyRows
                        height={dense ? 52 : 72}
                        emptyRows={emptyRows(page, rowsPerPage, sortedUsers.length)}
                      />
                    )}

                    <TableNoData isNotFound={!sortedUsers.length} />
                  </>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>

        <Box sx={{ position: 'relative' }}>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={sortedUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={onChangePage}
            onRowsPerPageChange={onChangeRowsPerPage}
            labelRowsPerPage="Số hàng mỗi trang:"
          />
        </Box>
      </Card>

      <Dialog fullWidth maxWidth="sm" open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{dialogMode === 'create' ? 'Tạo tài khoản' : 'Sửa tài khoản'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {dialogMode === 'create' && (isLoading || !loaded) && (
              <Alert severity="info">Đang tải danh mục chương trình, trường và vai trò…</Alert>
            )}
            {dialogMode === 'create' &&
              loaded &&
              (!tenants.length || !schools.length || !roles.length) && (
                <Alert severity="warning">
                  Chưa tải đủ danh sách chương trình, trường hoặc vai trò nên chưa thể tạo tài khoản. Hãy tải
                  lại trang hoặc đăng nhập lại; nếu vẫn không được, liên hệ bộ phận kỹ thuật.
                </Alert>
              )}
            <TextField
              label="Username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              disabled={dialogMode === 'edit'}
              fullWidth
              required
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  bgcolor: 'background.neutral',
                }
              }}
            />
            {dialogMode === 'create' && (
              <TextField
                label="Mật khẩu"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                fullWidth
                required
              />
            )}
            <TextField
              label="Họ và tên"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              fullWidth
              required
            />
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Ảnh đại diện (Avatar)
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  src={form.avatarUrl || undefined}
                  alt={form.fullName}
                  sx={{ width: 56, height: 56 }}
                >
                  {form.fullName ? form.fullName.charAt(0) : 'U'}
                </Avatar>
                <Stack spacing={0.5}>
                  <Button
                    variant="outlined"
                    component="label"
                    color="primary"
                    size="small"
                    startIcon={<Iconify icon="eva:image-fill" />}
                    sx={{ width: 'fit-content' }}
                  >
                    Chọn file ảnh
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setForm((f) => ({ ...f, avatarFile: file }));
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setForm((f) => ({ ...f, avatarUrl: event.target!.result as string }));
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </Button>
                  {form.avatarUrl && (
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      onClick={() => setForm((f) => ({ ...f, avatarUrl: '', avatarFile: null }))}
                      sx={{ width: 'fit-content', p: 0, minWidth: 'auto' }}
                    >
                      Xóa ảnh
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Vai trò</InputLabel>
              <Select
                label="Vai trò"
                value={form.roleId}
                onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
              >
                {dialogRoleOptions.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl 
              fullWidth 
              required
              disabled={isTenantDisabled}
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  bgcolor: 'background.neutral',
                }
              }}
            >
              <InputLabel>Chương trình</InputLabel>
              <Select
                label="Chương trình"
                value={form.tenantId}
                onChange={(e) => handleFormTenantChange(e.target.value)}
              >
                {dialogTenantOptions.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl 
              fullWidth 
              required
              disabled={isSchoolDisabled}
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  bgcolor: 'background.neutral',
                }
              }}
            >
              <InputLabel>Trường</InputLabel>
              <Select
                label="Trường"
                value={form.schoolId}
                onChange={(e) => setForm((f) => ({ ...f, schoolId: e.target.value }))}
              >
                {dialogSchoolOptions.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl 
              fullWidth 
              disabled={dialogMode === 'create'}
              sx={{
                '& .MuiInputBase-root.Mui-disabled': {
                  bgcolor: 'background.neutral',
                }
              }}
            >
              <InputLabel>Trạng thái</InputLabel>
              <Select
                label="Trạng thái"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as SuperAdminUserStatus }))
                }
              >
                <MenuItem value="active">Đang hoạt động</MenuItem>
                <MenuItem value="locked">Đã khóa</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={createSaveDisabled}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
