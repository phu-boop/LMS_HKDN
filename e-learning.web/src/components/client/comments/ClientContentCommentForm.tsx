import { useState } from 'react';
import { Box, Stack, Avatar, TextField, Button, CircularProgress } from '@mui/material';
import useAuth from '@/hooks/useAuth';

type Props = {
  initialValue?: string;
  isSubmitting?: boolean;
  onSubmit: (message: string) => Promise<void>;
  onCancel?: () => void;
};

export default function ClientContentCommentForm({ initialValue = '', isSubmitting = false, onSubmit, onCancel }: Props) {
  const { user } = useAuth();
  const [message, setMessage] = useState(initialValue);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    await onSubmit(message);
    if (!initialValue) {
      setMessage('');
    }
  };

  return (
    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
      <Avatar src={user?.avatarUrl || undefined} alt={user?.name || undefined}>
        {user?.name?.charAt(0).toUpperCase() || 'U'}
      </Avatar>

      <Box sx={{ flexGrow: 1 }}>
        <TextField
          fullWidth
          multiline
          minRows={2}
          maxRows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Viết bình luận của bạn..."
          disabled={isSubmitting}
          sx={{
            '& fieldset': {
              borderWidth: `1px !important`,
              borderColor: (theme) => theme.palette.grey[500_32],
            },
          }}
        />

        <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 1.5 }}>
          {onCancel && (
            <Button size="small" color="inherit" disabled={isSubmitting} onClick={onCancel}>
              Hủy
            </Button>
          )}
          <Button
            size="small"
            variant="contained"
            disabled={!message.trim() || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : (initialValue ? 'Cập nhật' : 'Gửi')}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
