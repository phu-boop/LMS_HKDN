import { ReactElement, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Card, 
  Stack, 
  Typography, 
  Divider, 
  Box, 
  ToggleButton, 
  ToggleButtonGroup, 
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import Layout from '../../layouts';
import Page from '../../components/Page';
import ClientExperienceTemplate from '../../components/portal/ClientExperienceTemplate';
import Iconify from '../../components/Iconify';
import { CalendarStyle, CalendarToolbar } from '../../sections/@dashboard/calendar';
import type { EventInput } from '@fullcalendar/react';
import useResponsive from '../../hooks/useResponsive';
import { CalendarView } from '../../@types/calendar';
import { useDispatch, useSelector } from '../../redux/store';
import { fetchClientCurriculum } from '../../redux/slices/learningStructure';
import axios from '@/utils/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';

ClientHistory.getLayout = function getLayout(page: ReactElement) {
  return <Layout variant="client" roles={['CLIENT', 'SCHOOL', 'TEACHER']}>{page}</Layout>;
};



export default function ClientHistory() {
  const router = useRouter();
  const dispatch = useDispatch();
  const isDesktop = useResponsive('up', 'sm');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarView, setCalendarView] = useState<CalendarView>(isDesktop ? 'dayGridMonth' : 'listWeek');
  const calendarRef = useRef<any>(null);
  const [date, setDate] = useState(new Date());
  const [calendarPlugins, setCalendarPlugins] = useState<any[]>([]);
  const [FullCalendarComp, setFullCalendarComp] = useState<any>(null);

  // Curriculum State
  const { nodes, loaded: curriculumLoaded } = useSelector((state) => state.learningStructure);

  // Calendar events & dialogs state
  const [events, setEvents] = useState<EventInput[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [clickedEvent, setClickedEvent] = useState<any>(null);

  // Form scheduling states
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState('');

  // Fetch client curriculum tree
  useEffect(() => {
    if (!curriculumLoaded) {
      dispatch(fetchClientCurriculum());
    }
  }, [dispatch, curriculumLoaded]);

  // Load events from localStorage or fallback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('client_scheduled_events_v2');
      if (stored) {
        try {
          setEvents(JSON.parse(stored));
        } catch (e) {
          setEvents([]);
        }
      } else {
        setEvents([]);
        localStorage.setItem('client_scheduled_events_v2', JSON.stringify([]));
      }
    }
  }, []);

  // Fetch content items of the selected lesson node dynamically
  useEffect(() => {
    if (!selectedLessonId) {
      setContentItems([]);
      return;
    }
    const fetchContents = async () => {
      setLoadingContent(true);
      try {
        const res = await axios.get(API_ENDPOINTS.clientCurriculumContents(selectedLessonId));
        setContentItems(res.data?.items || res.data || []);
      } catch (err) {
        console.error('Failed to fetch contents', err);
      } finally {
        setLoadingContent(false);
      }
    };
    fetchContents();
  }, [selectedLessonId]);

  useEffect(() => {
    let mounted = true;

    const loadPlugins = async () => {
      if (typeof window === 'undefined') return;
      await import('@fullcalendar/react');
      const [list, dayGrid, timeGrid, interaction] = await Promise.all([
        import('@fullcalendar/list'),
        import('@fullcalendar/daygrid'),
        import('@fullcalendar/timegrid'),
        import('@fullcalendar/interaction'),
      ]);

      const FC = await import('@fullcalendar/react');
      if (mounted) {
        setFullCalendarComp(() => FC.default);
        setCalendarPlugins([
          list.default,
          dayGrid.default,
          timeGrid.default,
          interaction.default,
        ]);
      }
    };

    loadPlugins();
    return () => { mounted = false; };
  }, []);

  const getCalendarApi = () => {
    const calendarEl = calendarRef.current as any;
    if (!calendarEl) return null;
    if (typeof calendarEl.getApi === 'function') return calendarEl.getApi();
    if (calendarEl.calendar && typeof calendarEl.calendar.getApi === 'function') {
      return calendarEl.calendar.getApi();
    }
    return null;
  };

  const handleClickToday = () => {
    const calendarApi = getCalendarApi();
    if (calendarApi) {
      calendarApi.today();
      setDate(calendarApi.getDate());
    }
  };

  const handleClickDatePrev = () => {
    const calendarApi = getCalendarApi();
    if (calendarApi) {
      calendarApi.prev();
      setDate(calendarApi.getDate());
    }
  };

  const handleClickDateNext = () => {
    const calendarApi = getCalendarApi();
    if (calendarApi) {
      calendarApi.next();
      setDate(calendarApi.getDate());
    }
  };

  const handleChangeView = (newView: CalendarView) => {
    const calendarApi = getCalendarApi();
    if (calendarApi) {
      calendarApi.changeView(newView);
      setCalendarView(newView);
    }
  };

  const handleAddEvent = (newEvent: EventInput) => {
    const updated = [...events, newEvent];
    setEvents(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('client_scheduled_events_v2', JSON.stringify(updated));
    }
  };

  const handleSaveEvent = () => {
    if (!selectedDate || !selectedContentId) return;
    
    const content = contentItems.find((c) => c.id === selectedContentId);
    if (!content) return;
    
    const newEvent: EventInput = {
      id: String(Date.now()),
      title: `${content.type === 'VIDEO' ? 'Xem video' : 'Học tài liệu'}: ${content.title}`,
      start: selectedDate.getTime(),
      allDay: true,
      textColor: '#fff',
      backgroundColor: content.type === 'VIDEO' ? '#ef4444' : '#0ea5e9',
      extendedProps: {
        route: content.type === 'VIDEO' 
          ? `/client/viewer/video/${content.id}` 
          : `/client/viewer/document/${content.id}?type=${content.type}`
      }
    };
    
    handleAddEvent(newEvent);
    setOpenAddDialog(false);
  };

  const handleDeleteEvent = () => {
    if (!clickedEvent) return;
    const updated = events.filter((e) => e.id !== clickedEvent.id);
    setEvents(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('client_scheduled_events_v2', JSON.stringify(updated));
    }
    setOpenEventDialog(false);
  };

  const handleStudyEvent = () => {
    if (clickedEvent?.route) {
      router.push(clickedEvent.route);
    }
    setOpenEventDialog(false);
  };

  const handleEventClick = (arg: any) => {
    setClickedEvent({
      id: arg.event.id,
      title: arg.event.title,
      route: arg.event.extendedProps?.route
    });
    setOpenEventDialog(true);
  };

  const lessonNodes = nodes.filter(
    (n) => n.nodeType?.toUpperCase() === 'LESSON' || n.nodeType?.toUpperCase() === 'LESSION'
  );

  const getLessonDisplayName = (node: any) => {
    const parent = nodes.find((n) => n.id === node.parentId);
    if (parent) {
      return `${parent.title} - ${node.title}`;
    }
    return node.title;
  };

  const formattedDate = selectedDate ? selectedDate.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  return (
    <Page title="Client - Kế hoạch học tập">
      <ClientExperienceTemplate
        title="Kế hoạch học tập"
        subtitle="Lên lịch và theo dõi kế hoạch học tập của bạn."
      >
        <Card sx={{ p: { xs: 1, md: 2.5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => {
                setSelectedDate(new Date());
                setSelectedLessonId('');
                setSelectedContentId('');
                setOpenAddDialog(true);
              }}
            >
              Lên lịch học
            </Button>

            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(e, v) => {
                if (v !== null) setViewMode(v);
              }}
            >
              <ToggleButton value="list">
                <Iconify icon="eva:list-fill" />
              </ToggleButton>
              <ToggleButton value="calendar">
                <Iconify icon="eva:calendar-fill" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {viewMode === 'list' && (
            <Stack spacing={2}>
              {events.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Chưa có kế hoạch học tập nào.
                  </Typography>
                </Box>
              ) : (
                [...events]
                  .sort((a, b) => new Date(b.start as any).getTime() - new Date(a.start as any).getTime())
                  .map((evt, idx) => {
                    const evtDate = new Date(evt.start as any);
                    return (
                      <Box key={evt.id || idx}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2">
                              {evtDate.toLocaleDateString('vi-VN')} • {evtDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                              {evt.title}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button 
                              size="small" 
                              variant="outlined" 
                              onClick={() => {
                                if (evt.extendedProps?.route) {
                                  router.push(evt.extendedProps.route);
                                }
                              }}
                            >
                              Học
                            </Button>
                            <Button 
                              size="small" 
                              color="error" 
                              onClick={() => {
                                if (window.confirm('Bạn có muốn xóa mục này?')) {
                                  const updated = events.filter((e) => e.id !== evt.id);
                                  setEvents(updated);
                                  localStorage.setItem('client_scheduled_events_v2', JSON.stringify(updated));
                                }
                              }}
                            >
                              Xóa
                            </Button>
                          </Stack>
                        </Stack>
                        {idx < events.length - 1 && <Divider sx={{ mt: 1.5 }} />}
                      </Box>
                    );
                  })
              )}
            </Stack>
          )}

          {viewMode === 'calendar' && (
            <CalendarStyle>
              <CalendarToolbar
                date={date}
                view={calendarView}
                onNextDate={handleClickDateNext}
                onPrevDate={handleClickDatePrev}
                onToday={handleClickToday}
                onChangeView={handleChangeView}
              />
              {!!calendarPlugins.length && !!FullCalendarComp && (
                <FullCalendarComp
                  weekends
                  events={events}
                  ref={calendarRef}
                  rerenderDelay={10}
                  initialDate={date}
                  initialView={calendarView}
                  dayMaxEventRows={3}
                  eventDisplay="block"
                  headerToolbar={false}
                  allDayMaintainDuration
                  height={isDesktop ? 720 : 'auto'}
                  plugins={calendarPlugins}
                  selectable={true}
                  selectMirror={true}
                  select={(arg: any) => {
                    setSelectedDate(arg.start);
                    setSelectedLessonId('');
                    setSelectedContentId('');
                    setOpenAddDialog(true);
                  }}
                  eventClick={handleEventClick}
                />
              )}
            </CalendarStyle>
          )}
        </Card>
      </ClientExperienceTemplate>

      {/* Dialog Lên lịch học mới */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Lên lịch học tập</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Ngày học"
              value={formattedDate}
              fullWidth
              InputProps={{ readOnly: true }}
            />

            <FormControl fullWidth>
              <InputLabel id="lesson-select-label">Chọn bài học (Cây học liệu)</InputLabel>
              <Select
                labelId="lesson-select-label"
                value={selectedLessonId}
                label="Chọn bài học (Cây học liệu)"
                onChange={(e) => {
                  setSelectedLessonId(e.target.value);
                  setSelectedContentId('');
                }}
              >
                {lessonNodes.map((node) => (
                  <MenuItem key={node.id} value={node.id}>
                    {getLessonDisplayName(node)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!selectedLessonId || loadingContent}>
              <InputLabel id="content-select-label">
                {loadingContent ? 'Đang tải học liệu...' : 'Chọn nội dung (PDF/Video/Slide)'}
              </InputLabel>
              <Select
                labelId="content-select-label"
                value={selectedContentId}
                label={loadingContent ? 'Đang tải học liệu...' : 'Chọn nội dung (PDF/Video/Slide)'}
                onChange={(e) => setSelectedContentId(e.target.value)}
              >
                {loadingContent ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} sx={{ mr: 1 }} /> Đang tải học liệu...
                  </MenuItem>
                ) : contentItems.length === 0 ? (
                  <MenuItem disabled>Không có học liệu nào trong bài học này</MenuItem>
                ) : (
                  contentItems.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.type === 'VIDEO' ? '🎥 Video: ' : '📄 Tài liệu: '} {item.title}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)} color="inherit">Hủy</Button>
          <Button 
            onClick={handleSaveEvent} 
            variant="contained" 
            disabled={!selectedContentId || !selectedDate}
          >
            Lưu lịch học
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Chi tiết / Hành động sự kiện lịch học */}
      <Dialog open={openEventDialog} onClose={() => setOpenEventDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Chi tiết lịch học</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 2 }}>
            {clickedEvent?.title}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Bạn muốn bắt đầu học ngay nội dung này hay muốn xóa khỏi lịch học?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button onClick={handleDeleteEvent} color="error" variant="outlined">Xóa lịch học</Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setOpenEventDialog(false)} color="inherit">Đóng</Button>
            <Button onClick={handleStudyEvent} variant="contained" color="primary">Học ngay</Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Page>
  );
}
