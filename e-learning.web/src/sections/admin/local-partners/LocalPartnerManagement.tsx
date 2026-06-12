import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import type { LocalPartner } from '../../../@types/localPartner';
import { useDispatch, useSelector } from '../../../redux/store';
import {
  assignSchoolToPartner,
  fetchLocalPartners,
  toggleLocalPartnerStatus,
  unassignSchoolFromPartner,
  upsertLocalPartner,
} from '../../../redux/slices/localPartner';
import { fetchAdminMasterData } from '../../../redux/slices/adminMasterData';
import Iconify from '../../../components/Iconify';
import Scrollbar from '../../../components/Scrollbar';
import Label from '../../../components/Label';
import uuidv4 from '../../../utils/uuidv4';
import { sanitizeUiMessage } from '../../../utils/sanitizeUiMessage';

type PartnerForm = {
  name: string;
  contactName: string;
  contactEmail: string;
  quotaSchools: number;
};

const emptyForm: PartnerForm = {
  name: '',
  contactName: '',
  contactEmail: '',
  quotaSchools: 1,
};

export default function LocalPartnerManagement() {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const { items, error, isLoading, loaded } = useSelector((state) => state.localPartner);
  const { schools } = useSelector((state) => state.adminMasterData);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [assignPartnerId, setAssignPartnerId] = useState<string>('');
  const [assignSchoolId, setAssignSchoolId] = useState<string>('');

  useEffect(() => {
    dispatch(fetchLocalPartners());
    dispatch(fetchAdminMasterData());
  }, [dispatch]);

  useEffect(() => {
    if (!error) return;
    enqueueSnackbar(sanitizeUiMessage(error), { variant: 'error' });
  }, [error, enqueueSnackbar]);

  const assignedSchoolIds = useMemo(() => items.flatMap((x) => x.schoolIds), [items]);
  const availableSchools = useMemo(
    () => schools.filter((s) => !assignedSchoolIds.includes(s.id)),
    [schools, assignedSchoolIds]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: LocalPartner) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      contactName: item.contactName,
      contactEmail: item.contactEmail,
      quotaSchools: item.quotaSchools,
    });
    setDialogOpen(true);
  };

  const onSave = () => {
    if (!form.name.trim()) {
      enqueueSnackbar('Tên partner là bắt buộc', { variant: 'warning' });
      return;
    }
    if (!form.contactEmail.trim()) {
      enqueueSnackbar('Email liên hệ là bắt buộc', { variant: 'warning' });
      return;
    }
    if (!Number.isFinite(form.quotaSchools) || form.quotaSchools < 1) {
      enqueueSnackbar('Quota số trường phải lớn hơn 0', { variant: 'warning' });
      return;
    }
    const now = new Date().toISOString();
    const existing = editingId ? items.find((x) => x.id === editingId) : undefined;
    dispatch(
      upsertLocalPartner({
        id: editingId || `lp-${uuidv4()}`,
        name: form.name.trim(),
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        quotaSchools: Math.floor(form.quotaSchools),
        schoolIds: existing?.schoolIds || [],
        status: existing?.status || 'active',
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      })
    );
    enqueueSnackbar(editingId ? 'Đã cập nhật Local Partner' : 'Đã tạo Local Partner', {
      variant: 'success',
    });
    setDialogOpen(false);
  };

  const onAssignSchool = () => {
    if (!assignPartnerId || !assignSchoolId) {
      enqueueSnackbar('Vui lòng chọn partner và trường', { variant: 'warning' });
      return;
    }
    dispatch(assignSchoolToPartner(assignPartnerId, assignSchoolId));
    setAssignSchoolId('');
  };

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <Card sx={{ p: { xs: 1.5, md: 2.5 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
          <Typography variant="h6">Quản lý Local Partner và quota triển khai trường</Typography>
          <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />} onClick={openCreate}>
            Tạo Local Partner
          </Button>
        </Stack>
        {!loaded && isLoading && (
          <Alert sx={{ mt: 2 }} severity="info">
            Đang tải danh sách Local Partner...
          </Alert>
        )}
      </Card>

      <Card sx={{ p: { xs: 1.5, md: 2.5 } }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
          Gán trường vào partner
        </Typography>
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="assign-partner">Local Partner</InputLabel>
              <Select
                labelId="assign-partner"
                label="Local Partner"
                value={assignPartnerId}
                onChange={(e) => setAssignPartnerId(e.target.value)}
              >
                {items.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel id="assign-school">Trường</InputLabel>
              <Select
                labelId="assign-school"
                label="Trường"
                value={assignSchoolId}
                onChange={(e) => setAssignSchoolId(e.target.value)}
              >
                {availableSchools.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button fullWidth variant="outlined" sx={{ height: 1 }} onClick={onAssignSchool}>
              Gán trường
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Card>
        <TableContainer>
          <Scrollbar>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Partner</TableCell>
                  <TableCell>Liên hệ</TableCell>
                  <TableCell>Quota</TableCell>
                  <TableCell>Trường thuộc partner</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{p.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        {p.contactName || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {p.contactEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {p.schoolIds.length}/{p.quotaSchools}
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        {p.schoolIds.length === 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Chưa gán trường
                          </Typography>
                        )}
                        {p.schoolIds.map((schoolId) => {
                          const school = schools.find((x) => x.id === schoolId);
                          return (
                            <Stack key={schoolId} direction="row" spacing={1} alignItems="center">
                              <Typography variant="caption">{school?.name || schoolId}</Typography>
                              <Button
                                size="small"
                                color="warning"
                                onClick={() => dispatch(unassignSchoolFromPartner(p.id, schoolId))}
                              >
                                Gỡ
                              </Button>
                            </Stack>
                          );
                        })}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {p.status === 'active' ? <Label color="success">Active</Label> : <Label color="warning">Inactive</Label>}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={() => openEdit(p)}>
                          Sửa
                        </Button>
                        <Button size="small" onClick={() => dispatch(toggleLocalPartnerStatus(p.id))}>
                          {p.status === 'active' ? 'Ngừng' : 'Kích hoạt'}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!items.length && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Typography align="center" sx={{ py: 3 }} color="text.secondary">
                        Chưa có Local Partner
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      </Card>

      <Dialog fullWidth maxWidth="sm" open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editingId ? 'Sửa Local Partner' : 'Tạo Local Partner'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Tên partner"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              fullWidth
              label="Người liên hệ"
              value={form.contactName}
              onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))}
            />
            <TextField
              fullWidth
              type="email"
              label="Email liên hệ"
              value={form.contactEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
            />
            <TextField
              fullWidth
              type="number"
              label="Quota số trường tối đa"
              inputProps={{ min: 1 }}
              value={form.quotaSchools}
              onChange={(e) => setForm((prev) => ({ ...prev, quotaSchools: Number(e.target.value || 1) }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={onSave}>
            {editingId ? 'Lưu' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
