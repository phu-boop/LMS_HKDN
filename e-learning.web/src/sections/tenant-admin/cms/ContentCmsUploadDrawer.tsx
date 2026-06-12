// @mui
import {
  Box,
  Stack,
  Drawer,
  Button,
  Divider,
  Typography,
  TextField,
  Switch,
  IconButton,
  Grid,
  CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
// hooks
import { useState, useRef, useEffect } from 'react';
import useAuth from '@/hooks/useAuth';
// redux
import { useDispatch, useSelector } from '@/redux/store';
import { upsertCmsContent, uploadCmsContent, confirmUpload, publishContentStatus, fetchCmsContents } from '@/redux/slices/cmsContent';
// types
import type { CmsContent } from '@/@types/cmsContent';
// components
import Iconify from '../../../components/Iconify';
import Scrollbar from '../../../components/Scrollbar';
// utils
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

// ----------------------------------------------------------------------

type Props = {
  open: boolean;
  isEdit: boolean;
  editingItem?: CmsContent | null;
  onClose: VoidFunction;
};

export default function ContentCmsUploadDrawer({ open, isEdit, editingItem, onClose }: Props) {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { activeNodeId, activeNodeTitle } = useSelector((state) => state.cmsContent);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState('DOCUMENT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isWatermark, setIsWatermark] = useState(true);
  const [isDownload, setIsDownload] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [visibilityFrom, setVisibilityFrom] = useState('');
  const [visibilityTo, setVisibilityTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Pre-fill / fetch details dynamically when editing
  useEffect(() => {
    const fetchDetails = async () => {
      if (isEdit && editingItem && open && user?.tenantId) {
        setIsLoadingDetails(true);
        try {
          const res = await axios.get(API_ENDPOINTS.tenantsContentById(user.tenantId, editingItem.id));
          const details = res.data?.data || res.data;
          if (details) {
            setTitle(details.title ?? '');
            setDescription(details.description ?? '');
            setContentType(details.type ?? 'WORD');
            setIsWatermark(details.watermarkEnabled ?? true);
            setIsDownload(details.isDownloadable ?? false);
            setSourceUrl(details.sourceUrl ?? '');
            setVisibilityFrom(details.visibilityFrom ? details.visibilityFrom.split('T')[0] : '');
            setVisibilityTo(details.visibilityTo ? details.visibilityTo.split('T')[0] : '');
          }
        } catch (err) {
          console.error('Failed to fetch content details', err);
        } finally {
          setIsLoadingDetails(false);
        }
      } else if (!isEdit && open) {
        setTitle('');
        setDescription('');
        setContentType('WORD');
        setIsWatermark(true);
        setIsDownload(false);
        setSourceUrl('');
        setVisibilityFrom('');
        setVisibilityTo('');
        setFile(null);
      }
    };

    fetchDetails();
  }, [isEdit, editingItem, open, user?.tenantId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.split('.')[0]);
      
      // Auto-set type
      if (selectedFile.type.includes('video')) setContentType('VIDEO');
      else if (selectedFile.type.includes('pdf')) setContentType('PDF');
      else if (selectedFile.name.toLowerCase().match(/\.(doc|docx)$/) || selectedFile.type.includes('word')) setContentType('WORD');
      else if (selectedFile.name.toLowerCase().match(/\.(ppt|pptx)$/) || selectedFile.type.includes('presentation')) setContentType('SLIDE');
      else setContentType('WORD');
    }
  };

  const handleSave = async (actionType: string) => {
    if (!user?.tenantId || !activeNodeId) return;
    setIsSubmitting(true);
    
    // Payload matching backend API expectations
    const payload: any = {
      ...(isEdit && editingItem ? { id: editingItem.id } : {}),
      curriculumNodeId: activeNodeId,
      type: contentType,
      title,
      description,
      sourceUrl: contentType === 'URL' ? sourceUrl : '', 
      watermarkEnabled: isWatermark,
      isDownloadable: isDownload,
      visibilityFrom: visibilityFrom ? new Date(visibilityFrom).toISOString() : null,
      visibilityTo: visibilityTo ? new Date(visibilityTo).toISOString() : null,
    };

    if (file) {
      payload.fileName = file.name;
    }

    try {
      // 1. Create/Update content metadata
      const response = await dispatch(upsertCmsContent(user.tenantId, payload, isEdit));
      
      // 2. Upload file content and confirm
      const uploadUrl = response?.uploadUrl || response?.data?.uploadUrl;
      const objectKey = response?.objectKey || response?.data?.objectKey;
      const contentId = response?.id || response?.contentId || response?.data?.id || response?.data?.contentId || (isEdit && editingItem?.id) || null;

      if (file && uploadUrl && objectKey) {
        await dispatch(uploadCmsContent(uploadUrl, file));
        if (contentId) {
          await dispatch(confirmUpload(user.tenantId, contentId, {
            fileName: file.name,
            objectKey,
            mimeType: file.type,
            fileSizeBytes: file.size,
          }));
        } else {
          console.warn('Content ID is missing; skipping confirmUpload');
        }
      }

      // 3. Set Publish Status if requested (new content flow)
      if (actionType === 'Đã xuất bản' && contentId) {
        await dispatch(publishContentStatus(user.tenantId, contentId, 'PUBLISHED'));
      }

      // Refresh parent cms list
      dispatch(fetchCmsContents(user.tenantId, activeNodeId));
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 600 } },
      }}
    >
      <Box sx={{ p: 3, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6">{isEdit ? 'Chỉnh sửa Học liệu' : 'Tải lên Học liệu mới'}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Thư mục đích: <Box component="span" sx={{ fontWeight: 'bold', color: '#10b981' }}>{activeNodeTitle || 'Chưa chọn thư mục'}</Box>
          </Typography>
        </Box>
        <IconButton onClick={onClose} disabled={isSubmitting}>
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </Box>

      <Divider />

      {isLoadingDetails ? (
        <Stack alignItems="center" justifyContent="center" sx={{ flexGrow: 1 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>Đang tải thông tin chi tiết...</Typography>
        </Stack>
      ) : (
        <Scrollbar sx={{ flexGrow: 1 }}>
          <Stack spacing={4} sx={{ p: 3 }}>
            {/* File Upload Section */}
            <Box>
              <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 2 }}>
                {isEdit ? 'Thay thế Tập tin nguồn (Bỏ trống nếu giữ nguyên)' : 'Tập tin nguồn'}
              </Typography>
              
              {isEdit && editingItem && !file && (
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2, p: 2, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05), border: '1px dashed', borderColor: 'primary.main', borderRadius: 1.5 }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: 'primary.lighter', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Iconify icon="eva:file-text-fill" width={24} height={24} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                      Tập tin hiện tại: {editingItem.fileName || editingItem.title || 'Đã có tập tin'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Chọn file mới bên dưới nếu muốn thay thế.
                    </Typography>
                  </Box>
                </Stack>
              )}

              <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="video/*,application/pdf,.doc,.docx,.ppt,.pptx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" />
              
              {!file ? (
                  <Box
                    onClick={() => !isSubmitting && fileInputRef.current?.click()}
                    sx={{
                      p: 5,
                      borderRadius: 2,
                      border: '1px dashed',
                      borderColor: 'divider',
                      bgcolor: 'background.neutral',
                      textAlign: 'center',
                      cursor: isSubmitting ? 'default' : 'pointer',
                      opacity: isSubmitting ? 0.6 : 1,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': { 
                        bgcolor: isSubmitting ? 'background.neutral' : (theme) => alpha(theme.palette.primary.main, 0.04), 
                        borderColor: isSubmitting ? 'divider' : 'primary.main',
                        transform: isSubmitting ? 'none' : 'translateY(-2px)',
                        boxShadow: (theme) => isSubmitting ? 'none' : theme.customShadows.z12
                      },
                    }}
                  >
                    <Box sx={{ 
                      width: 64, height: 64, 
                      bgcolor: 'background.paper', 
                      color: 'primary.main', 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto', mb: 2, 
                      fontSize: 32,
                      boxShadow: (theme) => theme.customShadows.z1
                    }}>
                      ☁️
                    </Box>
                    <Typography variant="h6" sx={{ color: 'text.primary', mb: 0.5 }}>Kéo thả Video, PDF, Word hoặc PowerPoint vào đây</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      hoặc <Box component="span" sx={{ color: 'primary.main', fontWeight: 'bold', textDecoration: 'underline' }}>Bấm vào đây</Box> để duyệt file
                    </Typography>
                    
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 3 }}>
                      <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'grey.800', color: 'common.white', borderRadius: 0.5, fontSize: 11, fontWeight: 'bold' }}>.mp4 (Max 2GB)</Box>
                      <Box sx={{ px: 1.5, py: 0.5, bgcolor: 'grey.800', color: 'common.white', borderRadius: 0.5, fontSize: 11, fontWeight: 'bold' }}>.pdf, .doc/x, .ppt/x (Max 50MB)</Box>
                    </Stack>
                  </Box>
                ) : (
                  <Stack 
                    direction="row" 
                    alignItems="center" 
                    spacing={2} 
                    sx={{ 
                      p: 2.5, 
                      border: '1px solid', 
                      borderColor: 'primary.main', 
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02), 
                      borderRadius: 2,
                      position: 'relative',
                      transition: 'all 0.3s',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                        boxShadow: (theme) => theme.customShadows.z8
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: 48, 
                        height: 48, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        bgcolor: 'background.paper',
                        borderRadius: 1.5,
                        fontSize: 24,
                        boxShadow: (theme) => theme.customShadows.z1
                      }}
                    >
                      {file.type.includes('video') ? '🎥' : '📄'}
                    </Box>
                    
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" noWrap sx={{ color: 'text.primary', mb: 0.5 }}>
                        {file.name}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ px: 0.8, py: 0.2, bgcolor: 'primary.lighter', color: 'primary.darker', borderRadius: 0.5, fontSize: 10, fontWeight: 'bold' }}>
                          {file.name.split('.').pop()?.toUpperCase()}
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Stack>
                    </Box>
                    
                    <IconButton 
                      size="small" 
                      onClick={() => setFile(null)} 
                      disabled={isSubmitting}
                      sx={{ 
                        bgcolor: 'background.neutral', 
                        '&:hover': { bgcolor: 'error.lighter', color: 'error.main' } 
                      }}
                    >
                      <Iconify icon="eva:close-fill" />
                    </IconButton>
                  </Stack>
                )}
              </Box>

            {/* Display Info Section */}
            <Box>
              <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 2 }}>
                Thông tin hiển thị
              </Typography>
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={8}>
                    <TextField 
                      fullWidth 
                      disabled={isSubmitting}
                      label="Tiêu đề học liệu *" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ví dụ: Video Bài giảng 1..."
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      select
                      label="Loại học liệu"
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      disabled={isSubmitting}
                      SelectProps={{ native: true }}
                    >
                      <option value="WORD">WORD</option>
                      <option value="VIDEO">VIDEO</option>
                      <option value="PDF">PDF</option>
                      <option value="SLIDE">SLIDE</option>
                      <option value="URL">URL</option>
                    </TextField>
                  </Grid>
                </Grid>

                {contentType === 'URL' && (
                  <TextField 
                    fullWidth 
                    disabled={isSubmitting}
                    label="Đường dẫn URL nguồn (Source URL) *" 
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="Ví dụ: https://www.youtube.com/watch?v=..."
                  />
                )}
                
                <TextField 
                  fullWidth 
                  disabled={isSubmitting}
                  multiline 
                  rows={3} 
                  label="Mô tả tóm tắt" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập tóm tắt nội dung để học sinh dễ nắm bắt..." 
                />
              </Stack>
            </Box>

            {/* Security and Custom Visibility Bounds */}
            <Box>
              <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 2 }}>
                Giới hạn hiển thị (Visibility Bounds)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    disabled={isSubmitting}
                    label="Hiển thị từ ngày (Visibility From)"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      inputProps: { max: visibilityTo || undefined },
                    }}
                    value={visibilityFrom}
                    onChange={(e) => setVisibilityFrom(e.target.value)}
                    sx={{
                      '& input::-webkit-calendar-picker-indicator': {
                        filter: (theme) => theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    disabled={isSubmitting}
                    label="Hiển thị đến ngày (Visibility To)"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      inputProps: { min: visibilityFrom || undefined },
                    }}
                    value={visibilityTo}
                    onChange={(e) => setVisibilityTo(e.target.value)}
                    sx={{
                      '& input::-webkit-calendar-picker-indicator': {
                        filter: (theme) => theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box>
              <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 2 }}>
                Bảo mật & Trải nghiệm
              </Typography>
              <Stack spacing={2} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: 'background.neutral' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2">Kích hoạt Dynamic Watermark</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>In mờ Tên và IP của người xem lên Video/PDF.</Typography>
                  </Box>
                  <Switch checked={isWatermark} onChange={(e) => setIsWatermark(e.target.checked)} disabled={isSubmitting} />
                </Stack>
                <Divider />
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="subtitle2">Cho phép Tải xuống (Download)</Typography>
                  </Box>
                  <Switch checked={isDownload} onChange={(e) => setIsDownload(e.target.checked)} disabled={isSubmitting} />
                </Stack>
                <Divider />
              </Stack>
            </Box>
          </Stack>
        </Scrollbar>
      )}

      <Divider />

      {isEdit ? (
        <Stack direction="row" spacing={2} sx={{ p: 3 }}>
          <Button fullWidth variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
          <Button 
            fullWidth 
            variant="contained" 
            color="success"
            disabled={isSubmitting || !title}
            onClick={() => handleSave('SAVE_EDIT')}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Lưu'}
          </Button>
        </Stack>
      ) : (
        <Stack direction="row" spacing={2} sx={{ p: 3 }}>
          <Button fullWidth variant="outlined" color="inherit" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
          <Button 
            fullWidth 
            variant="contained" 
            color="inherit" 
            disabled={isSubmitting || (!file && contentType !== 'URL') || !title}
            onClick={() => handleSave('Bản nháp (Draft)')}
            sx={{ bgcolor: 'grey.800', color: '#fff', '&:hover': { bgcolor: 'grey.900' } }}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Lưu Nháp'}
          </Button>
          <Button 
            fullWidth 
            variant="contained" 
            color="success"
            disabled={isSubmitting || (!file && contentType !== 'URL') || !title}
            onClick={() => handleSave('Đã xuất bản')}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Xuất bản ngay'}
          </Button>
        </Stack>
      )}
    </Drawer>
  );
}
