// import React, { useState, useEffect } from "react";
// import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
// import {
//   createViewDay,
//   createViewMonthAgenda,
//   createViewMonthGrid,
//   createViewWeek,
// } from "@schedule-x/calendar";
// import { createEventsServicePlugin } from "@schedule-x/events-service";
// import "@schedule-x/theme-default/dist/index.css"; // Import the default theme for styling

// interface CalendarViewProps {
//   timesheets: any[]; // Assuming timesheet data is passed here
// }

// const formatTime = (date: string) => {
//   const d = new Date(date);
//   const hours = String(d.getHours()).padStart(2, "0");
//   const minutes = String(d.getMinutes()).padStart(2, "0");
//   const seconds = String(d.getSeconds()).padStart(2, "0");
//   return `${hours}:${minutes}:${seconds}`;
// };

// const CalendarView: React.FC<CalendarViewProps> = ({ timesheets }) => {
//   const [eventsService] = useState(() => createEventsServicePlugin());

//   // Format the timesheet events into the format required by the calendar
//   // Correctly format the start and end times as ISO strings including the timezone

//   const formattedEvents = timesheets.map((timesheet) => ({
//     id: timesheet.id,
//     title: timesheet.summary,
//     start: formatTime(timesheet.start_time), // Format as HH:mm:ss
//     end: formatTime(timesheet.end_time), // Format as HH:mm:ss
//   }));

//   const calendar = useCalendarApp({
//     views: [
//       createViewDay(),
//       createViewWeek(),
//       createViewMonthGrid(),
//       createViewMonthAgenda(),
//     ],
//     events: formattedEvents,
//     plugins: [eventsService],
//   });

//   useEffect(() => {
//     // Load all events into the events service when the component mounts
//     eventsService.getAll();
//   }, [eventsService]);

//   return (
//     <div className="calendar-view">
//       <ScheduleXCalendar calendarApp={calendar} />
//     </div>
//   );
// };

// export default CalendarView;

import React, { useState, useEffect } from "react";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import {
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import "@schedule-x/theme-default/dist/index.css"; // Import the default theme for styling

interface CalendarViewProps {
  timesheets: any[]; // Assuming timesheet data is passed here
}

const formatDateTime = (date: string) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const CalendarView: React.FC<CalendarViewProps> = ({ timesheets }) => {
  const [eventsService] = useState(() => createEventsServicePlugin());

  // Format the timesheet events into the format required by the calendar
  const formattedEvents = timesheets.map((timesheet) => ({
    id: timesheet.id,
    title: timesheet.summary,
    start: formatDateTime(timesheet.start_time), // Format as yyyy-MM-dd HH:mm
    end: formatDateTime(timesheet.end_time), // Format as yyyy-MM-dd HH:mm
  }));

  const calendar = useCalendarApp({
    views: [
      createViewDay(),
      createViewWeek(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    events: formattedEvents,
    plugins: [eventsService],
  });

  useEffect(() => {
    // Load all events into the events service when the component mounts
    eventsService.getAll();
  }, [eventsService]);

  return (
    <div className="calendar-view">
      <ScheduleXCalendar calendarApp={calendar} />
    </div>
  );
};

export default CalendarView;
