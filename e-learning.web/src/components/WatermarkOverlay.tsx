import { useEffect, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import axios from '../utils/axios';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

type WatermarkOverlayProps = {
  contentId: string;
  enabled: boolean;
};

export default function WatermarkOverlay({ contentId, enabled }: WatermarkOverlayProps) {
  const theme = useTheme();
  const { user } = useSelector((state: any) => state.auth);
  const [config, setConfig] = useState<{
    text?: string;
    renderedText?: string;
    opacity?: number;
    fontSize?: number | string;
    color?: string;
  } | null>(null);
  const [liveText, setLiveText] = useState<string>('');

  useEffect(() => {
    if (!enabled || !contentId) {
      setConfig(null);
      return;
    }

    const fetchConfig = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.clientContentWatermarkConfig(contentId));
        if (res.data) {
          setConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch watermark config', err);
        // Fall back to default settings on error
        setConfig({});
      }
    };

    fetchConfig();
  }, [contentId, enabled]);



  useEffect(() => {
    let resolvedText = config?.renderedText || '';
    if (!resolvedText) {
      const rawTemplate = config?.text || '{name} ({email})';
      resolvedText = rawTemplate;
      if (user) {
        const name = user.name || user.username || '';
        const email = user.email || '';
        const phone = user.phoneNumber || '';
        const username = user.username || '';

        resolvedText = resolvedText
          .replace(/{name}/gi, name)
          .replace(/{userName}/gi, name)
          .replace(/{username}/gi, username)
          .replace(/{email}/gi, email)
          .replace(/{userEmail}/gi, email)
          .replace(/{phone}/gi, phone)
          .replace(/{userPhone}/gi, phone);
      } else {
        resolvedText = 'Hệ thống học tập';
      }
    }

    // Try to find a date string in resolvedText to auto-increment it
    const dateRegex = /(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})|(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/;
    const match = resolvedText.match(dateRegex);

    if (match) {
      const originalTimeStr = match[0];
      let parsedDate;
      if (originalTimeStr.includes('/')) {
        const [datePart, timePart] = originalTimeStr.split(' ');
        const [day, month, year] = datePart.split('/');
        parsedDate = new Date(`${year}-${month}-${day}T${timePart}`);
      } else {
        parsedDate = new Date(originalTimeStr.replace(' ', 'T'));
      }

      if (!isNaN(parsedDate.getTime())) {
        const initialServerTime = parsedDate.getTime();
        const localFetchTime = Date.now();

        setLiveText(resolvedText); // Set initial

        const timer = setInterval(() => {
          const now = Date.now();
          const diff = now - localFetchTime;
          const currentServerTime = new Date(initialServerTime + diff);

          const pad = (n: number) => n.toString().padStart(2, '0');
          let newTimeStr = '';
          if (originalTimeStr.includes('/')) {
            newTimeStr = `${pad(currentServerTime.getDate())}/${pad(currentServerTime.getMonth() + 1)}/${currentServerTime.getFullYear()} ${pad(currentServerTime.getHours())}:${pad(currentServerTime.getMinutes())}:${pad(currentServerTime.getSeconds())}`;
          } else {
            newTimeStr = `${currentServerTime.getFullYear()}-${pad(currentServerTime.getMonth() + 1)}-${pad(currentServerTime.getDate())} ${pad(currentServerTime.getHours())}:${pad(currentServerTime.getMinutes())}:${pad(currentServerTime.getSeconds())}`;
          }

          setLiveText(resolvedText.replace(originalTimeStr, newTimeStr));
        }, 1000);

        return () => clearInterval(timer);
      }
    }
    
    // Fallback if no date found or invalid date
    setLiveText(resolvedText);
  }, [config, user]);

  // Ép cứng độ mờ 18% để chữ trông xám nhạt hơn, không bị đen đậm
  const opacity = 0.18;

  // Đổi sang màu xám đậm (#333333) thay vì đen tuyền để lên màu xám đẹp hơn trên nền trắng
  const color = '#333333';
  const strokeColor = '#ffffff';

  // Determine fontSize: default to 15px
  let fontSize = '15px';
  if (config?.fontSize !== undefined) {
    fontSize = typeof config.fontSize === 'number' ? `${config.fontSize}px` : config.fontSize;
  }

  // Generate a repeating diagonal text pattern using an inline SVG background
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="350" height="250">
      <text 
        x="50%" 
        y="50%" 
        fill="${color}" 
        stroke="${strokeColor}"
        stroke-width="1"
        opacity="${opacity}" 
        font-size="${fontSize}" 
        font-family="sans-serif" 
        font-weight="bold"
        text-anchor="middle" 
        transform="rotate(-25 175 125)"
      >
        ${liveText}
      </text>
    </svg>
  `;
  const backgroundUrl = `url("data:image/svg+xml;utf8,${encodeURIComponent(svgString)}")`;

  if (!enabled) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 999, // Ensure overlay stays above video/document content but doesn't block player controls if possible
        backgroundImage: backgroundUrl,
        backgroundRepeat: 'repeat',
      }}
    />
  );
}
