import { useRef, useState, useEffect } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import Iconify from '../Iconify';
import ProtectContentWrapper from './ProtectContentWrapper';

export type PptxSlideViewerProps = {
  fileUrl: string;
  contentId?: string;
  initialPage?: number;
  totalPages?: number;
  onPageChange?: (page: number, totalPages: number) => void;
};

/**
 * Xem PowerPoint (.pptx) qua Microsoft Office Online.
 */
export default function PptxSlideViewer({
  fileUrl,
  contentId,
  initialPage = 1,
  totalPages,
  onPageChange
}: PptxSlideViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const isWordDoc = fileUrl?.toLowerCase().includes('.doc');

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isWordDoc || !containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width } = entry.contentRect;
        // Office Viewer forces word doc to be around ~820px wide
        // Let's use 850px as safe threshold for desktop view
        if (width > 0 && width < 850) {
          setScale(width / 850);
        } else {
          setScale(1);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isWordDoc]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (!fileUrl) {
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
          Chưa có URL slide (.pptx)
        </Typography>
      </Box>
    );
  }

  const startPage = 1;
  const embedSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}&wdSlideIndex=${startPage}`;

  const toolbarBgColor = isWordDoc ? '#ffffff' : '#444444';
  const iconColor = isWordDoc ? 'common.black' : 'common.white';
  const iconHoverBg = isWordDoc ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

  const handleFocus = () => {
    const iframe = document.getElementById('ppt-iframe');
    if (iframe) {
      iframe.focus();
    }
  };

  return (
    <div>
      <Box 
        ref={containerRef} 
        onMouseEnter={handleFocus}
        onClick={handleFocus}
        sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', bgcolor: '#000' }}
      >
        <Box
          sx={{
            width: isWordDoc && scale < 1 ? '850px' : '100%',
            height: isWordDoc && scale < 1 ? `${100 / scale}%` : '100%',
            transform: isWordDoc && scale < 1 ? `scale(${scale})` : 'none',
            transformOrigin: 'top left',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#000',
          }}
        >
          <Box
            id="ppt-iframe"
            component="iframe"
            tabIndex={0}
            title="PowerPoint viewer"
            src={embedSrc}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            onLoad={() => setIsLoaded(true)}
            sx={{
              width: '100%',
              height: '100%',
              border: 0,
              display: 'block',
              // Tăng chiều rộng vết cắt lên 120px để nuốt trọn toàn bộ nút Menu và vạch phân cách của MS Viewer
              clipPath: isLoaded ? 'polygon(0 0, 100% 0, 100% calc(100% - 24px), calc(100% - 120px) calc(100% - 24px), calc(100% - 120px) 100%, 0 100%)' : 'none'
            }}
            allowFullScreen
          />

          {/* Tấm khiên tàng hình che toàn bộ khu vực hiển thị Slide (chừa lại thanh công cụ 24px bên dưới) 
              Mục đích: Chặn chuột phải (Context Menu) và chặn click trực tiếp vào iFrame để không bị tự nhảy Next.
              Click chuột trái vào tấm khiên này sẽ focus iFrame để dùng bàn phím.
          */}
          {isLoaded && !isWordDoc && (
            <Box
              onContextMenu={(e) => e.preventDefault()}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 24, // Chừa 24px thanh công cụ
                zIndex: 4,
                cursor: 'default',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Background giả cho phần bị khoét để khớp màu 100% với toolbar gốc */}
          {isLoaded && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 120,
                height: 24,
                bgcolor: toolbarBgColor,
                zIndex: 5,
              }}
            />
          )}
          
          {/* Chỉ hiện Custom Fullscreen Button sau khi iframe đã load xong */}
          {isLoaded && (
            <Tooltip title={isFullscreen ? "Thu nhỏ" : "Phóng to"}>
              <IconButton
                onClick={toggleFullscreen}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 4,
                  width: 40,
                  height: 24,
                  borderRadius: 1,
                  color: iconColor,
                  '&:hover': { bgcolor: iconHoverBg },
                  zIndex: 10,
                }}
              >
                <Iconify icon={isFullscreen ? "eva:collapse-fill" : "eva:expand-fill"} width={16} height={16} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </div>
  );
}
