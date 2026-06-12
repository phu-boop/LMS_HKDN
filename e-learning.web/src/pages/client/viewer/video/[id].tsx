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
import ProtectContentWrapper from '@/components/document/ProtectContentWrapper';

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



ClientVideoViewer.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout variant="client" roles={['CLIENT', 'SCHOOL', 'TEACHER']}>{page}</Layout>;
};

export default function ClientVideoViewer() {
  const router = useRouter();
  const { id, nodeId } = router.query;
  const { collapseClick, onToggleCollapse } = useCollapseDrawer();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  const [playlistOpen, setPlaylistOpen] = useState(true);
  const [currentTab, setCurrentTab] = useState('description');
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

  const dispatch = useDispatch();
  const { favorites } = useSelector((state) => state.favorite);

  useEffect(() => {
    dispatch(getFavorites());
  }, [dispatch]);

  const isFavorited = favorites.some((fav) => fav.contentId === id);
  const currentPlaylistItem = playlistItems.find((item) => item.id === id);
  const canComment = currentPlaylistItem?.isCommentable !== false;

  const handleToggleFavorite = () => {
    if (!id) return;
    if (isFavorited) {
      dispatch(removeFavorite(id as string));
    } else {
      const contentPayload = {
        id: id as string,
        title: currentPlaylistItem?.title || videoData?.title || 'Bài giảng Video',
        description: currentPlaylistItem?.description || videoData?.description || '',
        type: currentPlaylistItem?.type || videoData?.type || 'VIDEO',
        fileSizeBytes: currentPlaylistItem?.fileSizeBytes || videoData?.fileSizeBytes || 0
      };
      dispatch(addFavorite(id as string, contentPayload));
    }
  };

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

  useEffect(() => {
    if (!id) return undefined;

    const fetchProgress = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.clientContentProgress(id as string));
        const data = res.data;
        const savedTime = data?.progressValue !== undefined ? data?.progressValue : data?.ProgressValue;
        const totalValue = data?.totalValue !== undefined ? data?.totalValue : data?.TotalValue;
        if (savedTime && savedTime > 0) {
          let duration = totalValue || 0;
          if (duration === 0) {
            try {
              const localSaved = localStorage.getItem(`video_progress_${id}`);
              if (localSaved) {
                const parsed = JSON.parse(localSaved);
                if (parsed.duration > 0) {
                  duration = parsed.duration;
                }
              }
            } catch (e) { }
          }

          localStorage.setItem(`video_progress_${id}`, JSON.stringify({
            currentTime: Number(savedTime),
            duration: Number(duration),
            lastUpdated: Date.now()
          }));
        }
      } catch (err) {
        console.error('Failed to fetch video progress from server', err);
      }
    };

    fetchProgress();

    return () => {
      try {
        const saved = localStorage.getItem(`video_progress_${id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.currentTime && parsed.currentTime > 0) {
            axios.put(API_ENDPOINTS.clientContentProgress(id as string), {
              progressValue: Math.round(parsed.currentTime),
              totalValue: Math.round(parsed.duration || 0)
            }).catch(err => {
              console.error('Failed to save video progress on unmount', err);
            });
          }
        }
      } catch (e) {
        console.error('Failed to parse video progress on unmount', e);
      }
    };
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
    if (isCurrentItem && typeof window !== 'undefined') {
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

  const handlePlayerError = (error: any) => {
    console.error('HLS Player Error:', error);
  };

  return (
    <ProtectContentWrapper>
      <Page title={currentPlaylistItem?.title || videoData?.title || 'Xem bài giảng video'}>
      <Container maxWidth={false} sx={{ pt: { xs: 0, md: 2 }, pb: 5, px: { xs: 0, md: 2 }, pr: { md: isDesktop && playlistOpen ? '366px' : undefined }, transition: 'padding 0.3s' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ width: 1, maxWidth: 1400, mx: 'auto', alignItems: { md: 'flex-start' } }}
        >
          {/* Main Video Section */}
          <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%', transition: 'width 0.3s' }}>
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
              {/* Mô tả bài học (YouTube Style) */}
              <Box sx={{ bgcolor: 'background.neutral', borderRadius: 2, p: 2, mb: 4 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Iconify icon="eva:info-fill" width={18} height={18} sx={{ color: 'text.secondary' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Mô tả bài học</Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {currentPlaylistItem?.description || videoData?.description || 'Không có mô tả cho bài học này.'}
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
    </ProtectContentWrapper>
  );
}
