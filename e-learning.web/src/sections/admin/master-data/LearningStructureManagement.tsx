import { useEffect, useMemo, useState } from 'react';
import { alpha, styled } from '@mui/material/styles';
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
  InputLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { TreeView, TreeItem, TreeItemProps, treeItemClasses } from '@mui/lab';
import { useSnackbar } from 'notistack';
import Iconify from '@/components/Iconify';
import Scrollbar from '@/components/Scrollbar';
import { useDispatch, useSelector } from '@/redux/store';
import {
  deleteLearningNode,
  fetchLearningStructure,
  reorderLearningNode,
  upsertLearningNode,
} from '@/redux/slices/learningStructure';
import { fetchAdminMasterData } from '@/redux/slices/adminMasterData';
import { sanitizeUiMessage } from '@/utils/sanitizeUiMessage';
import uuidv4 from '@/utils/uuidv4';

// ----------------------------------------------------------------------

const TYPE_OPTIONS: Array<{ value: string; label: string; color: string }> = [
  { value: 'PROGRAM', label: 'Chương trình', color: '#9333ea' },
  { value: 'GRADE', label: 'Khối lớp', color: '#2563eb' },
  { value: 'CLASS', label: 'Lớp học', color: '#10b981' },
  { value: 'SUBJECT', label: 'Môn học', color: '#d97706' },
  { value: 'LESSION', label: 'Bài học', color: '#64748b' },
];

const parentTypeMap: Record<string, string | null> = {
  PROGRAM: null,
  GRADE: 'PROGRAM',
  CLASS: 'GRADE',
  SUBJECT: 'CLASS',
  LESSION: 'SUBJECT',
};

function getBaseType(nodeType: string): string {
  const upper = nodeType.toUpperCase();
  if (upper.startsWith('PROGRAM')) return 'PROGRAM';
  if (upper.startsWith('GRADE')) return 'GRADE';
  if (upper.startsWith('CLASS')) return 'CLASS';
  if (upper.startsWith('SUBJECT')) return 'SUBJECT';
  if (upper.startsWith('LESSON') || upper.startsWith('LESSION')) return 'LESSION';
  return upper;
}

const StyledTreeItem = styled((props: TreeItemProps & {
  type: string;
  onAddChild?: (type: string) => void;
  onEdit?: VoidFunction;
  onDelete?: VoidFunction;
  onReorder?: (dir: 'up' | 'down') => void;
}) => {
  const { type, onAddChild, onEdit, onDelete, onReorder, label, nodeId, ...other } = props;
  const baseType = getBaseType(type);
  const typeInfo = TYPE_OPTIONS.find(x => x.value === baseType) || TYPE_OPTIONS[0];

  return (
    <TreeItem
      nodeId={nodeId}
      label={
        <Box
          className="node-row"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 0.75,
            px: 1,
            borderRadius: 1,
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: 'background.neutral',
              '& .actions': { opacity: 1 },
            }
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              px: 1, py: 0.2, borderRadius: 0.5, fontSize: 10, fontWeight: 'bold',
              bgcolor: alpha(typeInfo.color, 0.1), color: typeInfo.color, border: `1px solid ${alpha(typeInfo.color, 0.2)}`
            }}>
              {typeInfo.label.toUpperCase()}
            </Box>
            <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
              {label}
            </Typography>
          </Stack>

          <Stack className="actions" direction="row" spacing={0.5} sx={{ opacity: 0, transition: 'opacity 0.2s' }}>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onReorder?.('up'); }}>
              <Iconify icon="eva:arrow-up-fill" width={14} height={14} />
            </IconButton>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onReorder?.('down'); }}>
              <Iconify icon="eva:arrow-down-fill" width={14} height={14} />
            </IconButton>

            {baseType !== 'LESSION' && (
              <IconButton
                size="small"
                color="success"
                onClick={(e) => { e.stopPropagation(); onAddChild?.(type); }}
                sx={{ bgcolor: alpha('#10b981', 0.1) }}
              >
                <Iconify icon="eva:plus-fill" width={16} height={16} />
              </IconButton>
            )}
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
              sx={{ bgcolor: alpha('#3b82f6', 0.1) }}
            >
              <Iconify icon="eva:edit-2-fill" width={16} height={16} />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              sx={{ bgcolor: alpha('#ef4444', 0.1) }}
            >
              <Iconify icon="eva:trash-2-outline" width={16} height={16} />
            </IconButton>
          </Stack>
        </Box>
      }
      {...other}
    />
  );
})(({ theme }) => ({
  [`& .${treeItemClasses.group}`]: {
    marginLeft: 28,
    paddingLeft: 18,
    borderLeft: `2px solid ${theme.palette.divider}`,
  },
  [`& .${treeItemClasses.content}`]: {
    padding: 0,
    backgroundColor: 'transparent !important',
    '&:hover': { backgroundColor: 'transparent !important' },
    '&.Mui-selected': { backgroundColor: 'transparent !important' },
  },
}));

type FormState = {
  title: string;
  nodeType: string;
  parentId: string | null;
  sortOrder: number;
};

const emptyForm: FormState = {
  title: '',
  nodeType: 'PROGRAM',
  parentId: null,
  sortOrder: 1,
};

export default function LearningStructureManagement() {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const { nodes, loaded, isLoading, error } = useSelector((state) => state.learningStructure);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (!loaded) {
      dispatch(fetchLearningStructure());
    }
  }, [dispatch, loaded]);

  useEffect(() => {
    if (!error) return;
    enqueueSnackbar(sanitizeUiMessage(error), { variant: 'error' });
  }, [error, enqueueSnackbar]);

  const candidateParents = useMemo(() => {
    const baseType = getBaseType(form.nodeType);
    const parentBaseType = parentTypeMap[baseType];
    if (!parentBaseType) return [];
    return nodes.filter((x) => getBaseType(x.nodeType) === parentBaseType);
  }, [nodes, form.nodeType]);

  const openCreate = (parentId: string | null = null, nodeType: string = 'PROGRAM') => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      nodeType,
      parentId,
    });
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const node = nodes.find((x) => x.id === id);
    if (!node) return;
    setEditingId(id);
    setForm({
      title: node.title,
      nodeType: node.nodeType,
      parentId: node.parentId,
      sortOrder: node.sortOrder,
    });
    setDialogOpen(true);
  };

  const onSave = () => {
    if (!form.title.trim()) {
      enqueueSnackbar('Tiêu đề là bắt buộc', { variant: 'warning' });
      return;
    }
    const nodeId = editingId || uuidv4();
    dispatch(
      upsertLearningNode(
        '', // tenantId no longer used
        {
          id: nodeId,
          tenantId: '',
          title: form.title.trim(),
          nodeType: form.nodeType,
          parentId: parentTypeMap[getBaseType(form.nodeType)] ? form.parentId : null,
          sortOrder: Number.isFinite(form.sortOrder) ? form.sortOrder : 1,
          code: `CODE_${nodeId.substring(0, 8).toUpperCase()}`,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        Boolean(editingId)
      )
    );
    enqueueSnackbar(editingId ? 'Đã cập nhật' : 'Đã tạo mới', { variant: 'success' });
    setDialogOpen(false);
  };

  const renderTree = (parentId: string | null = null) => {
    const children = nodes
      .filter((node) => node.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return children.map((node) => (
      <StyledTreeItem
        key={node.id}
        nodeId={node.id}
        label={node.title}
        type={node.nodeType}
        onAddChild={(currentType) => {
          const base = getBaseType(currentType);
          const nextType =
            base === 'PROGRAM' ? 'GRADE' :
              base === 'GRADE' ? 'CLASS' :
                base === 'CLASS' ? 'SUBJECT' : 'LESSION';
          openCreate(node.id, nextType);
        }}
        onEdit={() => openEdit(node.id)}
        onDelete={() => {
          if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
            dispatch(deleteLearningNode('', node.id, node.nodeType));
          }
        }}
        onReorder={(dir) => {
          const newOrder = dir === 'up' ? Math.max(1, node.sortOrder - 1) : node.sortOrder + 1;
          dispatch(reorderLearningNode('', node.id, newOrder));
        }}
      >
        {renderTree(node.id)}
      </StyledTreeItem>
    ));
  };

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Cấu trúc học tập hệ thống</Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => openCreate()}
          >
            Thêm Chương trình
          </Button>
        </Stack>

        {!loaded && isLoading ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <Typography variant="body2">Đang tải cấu trúc học liệu...</Typography>
          </Box>
        ) : (
          <Scrollbar sx={{ maxHeight: 600 }}>
            <TreeView
              defaultCollapseIcon={<Iconify icon="eva:chevron-down-fill" width={24} height={24} />}
              defaultExpandIcon={<Iconify icon="eva:chevron-right-fill" width={24} height={24} />}
              sx={{ flexGrow: 1, maxWidth: '100%', overflowY: 'auto' }}
            >
              {renderTree(null)}
              {loaded && nodes.filter((n) => n.parentId === null).length === 0 && (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  Chưa có dữ liệu cấu trúc. Nhấn "Thêm Chương trình" để bắt đầu.
                </Typography>
              )}
            </TreeView>
          </Scrollbar>
        )}
      </Stack>

      <Dialog
        fullWidth
        maxWidth="sm"
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: { xs: 'calc(100% - 24px)', sm: '100%' },
            maxWidth: 680,
            mx: 'auto',
          },
        }}
      >
        <DialogTitle sx={{ px: 2.5, pt: 2.25, pb: 1.25 }}>
          {editingId ? 'Sửa node học liệu' : 'Tạo node học liệu'}
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, pt: 1.25, pb: 1.75 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Tiêu đề (Title)"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Box>
                <FormControl fullWidth>
                  <InputLabel id="node-type">Loại node</InputLabel>
                  <Select
                    labelId="node-type"
                    label="Loại node"
                    value={form.nodeType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        nodeType: e.target.value,
                        parentId: null,
                      }))
                    }
                  >
                    {TYPE_OPTIONS.map((x) => (
                      <MenuItem key={x.value} value={x.value}>
                        {x.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box>
                <FormControl fullWidth disabled={!parentTypeMap[getBaseType(form.nodeType)]}>
                  <InputLabel id="node-parent">Node cha</InputLabel>
                  <Select
                    labelId="node-parent"
                    label="Node cha"
                    value={form.parentId || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value || null }))}
                  >
                    <MenuItem value="">Không có</MenuItem>
                    {candidateParents.map((x) => (
                      <MenuItem key={x.id} value={x.id}>
                        {x.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <TextField
              type="number"
              label="Thứ tự hiển thị"
              inputProps={{ min: 1 }}
              value={form.sortOrder}
              onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value || 1) }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,
            justifyContent: 'flex-end',
            gap: 1,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button color="inherit" onClick={() => setDialogOpen(false)}>
            Hủy
          </Button>
          <Button variant="contained" color="primary" onClick={onSave} sx={{ minWidth: 112, height: 44 }}>
            {editingId ? 'Lưu' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
