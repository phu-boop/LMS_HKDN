import NextLink from 'next/link';
// @mui
import { alpha } from '@mui/material/styles';
import { Box, Card, Typography, Stack, Button, CircularProgress } from '@mui/material';
// redux
import { useSelector } from '@/redux/store';
// components
import Iconify from '@/components/Iconify';
import Scrollbar from '@/components/Scrollbar';

// ----------------------------------------------------------------------

const TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  VIDEO: { color: '#ef4444', icon: 'eva:video-fill', label: 'Video' },
  PDF: { color: '#0ea5e9', icon: 'eva:file-text-fill', label: 'PDF' },
  DOCUMENT: { color: '#6366f1', icon: 'eva:file-fill', label: 'Tài liệu' },
  SLIDE: { color: '#8b5cf6', icon: 'eva:layers-fill', label: 'Slide' },
  URL: { color: '#10b981', icon: 'eva:globe-2-fill', label: 'URL' },
  ASSIGNMENT: { color: '#f97316', icon: 'eva:edit-2-fill', label: 'Bài tập' },
  QUIZ: { color: '#f43f5e', icon: 'eva:question-mark-circle-fill', label: 'Quiz' },
};

export default function ClientLibraryContentList() {
  const { items, activeNodeTitle, activeNodeId, isLoading } = useSelector((state) => state.cmsContent);

  if (isLoading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, bgcolor: 'background.neutral', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2">
          Danh sách học liệu: <Box component="span" sx={{ color: 'primary.main' }}>{activeNodeTitle || 'Vui lòng chọn thư mục'}</Box>
        </Typography>
      </Box>

      <Scrollbar sx={{ flexGrow: 1 }}>
        <Box sx={{ p: 2 }}>
          {items.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 10, textAlign: 'center' }}>
               <Iconify icon="eva:folder-open-outline" width={48} height={48} sx={{ color: 'text.disabled', mb: 2 }} />
               <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                 {activeNodeTitle ? 'Thư mục này chưa có học liệu' : 'Chọn một thư mục bên trái để xem nội dung'}
               </Typography>
            </Stack>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                },
              }}
            >
              {items.map((item) => {
                const cfg = TYPE_CONFIG[item.type] || { color: '#919eab', icon: 'eva:file-fill', label: item.type };
                return (
                  <Card 
                    key={item.id} 
                    sx={{ 
                      p: 2, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      transition: 'all 0.2s',
                      '&:hover': { boxShadow: (theme) => theme.customShadows.z12, transform: 'translateY(-2px)' }
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
                      <Box 
                        sx={{ 
                          p: 1, 
                          borderRadius: 1, 
                          bgcolor: (theme) => alpha(cfg.color, 0.1), 
                          color: cfg.color,
                          display: 'flex'
                        }}
                      >
                        <Iconify icon={cfg.icon} width={24} height={24} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {item.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {cfg.label} • {item.fileSizeBytes ? (item.fileSizeBytes / 1024 / 1024).toFixed(1) : '0.0'} MB
                        </Typography>
                      </Box>
                    </Stack>
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.secondary', 
                        mb: 2, 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: 40
                      }}
                    >
                      {item.description || 'Không có mô tả cho nội dung này.'}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        component={NextLink}
                        href={item.type === 'VIDEO' ? `/client/viewer/video/${item.id}?nodeId=${activeNodeId}` : `/client/viewer/document/${item.id}?nodeId=${activeNodeId}&type=${item.type}`}
                      >
                        Học ngay
                      </Button>
                    </Stack>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </Scrollbar>
    </Card>
  );
}


