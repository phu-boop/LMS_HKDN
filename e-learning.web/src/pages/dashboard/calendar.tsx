import type { DateSelectArg, EventClickArg, EventDropArg } from '@fullcalendar/react';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
//
import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';
// @mui
import { Card, Button, Container, DialogTitle } from '@mui/material';
// redux
import { RootState, useDispatch, useSelector } from '../../redux/store';
import {
  getEvents,
  openModal,
  closeModal,
  updateEvent,
  selectEvent,
  selectRange,
} from '../../redux/slices/calendar';
// routes
import { PATH_DASHBOARD } from '../../routes/paths';
// hooks
import useSettings from '../../hooks/useSettings';
import useResponsive from '../../hooks/useResponsive';
// @types
import { CalendarView } from '../../@types/calendar';
// layouts
import Layout from '../../layouts';
// components
import Page from '../../components/Page';
import Iconify from '../../components/Iconify';
import { DialogAnimate } from '../../components/animate';
import HeaderBreadcrumbs from '../../components/HeaderBreadcrumbs';
// sections
import { CalendarForm, CalendarStyle, CalendarToolbar } from '../../sections/@dashboard/calendar';

// ----------------------------------------------------------------------

const FullCalendar = dynamic(() => import('@fullcalendar/react'), { ssr: false }) as any;

Calendar.getLayout = function getLayout(page: React.ReactElement) {
  return <Layout>{page}</Layout>;
};

// ----------------------------------------------------------------------

const selectedEventSelector = (state: RootState) => {
  const { events, selectedEventId } = state.calendar;
  if (selectedEventId) {
    return events.find((_event) => _event.id === selectedEventId);
  }
  return null;
};

export default function Calendar() {
  const { themeStretch } = useSettings();

  const dispatch = useDispatch();

  const isDesktop = useResponsive('up', 'sm');

  const calendarRef = useRef<any>(null);

  const [date, setDate] = useState(new Date());

  const [view, setView] = useState<CalendarView>(isDesktop ? 'dayGridMonth' : 'listWeek');
  const [calendarPlugins, setCalendarPlugins] = useState<any[]>([]);

  const selectedEvent = useSelector(selectedEventSelector);

  const { events, isOpenModal, selectedRange } = useSelector((state) => state.calendar);

  const getCalendarApi = () => {
    const calendarEl = calendarRef.current as any;

    if (!calendarEl) return null;
    if (typeof calendarEl.getApi === 'function') return calendarEl.getApi();
    if (calendarEl.calendar && typeof calendarEl.calendar.getApi === 'function') {
      return calendarEl.calendar.getApi();
    }

    return null;
  };

  useEffect(() => {
    let mounted = true;

    const loadPlugins = async () => {
      if (typeof window === 'undefined') return;

      // Ensure top-level package is initialized before plugins.
      await import('@fullcalendar/react');

      const [list, dayGrid, timeline, timeGrid, interaction] = await Promise.all([
        import('@fullcalendar/list'),
        import('@fullcalendar/daygrid'),
        import('@fullcalendar/timeline'),
        import('@fullcalendar/timegrid'),
        import('@fullcalendar/interaction'),
      ]);

      if (mounted) {
        setCalendarPlugins([
          list.default,
          dayGrid.default,
          timeline.default,
          timeGrid.default,
          interaction.default,
        ]);
      }
    };

    loadPlugins();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    dispatch(getEvents());
  }, [dispatch]);

  useEffect(() => {
    const calendarApi = getCalendarApi();
    if (calendarApi) {
      const newView = isDesktop ? 'dayGridMonth' : 'listWeek';
      calendarApi.changeView(newView);
      setView(newView);
    }
  }, [isDesktop]);

  const handleClickToday = () => {
    const calendarApi = getCalendarApi();
    if (calendarApi) {
      calendarApi.today();
      setDate(calendarApi.getDate());
    }
  };

  const handleChangeView = (newView: CalendarView) => {
    const calendarApi = getCalendarApi();
    if (calendarApi) {
      calendarApi.changeView(newView);
      setView(newView);
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

  const handleSelectRange = (arg: DateSelectArg) => {
    const calendarApi = getCalendarApi();
    if (calendarApi) {
      calendarApi.unselect();
    }
    dispatch(selectRange(arg.start, arg.end));
  };

  const handleSelectEvent = (arg: EventClickArg) => {
    dispatch(selectEvent(arg.event.id));
  };

  const handleResizeEvent = async ({ event }: EventResizeDoneArg) => {
    try {
      dispatch(
        updateEvent(event.id, {
          allDay: event.allDay,
          start: event.start,
          end: event.end,
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleDropEvent = async ({ event }: EventDropArg) => {
    try {
      dispatch(
        updateEvent(event.id, {
          allDay: event.allDay,
          start: event.start,
          end: event.end,
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddEvent = () => {
    dispatch(openModal());
  };

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  return (
    <Page title="Calendar">
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <HeaderBreadcrumbs
          heading="Calendar"
          links={[{ name: 'Dashboard', href: PATH_DASHBOARD.root }, { name: 'Calendar' }]}
          moreLink="https://fullcalendar.io/docs/react"
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon={'eva:plus-fill'} width={20} height={20} />}
              onClick={handleAddEvent}
            >
              New Event
            </Button>
          }
        />

        <Card>
          <CalendarStyle>
            <CalendarToolbar
              date={date}
              view={view}
              onNextDate={handleClickDateNext}
              onPrevDate={handleClickDatePrev}
              onToday={handleClickToday}
              onChangeView={handleChangeView}
            />
            {!!calendarPlugins.length && (
              <FullCalendar
                weekends
                editable
                droppable
                selectable
                events={events}
                ref={calendarRef}
                rerenderDelay={10}
                initialDate={date}
                initialView={view}
                dayMaxEventRows={3}
                eventDisplay="block"
                headerToolbar={false}
                allDayMaintainDuration
                eventResizableFromStart
                select={handleSelectRange}
                eventDrop={handleDropEvent}
                eventClick={handleSelectEvent}
                eventResize={handleResizeEvent}
                height={isDesktop ? 720 : 'auto'}
                plugins={calendarPlugins}
              />
            )}
          </CalendarStyle>
        </Card>

        <DialogAnimate open={isOpenModal} onClose={handleCloseModal}>
          <DialogTitle>{selectedEvent ? 'Edit Event' : 'Add Event'}</DialogTitle>

          <CalendarForm
            event={selectedEvent || {}}
            range={selectedRange}
            onCancel={handleCloseModal}
          />
        </DialogAnimate>
      </Container>
    </Page>
  );
}
