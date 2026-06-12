import { useEffect, useState } from 'react';
import NextLink from 'next/link';
// @mui
import { alpha } from '@mui/material/styles';
import { Box, Card, Typography, Stack, Button, CircularProgress, IconButton, ToggleButton, ToggleButtonGroup, Tooltip, Divider } from '@mui/material';
// redux
import { useDispatch, useSelector } from '@/redux/store';
import { getFavorites, removeFavorite } from '@/redux/slices/favorite';
// components
import Iconify from '@/components/Iconify';

const TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  VIDEO: { color: '#ef4444', icon: 'eva:video-fill', label: 'Video' },
  stream: { color: '#ef4444', icon: 'eva:video-fill', label: 'Video' },
  PDF: { color: '#0ea5e9', icon: 'eva:file-text-fill', label: 'PDF' },
  DOCUMENT: { color: '#6366f1', icon: 'eva:file-fill', label: 'Tài liệu' },
  view: { color: '#0ea5e9', icon: 'eva:file-text-fill', label: 'Tài liệu' },
  SLIDE: { color: '#8b5cf6', icon: 'eva:layers-fill', label: 'Slide' },
  URL: { color: '#10b981', icon: 'eva:globe-2-fill', label: 'URL' },
  ASSIGNMENT: { color: '#f97316', icon: 'eva:edit-2-fill', label: 'Bài tập' },
  QUIZ: { color: '#f43f5e', icon: 'eva:question-mark-circle-fill', label: 'Quiz' },
};



export default function FavoriteLessonList() {
  const dispatch = useDispatch();
  const { favorites, isLoading } = useSelector((state) => state.favorite);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    dispatch(getFavorites());
  }, [dispatch]);

  const handleRemove = (contentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn bỏ yêu thích bài học này?')) {
      dispatch(removeFavorite(contentId));
    }
  };

  const displayFavorites = favorites;

  if (isLoading && favorites.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="subtitle1">
          Tổng số: <Box component="span" sx={{ color: 'primary.main' }}>{displayFavorites.length}</Box> bài học
        </Typography>

        <ToggleButtonGroup
          size="small"
          value={viewMode}
          exclusive
          onChange={(e, next) => next && setViewMode(next)}
          aria-label="view mode"
        >
          <ToggleButton value="grid" aria-label="grid view">
            <Iconify icon="eva:grid-fill" width={20} height={20} />
          </ToggleButton>
          <ToggleButton value="list" aria-label="list view">
            <Iconify icon="eva:list-fill" width={20} height={20} />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: viewMode === 'grid' 
            ? { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }
            : '1fr',
        }}
      >
        {displayFavorites.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center', gridColumn: '1 / -1', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Iconify icon="eva:heart-outline" width={48} height={48} sx={{ color: 'text.secondary' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              Chưa có bài học yêu thích nào.
            </Typography>
          </Box>
        ) : (
          displayFavorites.map((fav) => {
          const item = fav.content;
          if (!item) return null;
          const cfg = TYPE_CONFIG[item.type] || { color: '#64748b', icon: 'eva:file-fill', label: item.type };
          
          if (viewMode === 'list') {
            return (
              <Card 
                key={fav.id} 
                sx={{ 
                  p: 1.5, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  transition: 'all 0.2s',
                  '&:hover': { boxShadow: (theme) => theme.customShadows.z8, bgcolor: 'background.neutral' }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                   <Box 
                    sx={{ 
                      p: 1.2, 
                      borderRadius: 1, 
                      bgcolor: (theme) => alpha(cfg.color, 0.1), 
                      color: cfg.color,
                      display: 'flex'
                    }}
                  >
                    <Iconify icon={cfg.icon} width={24} height={24} />
                  </Box>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>{item.title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {cfg.label} • {((item.fileSizeBytes || 0) / 1024 / 1024).toFixed(1)} MB
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Button 
                      size="small" 
                      variant="outlined"
                      component={NextLink}
                      href={item.type === 'VIDEO' || item.type === 'stream' ? `/client/viewer/video/${item.id}` : `/client/viewer/document/${item.id}`}
                    >
                      Học ngay
                    </Button>
                    <Tooltip title="Bỏ yêu thích">
                      <IconButton size="small" color="error" onClick={() => handleRemove(item.id)}>
                        <Iconify icon="eva:heart-fill" width={20} height={20} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Card>
            );
          }

          return (
            <Card 
              key={fav.id} 
              sx={{ 
                p: 2, 
                border: '1px solid', 
                borderColor: 'divider',
                position: 'relative',
                '&:hover': { boxShadow: (theme) => theme.customShadows.z12 }
              }}
            >
              <IconButton
                size="small"
                onClick={() => handleRemove(item.id)}
                sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main', bgcolor: (theme) => alpha(theme.palette.error.main, 0.1) }}
              >
                <Iconify icon="eva:heart-fill" width={18} height={18} />
              </IconButton>

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
                <Box sx={{ minWidth: 0, pr: 3 }}>
                  <Typography variant="subtitle2" noWrap>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {cfg.label} • {((item.fileSizeBytes || 0) / 1024 / 1024).toFixed(1)} MB
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
                {item.contentItemDescription || item.description || 'Không có mô tả.'}
              </Typography>

              <Button
                fullWidth
                variant="outlined"
                size="small"
                component={NextLink}
                href={item.type === 'VIDEO' || item.type === 'stream' ? `/client/viewer/video/${item.id}` : `/client/viewer/document/${item.id}`}
              >
                Xem lại bài học
              </Button>
            </Card>
          );
        }))}
      </Box>
    </Box>
  );
}
