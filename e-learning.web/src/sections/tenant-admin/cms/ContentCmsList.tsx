// react
import { useState, useEffect } from 'react';
// next
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
// @mui
import { Box, Card, Stack, Typography, IconButton, Chip, CircularProgress, Tooltip, Dialog, DialogTitle, DialogContent, Button, TextField } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
// redux
import { useSelector, useDispatch } from '@/redux/store';
// hooks
import useAuth from '@/hooks/useAuth';
import { useSnackbar } from 'notistack';
// actions
import { reprocessContent, fetchCmsContents } from '@/redux/slices/cmsContent';
// types
import type { CmsContent } from '@/@types/cmsContent';
// routes
import { PATH_ADMIN } from '../../../routes/paths';
// components
import Iconify from '../../../components/Iconify';
// utils
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
// viewers
const PdfLessonViewer = dynamic(() => import('@/components/document/PdfLessonViewer'), {
  ssr: false,
  loading: () => <CircularProgress />
});
import PptxSlideViewer from '@/components/document/PptxSlideViewer';
import HlsPlayer from '@/components/video/HlsPlayer';

// ----------------------------------------------------------------------

type Props = {
  onEdit: (item: CmsContent) => void;
};

export default function ContentCmsList({ onEdit }: Props) {
  const { items, activeNodeTitle, isLoading } = useSelector((state) => state.cmsContent);
  const [previewItem, setPreviewItem] = useState<CmsContent | null>(null);

  return (
    <>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1 }}>
              Thư mục hiện tại
            </Typography>
            <Typography variant="subtitle2" sx={{ color: 'text.primary', mt: 0.25 }}>
              {activeNodeTitle || 'Chưa chọn thư mục'}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${items.length} tài liệu`}
            sx={{ fontWeight: 600, bgcolor: 'primary.lighter', color: 'primary.darker', border: 'none' }}
          />
        </Stack>

        {/* List */}
        <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ height: 200 }}>
              <CircularProgress size={32} />
            </Stack>
          ) : items.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ height: 200, gap: 1.5 }}>
              <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Iconify icon="eva:folder-open-outline" width={32} height={32} sx={{ color: 'text.disabled' }} />
              </Box>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                Không có tài liệu trong thư mục này
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              {items.map((item) => (
                <ContentItem
                  key={item.id}
                  item={item}
                  onEdit={() => onEdit(item)}
                  onPreview={() => setPreviewItem(item)}
                />
              ))}
            </Stack>
          )}
        </Box>
      </Card>

      <CmsContentPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
    </>
  );
}

// ----------------------------------------------------------------------

type ContentItemProps = {
  item: CmsContent;
  onEdit: VoidFunction;
  onPreview: VoidFunction;
};

const TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  VIDEO:      { color: '#2065D1', icon: 'eva:video-fill',          label: 'Video'    },
  PDF:        { color: '#B72136', icon: 'eva:file-text-fill',       label: 'PDF'      },
  DOCUMENT:   { color: '#B76E00', icon: 'eva:file-fill',            label: 'Document' },
  WORD:       { color: '#B76E00', icon: 'eva:file-fill',            label: 'Document' },
  DOC:        { color: '#B76E00', icon: 'eva:file-fill',            label: 'Document' },
  DOCX:       { color: '#B76E00', icon: 'eva:file-fill',            label: 'Document' },
  SLIDE:      { color: '#7635DC', icon: 'eva:layers-fill',          label: 'Slide'    },
  URL:        { color: '#00AB55', icon: 'eva:globe-2-fill',         label: 'URL'      },
  ASSIGNMENT: { color: '#FF6C40', icon: 'eva:edit-2-fill',          label: 'Bài tập'  },
  QUIZ:       { color: '#FF3030', icon: 'eva:question-mark-circle-fill', label: 'Quiz' },
};

function ContentItem({ item, onEdit, onPreview }: ContentItemProps) {
  const { push } = useRouter();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { activeNodeId } = useSelector((state) => state.cmsContent);

  const { id, type, title, description, publishStatus: status, watermarkEnabled: watermark, isDownloadable: download, createdAt: date, curriculumNodeId, processingStatus, visibilityFrom, visibilityTo } = item;
  const visibilityFromText = visibilityFrom ? new Date(visibilityFrom).toLocaleDateString('vi-VN') : null;
  const visibilityToText = visibilityTo ? new Date(visibilityTo).toLocaleDateString('vi-VN') : null;
  const typeUpper = (type || '').toUpperCase();
  const isProcessable = ['VIDEO', 'SLIDE', 'PDF', 'DOCUMENT', 'WORD', 'DOC', 'DOCX', 'PPT', 'PPTX'].includes(typeUpper);
  const cfg = TYPE_CONFIG[type] ?? { color: theme.palette.text.secondary, icon: 'eva:file-fill', label: type };

  const handleReprocess = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.tenantId) return;
    try {
      await dispatch(reprocessContent(user.tenantId, id));
      enqueueSnackbar('Đã gửi yêu cầu xử lý lại nội dung', { variant: 'success' });
      if (curriculumNodeId) {
        dispatch(fetchCmsContents(user.tenantId, curriculumNodeId));
      } else if (activeNodeId) {
        dispatch(fetchCmsContents(user.tenantId, activeNodeId));
      }
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Không thể xử lý lại nội dung', { variant: 'error' });
    }
  };

  const handlePreview = () => {
    onPreview();
  };

  const handleViewInCurriculum = () => {
    const targetNodeId = curriculumNodeId || activeNodeId;
    if (targetNodeId) {
      push(`${PATH_ADMIN.tenantAdminPermissions}?nodeId=${targetNodeId}`);
    } else {
      enqueueSnackbar('Không tìm thấy ID thư mục/học liệu để phân quyền', { variant: 'error' });
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.tenantId) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      try {
        await axios.delete(API_ENDPOINTS.tenantsContentById(user.tenantId, id));
        enqueueSnackbar('Xóa tài liệu thành công', { variant: 'success' });
        if (curriculumNodeId) {
          dispatch(fetchCmsContents(user.tenantId, curriculumNodeId));
        } else if (activeNodeId) {
          dispatch(fetchCmsContents(user.tenantId, activeNodeId));
        }
      } catch (err) {
        console.error('Delete content error:', err);
        enqueueSnackbar('Không thể xóa tài liệu', { variant: 'error' });
      }
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStatus = e.target.value;
    if (!user?.tenantId) return;
    try {
      await axios.patch(API_ENDPOINTS.tenantsContentStatus(user.tenantId, id), {
        publishStatus: newStatus,
      });
      enqueueSnackbar('Cập nhật trạng thái thành công', { variant: 'success' });
      if (curriculumNodeId) {
        dispatch(fetchCmsContents(user.tenantId, curriculumNodeId));
      } else if (activeNodeId) {
        dispatch(fetchCmsContents(user.tenantId, activeNodeId));
      }
    } catch (err) {
      console.error('Failed to update status', err);
      enqueueSnackbar('Không thể cập nhật trạng thái', { variant: 'error' });
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        gap: 2,
        transition: 'all 0.2s ease',
        cursor: 'default',
        position: 'relative',
        bgcolor: 'background.paper',
        '&:hover': {
          borderColor: alpha(cfg.color, 0.5),
          boxShadow: `0 0 0 3px ${alpha(cfg.color, 0.08)}`,
        },
      }}
    >
      {/* Top Section: Icon + Title & Desc */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
        {/* Type Icon */}
        <Box
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(cfg.color, 0.1),
          }}
        >
          <Iconify icon={cfg.icon} width={24} height={24} sx={{ color: cfg.color }} />
        </Box>

        {/* Content Details */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5, minWidth: 0 }}>
            {/* Type Badge */}
            <Box
              sx={{
                px: 0.75, py: 0.15,
                borderRadius: 0.75,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.5,
                color: cfg.color,
                bgcolor: alpha(cfg.color, 0.1),
                flexShrink: 0,
              }}
            >
              {cfg.label}
            </Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: 'text.primary',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                flexGrow: 1,
              }}
            >
              {title}
            </Typography>
          </Stack>

          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              mb: { xs: 0, md: 0.75 },
            }}
          >
            {description || 'Chưa có mô tả'}
          </Typography>

          {/* Meta tags (visible only on desktop, hidden on mobile) */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            flexWrap="wrap"
            sx={{ gap: 1, display: { xs: 'none', md: 'flex' } }}
          >
            <MetaTag
              icon={watermark ? 'eva:shield-fill' : 'eva:shield-off-outline'}
              label="Watermark"
              active={!!watermark}
            />
            <MetaTag
              icon={download ? 'eva:download-fill' : 'eva:download-outline'}
              label="Tải xuống"
              active={!!download}
            />
            {(visibilityFrom || visibilityTo) && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'inline-flex', alignItems: 'center', bgcolor: 'background.neutral', px: 1, py: 0.5, borderRadius: 1 }}>
                <Iconify icon="eva:calendar-outline" width={14} height={14} sx={{ mr: 0.5 }} />
                {visibilityFrom && visibilityTo
                  ? `Từ ${visibilityFromText} - Đến ${visibilityToText}`
                  : visibilityFrom
                    ? `Từ ${visibilityFromText}`
                    : `Đến ${visibilityToText}`}
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>

      {/* Bottom Section: Meta Tags + Status & Actions */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        sx={{
          pt: { xs: 1.5, md: 0 },
          borderTop: { xs: '1px dashed', md: 'none' },
          borderColor: 'divider',
          flexShrink: 0,
          width: { xs: '100%', md: 'auto' },
        }}
      >
        {/* Meta tags (visible only on mobile, hidden on desktop) */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          flexWrap="wrap"
          sx={{ gap: 1, display: { xs: 'flex', md: 'none' } }}
        >
          <MetaTag
            icon={watermark ? 'eva:shield-fill' : 'eva:shield-off-outline'}
            label="Watermark"
            active={!!watermark}
          />
          <MetaTag
            icon={download ? 'eva:download-fill' : 'eva:download-outline'}
            label="Tải xuống"
            active={!!download}
          />
            {(visibilityFrom || visibilityTo) && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'inline-flex', alignItems: 'center', bgcolor: 'background.neutral', px: 1, py: 0.5, borderRadius: 1 }}>
                <Iconify icon="eva:calendar-fill" width={14} height={14} sx={{ mr: 0.5 }} />
                {visibilityFrom && visibilityTo
                  ? `Từ ${visibilityFromText} - Đến ${visibilityToText}`
                  : visibilityFrom
                    ? `Từ ${visibilityFromText}`
                    : `Đến ${visibilityToText}`}
              </Typography>
            )}
            <TextField
              select
              size="small"
              value={status}
              onChange={handleStatusChange}
              SelectProps={{ native: true }}
              onClick={(e) => e.stopPropagation()}
              sx={{
                '& select': { 
                  py: 0.5, 
                  px: 1.5,
                  fontSize: 11, 
                  fontWeight: 700,
                  color: status === 'DRAFT' ? 'warning.dark' : status === 'PUBLISHED' ? 'success.dark' : 'text.secondary',
                  bgcolor: status === 'DRAFT' ? alpha(theme.palette.warning.main, 0.1) : status === 'PUBLISHED' ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.action.selected, 0.1),
                  borderRadius: 1,
                  border: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                },
                '& fieldset': { border: 'none' },
                minWidth: 110,
              }}
            >
              <option value="DRAFT">Nháp</option>
              <option value="PUBLISHED">Đã phát hành</option>
              <option value="ARCHIVED">Lưu trữ</option>
            </TextField>

            {isProcessable && processingStatus && processingStatus !== 'SUCCESS' && (
              processingStatus === 'FAILED' ? (
                <Box
                  sx={{
                    px: 1, py: 0.35,
                    borderRadius: 1,
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    color: 'error.dark',
                    flexShrink: 0,
                  }}
                >
                  Lỗi xử lý
                </Box>
              ) : (
                <Box
                  sx={{
                    px: 1, py: 0.35,
                    borderRadius: 1,
                    fontSize: 11,
                    fontWeight: 700,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                    color: 'info.dark',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    flexShrink: 0,
                  }}
                >
                  <CircularProgress size={12} color="inherit" />
                  Đang xử lý
                </Box>
              )
            )}
          </Stack>

          {/* Action buttons */}
          <Stack
            className="item-actions"
            direction="row"
            spacing={0.5}
            sx={{ flexShrink: 0 }}
          >
            <Tooltip title={isProcessable && (processingStatus === 'PENDING' || processingStatus === 'PROCESSING') ? "Nội dung đang được xử lý..." : "Xem nội dung (Preview)"}>
              <span>
                <IconButton
                  size="small"
                  onClick={handlePreview}
                  disabled={isProcessable && (processingStatus === 'PENDING' || processingStatus === 'PROCESSING')}
                  sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'info.lighter', color: 'info.main' } }}
                >
                  <Iconify icon="eva:eye-fill" width={16} height={16} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Phân quyền nội dung">
              <IconButton
                size="small"
                onClick={handleViewInCurriculum}
                sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'warning.lighter', color: 'warning.main' } }}
              >
                <Iconify icon="eva:diagonal-arrow-right-up-fill" width={16} height={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Chỉnh sửa">
              <IconButton
                size="small"
                onClick={onEdit}
                sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'primary.lighter', color: 'primary.main' } }}
              >
                <Iconify icon="eva:edit-2-fill" width={16} height={16} />
              </IconButton>
            </Tooltip>
            {isProcessable && processingStatus === 'FAILED' && (
              <Tooltip title="Xử lý lại nội dung">
                <IconButton
                  size="small"
                  onClick={handleReprocess}
                  sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'warning.lighter', color: 'warning.main' } }}
                >
                  <Iconify icon="eva:refresh-fill" width={16} height={16} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Xóa">
              <IconButton
                size="small"
                onClick={handleDelete}
                sx={{ bgcolor: 'action.hover', '&:hover': { bgcolor: 'error.lighter', color: 'error.main' } }}
              >
                <Iconify icon="eva:trash-2-fill" width={16} height={16} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>
    );
}

// ----------------------------------------------------------------------

function MetaTag({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.4}>
      <Iconify
        icon={icon}
        width={13}
        height={13}
        sx={{ color: active ? 'success.main' : 'text.disabled' }}
      />
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {label}:{' '}
        <Box component="span" sx={{ color: active ? 'success.main' : 'error.main', fontWeight: 600 }}>
          {active ? 'Bật' : 'Tắt'}
        </Box>
      </Typography>
    </Stack>
  );
}

// ----------------------------------------------------------------------

type PreviewModalProps = {
  item: CmsContent | null;
  onClose: VoidFunction;
};

function getEmbedUrl(url: string) {
  if (!url) return '';
  let videoId = '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    videoId = match[2];
  }
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
}

function CmsContentPreviewModal({ item, onClose }: PreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [viewUrl, setViewUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!item) {
      setViewUrl('');
      setError(null);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (item.type === 'VIDEO') {
          const res = await axios.get(API_ENDPOINTS.clientContentStreamUrl(item.id));
          const data = res.data;
          setViewUrl(data?.url || data?.streamUrl || (typeof data === 'string' ? data : ''));
        } else if (item.type === 'PDF' || item.type === 'SLIDE' || ['DOCUMENT', 'WORD', 'DOC', 'DOCX'].includes((item.type || '').toUpperCase())) {
          const res = await axios.get(API_ENDPOINTS.clientContentViewUrl(item.id));
          const data = res.data;
          setViewUrl(data?.url || data?.viewUrl || (typeof data === 'string' ? data : ''));
        } else if (item.type === 'URL') {
          const res = await axios.get(`/api/client/contents/${item.id}/direct-url`);
          const data = res.data;
          const url = data?.url || data?.directUrl || (typeof data === 'string' ? data : '') || item.sourceUrl;
          if (url) {
            setViewUrl(url);
          } else {
            setError('Tài liệu này chưa có đường dẫn xem trước.');
          }
        } else if (item.sourceUrl) {
          setViewUrl(item.sourceUrl);
        } else {
          setError('Tài liệu này chưa có đường dẫn xem trước.');
        }
      } catch (err) {
        console.error('Failed to fetch preview URL', err);
        setError('Không thể tải tài liệu này. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [item]);

  if (!item) return null;

  const isOfficeDoc = 
    (item.type as string) === 'SLIDE' ||
    (((item.type as string) === 'DOCUMENT' || (item.type as string) === 'WORD' || (item.type as string) === 'DOC' || (item.type as string) === 'DOCX') && !(viewUrl || '').toLowerCase().includes('.pdf')) ||
    ((viewUrl || '').toLowerCase().split('?')[0].endsWith('.pptx') || 
     (viewUrl || '').toLowerCase().split('?')[0].endsWith('.ppt') ||
     (viewUrl || '').toLowerCase().split('?')[0].endsWith('.docx') ||
     (viewUrl || '').toLowerCase().split('?')[0].endsWith('.doc') ||
     (viewUrl || '').toLowerCase().split('?')[0].endsWith('.xlsx') ||
     (viewUrl || '').toLowerCase().split('?')[0].endsWith('.xls'));

  return (
    <Dialog 
      open={!!item} 
      onClose={onClose} 
      fullWidth 
      maxWidth="lg" 
      PaperProps={{ sx: { height: '85vh', maxHeight: 900 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.neutral' }}>
        <Typography variant="h6">{item.title}</Typography>
        <IconButton onClick={onClose}>
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, height: '100%', bgcolor: 'common.black', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {isLoading ? (
          <Stack alignItems="center" sx={{ color: 'common.white' }}>
            <CircularProgress color="primary" sx={{ mb: 2 }} />
            <Typography>Đang tải tài liệu...</Typography>
          </Stack>
        ) : error ? (
          <Stack alignItems="center" sx={{ color: 'common.white', p: 2, textAlign: 'center' }}>
            <Iconify icon="eva:alert-triangle-fill" width={48} height={48} sx={{ color: 'error.main', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>Lỗi tải tài liệu</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>{error}</Typography>
            <Button variant="contained" onClick={onClose}>Đóng</Button>
          </Stack>
        ) : viewUrl ? (
          item.type === 'VIDEO' ? (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HlsPlayer src={viewUrl} videoId={item.id} sx={{ width: '100%', height: '100%' }} />
            </Box>
          ) : item.type === 'URL' ? (
            <iframe
              src={getEmbedUrl(viewUrl)}
              title={item.title}
              width="100%"
              height="100%"
              style={{ border: 'none', backgroundColor: '#fff' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : isOfficeDoc ? (
            <PptxSlideViewer fileUrl={viewUrl} />
          ) : (
            <PdfLessonViewer file={viewUrl} />
          )
        ) : (
          <Typography sx={{ color: 'common.white' }}>Không có tài liệu để hiển thị</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
