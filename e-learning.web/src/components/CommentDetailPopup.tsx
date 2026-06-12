import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
} from '@mui/material';
import Iconify from '@/components/Iconify';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import CommentItem from '@/components/comments/CommentItem';

type Props = {
  open: boolean;
  onClose: () => void;
  // If `commentDetail` is provided the popup will use it; otherwise it will fetch by `commentId`.
  commentDetail?: any | null;
  commentId?: string | null;
  onReload?: () => void;
};

export default function CommentDetailPopup({ open, onClose, commentDetail: propDetail = null, commentId = null, onReload }: Props) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any | null>(propDetail);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDetail(propDetail);
  }, [propDetail]);

  const fetchDetail = useCallback(async (id?: string | null) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(API_ENDPOINTS.tenantCommentById(id));
      setDetail(res.data || null);
    } catch (err) {
      console.error('Failed to fetch comment detail', err);
      setError('Không thể tải chi tiết bình luận');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (propDetail) return;
    if (commentId) fetchDetail(commentId);
  }, [open, propDetail, commentId, fetchDetail]);

  const handleEdit = async (id: string, message: string) => {
    try {
      const payload = { body: message };
      const res = await axios.put(API_ENDPOINTS.tenantCommentEdit(id), payload);
      const updated = res.data?.data || res.data;
      setDetail((prev: any) => {
        if (!prev) return prev;
        return { ...prev, comments: (prev.comments || []).map((c: any) => (c.id === id ? { ...c, ...updated } : c)) };
      });
      if (onReload) onReload();
    } catch (err) {
      console.error('Failed to edit comment', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(API_ENDPOINTS.tenantCommentDelete(id));
      setDetail((prev: any) => {
        if (!prev) return prev;
        return { ...prev, comments: (prev.comments || []).filter((c: any) => c.id !== id) };
      });
      if (onReload) onReload();
    } catch (err) {
      console.error('Failed to delete comment', err);
    }
  };

  const handleReply = async (message: string, parentId?: string) => {
    if (!message || !message.trim() || !parentId) return;
    try {
      const payload = { body: message };
      const res = await axios.post(API_ENDPOINTS.tenantCommentReply(parentId), payload);
      const newComment = res.data?.data || res.data;
      setDetail((prev: any) => {
        if (!prev) return prev;
        return { ...prev, comments: [...(prev.comments || []), newComment] };
      });
      if (onReload) onReload();
    } catch (err) {
      console.error('Failed to reply', err);
    }
  };

  const comments = detail?.comments || [];

  const scrollToHighlightedComment = useCallback(() => {
    if (!contentRef.current || !detail?.commentId) return;

    const highlighted = contentRef.current.querySelector<HTMLElement>(`[data-comment-id="${detail.commentId}"]`);
    if (!highlighted) return;

    const container = contentRef.current;
    const containerRect = container.getBoundingClientRect();
    const highlightedRect = highlighted.getBoundingClientRect();

    const isVisible = highlightedRect.top >= containerRect.top && highlightedRect.bottom <= containerRect.bottom;
    if (isVisible) return;

    highlighted.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [detail?.commentId]);

  useEffect(() => {
    if (!open) return;
    if (!detail?.commentId) return;
    scrollToHighlightedComment();
  }, [open, detail?.commentId, scrollToHighlightedComment]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Chi tiết bình luận</Typography>
        <IconButton onClick={onClose} size="small">
          <Iconify icon="eva:close-fill" width={20} height={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2, color: 'text.disabled' }}>
              Đang tải chi tiết bình luận...
            </Typography>
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : detail ? (
          <Stack spacing={3}>
            <Box sx={{ position: 'sticky', top: 0, zIndex: 1, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider', py: 2, px: 2, borderRadius: '8px 8px 0 0' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1, bgcolor: 'background.default', p: 2, borderRadius: 2 }}>
                  <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>Tài liệu</Typography>
                  <Typography variant="body2">{detail.contentTitle || '—'}</Typography>
                </Box>
                <Box sx={{ flex: 1, bgcolor: 'background.default', p: 2, borderRadius: 2 }}>
                  <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>Trường học</Typography>
                  <Typography variant="body2">{detail.schoolName || '—'}</Typography>
                </Box>
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Bình luận</Typography>
              {Array.isArray(comments) && comments.length > 0 ? (
                <Box ref={contentRef} sx={{ mt: 1, maxHeight: 420, overflowY: 'auto', pr: 1 }}>
                  {comments.filter((c: any) => !c.parentId).map((top) => (
                    <Box key={top.id} sx={{ mb: 2 }}>
                      <CommentItem
                        comment={top}
                        allComments={comments}
                        depth={1}
                        onEdit={handleEdit}
                        onDelete={async (id: string) => handleDelete(id)}
                        onReply={async (message: string, parentId?: string) => handleReply(message, parentId)}
                        highlightedId={detail?.commentId}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>Không có bình luận nào.</Typography>
              )}
            </Box>
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Chưa có dữ liệu chi tiết.</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: 'background.neutral' }}>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}
