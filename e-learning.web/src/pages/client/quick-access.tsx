import { ReactElement, useState, useEffect } from 'react';
import NextLink from 'next/link';
import { Box, Card, Button, Typography, Stack, LinearProgress } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Layout from '../../layouts';
import Page from '../../components/Page';
import ClientExperienceTemplate from '../../components/portal/ClientExperienceTemplate';
import Iconify from '@/components/Iconify';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

ClientQuickAccess.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="client" roles={['CLIENT', 'SCHOOL', 'TEACHER']}>{page}</Layout>;
};

interface QuickAccessItem {
  contentId: string;
  title: string;
  type: string;
  curriculumNodeId?: string;
  curriculumNodeTitle?: string;
  isFavorite?: boolean;
  progressValue?: number;
  totalValue?: number;
  favoritedAt?: string;
  group?: string;
  lastViewedAt?: string | null;
}

const TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  VIDEO: { color: '#ef4444', icon: 'eva:video-fill', label: 'Video' },
  PDF: { color: '#0ea5e9', icon: 'eva:file-text-fill', label: 'PDF' },
  DOCUMENT: { color: '#6366f1', icon: 'eva:file-fill', label: 'Tài liệu' },
  SLIDE: { color: '#8b5cf6', icon: 'eva:layers-fill', label: 'Slide' },
  URL: { color: '#10b981', icon: 'eva:globe-2-fill', label: 'URL' },
  ASSIGNMENT: { color: '#f97316', icon: 'eva:edit-2-fill', label: 'Bài tập' },
  QUIZ: { color: '#f43f5e', icon: 'eva:question-mark-circle-fill', label: 'Quiz' },
};

export default function ClientQuickAccess() {
  const [items, setItems] = useState<QuickAccessItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuickAccess = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.clientDashboardQuickAccess);
        const data = response.data?.items || response.data?.data || response.data || [];
        setItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuickAccess();
  }, []);

  return (
    <Page title="Client - Truy cập nhanh">
      <ClientExperienceTemplate
        title="Truy cập nhanh"
        subtitle="Những học liệu bạn mở thường xuyên nhất được ghim ở đây."
        primaryAction={{ label: 'Mở thư viện', href: '/client/library' }}
      >
        {loading ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Đang tải...</Typography>
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center', bgcolor: 'background.neutral', borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Chưa có nội dung truy cập nhanh nào.</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
            }}
          >
            {items.map((item) => {
              const cfg = TYPE_CONFIG[item.type] || { color: '#919eab', icon: 'eva:file-fill', label: item.type };
              return (
                <Card 
                  key={item.contentId} 
                  sx={{ 
                    p: 2.5, 
                    minWidth: 0, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: (theme) => theme.customShadows.z12,
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {item.isFavorite && (
                    <Box sx={{ position: 'absolute', top: 12, right: 12, color: 'error.main' }}>
                      <Iconify icon="eva:heart-fill" width={18} height={18} />
                    </Box>
                  )}

                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <Box
                        sx={{
                          p: 0.8,
                          borderRadius: 1,
                          bgcolor: (theme) => alpha(cfg.color, 0.1),
                          color: cfg.color,
                          display: 'flex'
                        }}
                      >
                        <Iconify icon={cfg.icon} width={18} height={18} />
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                        {cfg.label}
                      </Typography>
                    </Stack>

                    {item.curriculumNodeTitle && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }} noWrap>
                        Chương: {item.curriculumNodeTitle}
                      </Typography>
                    )}

                    <Typography variant="subtitle2" sx={{ mb: 2 }} noWrap>
                      {item.title}
                    </Typography>

                    {(item.type === 'VIDEO' || item.type === 'SLIDE' || item.type === 'PDF' || item.type === 'DOCUMENT') && (
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Tiến độ</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            {(() => {
                              const progress = item.progressValue !== undefined ? item.progressValue : ((item as any).ProgressValue !== undefined ? (item as any).ProgressValue : 0);
                              const total = item.totalValue !== undefined ? item.totalValue : ((item as any).TotalValue !== undefined ? (item as any).TotalValue : 0);
                              if (total > 0) {
                                return Math.min(Math.round((progress / total) * 100), 100);
                              }
                              return 0;
                            })()}%
                          </Typography>
                        </Stack>
                        <LinearProgress 
                          variant="determinate" 
                          value={(() => {
                            const progress = item.progressValue !== undefined ? item.progressValue : ((item as any).ProgressValue !== undefined ? (item as any).ProgressValue : 0);
                            const total = item.totalValue !== undefined ? item.totalValue : ((item as any).TotalValue !== undefined ? (item as any).TotalValue : 0);
                            if (total > 0) {
                              return Math.min(Math.round((progress / total) * 100), 100);
                            }
                            return 0;
                          })()} 
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                      </Stack>
                    )}
                  </Box>

                  <Button 
                    fullWidth
                    component={NextLink} 
                    href={item.type === 'VIDEO' 
                      ? `/client/viewer/video/${item.contentId}${item.curriculumNodeId ? `?nodeId=${item.curriculumNodeId}` : ''}` 
                      : `/client/viewer/document/${item.contentId}?type=${item.type}${item.curriculumNodeId ? `&nodeId=${item.curriculumNodeId}` : ''}`} 
                    variant="outlined"
                    size="small"
                  >
                    Tiếp tục học
                  </Button>
                </Card>
              );
            })}
          </Box>
        )}
      </ClientExperienceTemplate>
    </Page>
  );
}
