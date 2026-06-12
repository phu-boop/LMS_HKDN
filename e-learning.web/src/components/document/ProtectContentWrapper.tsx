import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface ProtectContentWrapperProps {
  children: React.ReactNode;
}

export default function ProtectContentWrapper({ children }: ProtectContentWrapperProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        blockScreenshot();
      }
      // Windows: Win + Shift + S
      if (e.shiftKey && e.metaKey && e.code === 'KeyS') {
        blockScreenshot();
      }
      // Mac: Cmd + Shift + 3/4/5
      if (e.metaKey && e.shiftKey && (e.code === 'Digit3' || e.code === 'Digit4' || e.code === 'Digit5')) {
        blockScreenshot();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        unblockScreenshot();
      }
      if (e.code === 'KeyS' || e.code === 'Digit3' || e.code === 'Digit4' || e.code === 'Digit5') {
        unblockScreenshot();
      }
    };

    const blockScreenshot = () => {
      setIsCapturing(true);
      
      // Try to clear clipboard to prevent taking image
      try {
        navigator.clipboard.writeText('Screenshots are disabled for this content.');
      } catch (err) {
        // ignore
      }

      // Hide the content for a short duration
      setTimeout(() => {
        setIsCapturing(false);
      }, 3000); // Keep it hidden for 3 seconds to ensure screenshot is blocked
    };

    const unblockScreenshot = () => {
      // setIsCapturing(false); // Let the timeout handle it to be safe
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <Box 
      sx={{ width: '100%', height: '100%', position: 'relative' }}
      onContextMenu={(e) => e.preventDefault()} // Block right-click
    >
      {isCapturing && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            bgcolor: 'common.black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h5" sx={{ color: 'common.white', textAlign: 'center', p: 3 }}>
            ⚠️ Nội dung đã được bảo vệ bản quyền. Không cho phép chụp ảnh màn hình.
          </Typography>
        </Box>
      )}
      
      {/* Hide content completely when capturing by applying opacity or display none */}
      <Box sx={{ width: '100%', height: '100%', opacity: isCapturing ? 0 : 1, pointerEvents: isCapturing ? 'none' : 'auto' }}>
        {children}
      </Box>
    </Box>
  );
}
