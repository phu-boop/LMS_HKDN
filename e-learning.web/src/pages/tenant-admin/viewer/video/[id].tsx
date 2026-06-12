import { useState, useEffect } from 'react';
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
import HlsPlayer from '@/components/video/HlsPlayer';
import ClientLayout from '@/layouts/client';
import useCollapseDrawer from '@/hooks/useCollapseDrawer';
import WatermarkOverlay from '@/components/WatermarkOverlay';
import ClientContentCommentList from '@/components/client/comments/ClientContentCommentList';

// ----------------------------------------------------------------------

import { useRouter } from 'next/router';
import NextLink from 'next/link';
// redux
import { useSelector } from '@/redux/store';
// api
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { ROOT_DOMAIN } from '@/config';



TenantAdminVideoViewer.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout variant="dashboard">{page}</Layout>;
};

export default function TenantAdminVideoViewer() {
  const router = useRouter();
  const { id, nodeId } = router.query;
  const { collapseClick, onToggleCollapse } = useCollapseDrawer();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  const [playlistOpen, setPlaylistOpen] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [videoData, setVideoData] = useState<any>(null);
  const [streamUrl, setStreamUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [playlistItems, setPlaylistItems] = useState<any[]>([]);
  const [progressTick, setProgressTick] = useState(0);

  const { user } = useSelector((state) => state.auth);
  const { activeNodeId, activeNodeTitle } = useSelector((state) => state.cmsContent);
  const actualNodeId = nodeId || activeNodeId;
  const domain = user?.subdomain ? `${user.subdomain}.${ROOT_DOMAIN}` : '';
  const currentPlaylistItem = playlistItems.find((item) => item.id === id);
  const canComment = currentPlaylistItem?.isCommentable !== false;

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Only call the stream-url API as requested
        const streamRes = await axios.get(API_ENDPOINTS.clientContentStreamUrl(id as string));
        
        const data = streamRes.data;
        // If the API returns metadata along with the URL, use it
        setVideoData(data);
        setStreamUrl(data?.url || data?.streamUrl || (typeof data === 'string' ? data : ''));
      } catch (err) {
        console.error('Failed to fetch video stream', err);
        setError('Không thể tải bài giảng này. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, domain]);

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

  const getSavedProgress = (item: any) => {
    if (!item) return { progress: 0, duration: '0:00', isSlide: false };
    const itemId = item.id;
    const isSlideType = item.type === 'SLIDE' || item.type === 'PDF' || item.type === 'DOCUMENT';

    const backendDuration = Number(item.duration || 0);

    if (typeof window === 'undefined') {
      const defaultDuration = backendDuration > 0 ? backendDuration : 0;
      return { progress: 0, duration: isSlideType ? `Slide 0/${defaultDuration}` : '0:00', isSlide: isSlideType };
    }

    try {
      const saved = localStorage.getItem(`video_progress_${itemId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const duration = backendDuration > 0 ? backendDuration : (parsed.duration || 100);
        if (duration > 0) {
          const percent = Math.round((parsed.currentTime / duration) * 100);
          if (isSlideType) {
            return {
              progress: Math.min(percent, 100),
              duration: `Slide ${parsed.currentTime}/${duration}`,
              isSlide: true
            };
          } else {
            const mins = Math.floor(duration / 60);
            const secs = Math.floor(duration % 60);
            const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            return {
              progress: Math.min(percent, 100),
              duration: durationStr,
              isSlide: false
            };
          }
        }
      }
    } catch (e) {}

    const defaultDuration = backendDuration > 0 ? backendDuration : 100;
    return {
      progress: 0,
      duration: isSlideType ? `Slide 0/${defaultDuration}` : '0:00',
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

  const handlePlayerError = (error: any) => {
    console.error('HLS Player Error:', error);
  };


  return (
    <Page title={currentPlaylistItem?.title || videoData?.title || 'Xem bài giảng video'}>
      <Container maxWidth={false} sx={{ pt: { xs: 0, md: 2 }, pb: 5, px: { xs: 0, md: 2 } }}>
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={1.5} 
          sx={{ width: 1, maxWidth: 1400, mx: 'auto', alignItems: { md: 'flex-start' } }}
        >
          {/* Main Video Section */}
          <Box sx={{ flexGrow: 1, minWidth: 0, width: { xs: '100%', md: 'calc(100% - 374px)' }, transition: 'width 0.3s' }}>
            {/* 1. Large Video Player */}
            <Card sx={{ 
              borderRadius: { xs: 0, md: 1 }, 
              bgcolor: 'common.black', 
              overflow: 'hidden', 
              mb: { xs: 2, md: 3 },
              border: 'none',
              boxShadow: (theme) => theme.customShadows.z1
            }}>
              <Box sx={{ position: 'relative', width: 1, aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WatermarkOverlay contentId={id as string} enabled={!!(currentPlaylistItem?.watermarkEnabled || videoData?.watermarkEnabled)} />
                {isLoading ? (
                  <Stack alignItems="center" sx={{ color: 'common.white' }}>
                    <CircularProgress color="primary" sx={{ mb: 2 }} />
                    <Typography>Đang chuẩn bị bài giảng...</Typography>
                  </Stack>
                ) : error ? (
                  <Stack alignItems="center" sx={{ color: 'common.white', p: 2, textAlign: 'center' }}>
                    <Iconify icon="eva:alert-triangle-fill" width={48} height={48} sx={{ color: 'error.main', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>Không thể tải bài giảng này</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>{error}</Typography>
                    <Button variant="contained" onClick={() => router.back()}>Quay lại</Button>
                  </Stack>
                ) : streamUrl ? (
                  <HlsPlayer 
                    src={streamUrl} 
                    videoId={id as string}
                    onStreamError={handlePlayerError} 
                    sx={{ width: 1, height: 1 }}
                  />
                ) : (
                  <Stack alignItems="center" justifyContent="center" sx={{ height: 1, color: 'common.white' }}>
                    <Typography>Không có luồng phát video</Typography>
                  </Stack>
                )}
              </Box>
            </Card>

            <Box sx={{ mb: 3, px: { xs: 1, md: 0 } }}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ mb: 1.5 }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {currentPlaylistItem?.title || videoData?.title || 'Bài giảng Video'}
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
                    startIcon={<Iconify icon="eva:heart-fill" />} 
                    variant="outlined" 
                    sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
                  >
                    Yêu thích
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<Iconify icon="eva:share-fill" />} 
                    variant="outlined" 
                    sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
                  >
                    Chia sẻ
                  </Button>
                  {(currentPlaylistItem?.isDownloadable === true || currentPlaylistItem?.isDownloadable === 'true' || videoData?.isDownloadable === true || videoData?.isDownloadable === 'true') && (
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
              {/* Description Box (YouTube style) */}
              <Box sx={{ bgcolor: 'background.neutral', borderRadius: 2, p: 2, mb: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Mô tả bài học</Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {currentPlaylistItem?.description || videoData?.description || 'Không có mô tả cho bài học này.'}
                </Typography>
              </Box>

              {/* Comments Section */}
              {id && (
                <Box sx={{ mt: 2 }}>
                  <ClientContentCommentList contentId={id as string} canComment={canComment} />
                </Box>
              )}
            </Box>
          </Box>

          {/* Desktop Right Column Playlist */}
          {isDesktop ? (
            <Collapse in={playlistOpen} orientation="horizontal" unmountOnExit>
              <Box sx={{ width: 350, flexShrink: 0, position: 'sticky', top: 88 }}>
                <Card sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {activeNodeTitle ? (
                        <>
                          Nội dung:{' '}
                          <NextLink href={`/tenant-admin/cms?nodeId=${actualNodeId}`} passHref legacyBehavior>
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
                            onClick={() => router.push(item.type === 'VIDEO' ? `/tenant-admin/viewer/video/${item.id}?nodeId=${actualNodeId}` : `/tenant-admin/viewer/document/${item.id}?nodeId=${actualNodeId}`)}
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
                                  {isSlide ? `${duration} đã xem` : `${duration} • ${progress}% đã xem`}
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
                        <NextLink href={`/tenant-admin/cms?nodeId=${actualNodeId}`} passHref legacyBehavior>
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
                          router.push(item.type === 'VIDEO' ? `/tenant-admin/viewer/video/${item.id}?nodeId=${actualNodeId}` : `/tenant-admin/viewer/document/${item.id}?nodeId=${actualNodeId}`);
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
                              {isSlide ? `${duration} đã xem` : `${duration} • ${progress}% đã xem`}
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
