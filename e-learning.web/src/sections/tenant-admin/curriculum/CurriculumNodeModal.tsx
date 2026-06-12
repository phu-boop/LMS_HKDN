import { useState, useEffect } from 'react';
// @mui
import {
  Box,
  Stack,
  Dialog,
  Button,
  TextField,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
// redux
import { useDispatch } from '@/redux/store';
import { upsertLearningNode } from '@/redux/slices/learningStructure';
import useAuth from '@/hooks/useAuth';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: VoidFunction;
  config: {
    mode: 'create' | 'edit';
    title: string;
    type: string;
    nodeId?: string;
    parentId?: string | null;
    existingValue?: string;
    existingCode?: string;
    existingSortOrder?: number;
  };
};

export default function CurriculumNodeModal({ open, onClose, config }: Props) {
  const dispatch = useDispatch();
  const { user } = useAuth();

  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(config.existingValue || '');
      setCode(config.existingCode || '');
      setError(null);
    }
  }, [open, config]);

  const handleSave = async () => {
    if (!value.trim()) {
      setError('Tên thư mục/bài học không được để trống');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const isEdit = config.mode === 'edit';
      const nodeData = {
        id: isEdit ? (config.nodeId || '') : '',
        tenantId: user?.tenantId || '',
        parentId: config.parentId || null,
        nodeType: config.type,
        code: code.trim(),
        title: value.trim(),
        sortOrder: isEdit ? config.existingSortOrder ?? 0 : 0,
        status: 'ACTIVE' as const,
        createdAt: '',
        updatedAt: '',
      };

      await dispatch(upsertLearningNode(user?.tenantId || null, nodeData, isEdit));
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Không thể lưu học liệu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">{config.title}</Typography>
        <Button onClick={onClose} sx={{ minWidth: 'auto', p: 0, fontSize: 24, color: 'text.disabled' }}>&times;</Button>
      </DialogTitle>

      <DialogContent sx={{ mt: 3 }}>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Lỗi</Typography>
              <Typography variant="caption">{error}</Typography>
            </Alert>
          )}

          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', mb: 1, display: 'block' }}>Cấp độ (Node Type)</Typography>
            <TextField 
              fullWidth 
              size="small" 
              value={config.type} 
              disabled 
              inputProps={{ style: { fontFamily: 'monospace', color: 'gray' } }}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', mb: 1, display: 'block' }}>Mã Code (Tùy chọn)</Typography>
            <TextField 
              fullWidth 
              size="small" 
              placeholder="VD: B1" 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isSubmitting}
            />
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', mb: 1, display: 'block' }}>Tên thư mục/bài học <Box component="span" sx={{ color: 'error.main' }}>*</Box></Typography>
            <TextField 
              fullWidth 
              size="small" 
              placeholder="Nhập tên..." 
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null); }}
              disabled={isSubmitting}
              error={!!error && !value.trim()}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'background.neutral' }}>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting}>Hủy bỏ</Button>
        <Button variant="contained" color="success" onClick={handleSave} disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu lại'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
