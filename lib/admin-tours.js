// Guided tours shown inside the admin. Each step points at a real element (a CSS selector) on the page.
// A step with no target is shown in the middle of the screen. Steps whose target is not on the page are skipped.

export const TOURS = {
  home: {
    path: '/admin',
    exact: true,
    steps: [
      { title: 'Welcome to your admin', text: 'This is where you run your store: orders, products, client requests and bookings. This quick tour takes about a minute. You can skip it any time.' },
      { target: '.admin-sidebar', place: 'right', title: 'Your menu', text: 'Everything lives in this menu on the left. Click a name to open that part of the admin.' },
      { target: 'a[href="/admin/orders"]', place: 'right', title: 'Orders', text: 'Every paid order appears here. Open one to mark it shipped and add tracking.' },
      { target: 'a[href="/admin/inquiries"]', place: 'right', title: 'Customer requests', text: 'Client bookings, questions and messages arrive here. This is also where you choose when clients can book.' },
      { target: 'a[href="/admin/products"]', place: 'right', title: 'Products', text: 'Add and edit your pieces. You can also show a piece with no price, so clients enquire instead.' },
      { target: '.admin-global-search', place: 'bottom', title: 'Search', text: 'Looking for a client, a piece or a page? Type here from any screen.' },
      { target: '.admin-topbar__help', place: 'bottom', title: 'Help is always here', text: 'This button opens a step-by-step guide for the page you are on.' },
      { target: '.admin-topbar__store', place: 'bottom', title: 'See your website', text: 'Open your live website in a new tab to check how a change looks.' },
      { title: 'You are ready', text: 'To go through the setup steps one by one, open Help & guides and follow the checklist. You can replay this tour from there too.' },
    ],
  },
  requests: {
    path: '/admin/inquiries',
    steps: [
      { title: 'Customer requests', text: 'Every booking, question and message from a client arrives on this page. Here is a quick look around.' },
      { target: '.admin-view-tabs', place: 'bottom', title: 'Two tabs', text: 'Customer inquiries is your inbox. Customer appointments is where you choose your hours and see upcoming bookings.' },
      { target: '.requests-toolbar', place: 'bottom', title: 'Find a request', text: 'Search by name or email, or narrow the list by type and status, then press Apply.' },
      { target: '.admin-table-card', place: 'top', title: 'The list', text: 'Newest first. The Appointment time column shows when a client wants to meet. Click Open on a row to read it, reply and confirm.' },
    ],
  },
  appointments: {
    path: '/admin/appointments',
    steps: [
      { title: 'Choose when clients can book', text: 'The calendar on your website shows only the days and times you set here. Let us look at each part.' },
      { target: '.avail-switch', place: 'left', title: 'On and off', text: 'Turn this off to pause all online booking, for example while you travel.' },
      { target: '.avail-days', place: 'bottom', title: 'Your working days', text: 'Tap a day to open or close it. Green means you take clients that day.' },
      { target: '.avail-times', place: 'bottom', title: 'Your times', text: 'Add a time, or remove one with its cross. These apply to every open day.' },
      { target: '.avail-grid', place: 'top', title: 'Booking rules', text: 'How much notice you need and how far ahead clients can book.' },
      { target: '.avail-save', place: 'top', title: 'Press Save', text: 'Nothing changes on your website until you press Save availability.' },
      { target: '.admin-bookings', place: 'left', title: 'Upcoming bookings', text: 'Everyone who has booked is listed here. Open one to confirm it or move it to another time.' },
    ],
  },
};

export function tourForPath(pathname) {
  const clean = String(pathname || '').replace(/\/$/, '') || '/admin';
  return Object.entries(TOURS).find(([, tour]) => clean === tour.path) || null;
}
