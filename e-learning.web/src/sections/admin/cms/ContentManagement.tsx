// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import type { CmsContentStatus, CmsContentType } from '../../../@types/cmsContent';
import { useDispatch, useSelector } from '../../../redux/store';
import { fetchCmsContents, removeCmsContent, upsertCmsContent } from '../../../redux/slices/cmsContent';
import { fetchLearningStructure } from '../../../redux/slices/learningStructure';
import Iconify from '../../../components/Iconify';
import Scrollbar from '../../../components/Scrollbar';
import Label from '../../../components/Label';
import uuidv4 from '../../../utils/uuidv4';
import { fDateTime } from '../../../utils/formatTime';
import { sanitizeUiMessage } from '../../../utils/sanitizeUiMessage';

// Local type for admin CMS (uses old lowercase field names from legacy data)
type AdminCmsItem = {
  id: string;
  title: string;
  description: string;
  contentType: string;
  sourceUrl: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  programId: string;
  gradeId: string;
  subjectId: string;
  lessonId: string;
  status: string;
  downloadAllowed: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  title: string;
  description: string;
  contentType: CmsContentType;
  sourceUrl: string;
  programId: string;
  gradeId: string;
  subjectId: string;
  lessonId: string;
  status: CmsContentStatus;
  downloadAllowed: boolean;
  fileName: string;
  mimeType: string;
  fileSize: number;
};

const emptyForm: FormState = {
  title: '',
  description: '',
  contentType: 'video',
  sourceUrl: '',
  programId: '',
  gradeId: '',
  subjectId: '',
  lessonId: '',
  status: 'draft',
  downloadAllowed: false,
  fileName: '',
  mimeType: '',
  fileSize: 0,
};

const statusOptions: Array<'all' | CmsContentStatus> = ['all', 'draft', 'published', 'archived'];
const typeOptions: Array<'all' | CmsContentType> = ['all', 'video', 'pdf', 'slide', 'url'];

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let val = bytes;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx += 1;
  }
  return `${val.toFixed(val >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function labelForStatus(status: string) {
  if (status === 'published' || status === 'PUBLISHED') return <Label color="success">Published</Label>;
  if (status === 'archived' || status === 'ARCHIVED') return <Label color="warning">Archived</Label>;
  return <Label color="default">Draft</Label>;
}

export default function ContentManagement() {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const { items, isLoading, error, loaded } = useSelector((state) => state.cmsContent);
  const learningNodes = useSelector((state) => state.learningStructure.nodes);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | CmsContentStatus>('all');
  const [filterType, setFilterType] = useState<'all' | CmsContentType>('all');
  const [filterProgram, setFilterProgram] = useState<'all' | string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    dispatch(fetchCmsContents() as any);
    dispatch(fetchLearningStructure());
  }, [dispatch]);


  const programOptions = useMemo(
    () => learningNodes.filter((x) => x.nodeType === 'PROGRAM').sort((a, b) => a.sortOrder - b.sortOrder),
    [learningNodes]
  );
  const gradeOptions = useMemo(
    () =>
      learningNodes
        .filter((x) => x.nodeType === 'GRADE' && x.parentId === form.programId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [learningNodes, form.programId]
  );
  const subjectOptions = useMemo(
    () =>
      learningNodes
        .filter((x) => x.nodeType === 'SUBJECT' && x.parentId === form.gradeId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [learningNodes, form.gradeId]
  );
  const lessonOptions = useMemo(
    () =>
      learningNodes
        .filter((x) => x.nodeType === 'LESSION' && x.parentId === form.subjectId)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [learningNodes, form.subjectId]
  );

  useEffect(() => {
    if (!error) return;
    enqueueSnackbar(sanitizeUiMessage(error), { variant: 'error' });
  }, [error, enqueueSnackbar]);

  const filteredItems = useMemo(() => {
    return (items as unknown as AdminCmsItem[]).filter((item) => {
      const st = item.status?.toLowerCase();
      const ct = item.contentType?.toLowerCase();
      if (filterStatus !== 'all' && st !== filterStatus.toLowerCase()) return false;
      if (filterType !== 'all' && ct !== filterType.toLowerCase()) return false;
      if (filterProgram !== 'all' && item.programId !== filterProgram) return false;

      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        item.title?.toLowerCase().includes(q) ||
        item.fileName?.toLowerCase().includes(q) ||
        item.sourceUrl?.toLowerCase().includes(q)
      );
    });
  }, [items, filterStatus, filterType, filterProgram, search]);


  const openCreate = () => {
    setEditingId(null);
    const programId = programOptions[0]?.id || '';
    const gradeId = learningNodes.find((x) => x.nodeType === 'GRADE' && x.parentId === programId)?.id || '';
    const subjectId = learningNodes.find((x) => x.nodeType === 'SUBJECT' && x.parentId === gradeId)?.id || '';
    const lessonId = learningNodes.find((x) => (x.nodeType === 'LESSION' || x.nodeType === 'LESSON') && x.parentId === subjectId)?.id || '';
    setForm({ ...emptyForm, programId, gradeId, subjectId, lessonId });
    setDialogOpen(true);
  };

  const openEdit = (item: AdminCmsItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description || '',
      contentType: item.contentType as CmsContentType,
      sourceUrl: item.sourceUrl || '',
      programId: item.programId || '',
      gradeId: item.gradeId || '',
      subjectId: item.subjectId || '',
      lessonId: item.lessonId || '',
      status: item.status as CmsContentStatus,
      downloadAllowed: item.downloadAllowed ?? false,
      fileName: item.fileName || '',
      mimeType: item.mimeType || '',
      fileSize: item.fileSize ?? 0,
    });
    setDialogOpen(true);
  };

  const handleFilePicked = (file: File | undefined) => {
    if (!file) return;
    let nextType: CmsContentType = form.contentType;
    if (file.type.startsWith('video/')) nextType = 'video';
    else if (file.type === 'application/pdf') nextType = 'pdf';
    else if (file.name.toLowerCase().endsWith('.ppt') || file.name.toLowerCase().endsWith('.pptx'))
      nextType = 'slide';

    setForm((prev) => ({
      ...prev,
      contentType: nextType,
      fileName: file.name,
      mimeType: file.type || prev.mimeType,
      fileSize: file.size,
      sourceUrl: prev.sourceUrl || file.name,
    }));
  };

  const validate = (): boolean => {
    if (!form.title.trim()) {
      enqueueSnackbar('Tiêu đề nội dung là bắt buộc', { variant: 'warning' });
      return false;
    }
    if (!form.programId || !form.gradeId || !form.subjectId || !form.lessonId) {
      enqueueSnackbar('Vui lòng gắn đầy đủ chương trình/khối/môn/bài học', { variant: 'warning' });
      return false;
    }
    if (form.contentType === 'url') {
      if (!form.sourceUrl.trim()) {
        enqueueSnackbar('Nội dung dạng URL phải có đường dẫn', { variant: 'warning' });
        return false;
      }
      if (!/^https?:\/\//i.test(form.sourceUrl.trim())) {
        enqueueSnackbar('URL phải bắt đầu bằng http:// hoặc https://', { variant: 'warning' });
        return false;
      }
    } else {
      if (!form.fileName.trim()) {
        enqueueSnackbar('Vui lòng chọn file để upload', { variant: 'warning' });
        return false;
      }
    }
    return true;
  };

  const onSave = () => {
    if (!validate()) return;

    const now = new Date().toISOString();
    const payload: CmsContent = {
      id: editingId || uuidv4(),
      title: form.title.trim(),
      description: form.description.trim(),
      contentType: form.contentType,
      sourceUrl: form.sourceUrl.trim(),
      fileName: form.fileName.trim() || form.sourceUrl.trim(),
      mimeType: form.mimeType.trim() || (form.contentType === 'url' ? 'text/uri-list' : 'application/octet-stream'),
      fileSize: Number.isFinite(form.fileSize) ? form.fileSize : 0,
      programId: form.programId,
      gradeId: form.gradeId,
      subjectId: form.subjectId,
      lessonId: form.lessonId,
      status: form.status,
      downloadAllowed: form.downloadAllowed,
      createdBy: 'content.admin',
      createdAt: editingId ? items.find((x) => x.id === editingId)?.createdAt || now : now,
      updatedAt: now,
    };

    dispatch(upsertCmsContent(payload as any));
    enqueueSnackbar(editingId ? 'Đã cập nhật nội dung' : 'Đã tạo nội dung', { variant: 'success' });
    setDialogOpen(false);
  };

  const onDelete = (id: string) => {
    dispatch(removeCmsContent(id));
    enqueueSnackbar('Đã xóa nội dung', { variant: 'success' });
  };

  return (
    <Stack spacing={{ xs: 2, md: 3 }}>
      <Card sx={{ p: { xs: 1.5, md: 2.5 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between">
          <Typography variant="h6">Kho nội dung tập trung</Typography>
          <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />} onClick={openCreate}>
            Upload nội dung
          </Button>
        </Stack>
        {!loaded && isLoading && (
          <Alert sx={{ mt: 2 }} severity="info">
            Đang tải danh sách nội dung...
          </Alert>
        )}
      </Card>

      <Card sx={{ p: { xs: 1.5, md: 2.5 } }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={3.5}>
            <TextField
              fullWidth
              label="Tìm kiếm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tên nội dung, tên file, URL..."
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2.5}>
            <FormControl fullWidth>
              <InputLabel id="filter-type">Loại</InputLabel>
              <Select
                labelId="filter-type"
                label="Loại"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | CmsContentType)}
              >
                {typeOptions.map((x) => (
                  <MenuItem key={x} value={x}>
                    {x === 'all' ? 'Tất cả' : x.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={2.5}>
            <FormControl fullWidth>
              <InputLabel id="filter-status">Trạng thái</InputLabel>
              <Select
                labelId="filter-status"
                label="Trạng thái"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | CmsContentStatus)}
              >
                {statusOptions.map((x) => (
                  <MenuItem key={x} value={x}>
                    {x === 'all' ? 'Tất cả' : x}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={3.5}>
            <FormControl fullWidth>
              <InputLabel id="filter-program">Chương trình</InputLabel>
              <Select
                labelId="filter-program"
                label="Chương trình"
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
              >
                <MenuItem value="all">Tất cả chương trình</MenuItem>
                {programOptions.map((x) => (
                  <MenuItem key={x.id} value={x.id}>
                    {x.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      <Card>
        <TableContainer>
          <Scrollbar>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nội dung</TableCell>
                  <TableCell>Mapping học liệu</TableCell>
                  <TableCell>Metadata file</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell align="right">Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Stack spacing={0.4}>
                        <Typography variant="subtitle2">{item.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(item as any).contentType?.toUpperCase() ?? item.type} - {item.fileName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cập nhật: {fDateTime(item.updatedAt)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        Program: {learningNodes.find((x) => x.id === item.programId)?.title || item.programId}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Grade: {learningNodes.find((x) => x.id === item.gradeId)?.title || item.gradeId}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Subject: {learningNodes.find((x) => x.id === item.subjectId)?.title || item.subjectId}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Lesson: {learningNodes.find((x) => x.id === item.lessonId)?.title || item.lessonId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        MIME: {item.mimeType}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Dung lượng: {formatBytes(item.fileSize)}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Quyền tải: {item.downloadAllowed ? 'Cho phép' : 'Không cho phép'}
                      </Typography>
                    </TableCell>
                    <TableCell>{labelForStatus((item as any).status ?? (item as any).publishStatus ?? '')}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Sửa">
                          <IconButton size="small" color="primary" onClick={() => openEdit(item as unknown as AdminCmsItem)}>
                            <Iconify icon="eva:edit-2-fill" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Xóa">
                          <IconButton size="small" color="error" onClick={() => onDelete(item.id)}>
                            <Iconify icon="eva:trash-2-outline" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredItems.length && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography align="center" sx={{ py: 3 }} color="text.secondary">
                        Không có nội dung phù hợp bộ lọc
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      </Card>

      <Dialog fullWidth maxWidth="md" open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editingId ? 'Cập nhật nội dung' : 'Upload nội dung mới'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Tiêu đề"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="content-type">Loại nội dung</InputLabel>
                  <Select
                    labelId="content-type"
                    label="Loại nội dung"
                    value={form.contentType}
                    onChange={(e) => setForm((prev) => ({ ...prev, contentType: e.target.value as CmsContentType }))}
                  >
                    <MenuItem value="video">Video</MenuItem>
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="slide">Slide</MenuItem>
                    <MenuItem value="url">URL</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Mô tả"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />

            {form.contentType === 'url' ? (
              <TextField
                fullWidth
                label="URL nội dung"
                value={form.sourceUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, sourceUrl: e.target.value }))}
                placeholder="https://..."
              />
            ) : (
              <Stack spacing={1}>
                <Button variant="outlined" component="label">
                  Chọn file
                  <input
                    hidden
                    type="file"
                    accept={
                      form.contentType === 'video'
                        ? 'video/*'
                        : form.contentType === 'pdf'
                        ? '.pdf,application/pdf'
                        : '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'
                    }
                    onChange={(e) => handleFilePicked(e.target.files?.[0])}
                  />
                </Button>
                {!!form.fileName && (
                  <Typography variant="caption" color="text.secondary">
                    {form.fileName} ({formatBytes(form.fileSize)})
                  </Typography>
                )}
              </Stack>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Box>
                <FormControl fullWidth>
                  <InputLabel id="program-id">Chương trình</InputLabel>
                  <Select
                    labelId="program-id"
                    label="Chương trình"
                    value={form.programId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        programId: e.target.value,
                        gradeId: '',
                        subjectId: '',
                        lessonId: '',
                      }))
                    }
                  >
                    {programOptions.map((x) => (
                      <MenuItem key={x.id} value={x.id}>
                        {x.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FormControl fullWidth>
                  <InputLabel id="grade-id">Khối</InputLabel>
                  <Select
                    labelId="grade-id"
                    label="Khối"
                    value={form.gradeId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, gradeId: e.target.value, subjectId: '', lessonId: '' }))
                    }
                  >
                    {gradeOptions.map((x) => (
                      <MenuItem key={x.id} value={x.id}>
                        {x.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FormControl fullWidth>
                  <InputLabel id="subject-id">Môn học</InputLabel>
                  <Select
                    labelId="subject-id"
                    label="Môn học"
                    value={form.subjectId}
                    onChange={(e) => setForm((prev) => ({ ...prev, subjectId: e.target.value, lessonId: '' }))}
                  >
                    {subjectOptions.map((x) => (
                      <MenuItem key={x.id} value={x.id}>
                        {x.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FormControl fullWidth>
                  <InputLabel id="lesson-id">Bài học</InputLabel>
                  <Select
                    labelId="lesson-id"
                    label="Bài học"
                    value={form.lessonId}
                    onChange={(e) => setForm((prev) => ({ ...prev, lessonId: e.target.value }))}
                  >
                    {lessonOptions.map((x) => (
                      <MenuItem key={x.id} value={x.id}>
                        {x.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Box>
                <FormControl fullWidth>
                  <InputLabel id="content-status">Trạng thái</InputLabel>
                  <Select
                    labelId="content-status"
                    label="Trạng thái"
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as CmsContentStatus }))}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="published">Published</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <Box sx={{ p: 1, border: (theme) => `1px dashed ${theme.palette.divider}`, borderRadius: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.downloadAllowed}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, downloadAllowed: e.target.checked }))
                        }
                      />
                    }
                    label="Cho phép tải về"
                  />
                </Box>
              </Box>
            </Box>
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
