import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { m, AnimatePresence } from 'framer-motion';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import {
  Box,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import Iconify from '../Iconify';
import ProtectContentWrapper from './ProtectContentWrapper';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

export type PdfFileSource = string | { url: string; httpHeaders?: Record<string, string> };

export type PdfLessonViewerProps = {
  file: PdfFileSource;
  initialPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
  onDocumentError?: (message: string) => void;
};

function pdfSourceKey(file: PdfFileSource): string {
  if (typeof file === 'string') return file;
  const h = file.httpHeaders ? JSON.stringify(file.httpHeaders) : '';
  return `${file.url}\0${h}`;
}

type ViewMode = 'slides' | 'scroll';

export default function PdfLessonViewer({ file, initialPage, onPageChange, onDocumentError }: PdfLessonViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(640);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState(0);
  const [transitionMode, setTransitionMode] = useState<'slide' | 'flip'>('slide');
  const [viewMode, setViewMode] = useState<ViewMode>('slides');
  const [zoom, setZoom] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [autoFitDone, setAutoFitDone] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => {
      setContainerWidth(Math.max(280, el.clientWidth));
      setContainerHeight(el.clientHeight);
    });
    ro.observe(el);
    setContainerWidth(Math.max(280, el.clientWidth));
    setContainerHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (onPageChange && numPages) {
      onPageChange(page, numPages);
    }
  }, [page, numPages, onPageChange]);

  useEffect(() => {
    setPage(1);
    setNumPages(null);
    setAutoFitDone(false);
    setFitScale(1);
    setZoom(1);
  }, [pdfSourceKey(file)]);

  // Sau khi render xong trang đầu tiên, auto-fit scale để page vừa chiều cao container
  const handlePageRenderSuccess = useCallback(
    (pageProxy: { height: number; width: number }) => {
      if (autoFitDone || !containerRef.current) return;
      const availH = containerRef.current.clientHeight - 32; // Chừa lề vừa đủ (16px trên/dưới)
      if (availH > 0 && pageProxy.height > 0) {
        // Initial render is fit-to-width (fitScale=1).
        // If height overflows, scale down.
        const fitted = Math.min(1.0, availH / pageProxy.height);
        setFitScale(parseFloat(fitted.toFixed(3)));
      }
      setAutoFitDone(true);
    },
    [autoFitDone]
  );

  const pageWidth = Math.round(Math.max(200, containerWidth - 32) * fitScale * zoom);

  const goPrev = useCallback(() => {
    setPage((p) => {
      if (p <= 1) return p;
      setDirection(-1);
      return p - 1;
    });
  }, []);

  const goNext = useCallback(() => {
    setPage((p) => {
      if (numPages != null && p >= numPages) return p;
      setDirection(1);
      return p + 1;
    });
  }, [numPages]);

  useEffect(() => {
    if (viewMode !== 'slides') return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [viewMode, goPrev, goNext]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === fullscreenRef.current);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = fullscreenRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const fileMissing = typeof file === 'string' ? !file : !file.url;

  if (fileMissing) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.neutral',
          borderRadius: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Chưa cấu hình tài liệu PDF
        </Typography>
      </Box>
    );
  }

  return (
    <ProtectContentWrapper>
      <Box sx={{ width: 1 }}>
        <Box
          ref={fullscreenRef}
        sx={{
          width: 1,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: isFullscreen ? 'common.black' : 'transparent',
          borderRadius: isFullscreen ? 0 : 0,
          minHeight: isFullscreen ? '100vh' : 'auto',
          p: isFullscreen ? 1 : 0,
        }}
      >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          color="primary"
          value={viewMode}
          onChange={(_, v) => v && setViewMode(v)}
        >
          <ToggleButton 
            value="slides"
            sx={{
              ...(viewMode === 'slides' && {
                bgcolor: (theme) => `${theme.palette.primary.main} !important`,
                color: (theme) => `${theme.palette.primary.contrastText} !important`,
              })
            }}
          >
            Trình chiếu (từng trang)
          </ToggleButton>
          <ToggleButton 
            value="scroll"
            sx={{
              ...(viewMode === 'scroll' && {
                bgcolor: (theme) => `${theme.palette.primary.main} !important`,
                color: (theme) => `${theme.palette.primary.contrastText} !important`,
              })
            }}
          >
            Cuộn liên tục
          </ToggleButton>
        </ToggleButtonGroup>

        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
          {viewMode === 'slides' && (
            <ToggleButtonGroup
              size="small"
              exclusive
              color="primary"
              value={transitionMode}
              onChange={(_, v) => v && setTransitionMode(v)}
              sx={{ mr: 1 }}
            >
              <Tooltip title="Hiệu ứng lướt ngang">
                <ToggleButton 
                  value="slide"
                  sx={{
                    ...(transitionMode === 'slide' && {
                      bgcolor: (theme) => `${theme.palette.primary.main} !important`,
                      color: (theme) => `${theme.palette.primary.contrastText} !important`,
                    })
                  }}
                >
                  <Iconify icon="eva:arrow-forward-outline" width={18} height={18} />
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Hiệu ứng lật trang 3D">
                <ToggleButton 
                  value="flip"
                  sx={{
                    ...(transitionMode === 'flip' && {
                      bgcolor: (theme) => `${theme.palette.primary.main} !important`,
                      color: (theme) => `${theme.palette.primary.contrastText} !important`,
                    })
                  }}
                >
                  <Iconify icon="eva:book-open-outline" width={18} height={18} />
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
          )}

          <Tooltip title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}>
            <IconButton 
              size="small" 
              onClick={toggleFullscreen} 
              sx={{ 
                color: isFullscreen ? 'primary.main' : 'common.white',
                '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' } 
              }}
            >
              <Iconify icon={isFullscreen ? 'eva:collapse-fill' : 'eva:expand-fill'} width={20} height={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Thu nhỏ">
            <span>
              <IconButton 
                size="small" 
                onClick={() => setZoom((s) => Math.max(0.5, s - 0.1))} 
                disabled={zoom <= 0.5}
                sx={{ 
                  color: 'common.white',
                  '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' } 
                }}
              >
                <Iconify icon="eva:minus-fill" width={20} height={20} />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="caption" sx={{ minWidth: 36, textAlign: 'center', color: 'common.white' }}>
            {Math.round(zoom * 100)}%
          </Typography>
          <Tooltip title="Phóng to">
            <span>
              <IconButton 
                size="small" 
                onClick={() => setZoom((s) => Math.min(2.5, s + 0.1))} 
                disabled={zoom >= 2.5}
                sx={{ 
                  color: 'common.white',
                  '&.Mui-disabled': { color: 'rgba(255, 255, 255, 0.3)' } 
                }}
              >
                <Iconify icon="eva:plus-fill" width={20} height={20} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {viewMode === 'slides' && (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
          <Tooltip title="Trang trước (←)">
            <span>
              <IconButton 
                size="medium" 
                onClick={goPrev} 
                disabled={page <= 1}
                sx={{ 
                  color: 'common.white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-disabled': { 
                    color: 'rgba(255, 255, 255, 0.3)',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  } 
                }}
              >
                <Iconify icon="eva:arrow-ios-back-fill" width={24} height={24} />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="subtitle2" sx={{ color: 'common.white', minWidth: 80, textAlign: 'center', fontWeight: 700 }}>
            Trang {page}
            {numPages != null ? ` / ${numPages}` : ''}
          </Typography>
          <Tooltip title="Trang sau (→)">
            <span>
              <IconButton 
                size="medium" 
                onClick={goNext} 
                disabled={numPages != null && page >= numPages}
                sx={{ 
                  color: 'common.white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-disabled': { 
                    color: 'rgba(255, 255, 255, 0.3)',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  } 
                }}
              >
                <Iconify icon="eva:arrow-ios-forward-fill" width={24} height={24} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      )}

      <Box
        ref={containerRef}
        onContextMenu={(e) => e.preventDefault()}
        sx={{
          width: 1,
          flex: isFullscreen ? 1 : 'none',
          minHeight: viewMode === 'slides' ? { xs: 320, sm: 400, md: 'calc(100vh - 200px)' } : 320,
          maxHeight:
            viewMode === 'scroll'
              ? isFullscreen
                ? 'calc(100vh - 140px)'
                : { xs: 480, md: 720 }
              : 'none',
          height: viewMode === 'slides' ? { xs: 320, sm: 480, md: 'calc(100vh - 200px)' } : 'auto',
          overflow: viewMode === 'scroll' ? 'auto' : 'hidden',
          bgcolor: 'grey.900',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          perspective: 2500,
          py: viewMode === 'slides' ? 2 : 2,
          px: 1,
          userSelect: 'none',
        }}
      >
        {viewMode === 'slides' && (
          <>
            <IconButton
              disabled={page <= 1}
              onClick={goPrev}
              sx={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                color: 'common.white',
                bgcolor: 'rgba(0, 0, 0, 0.4)',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.2)',
                  bgcolor: 'rgba(0, 0, 0, 0.1)',
                },
                width: 48,
                height: 48,
              }}
            >
              <Iconify icon="eva:arrow-ios-back-fill" width={28} height={28} />
            </IconButton>

            <IconButton
              disabled={numPages != null && page >= numPages}
              onClick={goNext}
              sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                color: 'common.white',
                bgcolor: 'rgba(0, 0, 0, 0.4)',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                },
                '&.Mui-disabled': {
                  color: 'rgba(255, 255, 255, 0.2)',
                  bgcolor: 'rgba(0, 0, 0, 0.1)',
                },
                width: 48,
                height: 48,
              }}
            >
              <Iconify icon="eva:arrow-ios-forward-fill" width={28} height={28} />
            </IconButton>

            {/* Vùng click tàng hình để lật trang */}
            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5, display: 'flex' }}>
              <Box 
                sx={{ flex: 1, cursor: page <= 1 ? 'default' : 'w-resize' }} 
                onClick={(e) => { e.stopPropagation(); goPrev(); }} 
              />
              <Box 
                sx={{ flex: 1, cursor: (numPages != null && page >= numPages) ? 'default' : 'e-resize' }} 
                onClick={(e) => { e.stopPropagation(); goNext(); }} 
              />
            </Box>
          </>
        )}

        <Document
          file={file}
          loading={
            <Typography variant="body2" sx={{ color: 'grey.400', py: 6 }}>
              Đang tải PDF…
            </Typography>
          }
          onLoadSuccess={({ numPages: n }) => {
            setNumPages(n);
            if (initialPage && initialPage >= 1 && initialPage <= n) {
              setPage(initialPage);
            } else {
              setPage(1);
            }
          }}
          onLoadError={(err) => {
            onDocumentError?.(
              err.message || 'Không mở được PDF (401: cần đăng nhập hoặc token hết hạn).'
            );
          }}
        >
          <AnimatePresence initial={false} custom={direction}>
            {numPages != null &&
              viewMode === 'slides' &&
              page >= 1 &&
              page <= numPages && (
                <m.div
                  key={page}
                  custom={direction}
                  initial={(dir) => 
                    transitionMode === 'slide' 
                      ? { x: dir > 0 ? 800 : -800, opacity: 0, rotateY: 0, scale: 1 }
                      : { rotateY: dir > 0 ? 90 : -90, scale: 0.8, opacity: 0, x: 0 }
                  }
                  animate={{ 
                    x: 0, 
                    rotateY: 0, 
                    scale: 1, 
                    opacity: 1, 
                    transition: { duration: 0.5, ease: 'easeOut' } 
                  }}
                  exit={(dir) => 
                    transitionMode === 'slide'
                      ? { x: dir > 0 ? -800 : 800, opacity: 0, rotateY: 0, scale: 1, transition: { duration: 0.4, ease: 'easeIn' } }
                      : { rotateY: dir > 0 ? -90 : 90, scale: 0.8, opacity: 0, x: 0, transition: { duration: 0.4, ease: 'easeIn' } }
                  }
                  style={{ display: 'flex', justifyContent: 'center', width: '100%', position: 'absolute', left: 0, top: 16 }}
                >
                  <Box sx={{ 
                    boxShadow: '0 8px 24px -4px rgba(0,0,0,0.8), 0 0 12px 0 rgba(0,0,0,0.6)', 
                    border: '1px solid rgba(255,255,255,0.15)',
                    bgcolor: 'white' 
                  }}>
                    <Page
                      pageNumber={page}
                      width={pageWidth}
                      renderTextLayer
                      renderAnnotationLayer
                      onRenderSuccess={handlePageRenderSuccess}
                    />
                  </Box>
                </m.div>
              )}
          </AnimatePresence>
          {numPages != null &&
            viewMode === 'scroll' &&
            Array.from({ length: numPages }, (_, i) => (
              <Box key={i + 1} sx={{ 
                mb: 4, 
                boxShadow: '0 8px 24px -4px rgba(0,0,0,0.8), 0 0 12px 0 rgba(0,0,0,0.6)', 
                border: '1px solid rgba(255,255,255,0.15)',
                bgcolor: 'white' 
              }}>
                <Page
                  pageNumber={i + 1}
                  width={pageWidth}
                  renderTextLayer
                  renderAnnotationLayer
                />
              </Box>
            ))}
        </Document>
      </Box>

      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
        Gợi ý: chế độ trình chiếu phù hợp khi dạy trực tiếp; dùng phím ← → để lật trang. Nội dung xem trong trình duyệt,
        không cần tải file về máy (vẫn có thể chặn copy mạnh hơn ở tầng backend / DRM sau).
      </Typography>
        </Box>
      </Box>
    </ProtectContentWrapper>
  );
}
