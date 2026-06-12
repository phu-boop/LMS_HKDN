import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  Stack,
  Table,
  Button,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  IconButton,
  TableContainer,
  Tooltip,
  Chip,
  Container,
  TextField,
  InputAdornment,
  TablePagination,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import useAuth from '../../../hooks/useAuth';
import axios from '../../../utils/axios';
import { API_ENDPOINTS } from '../../../constants/apiEndpoints';
import Iconify from '../../../components/Iconify';
import Scrollbar from '../../../components/Scrollbar';
import CommentDetailPopup from '@/components/CommentDetailPopup';
import { fDateTime } from '../../../utils/formatTime';
import { useGetSchoolsByTenantQuery } from '../../../redux/api/schoolApi';
// CommentDetailPopup removed — using built-in Dialog for details

// ----------------------------------------------------------------------

type ContentOption = {
  id: string;
  title: string;
};

export default function CommentManagement() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const tenantId = user?.tenantId;

  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentOption | null>(null);
  const [contentInputValue, setContentInputValue] = useState('');
  const [contentOptions, setContentOptions] = useState<ContentOption[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [commentDetail, setCommentDetail] = useState<any | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const [isPublicFilter, setIsPublicFilter] = useState<'true' | 'false' | ''>('');
  const [isAdminFilter, setIsAdminFilter] = useState<'true' | 'false' | ''>('');
  const [isPinnedFilter, setIsPinnedFilter] = useState<'true' | 'false' | ''>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const { data: schools = [] } = useGetSchoolsByTenantQuery();

  useEffect(() => {
    const fetchUserOptions = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.usersList, {
          params: { search: userSearchInput || undefined, page: 1, pageSize: 50 },
        });
        const items = res.data?.items || res.data?.data?.items || (Array.isArray(res.data) ? res.data : []);
        setUserOptions(items);
      } catch (error) {
        console.error('Failed to fetch user options', error);
      }
    };

    const timeout = window.setTimeout(fetchUserOptions, 400);
    return () => window.clearTimeout(timeout);
  }, [userSearchInput]);

  useEffect(() => {
    if (!tenantId) return;

    let active = true;
    const fetchContentOptions = async () => {
      setContentLoading(true);
      try {
        const res = await axios.get(API_ENDPOINTS.tenantsContents(tenantId), {
          params: {
            search: contentInputValue || undefined,
            page: 1,
            pageSize: 50,
          },
        });

        const items = res.data?.items || res.data?.data?.items || [];
        if (active) {
          setContentOptions(items);
        }
      } catch (error) {
        console.error('Failed to fetch content options', error);
      } finally {
        if (active) setContentLoading(false);
      }
    };

    const timeout = window.setTimeout(fetchContentOptions, 400);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [tenantId, contentInputValue]);

  const fetchComments = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);

    try {
      const res = await axios.get(API_ENDPOINTS.tenantComments, {
        params: {
          page: page + 1,
          pageSize: rowsPerPage,
          search: search || undefined,
          schoolId: schoolFilter || undefined,
          userId: selectedUser?.id || selectedUser?.userId || undefined,
          contentId: selectedContent?.id || undefined,
          isPublic: isPublicFilter ? isPublicFilter === 'true' : undefined,
          isAdmin: isAdminFilter ? isAdminFilter === 'true' : undefined,
          isPinned: isPinnedFilter ? isPinnedFilter === 'true' : undefined,
          sortOrder,
        },
      });

      const data = res.data;
      const items = data.items || data.data || data || [];
      setComments(items);
      setTotal(Number(data.totalCount ?? data.total ?? items.length) || 0);
    } catch (error) {
      console.error('Failed to fetch comments', error);
      enqueueSnackbar('Không thể tải danh sách bình luận', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, page, rowsPerPage, search, schoolFilter, selectedUser, selectedContent, isPublicFilter, isAdminFilter, isPinnedFilter, sortOrder, enqueueSnackbar]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleDelete = async (commentId: string) => {
    if (!tenantId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    try {
      await axios.delete(API_ENDPOINTS.tenantCommentDelete(commentId));
      enqueueSnackbar('Đã xóa bình luận', { variant: 'success' });
      fetchComments();
    } catch (error) {
      console.error('Failed to delete comment', error);
      enqueueSnackbar('Không thể xóa bình luận', { variant: 'error' });
    }
  };

  const handleOpenDetail = async (commentId: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setCommentDetail(null);

    try {
      const res = await axios.get(API_ENDPOINTS.tenantCommentById(commentId));
      setCommentDetail(res.data);
    } catch (error) {
      console.error('Failed to load comment detail', error);
      setDetailError('Không thể tải chi tiết bình luận');
      enqueueSnackbar('Không thể tải chi tiết bình luận', { variant: 'error' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setCommentDetail(null);
    setDetailError(null);
    setReplyingTo(null);
    setReplyMessage('');
  };

  const getCommentChildren = (parentId: string | null) => {
    if (!commentDetail?.comments) return [];
    return commentDetail.comments
      .filter((c: any) => c.parentId === parentId)
      .sort((a: any, b: any) => new Date(a.createdAt || a.createdDate || 0).getTime() - new Date(b.createdAt || b.createdDate || 0).getTime());
  };

  const handleReplySubmit = async (parentId: string | null, message: string) => {
    if (!message.trim() || !tenantId) return;
    setIsReplySubmitting(true);
    try {
      const payload: any = {
        body: message,
        message,
        content: message,
        parentId,
      };

      if (commentDetail?.contentItemId) {
        payload.contentItemId = commentDetail.contentItemId;
      }

      const res = await axios.post(API_ENDPOINTS.tenantComments, payload);
      const newComment = res.data?.data || res.data;

      setCommentDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: [...(prev.comments || []), newComment],
        };
      });

      setReplyingTo(null);
      setReplyMessage('');
      enqueueSnackbar('Đã trả lời bình luận', { variant: 'success' });
    } catch (error) {
      console.error('Failed to reply comment', error);
      enqueueSnackbar('Không thể trả lời bình luận', { variant: 'error' });
    } finally {
      setIsReplySubmitting(false);
    }
  };

  const handleModalDelete = async (commentId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    try {
      await axios.delete(API_ENDPOINTS.tenantCommentDelete(commentId));
      setCommentDetail((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: (prev.comments || []).filter((item: any) => item.id !== commentId),
        };
      });
      enqueueSnackbar('Đã xóa bình luận', { variant: 'success' });
    } catch (error) {
      console.error('Failed to delete comment', error);
      enqueueSnackbar('Không thể xóa bình luận', { variant: 'error' });
    }
  };

  const renderCommentItem = (item: any, level = 0) => {
    const children = getCommentChildren(item.id);
    const isMainComment = item.id === commentDetail?.commentId;

    return (
      <Box
        key={item.id}
        sx={{
          ml: level * 3,
          borderLeft: level > 0 ? '2px solid' : undefined,
          borderColor: 'divider',
          pl: level > 0 ? 2 : 0,
        }}
      >
        <Card
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            bgcolor: isMainComment ? 'action.selected' : 'background.paper',
            borderColor: isMainComment ? 'primary.main' : 'divider',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: 'common.white', flexShrink: 0 }}>
              {(item.authorName || item.userName || 'Người dùng').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {item.authorName || item.userName || 'Người dùng'}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  <Chip
                    label={item.isPublic ? 'Công khai' : 'Nội bộ'}
                    color={item.isPublic ? 'success' : 'warning'}
                    size="small"
                  />
                  <Chip
                    label={item.isAdmin ? 'Admin' : 'Người dùng'}
                    size="small"
                  />
                </Stack>
              </Stack>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                {item.body || item.content || item.message || '—'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {item.createdAt ? `Tạo: ${fDateTime(item.createdAt)}` : 'Tạo: —'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {item.updatedAt ? `Cập nhật: ${fDateTime(item.updatedAt)}` : 'Cập nhật: —'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setReplyingTo(item.id);
                    setReplyMessage('');
                  }}
                >
                  Trả lời
                </Button>
                <Button
                  size="small"
                  variant="text"
                  color="error"
                  onClick={() => handleModalDelete(item.id)}
                >
                  Xóa
                </Button>
              </Stack>
              {replyingTo === item.id && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Nhập nội dung trả lời..."
                  />
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={isReplySubmitting || !replyMessage.trim()}
                      onClick={() => handleReplySubmit(item.id, replyMessage)}
                    >
                      Gửi trả lời
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyMessage('');
                      }}
                    >
                      Hủy
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>
          </Stack>
        </Card>

        {children.map((child: any) => renderCommentItem(child, level + 1))}
      </Box>
    );
  };

  const renderCommentTree = () => {
    if (!commentDetail?.comments) return null;
    const rootComment =
      commentDetail.comments.find((c: any) => c.id === commentDetail.commentId) ||
      commentDetail.comments.find((c: any) => !c.parentId) ||
      commentDetail.comments[0];

    return rootComment ? renderCommentItem(rootComment) : null;
  };

  const handleToggleStatus = async (comment: any) => {
    if (!tenantId) return;
    try {
      const newVisibility = comment.isPublic ? false : true;
      await axios.put(API_ENDPOINTS.tenantCommentStatus(comment.id), { isPublic: newVisibility });
      enqueueSnackbar(
        newVisibility ? 'Đã chuyển sang Công khai' : 'Đã chuyển sang Nội bộ',
        { variant: 'success' }
      );
      fetchComments();
    } catch (error) {
      console.error('Failed to toggle comment status', error);
      enqueueSnackbar('Không thể thay đổi trạng thái', { variant: 'error' });
    }
  };

  const handleTogglePin = async (comment: any) => {
    try {
      const newPinnedState = !comment.isPinned;
      await axios.put(API_ENDPOINTS.tenantCommentPin(comment.id), { isPinned: newPinnedState });
      enqueueSnackbar(
        newPinnedState ? 'Đã ghim bình luận' : 'Đã bỏ ghim bình luận',
        { variant: 'success' }
      );
      fetchComments();
    } catch (error) {
      console.error('Failed to toggle comment pin', error);
      enqueueSnackbar('Không thể thay đổi trạng thái ghim', { variant: 'error' });
    }
  };

  const filteredComments = comments;

  return (
    <Container maxWidth={false}>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Quản lý Bình luận
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Kiểm duyệt và quản lý tất cả bình luận của học viên trong hệ thống
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="eva:refresh-fill" />}
          onClick={fetchComments}
          sx={{ borderColor: 'divider' }}
        >
          Làm mới
        </Button>
      </Stack>


      {/* Filters */}
      <Card sx={{ borderRadius: 2 }}>
        <Stack direction="column" spacing={2} sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
            <TextField
              fullWidth
              size="small"
              placeholder="Tìm theo nội dung bình luận"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ width: { xs: '100%', md: 180 } }}>
              <InputLabel>Sắp xếp</InputLabel>
              <Select
                value={sortOrder}
                label="Sắp xếp"
                onChange={(e) => {
                  setSortOrder(e.target.value as 'desc' | 'asc');
                  setPage(0);
                }}
              >
                <MenuItem value="desc">Mới nhất</MenuItem>
                <MenuItem value="asc">Cũ nhất</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Autocomplete
              fullWidth
              size="small"
              options={userOptions}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.fullName ? `${option.fullName} (${option.username || option.email || ''})` : option.username || option.email || '';
              }}
              filterOptions={(x) => x}
              value={selectedUser}
              onChange={(event, newValue) => {
                setSelectedUser(newValue);
                setPage(0);
              }}
              inputValue={userSearchInput}
              onInputChange={(event, newInputValue) => {
                setUserSearchInput(newInputValue);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Người dùng"
                  placeholder="Tìm người dùng..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />

            <FormControl fullWidth size="small">
              <InputLabel>Trường học</InputLabel>
              <Select
                value={schoolFilter}
                label="Trường học"
                onChange={(e) => { setSchoolFilter(e.target.value); setPage(0); }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {schools.map((school: any) => (
                  <MenuItem key={school.id} value={school.id}>
                    {school.schoolName || school.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              fullWidth
              size="small"
              options={contentOptions}
              getOptionLabel={(option) => option.title}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedContent}
              onChange={(event, newValue) => {
                setSelectedContent(newValue);
                setPage(0);
              }}
              inputValue={contentInputValue}
              onInputChange={(event, newInputValue) => {
                setContentInputValue(newInputValue);
              }}
              loading={contentLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tài liệu/Bài giảng"
                  placeholder="Chọn nội dung..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {contentLoading ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Hiển thị</InputLabel>
              <Select
                value={isPublicFilter}
                label="Hiển thị"
                onChange={(e) => {
                  setIsPublicFilter(e.target.value as 'true' | 'false' | '');
                  setPage(0);
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="true">Công khai</MenuItem>
                <MenuItem value="false">Nội bộ</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Người đăng</InputLabel>
              <Select
                value={isAdminFilter}
                label="Người đăng"
                onChange={(e) => {
                  setIsAdminFilter(e.target.value as 'true' | 'false' | '');
                  setPage(0);
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="true">Admin</MenuItem>
                <MenuItem value="false">Người dùng</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Ghim</InputLabel>
              <Select
                value={isPinnedFilter}
                label="Ghim"
                onChange={(e) => {
                  setIsPinnedFilter(e.target.value as 'true' | 'false' | '');
                  setPage(0);
                }}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="true">Ghim</MenuItem>
                <MenuItem value="false">Chưa ghim</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {/* Table */}
        <Scrollbar>
          <TableContainer sx={{ minWidth: 900 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>Người gửi</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>Trường học</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>Tài liệu</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>Nội dung</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>Ngày gửi</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>Trạng thái</TableCell>                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>Ghim</TableCell>                  <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 13 }}>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2, color: 'text.disabled' }}>Đang tải dữ liệu...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredComments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Box sx={{ mb: 2 }}>
                        <Iconify icon="eva:message-circle-outline" sx={{ width: 64, height: 64, color: 'text.disabled', opacity: 0.5 }} />
                      </Box>
                      <Typography variant="subtitle1" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                        Chưa có bình luận nào
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
                        Bình luận của học viên sẽ xuất hiện tại đây
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComments.map((comment) => {
                    const school = schools.find((s: any) => s.id === comment.schoolId);
                    return (
                      <TableRow key={comment.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" noWrap sx={{ maxWidth: 180, fontWeight: 600 }}>
                              {comment.authorName || comment.userName || 'Người dùng'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              {comment.userEmail || ''}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={school?.schoolName || (school as any)?.name || comment.schoolName || '—'} placement="top">
                            <Typography variant="body2" sx={{ maxWidth: 260, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {school?.schoolName || (school as any)?.name || comment.schoolName || '—'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={comment.contentTitle || comment.lessonTitle || '—'} placement="top">
                            <Typography variant="body2" sx={{ maxWidth: 260, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {comment.contentTitle || comment.lessonTitle || '—'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={comment.body || comment.message || comment.content || ''} placement="top">
                            <Typography variant="body2" noWrap sx={{ maxWidth: 250, color: 'text.primary' }}>
                              {comment.body || comment.message || comment.content || '—'}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: 'text.disabled', whiteSpace: 'nowrap' }}>
                            {fDateTime(comment.createdAt || comment.createdDate)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={comment.isPublic ? 'Công khai' : 'Nội bộ'}
                            color={comment.isPublic ? 'success' : 'warning'}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: 11 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {(comment.parentId === null || comment.parentId === undefined) ? (
                            <Tooltip title={comment.isPinned ? 'Bỏ ghim bình luận' : 'Ghim bình luận'}>
                              <IconButton size="small" onClick={() => handleTogglePin(comment)} sx={{ color: comment.isPinned ? 'warning.main' : 'text.secondary' }}>
                                <Iconify icon={comment.isPinned ? 'mynaui:pin-solid' : 'mynaui:pin'} width={18} height={18} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                            <Tooltip title="Xem chi tiết">
                              <IconButton size="small" onClick={() => handleOpenDetail(comment.id)} sx={{ color: 'text.secondary' }}>
                                <Iconify icon="bx:comment-detail" width={18} height={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={comment.isPublic ? 'Chuyển sang Nội bộ' : 'Chuyển sang Công khai'}>
                              <IconButton size="small" onClick={() => handleToggleStatus(comment)} sx={{ color: comment.isPublic ? 'warning.main' : 'success.main' }}>
                                <Iconify icon={comment.isPublic ? 'eva:eye-off-fill' : 'eva:eye-fill'} width={18} height={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Xóa">
                              <IconButton size="small" onClick={() => handleDelete(comment.id)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                <Iconify icon="eva:trash-2-outline" width={18} height={18} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Số hàng mỗi trang"
        />
      </Card>

      <CommentDetailPopup
        open={detailOpen}
        onClose={handleCloseDetail}
        commentDetail={commentDetail}
        commentId={commentDetail?.commentId}
        onReload={fetchComments}
      />
    </Container>
  );
}
