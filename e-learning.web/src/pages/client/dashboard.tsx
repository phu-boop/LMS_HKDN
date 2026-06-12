import { ReactElement, useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Box, Card, Button, Typography, Stack, alpha, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import Layout from '@/layouts';
import Iconify from '@/components/Iconify';
import Page from '../../components/Page';
import ClientExperienceTemplate from '../../components/portal/ClientExperienceTemplate';
import { useDispatch, useSelector } from '@/redux/store';
import { getClientDashboard, getRecentContents } from '@/redux/slices/clientDashboard';

ClientDashboard.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="client" roles={['CLIENT', 'SCHOOL', 'TEACHER']}>{page}</Layout>;
};

export default function ClientDashboard() {
  const dispatch = useDispatch();
  const { data, recentContents, isLoading } = useSelector((state) => state.clientDashboard);

  useEffect(() => {
    dispatch(getClientDashboard());
    dispatch(getRecentContents());
  }, [dispatch]);

  const formatRecentTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return 'Chưa học';
    try {
      const date = new Date(timeStr);
      return date.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Vừa xong';
    }
  };

  const formatRelativeTime = (dateStr?: string) => {
    if (!dateStr) return 'Không có thời gian';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} ngày trước`;

    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const [openDialog, setOpenDialog] = useState<'viewed' | 'favoriteAdded' | 'favorite' | null>(null);

  const viewedItems = data?.viewedThisWeekDetails || [];
  const favoriteAddedItems = data?.favoriteAddedThisWeekDetails || [];
  const favoriteItems = data?.favoriteDetails || [];

  const metrics = [
    {
      label: 'Đã học tuần này',
      value: data?.viewedThisWeekCount?.toString() || '0',
      onClick: () => setOpenDialog('viewed'),
    },
    {
      label: 'Yêu thích mới tuần này',
      value: data?.favoriteAddedThisWeekCount?.toString() || '0',
      onClick: () => setOpenDialog('favoriteAdded'),
    },
    {
      label: 'Bài học yêu thích',
      value: data?.favoriteCount?.toString() || '0',
      onClick: () => setOpenDialog('favorite'),
    },
    { label: 'Hoạt động gần nhất', value: formatRecentTime(data?.lastLearningAt) },
  ];

  const handleCloseDialog = () => setOpenDialog(null);

  const dialogConfig = openDialog
    ? {
        viewed: {
          title: 'Đã học tuần này',
          items: viewedItems,
          emptyText: 'Bạn chưa xem nội dung nào trong tuần này.',
        },
        favoriteAdded: {
          title: 'Yêu thích mới tuần này',
          items: favoriteAddedItems,
          emptyText: 'Không có nội dung yêu thích mới trong tuần này.',
        },
        favorite: {
          title: 'Bài học yêu thích',
          items: favoriteItems,
          emptyText: 'Bạn chưa lưu bài học nào vào yêu thích.',
        },
      }[openDialog]
    : null;


  return (
    <Page title="Client Dashboard">
      <ClientExperienceTemplate
        title="Xin chào, bắt đầu buổi học thôi"
        subtitle="Truy cập nhanh bài giảng, tài liệu và lịch sử học tập của bạn."
        primaryAction={{ label: 'Mở thư viện', href: '/client/library' }}
        secondaryAction={{ label: 'Xem lịch sử', href: '/client/history' }}
        metrics={metrics}
      >
        <Dialog open={Boolean(openDialog)} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              pr: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {dialogConfig?.title}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <Iconify icon="eva:close-fill" width={18} height={18} />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ p: 2 }}>
            {dialogConfig?.items.length ? (
              <Stack spacing={2}>
                {dialogConfig.items.map((item) => {
                  const href = item.type === 'VIDEO' || item.type === 'stream'
                    ? `/client/viewer/video/${item.contentId}`
                    : `/client/viewer/document/${item.contentId}`;

                  return (
                    <Card
                      key={item.contentId}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {formatRelativeTime(item.lastViewedAt || item.favoritedAt)}
                          </Typography>
                        </Box>
                        <Button
                          component={NextLink}
                          href={href}
                          size="small"
                          variant="outlined"
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          Xem
                        </Button>
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Không có dữ liệu để hiển thị.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {dialogConfig?.emptyText}
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: '800', color: 'text.primary', letterSpacing: -0.5 }}>
            Bài học vừa xem gần đây
          </Typography>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
          }}
        >
          {recentContents.length === 0 ? (
             <Box sx={{ gridColumn: '1 / -1', py: 5, textAlign: 'center', bgcolor: 'background.neutral', borderRadius: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Bạn chưa xem bài học nào gần đây.</Typography>
             </Box>
          ) : (
            recentContents.map((item: any) => {
              const contentId = item.contentId || item.id;
              const title = item.title || item.curriculumNodeTitle || 'Bài học';
              const dateStr = item.lastViewedAt ? new Date(item.lastViewedAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');
              return (
                <Card
                  key={contentId}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: (theme) => theme.customShadows.z12 }
                  }}
                >
                  <Stack spacing={1.5}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'primary.lighter',
                        color: 'primary.main'
                      }}
                    >
                      <Iconify icon={item.type === 'VIDEO' ? 'eva:video-fill' : 'eva:file-text-fill'} width={24} height={24} />
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" noWrap sx={{ mb: 0.5 }}>{title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {item.type} • {dateStr}
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      component={NextLink}
                      href={item.type === 'VIDEO'
                        ? `/client/viewer/video/${contentId}${item.curriculumNodeId ? `?nodeId=${item.curriculumNodeId}` : ''}`
                        : `/client/viewer/document/${contentId}?type=${item.type}${item.curriculumNodeId ? `&nodeId=${item.curriculumNodeId}` : ''}`}
                    >
                      Xem tiếp
                    </Button>
                  </Stack>
                </Card>
              );
            })
          )}
        </Box>

        <Box sx={{ mt: 5 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
            <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: '800', color: 'text.primary', letterSpacing: -0.5 }}>
              Lối tắt học tập
            </Typography>
          </Stack>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
            }}
          >
            <ShortcutCard
              title="Thư viện học liệu"
              description="Khám phá toàn bộ kho bài giảng, PDF và tài liệu."
              icon="eva:book-open-fill"
              href="/client/library"
              color="#2563eb"
            />
            {/* <ShortcutCard
              title="Lịch sử học tập"
              description="Xem lại các nội dung bạn đã học và tiến độ."
              icon="eva:clock-fill"
              href="/client/history"
              color="#9333ea"
            /> */}
             <ShortcutCard
              title="Truy cập nhanh"
              description="Truy cập nhanh các bài học bạn đã lưu."
              icon="eva:flash-fill"
              href="/client/quick-access"
              color="#f59e0b"
            />
          </Box>
        </Box>
      </ClientExperienceTemplate>
    </Page>
  );
}

function ShortcutCard({ title, description, icon, href, color }: any) {
  return (
    <Card
      component={NextLink}
      href={href}
      sx={{
        p: 3,
        textDecoration: 'none',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: (theme) => theme.customShadows.z16,
          borderColor: color
        }
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: alpha(color, 0.1), color: color, display: 'flex' }}>
          <Iconify icon={icon} width={28} height={28} />
        </Box>
        <Box>
          <Typography variant="subtitle1">{title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{description}</Typography>
        </Box>
      </Stack>
    </Card>
  );
}
