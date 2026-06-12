import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import PdfLessonViewer, { PdfFileSource } from './PdfLessonViewer';
import PptxSlideViewer from './PptxSlideViewer';
import { resolveViewerDocumentId } from '../../utils/resolveViewerDocumentId';
import { getToken } from '../../utils/cacheStorage';

const showDevViewerTools = process.env.NODE_ENV !== 'production';

function a11yProps(index: number) {
  return {
    id: `lesson-doc-tab-${index}`,
    'aria-controls': `lesson-doc-tabpanel-${index}`,
  };
}

export default function ClientDocumentLessonViewer() {
  const router = useRouter();
  const { query } = router;
  const [tab, setTab] = useState(0);
  const [accessToken, setAccessToken] = useState('');
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pptxError, setPptxError] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);

  const [devPdfOverride, setDevPdfOverride] = useState('');
  const [devPptxEmbedUrl, setDevPptxEmbedUrl] = useState('');
  const [useDevPdfOverride, setUseDevPdfOverride] = useState(false);

  const docId = useMemo(() => resolveViewerDocumentId(query.id as string | undefined), [query.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Token được lưu trong Cookie, không phải localStorage
    setAccessToken(getToken() || '');
    setIsLocalhost(['localhost', '127.0.0.1'].includes(window.location.hostname));
  }, []);

  useEffect(() => {
    if (!router.isReady) return;
    const id = String(query.id || '').toLowerCase();
    if (id === 'pdf') {
      setTab(0);
      setPdfError(null);
      setUseDevPdfOverride(false);
    }
    if (id === 'pptx' || id === 'slide' || id === 'slides') {
      setTab(1);
    }
  }, [router.isReady, query.id]);

  const pdfFile: PdfFileSource = useMemo(() => {
    if (showDevViewerTools && useDevPdfOverride && devPdfOverride.trim()) {
      return devPdfOverride.trim();
    }
    const url = `/api/viewer/pdf/${encodeURIComponent(docId)}`;
    if (!accessToken) {
      return { url };
    }
    return {
      url,
      httpHeaders: { Authorization: `Bearer ${accessToken}` },
    };
  }, [docId, accessToken, useDevPdfOverride, devPdfOverride]);

  const downloadPptx = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setPptxError(null);
    try {
      const headers: HeadersInit = {};
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }
      const r = await fetch(`/api/viewer/pptx/${encodeURIComponent(docId)}`, { headers });
      if (!r.ok) {
        throw new Error(r.status === 401 ? 'Cần đăng nhập hoặc token hết hạn.' : `Lỗi ${r.status}`);
      }
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${docId}.pptx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Tải thất bại';
      setPptxError(msg);
    }
  }, [docId, accessToken]);

  const pptxEmbedSource =
    showDevViewerTools && devPptxEmbedUrl.trim() ? devPptxEmbedUrl.trim() : '';

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Chip label="PDF" color="primary" size="small" />
        <Chip label="Slide (.pptx)" variant="outlined" size="small" />
        <Chip label="Theo documentId" variant="outlined" size="small" />
      </Stack>

      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Document ID: <strong>{docId}</strong>
        {String(query.id || '') && String(query.id) !== docId ? (
          <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
            (route: {String(query.id)})
          </Typography>
        ) : null}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
        <strong>Slide trong web viewer</strong> = file <strong>PDF</strong> (xuất từ PowerPoint), stream qua{' '}
        <code>/api/viewer/pdf/&lt;id&gt;</code>. Tab «File gốc .pptx» chỉ để tải PowerPoint, không phải viewer trong trang.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="Loại tài liệu">
          <Tab label="Xem trong trình duyệt (PDF)" {...a11yProps(0)} />
          <Tab label="File gốc .pptx" {...a11yProps(1)} />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Box role="tabpanel" id="lesson-doc-tabpanel-0">
          {showDevViewerTools && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Dev: có thể ghi đè URL PDF để test CORS. Production không hiển thị khối này.
            </Alert>
          )}
          {showDevViewerTools && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }} alignItems={{ sm: 'center' }}>
              <Button
                size="small"
                variant={useDevPdfOverride ? 'contained' : 'outlined'}
                onClick={() => {
                  setUseDevPdfOverride((v) => !v);
                  setPdfError(null);
                }}
              >
                {useDevPdfOverride ? 'Dùng API theo id' : 'Bật ghi đè URL (dev)'}
              </Button>
              {useDevPdfOverride && (
                <>
                  <TextField
                    fullWidth
                    size="small"
                    label="URL PDF (chỉ dev)"
                    value={devPdfOverride}
                    onChange={(e) => setDevPdfOverride(e.target.value)}
                  />
                </>
              )}
            </Stack>
          )}
          {pdfError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPdfError(null)}>
              {pdfError}
            </Alert>
          )}
          <PdfLessonViewer file={pdfFile} onDocumentError={setPdfError} />
        </Box>
      )}

      {tab === 1 && (
        <Box role="tabpanel" id="lesson-doc-tabpanel-1">
          {pptxError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPptxError(null)}>
              {pptxError}
            </Alert>
          )}
          <Alert severity="success" sx={{ mb: 2 }} action={
            <Button color="inherit" size="small" variant="outlined" onClick={() => { setTab(0); setPdfError(null); }}>
              Mở viewer PDF
            </Button>
          }>
            Để <strong>xem slide ngay trong trang</strong>: bấm <strong>«Mở viewer PDF»</strong> (tab{' '}
            <strong>Xem trong trình duyệt (PDF)</strong>). Nội dung là bản <strong>PDF</strong> đã xuất từ PowerPoint, không
            phải file .pptx thô.
          </Alert>
          <Alert severity="info" sx={{ mb: 2 }}>
            Tab này chỉ để <strong>tải .pptx</strong> (mở bằng PowerPoint trên máy). Office Online embed chỉ bật ở dev và cần
            URL .pptx HTTPS công khai.
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
            <Button variant="contained" onClick={downloadPptx}>
              Tải .pptx (đã xác thực)
            </Button>
            <Typography variant="body2" sx={{ color: 'text.secondary', alignSelf: 'center' }}>
              GET <code>/api/viewer/pptx/{docId}</code>
            </Typography>
          </Stack>

          {showDevViewerTools && (
            <>
              {isLocalhost && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Office Online không fetch được <code>localhost</code>. Chỉ dùng embed dev với URL HTTPS công khai.
                </Alert>
              )}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Dev — Office embed (tùy chọn)
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="URL .pptx công khai (HTTPS)"
                  placeholder="https://…/slides.pptx"
                  value={devPptxEmbedUrl}
                  onChange={(e) => setDevPptxEmbedUrl(e.target.value)}
                />
              </Stack>
              {!!pptxEmbedSource && <PptxSlideViewer fileUrl={pptxEmbedSource} />}
            </>
          )}
        </Box>
      )}
    </Card>
  );
}
