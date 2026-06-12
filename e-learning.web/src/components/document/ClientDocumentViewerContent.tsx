import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
// @mui
import { Box, Card, Typography, Stack, CircularProgress, Button, Container, LinearProgress } from '@mui/material';
// redux
import { useSelector } from '@/redux/store';
// components
import Iconify from '@/components/Iconify';
import Page from '@/components/Page';
import PdfLessonViewer from './PdfLessonViewer';
// utils
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import { getToken } from '@/utils/cacheStorage';

export default function ClientDocumentViewerContent() {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [docData, setDocData] = useState<any>(null);
  const [viewUrl, setViewUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { user } = useSelector((state) => state.auth);

  const pdfFile = useMemo(() => {
    const url = `/api/viewer/pdf/${encodeURIComponent(id as string)}`;
    const token = getToken();
    if (!token) {
      return { url };
    }
    return {
      url,
      httpHeaders: { Authorization: `Bearer ${token}` },
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Instead of calling backend view-url directly and leaking S3 URLs, 
        // we call our proxy metadata endpoint which strips the URL.
        const token = getToken();
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const viewRes = await axios.get(`/api/viewer/metadata/${encodeURIComponent(id as string)}`, { headers });
        
        const data = viewRes.data;
        setDocData(data);
        setViewUrl(data?.hasUrl ? 'yes' : '');
      } catch (err) {
        console.error('Failed to fetch document data', err);
        setError('Không thể tải tài liệu này. Vui lòng thử lại sau.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (isLoading && !docData) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>Đang chuẩn bị tài liệu...</Typography>
      </Box>
    );
  }

  if (error && !docData) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Iconify icon="eva:alert-triangle-fill" width={64} height={64} sx={{ color: 'error.main', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 1 }}>{error}</Typography>
        <Button variant="contained" onClick={() => router.back()}>Quay lại</Button>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.lighter', color: 'primary.main', display: 'flex' }}>
            <Iconify icon="eva:file-text-fill" width={24} height={24} />
          </Box>
          <Box>
            <Typography variant="h6">{docData?.title || 'Tài liệu học tập'}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {docData?.type || 'DOCUMENT'} • {docData?.fileSizeBytes ? (docData.fileSizeBytes / 1024 / 1024).toFixed(1) : '0.0'} MB
            </Typography>
          </Box>
        </Stack>
      </Card>

      <Card sx={{ p: 1, minHeight: 600, bgcolor: 'background.neutral' }}>
        {viewUrl ? (
          <PdfLessonViewer file={pdfFile} />
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ height: 600 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Không có nội dung hiển thị</Typography>
          </Stack>
        )}
      </Card>

      {docData?.description && (
        <Card sx={{ p: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>Mô tả bài học</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
            {docData.description}
          </Typography>
        </Card>
      )}
    </Stack>
  );
}
