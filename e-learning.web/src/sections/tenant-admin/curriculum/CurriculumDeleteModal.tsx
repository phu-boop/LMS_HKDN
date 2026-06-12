// @mui
import {
  Dialog,
  Button,
  Typography,
  DialogContent,
  DialogActions,
  Box,
  Stack,
} from '@mui/material';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  onClose: VoidFunction;
  onConfirm: VoidFunction;
};

export default function CurriculumDeleteModal({ open, onClose, onConfirm }: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogContent sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ 
          width: 64, height: 64, 
          bgcolor: 'error.lighter', 
          color: 'error.main', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: 32,
          margin: '0 auto',
          mb: 2
        }}>
          🗑️
        </Box>
        <Typography variant="h6" gutterBottom>Xác nhận Xóa</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Bạn có chắc chắn muốn xóa thư mục này? Toàn bộ thư mục con và tài liệu bên trong sẽ bị xóa vĩnh viễn.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'background.neutral' }}>
        <Stack direction="row" spacing={2} sx={{ width: 1 }}>
          <Button fullWidth variant="outlined" color="inherit" onClick={onClose}>Hủy bỏ</Button>
          <Button fullWidth variant="contained" color="error" onClick={onConfirm}>Xóa vĩnh viễn</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
