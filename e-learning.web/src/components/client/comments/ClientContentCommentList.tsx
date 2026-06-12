import { useState, useEffect } from 'react';
import { Box, Typography, Stack, CircularProgress } from '@mui/material';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import ClientContentCommentItem from './ClientContentCommentItem';
import ClientContentCommentForm from './ClientContentCommentForm';

type Props = {
  contentId: string;
  canComment?: boolean;
  disableActionsWhenNoComment?: boolean;
};

export default function ClientContentCommentList({ contentId, canComment = true, disableActionsWhenNoComment = false }: Props) {
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (contentId) {
      fetchComments();
    }
  }, [contentId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.clientContentComments(contentId));
      setComments(res.data?.items || res.data || []);
    } catch (error) {
      console.error('Failed to fetch comments', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (message: string, parentId?: string) => {
    if (!canComment) return;
    setIsSubmitting(true);
    try {
      const payload: any = { body: message, message, content: message };
      if (parentId) payload.parentId = parentId;

      const res = await axios.post(API_ENDPOINTS.clientContentComments(contentId), payload);
      const newComment = res.data?.data || res.data;
      setComments([newComment, ...comments]);
    } catch (error) {
      console.error('Failed to add comment', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (id: string, message: string) => {
    try {
      const res = await axios.put(API_ENDPOINTS.clientContentCommentById(contentId, id), { body: message, message, content: message });
      const updatedComment = res.data?.data || res.data;
      setComments(comments.map(c => c.id === id ? { ...c, ...updatedComment, message, body: message, content: message } : c));
    } catch (error) {
      console.error('Failed to edit comment', error);
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await axios.delete(API_ENDPOINTS.clientContentCommentById(contentId, id));
      setComments(comments.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete comment', error);
    }
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    const timeA = new Date(a.createdAt || a.createdDate || a.postedAt || 0).getTime();
    const timeB = new Date(b.createdAt || b.createdDate || b.postedAt || 0).getTime();
    return timeB - timeA;
  });
  const topLevelComments = sortedComments.filter(c => !c.parentId);

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 3 }}>
        Bình luận ({comments.length})
      </Typography>

      {canComment && (
        <ClientContentCommentForm onSubmit={(msg) => handleAddComment(msg)} isSubmitting={isSubmitting} />
      )}

      {isLoading ? (
        <Stack alignItems="center" sx={{ my: 5 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <Box sx={{ mt: 3 }}>
          {topLevelComments.map((comment) => {
            const allowEditDelete = !disableActionsWhenNoComment || canComment;
            return (
              <ClientContentCommentItem
                key={comment.id}
                comment={comment}
                allComments={comments}
                canComment={canComment}
                onEdit={allowEditDelete ? handleEditComment : undefined}
                onDelete={allowEditDelete ? handleDeleteComment : undefined}
                onReply={canComment ? handleAddComment : undefined}
              />
            );
          })}
          {comments.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', my: 5 }}>
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
