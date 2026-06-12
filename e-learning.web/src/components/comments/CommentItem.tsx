import { useState } from 'react';
import { Box, Stack, Avatar, Typography, IconButton, Paper, Tooltip, Chip } from '@mui/material';
import { fToNow } from '@/utils/formatTime';
import Iconify from '@/components/Iconify';
import useAuth from '@/hooks/useAuth';
import ClientContentCommentForm from '@/components/client/comments/ClientContentCommentForm';

type Props = {
  comment: any;
  allComments?: any[];
  depth?: number;
  onEdit?: (id: string, message: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onReply?: (message: string, parentId?: string) => Promise<void>;
  highlightedId?: string | null;
  canComment?: boolean;
};

export default function CommentItem({ comment, allComments = [], depth = 1, onEdit, onDelete, onReply, highlightedId = null, canComment = true }: Props) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);

  const name = comment.authorName || comment.userName || comment.user?.name || comment.name || 'Người dùng';
  const avatarUrl = comment.avatarUrl || comment.userAvatar || comment.user?.avatarUrl;
  const isOwner = user?.id === comment.userId;
  const isAdminUser = Boolean(
    (user as any)?.role && String((user as any).role).toLowerCase().includes('admin')
  );
  const canCommentActions = canComment !== false;
  const canEditComment = Boolean(onEdit) && isOwner;
  const canDeleteComment = Boolean(onDelete) && (isOwner || isAdminUser);
  const canReplyComment = Boolean(onReply) && canCommentActions && depth! < 3;

  const replies = allComments.filter(c => c.parentId === comment.id).sort((a, b) => {
    const timeA = new Date(a.createdAt || a.createdDate || a.postedAt || 0).getTime();
    const timeB = new Date(b.createdAt || b.createdDate || b.postedAt || 0).getTime();
    return timeA - timeB;
  });

  const isHighlighted = comment.id === highlightedId;
  const isDeletedByAdmin = comment.isDeletedByAdmin || comment.isDeleted || comment.deletedBy || comment.deletedAt;

  const handleDelete = async () => {
    if (!onDelete) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      setIsDeleting(true);
      try {
        await onDelete(comment.id);
      } catch (err) {
        setIsDeleting(false);
      }
    }
  };

  const handleEdit = async (message: string) => {
    if (!onEdit) return;
    await onEdit(comment.id, message);
    setIsEditing(false);
  };

  const handleReply = async (message: string) => {
    if (onReply) {
      await onReply(message, comment.id);
      setIsReplying(false);
    }
  };

  if (isEditing) {
    return (
      <Box sx={{ pb: 3 }}>
        <ClientContentCommentForm
          initialValue={comment.body || comment.message || comment.content}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 3 }} data-comment-id={comment.id}>
      <Box sx={{ position: 'relative', pb: replies.length > 0 ? 2 : 0 }}>
        <Stack direction="row" spacing={2} sx={{ opacity: isDeleting || isDeletedByAdmin ? 0.5 : 1 }}>
          <Avatar src={avatarUrl} alt={name} sx={{ width: 40, height: 40, flexShrink: 0, position: 'relative', zIndex: 2, opacity: isDeletedByAdmin ? 0.6 : 1 }}>
            {name.charAt(0).toUpperCase()}
          </Avatar>

          <Paper sx={{ p: 2, flexGrow: 1, bgcolor: isDeletedByAdmin ? 'action.disabledBackground' : (isHighlighted ? 'action.selected' : 'background.neutral'), borderLeft: isHighlighted ? '4px solid' : '4px solid transparent', borderColor: isHighlighted ? 'primary.main' : 'transparent', opacity: isDeletedByAdmin ? 0.6 : 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, textDecoration: isDeletedByAdmin ? 'line-through' : 'none', color: isDeletedByAdmin ? 'text.disabled' : 'inherit' }}>{name}</Typography>
                {comment.isAdmin && (
                  <Tooltip title="Quản trị viên">
                    <Chip label="Quản trị viên" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 600 }} />
                  </Tooltip>
                )}
                {comment.isPublic && (
                  <Tooltip title="Công khai">
                    <Chip icon={<Iconify icon="glyphs-poly:globe-earth" />} label="Công khai" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#dcfce7', color: '#166534', fontWeight: 600 }} />
                  </Tooltip>
                )}
                {comment.isPinned && (
                  <Tooltip title="Đã ghim">
                    <Chip icon={<Iconify icon="glyphs-poly:pin" />} label="Đã ghim" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#fef9c3', color: '#92400e', fontWeight: 600 }} />
                  </Tooltip>
                )}
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {comment.isEdited && (
                    <Typography component="span" variant="caption" sx={{ color: 'text.disabled', display: 'inline-flex', alignItems: 'center', mr: 1 }}>
                      (đã sửa)
                    </Typography>
                  )}
                  {fToNow(comment.createdAt || comment.createdDate || comment.postedAt)}
                </Typography>
              </Stack>
            </Stack>

            {isDeletedByAdmin ? (
              <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic', fontWeight: 500 }}>[Bình luận đã bị xóa]</Typography>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>{comment.body || comment.message || comment.content}</Typography>
                {!isDeletedByAdmin && (
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
                    {canReplyComment && (
                      <Typography variant="caption" sx={{ cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'text.primary', textDecoration: 'underline' } }} onClick={() => setIsReplying(!isReplying)}>Trả lời</Typography>
                    )}
                    {canEditComment && (
                      <Typography variant="caption" sx={{ cursor: 'pointer', color: 'text.secondary', '&:hover': { color: 'text.primary', textDecoration: 'underline' } }} onClick={() => setIsEditing(true)}>Chỉnh sửa</Typography>
                    )}
                    {canDeleteComment && (
                      <Typography variant="caption" sx={{ cursor: 'pointer', color: 'error.main', '&:hover': { color: 'error.dark', textDecoration: 'underline' } }} onClick={handleDelete}>Xóa</Typography>
                    )}
                  </Stack>
                )}
              </>
            )}
          </Paper>
        </Stack>

        {isReplying && (
          <Box sx={{ ml: '56px', mt: 2 }}>
            <ClientContentCommentForm onSubmit={handleReply} onCancel={() => setIsReplying(false)} />
          </Box>
        )}

        {replies.length > 0 && (
          <Box sx={{ position: 'absolute', top: '40px', bottom: 0, left: '20px', width: '2px', bgcolor: 'divider', zIndex: 1 }} />
        )}
      </Box>

      {replies.length > 0 && (
        <Box sx={{ ml: '20px', position: 'relative' }}>
          {replies.map((reply, index) => {
            const isLast = index === replies.length - 1;
            return (
              <Box key={reply.id} sx={{ position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '36px', height: '20px', borderLeft: '2px solid', borderBottom: '2px solid', borderColor: 'divider', borderBottomLeftRadius: 16, zIndex: 1 }} />
                {!isLast && <Box sx={{ position: 'absolute', top: '20px', bottom: 0, left: 0, width: '2px', bgcolor: 'divider', zIndex: 1 }} />}
                <Box sx={{ pl: '36px' }}>
                  <CommentItem
                    comment={reply}
                    allComments={allComments}
                    depth={depth! + 1}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReply={onReply}
                    highlightedId={highlightedId}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
