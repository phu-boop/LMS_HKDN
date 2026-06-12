import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Box,
  Card,
  Stack,
  Typography,
  Tabs,
  Tab,
  List,
  ListItemButton,
  Divider,
  IconButton,
  Chip,
  Avatar,
  Button,
  Rating,
  TextField,
  Paper,
  Tooltip,
  Container,
  Fab,
  LinearProgress,
  CircularProgress,
  Drawer,
  useMediaQuery,
  Collapse,
  Link
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Layout from '@/layouts';
import Page from '@/components/Page';
import Iconify from '@/components/Iconify';
import Scrollbar from '@/components/Scrollbar';
import ClientExperienceTemplate from '@/components/portal/ClientExperienceTemplate';
import dynamic from 'next/dynamic';
import WatermarkOverlay from '@/components/WatermarkOverlay';

const PdfLessonViewer = dynamic(() => import('@/components/document/PdfLessonViewer'), {
  ssr: false,
  loading: () => <CircularProgress />
});
import PptxSlideViewer from '@/components/document/PptxSlideViewer';
import ClientLayout from '@/layouts/client';
import useCollapseDrawer from '@/hooks/useCollapseDrawer';
import ClientContentCommentList from '@/components/client/comments/ClientContentCommentList';

// ----------------------------------------------------------------------

import { useRouter } from 'next/router';
import NextLink from 'next/link';
// redux
import { useSelector, useDispatch } from '@/redux/store';
import { getFavorites, addFavorite, removeFavorite } from '@/redux/slices/favorite';
// api
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { ROOT_DOMAIN } from '@/config';
import { getToken } from '@/utils/cacheStorage';

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



import { useSnackbar } from 'notistack';

ClientDocumentViewer.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout variant="client" roles={['CLIENT', 'SCHOOL', 'TEACHER']}>{page}</Layout>;
};

export default function ClientDocumentViewer() {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const { id, nodeId, type: queryType } = router.query;
  const { collapseClick, onToggleCollapse } = useCollapseDrawer();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  const [playlistOpen, setPlaylistOpen] = useState(true);
  const [currentTab, setCurrentTab] = useState('description');
  const [isLoading, setIsLoading] = useState(true);
  const [docData, setDocData] = useState<any>(null);
  const [viewUrl, setViewUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [playlistItems, setPlaylistItems] = useState<any[]>([]);
  const [progressTick, setProgressTick] = useState(0);
  const [initialProgressPage, setInitialProgressPage] = useState<number | undefined>(undefined);
  const currentProgressRef = useRef<{ page: number; totalPages: number }>({ page: 1, totalPages: 1 });

  const { user } = useSelector((state) => state.auth);
  const { activeNodeId, activeNodeTitle } = useSelector((state) => state.cmsContent);
  const actualNodeId = nodeId || activeNodeId;
  const domain = user?.subdomain ? `${user.subdomain}.${ROOT_DOMAIN}` : '';

  const dispatch = useDispatch();
  const { favorites } = useSelector((state) => state.favorite);

  const pdfFile = useMemo(() => {
    const url = `/api/viewer/pdf/${encodeURIComponent(id as string)}`;
    const token = getToken();
    if (!token) {
      return { url };
    }
    return {
      url,
      httpHeaders: { Authorization: `Bearer ${token}` },
    };
  }, [id]);

  useEffect(() => {
    dispatch(getFavorites());
  }, [dispatch]);

  const isFavorited = favorites.some((fav) => fav.contentId === id);

  const handleToggleFavorite = () => {
    if (!id) return;
    if (isFavorited) {
      dispatch(removeFavorite(id as string));
    } else {
      const currentPlaylistItem = playlistItems.find((item) => item.id === id);
      const contentPayload = {
        id: id as string,
        title: currentPlaylistItem?.title || docData?.title || 'Tài liệu học tập',
        description: currentPlaylistItem?.description || docData?.description || '',
        type: currentPlaylistItem?.type || docData?.type || queryType || 'PDF',
        fileSizeBytes: currentPlaylistItem?.fileSizeBytes || docData?.fileSizeBytes || 0
      };
      dispatch(addFavorite(id as string, contentPayload));
    }
  };

  const currentPlaylistItem = playlistItems.find((item) => item.id === id);
  const canComment = currentPlaylistItem?.isCommentable !== false;
  const currentType = queryType || currentPlaylistItem?.type || docData?.type;
  const backendTotalPages = Number(docData?.totalPages || docData?.totalFrames || currentPlaylistItem?.totalPages || currentPlaylistItem?.totalFrames || docData?.duration || currentPlaylistItem?.duration || 0);

  const urlPath = (viewUrl || '').toLowerCase().split('?')[0];
  const fileNameLower = (docData?.fileName || '').toLowerCase();

  // queryType / playlist item type takes priority so SLIDE is always detected correctly
  const isOfficeDoc =
    currentType === 'SLIDE' ||
    currentType === 'DOCUMENT' ||
    docData?.type === 'SLIDE' ||
    (docData?.type === 'DOCUMENT' && !urlPath.includes('.pdf')) ||
    urlPath.includes('.pptx') ||
    urlPath.includes('.ppt') ||
    urlPath.includes('.docx') ||
    urlPath.includes('.doc') ||
    urlPath.includes('.xlsx') ||
    urlPath.includes('.xls') ||
    fileNameLower.includes('.pptx') ||
    fileNameLower.includes('.ppt') ||
    fileNameLower.includes('.docx') ||
    fileNameLower.includes('.doc') ||
    fileNameLower.includes('.xlsx') ||
    fileNameLower.includes('.xls');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const matchedItem = playlistItems.find((item) => item.id === id);
        const resolvedType = queryType || matchedItem?.type;

        let viewRes;
        if (resolvedType === 'URL') {
          viewRes = await axios.get(API_ENDPOINTS.clientContentDirectUrl(id as string));
        } else {
          viewRes = await axios.get(API_ENDPOINTS.clientContentViewUrl(id as string));
        }

        let metadata = viewRes.data;
        const finalType = metadata?.type || resolvedType;

        if (finalType === 'URL' && !viewRes.config.url.includes('direct-url')) {
          const directRes = await axios.get(API_ENDPOINTS.clientContentDirectUrl(id as string));
          metadata = { ...metadata, ...directRes.data };
        }

        if (finalType !== 'URL' && user?.tenantId && id) {
          try {
            const statusRes = await axios.get(API_ENDPOINTS.tenantsContentProcessingStatus(user.tenantId, id as string));

            let dataObj = Array.isArray(statusRes.data) ? statusRes.data[0] : statusRes.data;

            if (dataObj?.result && typeof dataObj.result === 'string') {
              try { dataObj.result = JSON.parse(dataObj.result); } catch (e) { }
            }
            if (dataObj?.metadata && typeof dataObj.metadata === 'string') {
              try { dataObj.metadata = JSON.parse(dataObj.metadata); } catch (e) { }
            }

            const frames = dataObj?.totalFrames
              || dataObj?.data?.totalFrames
              || dataObj?.result?.totalFrames
              || dataObj?.metadata?.totalFrames
              || dataObj?.pageCount
              || dataObj?.data?.pageCount
              || dataObj?.result?.pageCount
              || dataObj?.metadata?.pageCount
              || dataObj?.totalPages
              || dataObj?.data?.totalPages
              || dataObj?.result?.totalPages
              || dataObj?.metadata?.totalPages
              || dataObj?.duration
              || dataObj?.data?.duration
              || dataObj?.result?.duration
              || dataObj?.metadata?.duration
              || dataObj?.totalSlides
              || dataObj?.data?.totalSlides
              || dataObj?.result?.totalSlides
              || dataObj?.slideCount
              || dataObj?.data?.slideCount
              || dataObj?.result?.slideCount
              || dataObj?.totalSlide
              || dataObj?.data?.totalSlide
              || dataObj?.result?.totalSlide;

            if (frames) {
              metadata = { ...metadata, totalFrames: Number(frames) };
              setPlaylistItems(prev => {
                const current = prev.find(p => p.id === id);
                if (current && current.totalFrames === Number(frames)) return prev;
                return prev.map(p => p.id === id ? { ...p, totalFrames: Number(frames) } : p);
              });
            }
          } catch (e: any) {
            console.error('Failed to fetch processing status', e);
          }
        }
        setDocData(metadata);

        // Unconditionally update playlistItems with whatever duration/totalFrames we found in metadata
        const finalFrames = metadata?.totalFrames || metadata?.totalPages || metadata?.duration;
        if (finalFrames) {
          setPlaylistItems(prev => {
            const current = prev.find(p => p.id === id);
            if (current && current.totalFrames === Number(finalFrames)) return prev;
            return prev.map(p => p.id === id ? { ...p, totalFrames: Number(finalFrames) } : p);
          });
        }

        setViewUrl(metadata?.url || metadata?.viewUrl || (typeof metadata === 'string' ? metadata : ''));
      } catch (err) {
        console.error('Failed to fetch document', err);
        setError('Không thể tải tài liệu này. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, domain, playlistItems, queryType]);

  useEffect(() => {
    if (!actualNodeId) return;
    const fetchPlaylist = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.clientCurriculumContents(actualNodeId as string));
        setPlaylistItems(res.data.items || res.data);
      } catch (err) {
        console.error('Failed to fetch playlist', err);
      }
    };
    fetchPlaylist();
  }, [actualNodeId]);

  useEffect(() => {
    setPlaylistOpen(isDesktop);
  }, [isDesktop]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressTick(t => t + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOfficeDoc && id) {
      setInitialProgressPage(1);
      currentProgressRef.current = { page: 1, totalPages: 1 };
      try {
        localStorage.setItem(`video_progress_${id}`, JSON.stringify({
          currentTime: 1,
          duration: 1,
          lastUpdated: Date.now()
        }));
        axios.put(API_ENDPOINTS.clientContentProgress(id as string), {
          progressValue: 1,
          totalValue: 1
        }).catch(() => { });
      } catch (e) { }
    }
  }, [isOfficeDoc, id]);

  useEffect(() => {
    if (!id || currentType === 'URL') return undefined;

    setInitialProgressPage(undefined);
    currentProgressRef.current = { page: 1, totalPages: 1 };

    const fetchProgress = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.clientContentProgress(id as string));
        const data = res.data;
        const savedPage = data?.progressValue !== undefined ? data?.progressValue : data?.ProgressValue;
        const totalValue = data?.totalValue !== undefined ? data?.totalValue : data?.TotalValue;
        if (savedPage && savedPage > 0) {
          // If it's already detected as an Office doc, don't restore old progress > 1
          if (isOfficeDoc && savedPage > 1) {
            setInitialProgressPage(1);
            currentProgressRef.current = { page: 1, totalPages: 1 };
            return;
          }

          setInitialProgressPage(Number(savedPage));

          let total = totalValue || 1;
          if (!totalValue) {
            try {
              const localSaved = localStorage.getItem(`video_progress_${id}`);
              if (localSaved) {
                const parsed = JSON.parse(localSaved);
                if (parsed.duration > 0) {
                  total = parsed.duration;
                }
              }
            } catch (e) { }
          }

          currentProgressRef.current = { page: Number(savedPage), totalPages: Number(total) };
          localStorage.setItem(`video_progress_${id}`, JSON.stringify({
            currentTime: Number(savedPage),
            duration: Number(total),
            lastUpdated: Date.now()
          }));
        }
      } catch (err) {
        console.error('Failed to fetch progress from server', err);
      }
    };

    fetchProgress();

    return () => {
      // Do not save progress for PowerPoint/Office documents since we always start at slide 1
      if (isOfficeDoc || currentType === 'URL') return;
      const { page, totalPages } = currentProgressRef.current;
      if (page > 1) {
        axios.put(API_ENDPOINTS.clientContentProgress(id as string), {
          progressValue: page,
          totalValue: totalPages
        }).catch(err => {
          console.error('Failed to save progress to server', err);
        });
      }
    };
  }, [id, isOfficeDoc, currentType]);

  const handlePageChange = useCallback((page: number, totalPages: number) => {
    currentProgressRef.current = { page, totalPages };
    try {
      localStorage.setItem(`video_progress_${id}`, JSON.stringify({
        currentTime: page,
        duration: totalPages,
        lastUpdated: Date.now()
      }));
      if (id && page > 0) {
        axios.put(API_ENDPOINTS.clientContentProgress(id as string), {
          progressValue: page,
          totalValue: totalPages
        }).catch(err => {
          console.error('Failed to save progress to server', err);
        });
      }
    } catch (e) {
      // ignore
    }
  }, [id]);

  const getSavedProgress = (item: any) => {
    if (!item) return { progress: 0, duration: '0:00', isSlide: false };
    const itemId = item.id;
    const isSlideType = item.type === 'SLIDE' || item.type === 'PDF' || item.type === 'DOCUMENT';

    // Parse progress from API item
    const progressVal = item.progressValue !== undefined ? item.progressValue : ((item as any).ProgressValue !== undefined ? (item as any).ProgressValue : 0);
    const totalVal = item.totalValue !== undefined ? item.totalValue : ((item as any).TotalValue !== undefined ? (item as any).TotalValue : 0);

    let progress = progressVal;
    let total = totalVal;

    // Fallback to backend total values if totalVal is 0
    if (total === 0) {
      total = Number(item.totalFrames || item.totalPages || item.duration || 0);
    }

    const isCurrentItem = itemId === id;
    if (isCurrentItem) {
      try {
        const saved = localStorage.getItem(`video_progress_${itemId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.currentTime !== undefined) {
            progress = parsed.currentTime;
          }
          if (parsed.duration !== undefined && parsed.duration > 0) {
            total = parsed.duration;
          }
        }
      } catch (e) { }
    }

    let percent = 0;
    if (total > 0) {
      percent = Math.min(Math.round((progress / total) * 100), 100);
    }

    let durationStr = '0:00';
    if (isSlideType) {
      durationStr = `Slide ${progress}/${total > 0 ? total : 1}`;
    } else if (total > 0) {
      const mins = Math.floor(total / 60);
      const secs = Math.floor(total % 60);
      durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    return {
      progress: percent,
      duration: durationStr,
      isSlide: isSlideType
    };
  };

  const getIconForType = (type: string) => {
    if (type === 'VIDEO') return 'eva:video-fill';
    if (type === 'PDF') return 'eva:file-text-fill';
    if (type === 'SLIDE') return 'eva:layers-fill';
    if (type === 'URL') return 'eva:globe-2-fill';
    if (type === 'ASSIGNMENT') return 'eva:edit-2-fill';
    if (type === 'QUIZ') return 'eva:question-mark-circle-fill';
    return 'eva:file-fill';
  };

  useEffect(() => {
    if (!collapseClick) {
      onToggleCollapse();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Page title={currentPlaylistItem?.title || docData?.title || 'Xem tài liệu'}>
      <Container maxWidth={false} sx={{ pt: { xs: 0, md: 2 }, pb: 5, px: { xs: 0, md: 2 }, pr: { md: isDesktop && playlistOpen ? '366px' : undefined }, transition: 'padding 0.3s' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ width: 1, maxWidth: 1400, mx: 'auto', alignItems: { md: 'flex-start' } }}
        >
          {/* Main Video Section */}
          <Box sx={{ flexGrow: 1, minWidth: 0, width: { xs: '100%', md: 'calc(100% - 374px)' }, transition: 'width 0.3s' }}>
            {/* 1. Large Video Player */}
            <Card sx={{
              borderRadius: isOfficeDoc ? 0 : { xs: 0, md: 1 },
              bgcolor: 'common.black',
              overflow: 'hidden',
              mb: { xs: 2, md: 3 },
              border: 'none',
              boxShadow: (theme) => theme.customShadows.z1
            }}>
              <Box sx={{ position: 'relative', width: 1, minHeight: { xs: 320, sm: 400, md: 600 }, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WatermarkOverlay contentId={id as string} enabled={!!(currentPlaylistItem?.watermarkEnabled || docData?.watermarkEnabled)} />
                {isLoading ? (
                  <Stack alignItems="center" sx={{ color: 'common.white' }}>
                    <CircularProgress color="primary" sx={{ mb: 2 }} />
                    <Typography>Đang chuẩn bị tài liệu...</Typography>
                  </Stack>
                ) : error ? (
                  <Stack alignItems="center" sx={{ color: 'common.white', p: 2, textAlign: 'center' }}>
                    <Iconify icon="eva:alert-triangle-fill" width={48} height={48} sx={{ color: 'error.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>Không thể tải tài liệu này</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>{error}</Typography>
                    <Button variant="contained" onClick={() => router.back()}>Quay lại</Button>
                  </Stack>
                ) : viewUrl ? (
                  currentType === 'URL' ? (
                    <iframe
                      src={getEmbedUrl(viewUrl)}
                      title={currentPlaylistItem?.title || docData?.title || 'Tài liệu'}
                      width="100%"
                      height="100%"
                      style={{ border: 'none', backgroundColor: '#000', position: 'absolute', top: 0, left: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : isOfficeDoc ? (
                    <PptxSlideViewer
                      fileUrl={viewUrl}
                      contentId={id as string}
                      initialPage={initialProgressPage}
                      totalPages={backendTotalPages > 0 ? backendTotalPages : undefined}
                      onPageChange={handlePageChange}
                    />
                  ) : (
                    <PdfLessonViewer
                      file={pdfFile}
                      initialPage={initialProgressPage}
                      onPageChange={handlePageChange}
                    />
                  )
                ) : (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: 1, color: 'common.white' }}>
                    <Typography>Không có tài liệu để hiển thị</Typography>
                  </Stack>
                )}
              </Box>
            </Card>

            <Box sx={{ mb: 3, px: { xs: 1, md: 0 } }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ mb: 1.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {currentPlaylistItem?.title || docData?.title || 'Tài liệu học tập'}
                </Typography>
                {!isDesktop && playlistItems.length > 0 && (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={() => setPlaylistOpen(true)}
                    startIcon={<Iconify icon="eva:menu-fill" />}
                    sx={{
                      flexShrink: 0
                    }}
                  >
                    Mục Lục
                  </Button>
                )}
              </Stack>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={1.5}
              >
                {/* Author info */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 16 }}>AD</Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Giảng viên</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>Hệ thống học tập</Typography>
                  </Box>
                </Stack>

                {/* Action buttons */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button
                    size="small"
                    startIcon={<Iconify icon={isFavorited ? "eva:heart-fill" : "eva:heart-outline"} sx={{ color: isFavorited ? 'error.main' : 'inherit' }} />}
                    variant={isFavorited ? "contained" : "outlined"}
                    onClick={handleToggleFavorite}
                    sx={{
                      whiteSpace: 'nowrap',
                      ...(isFavorited && {
                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                        color: 'error.main',
                        '&:hover': {
                          bgcolor: (theme) => alpha(theme.palette.error.main, 0.2),
                        }
                      })
                    }}
                  >
                    {isFavorited ? 'Đã thích' : 'Yêu thích'}
                  </Button>
                  {/* Hide Share Button */}
                  {(currentPlaylistItem?.isDownloadable === true || currentPlaylistItem?.isDownloadable === 'true' || docData?.isDownloadable === true || docData?.isDownloadable === 'true') && (
                    <Button
                      size="small"
                      startIcon={<Iconify icon="eva:download-fill" />}
                      variant="outlined"
                      onClick={async () => {
                        if (!id) return;
                        try {
                          const res = await axios.get(API_ENDPOINTS.clientContentDownloadUrl(id as string));
                          const downloadUrl = res.data?.url || res.data?.downloadUrl || res.data?.data || (typeof res.data === 'string' ? res.data : '');
                          if (downloadUrl) {
                            const a = document.createElement('a');
                            a.href = downloadUrl;
                            a.download = '';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          } else {
                            alert('Không tìm thấy liên kết tải về.');
                          }
                        } catch (err) {
                          console.error('Failed to fetch download url', err);
                          alert('Không thể tải tệp tin này về. Vui lòng thử lại sau.');
                        }
                      }}
                      sx={{ color: 'primary.main', borderColor: 'primary.main', whiteSpace: 'nowrap' }}
                    >
                      Tải về
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>

            <Box sx={{ px: { xs: 1, md: 0 }, mt: 3 }}>
              {/* Mô tả bài học (YouTube Style) */}
              <Box sx={{ bgcolor: 'background.neutral', borderRadius: 2, p: 2, mb: 4 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Iconify icon="eva:info-fill" width={18} height={18} sx={{ color: 'text.secondary' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Mô tả bài học</Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {currentPlaylistItem?.description || docData?.description || 'Không có mô tả cho bài học này.'}
                </Typography>
              </Box>

              {/* Bình luận */}
              {id && (
                <Box>
                  <ClientContentCommentList contentId={id as string} canComment={canComment} disableActionsWhenNoComment />
                </Box>
              )}
            </Box>
          </Box>

          {/* Desktop Right Column Playlist – fixed so it stays while scrolling */}
          {isDesktop ? (
            <Collapse in={playlistOpen} orientation="horizontal" unmountOnExit>
              <Box sx={{ width: 350, flexShrink: 0, position: 'fixed', top: 80, right: 0, zIndex: 1100, height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: 0 }}>
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        {activeNodeTitle ? (
                          <>
                            Nội dung:{' '}
                            <NextLink href={`/client/library?nodeId=${actualNodeId}`} passHref legacyBehavior>
                              <Link underline="always" color="primary">{activeNodeTitle}</Link>
                            </NextLink>
                          </>
                        ) : (
                          'Nội dung bài học'
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">{playlistItems.length} bài học</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setPlaylistOpen(false)}>
                      <Iconify icon="eva:close-fill" />
                    </IconButton>
                  </Box>
                  <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
                    <Scrollbar sx={{ height: 1 }}>
                      <List disablePadding sx={{ pb: 2 }}>
                        {playlistItems.map((item, index) => {
                          const isActive = item.id === id;
                          const { progress, duration, isSlide } = getSavedProgress(item);
                          return (
                            <ListItemButton
                              key={item.id}
                              selected={isActive}
                              onClick={() => router.push(item.type === 'VIDEO' ? `/client/viewer/video/${item.id}?nodeId=${actualNodeId}` : `/client/viewer/document/${item.id}?nodeId=${actualNodeId}&type=${item.type}`)}
                              sx={{
                                p: 2,
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <Stack direction="row" spacing={2} alignItems="center" sx={{ width: 1 }}>
                                <Iconify
                                  icon={getIconForType(item.type)}
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    flexShrink: 0,
                                    color: isActive ? 'primary.main' : 'text.secondary',
                                  }}
                                />
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle2" noWrap sx={{ color: isActive ? 'primary.main' : 'text.primary' }}>
                                    {item.title}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                                    {item.type === 'URL' ? 'Liên kết' : isSlide ? `${duration} đã xem` : `${duration} • ${progress}% đã xem`}
                                  </Typography>
                                  {(item.type === 'VIDEO' || item.type === 'SLIDE' || item.type === 'PDF' || item.type === 'DOCUMENT') && (
                                    <LinearProgress
                                      variant="determinate"
                                      value={progress}
                                      sx={{ mt: 1, height: 4, borderRadius: 2 }}
                                    />
                                  )}
                                </Box>
                              </Stack>
                            </ListItemButton>
                          );
                        })}
                      </List>
                    </Scrollbar>
                  </Box>
                </Card>
              </Box>
            </Collapse>
          ) : (
            <Drawer
              anchor="right"
              open={playlistOpen}
              onClose={() => setPlaylistOpen(false)}
              PaperProps={{ sx: { width: { xs: 300, sm: 360 } } }}
            >
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.default' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {activeNodeTitle ? (
                      <>
                        Nội dung:{' '}
                        <NextLink href={`/client/library?nodeId=${actualNodeId}`} passHref legacyBehavior>
                          <Link underline="always" color="primary">{activeNodeTitle}</Link>
                        </NextLink>
                      </>
                    ) : (
                      'Nội dung bài học'
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">{playlistItems.length} bài học</Typography>
                </Box>
                <IconButton onClick={() => setPlaylistOpen(false)}>
                  <Iconify icon="eva:close-fill" />
                </IconButton>
              </Box>
              <Scrollbar>
                <List disablePadding>
                  {playlistItems.map((item, index) => {
                    const isActive = item.id === id;
                    const { progress, duration, isSlide } = getSavedProgress(item);
                    return (
                      <ListItemButton
                        key={item.id}
                        selected={isActive}
                        onClick={() => {
                          router.push(item.type === 'VIDEO' ? `/client/viewer/video/${item.id}?nodeId=${actualNodeId}` : `/client/viewer/document/${item.id}?nodeId=${actualNodeId}&type=${item.type}`);
                          setPlaylistOpen(false); // Close on mobile after selection
                        }}
                        sx={{
                          py: 2,
                          px: 2,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: 1 }}>
                          <Iconify
                            icon={getIconForType(item.type)}
                            sx={{
                              width: 24,
                              height: 24,
                              flexShrink: 0,
                              color: isActive ? 'primary.main' : 'text.secondary',
                            }}
                          />
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap sx={{ color: isActive ? 'primary.main' : 'text.primary' }}>
                              {item.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                              {item.type === 'URL' ? 'Liên kết' : isSlide ? `${duration} đã xem` : `${duration} • ${progress}% đã xem`}
                            </Typography>
                            {(item.type === 'VIDEO' || item.type === 'SLIDE' || item.type === 'PDF' || item.type === 'DOCUMENT') && (
                              <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{ mt: 1, height: 4, borderRadius: 2 }}
                              />
                            )}
                          </Box>
                        </Stack>
                      </ListItemButton>
                    );
                  })}
                </List>
              </Scrollbar>
            </Drawer>
          )}

          {isDesktop && !playlistOpen && playlistItems.length > 0 && (
            <Tooltip title="Mở danh sách bài học">
              <Fab
                color="primary"
                onClick={() => setPlaylistOpen(true)}
                sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 100 }}
              >
                <Iconify icon="eva:menu-2-fill" />
              </Fab>
            </Tooltip>
          )}
        </Stack>
      </Container>
    </Page>
  );
}
