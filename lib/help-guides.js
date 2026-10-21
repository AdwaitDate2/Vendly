// Content for Admin → Help & guides. Plain text only, so it can be edited without touching the screens.
// `layout` picks the drawing in HelpSketch; `parts` are explained in order and match the numbered pins:
//   list:      1 search/filters, 2 the table, 3 row actions, 4 page footer
//   form:      1 main details, 2 second card, 3 side panel, 4 save bar
//   cards:     1 top actions, 2 the cards, 3 one card's controls
//   settings:  1 first card, 2 second card, 3 third card, 4 save button
//   dashboard: 1 summary tiles, 2 chart or table, 3 latest activity

export const HELP_GROUPS = [
  { key: 'sell', title: 'Sell' },
  { key: 'clients', title: 'Clients' },
  { key: 'website', title: 'Your website' },
  { key: 'setup', title: 'Store setup' },
  { key: 'safety', title: 'Team and safety' },
];

export const CHECKLIST = [
  { id: 'store', title: 'Check your store details', text: 'Name, contact email and address.', slug: 'settings', href: '/admin/settings' },
  { id: 'notify', title: 'Choose who gets emailed', text: 'New request and order alerts.', slug: 'settings', href: '/admin/settings' },
  { id: 'theme', title: 'Pick your website colours', text: 'Preview, then save.', slug: 'theme', href: '/admin/theme' },
  { id: 'media', title: 'Upload your photos', text: 'Add pictures and videos to the Media library.', slug: 'media', href: '/admin/media' },
  { id: 'collections', title: 'Create your collections', text: 'The groups shoppers browse by.', slug: 'collections', href: '/admin/collections' },
  { id: 'product', title: 'Add your first product', text: 'Photos, price and description.', slug: 'products', href: '/admin/products/new' },
  { id: 'booking', title: 'Set when clients can book', text: 'Your days, times and days off.', slug: 'appointments', href: '/admin/appointments' },
  { id: 'policies', title: 'Review your policies', text: 'Shipping, returns and privacy pages.', slug: 'policies', href: '/admin/policies' },
  { id: 'team', title: 'Add a teammate', text: 'Optional. Give them their own sign-in.', slug: 'team', href: '/admin/team' },
];

export const HELP_GUIDES = [
  {
    slug: 'dashboard', title: 'Home', group: 'sell', path: '/admin', who: 'Owners and editors',
    summary: 'Your daily overview: how the shop is doing and what needs attention.',
    layout: 'dashboard',
    parts: [
      { label: "Today at a glance", text: "Four boxes: new requests waiting for you, orders to make and ship, requests you are working on, and how many products are on your website. Click the blue link in a box to go there.", at: {"x": 21.8, "y": 14.6} },
      { label: "Sales, last 30 days", text: "How much you sold, how many orders, and the average order. The line underneath shows your busiest days.", at: "card 1" },
      { label: "Latest requests", text: "The newest bookings and messages from clients. Click one to open it.", at: {"x": 21.8, "y": 55.5} },
      { label: "Quick links", text: "Shortcuts for common jobs, like adding a product or editing the homepage.", at: {"x": 70.2, "y": 55.5} },
    ],
    tasks: [
      { title: 'Start your day', steps: ['Open Home. It is the first item in the left menu.', 'Look at the numbers at the top for the last 30 days.', 'Click anything in the latest list to open it and deal with it.'] },
    ],
    tips: ['Anything marked New in Customer requests is waiting for a reply.'],
    faqs: [['The numbers look empty.', 'They fill in as orders and requests arrive. A brand-new store starts at zero.']],
  },
  {
    slug: 'orders', title: 'Orders', group: 'sell', path: '/admin/orders', who: 'Owners and editors',
    summary: 'Every paid order from the website, from payment to delivery.',
    layout: 'list',
    parts: [
      { label: "Views", text: "Switch between All orders, ones not yet started, ones being made, ones shipped, and Abandoned checkouts (people who started but did not pay).", at: "tabs 1" },
      { label: "Search", text: "Type an order number, a name, an email or a product name, then press Search.", at: "search 1" },
      { label: "Your orders", text: "Newest first. You can see the date, who ordered, the total, whether it is paid, and where it is up to. Click an order to open it.", at: "table 1" },
      { label: "Pages", text: "Use the arrows to see older orders.", at: "footer 1" },
    ],
    tasks: [
      { title: 'Process a new order', steps: ['Open Orders and click the newest order.', 'Check the Items, Customer and Shipping boxes.', 'When work starts, set the shipping state to In production.', 'When it ships, press Mark as shipped and enter the tracking number. The client is emailed.', 'If the tracking number changes, press Update tracking.', 'After delivery, set it to Delivered.'] },
      { title: 'Follow up an abandoned checkout', steps: ['Open Orders and switch to the Abandoned view.', 'Find the client and email them kindly from your own mail.'] },
      { title: 'Add a note, cancel or refund', steps: ['Open the order. Use Add note for a private message to your team.', 'To stop an order, use Cancel order at the bottom.', 'Refunds are limited to the amount still refundable. Only owners can refund.'] },
    ],
    tips: ['Made-to-order pieces take 5–7 weeks, so In production is the state they sit in longest.', 'Use Add note on an order to leave a private message for your team.'],
    faqs: [['Who sees the tracking number?', 'The client, in the shipping email. Check it before you save.'], ['Can editors refund?', 'No. Refunds are for owners.']],
  },
  {
    slug: 'products', title: 'Products', group: 'sell', path: '/admin/products', who: 'Owners and editors',
    summary: 'Add, edit and organise the pieces on your website.',
    layout: 'list',
    parts: [
      { label: "Add product", text: "Press this to add a new piece to your website.", at: "headbtn 4" },
      { label: "Bulk edit and Import", text: "Bulk edit changes many products in one table. Import adds many from a spreadsheet. Export downloads your list.", at: "headbtn 3" },
      { label: "Search and views", text: "Find a piece by name, or look only at Published, Draft or Archived pieces.", at: "tabs 1" },
      { label: "Your products", text: "Every piece with its collection, price and whether it is live. Click Edit to change one.", at: "table 1" },
    ],
    tasks: [
      { title: 'Add a product', steps: ['Click Products, then Add product.', 'Fill in the title, description, metal, stone and the collection.', 'Add photos (drag them in, or pick from Media).', 'Under How is this piece sold?, choose Sell online and set the price for each metal option, or choose Catalogue — enquiry only for no price.', 'Set Status to Published when you are ready, then save.'] },
      { title: 'Change what a product page shows', steps: ['Open the product.', 'Find Details, care & shipping text.', 'Untick any section you want to hide, or edit the wording for just this piece.'] },
      { title: 'Edit many products at once', steps: ['On the Products page press Bulk edit.', 'Change titles, prices or status in the table.', 'Save when finished.'] },
      { title: 'Import from a spreadsheet', steps: ['On the Products page press Import.', 'Step 1: download the template.', 'Step 2: fill it in and upload it as a CSV file.', 'Step 3: review the preview, then import.'] },
    ],
    tips: ['Leave a product on Draft while you work. Only Published pieces show on the website.', 'Archiving hides a product but keeps its history. Deleting is owner-only.'],
    faqs: [['Why is my piece not on the website?', 'Check its Status is Published and that it has at least one photo.'], ['Where do I set stock?', 'In Inventory.']],
  },
  {
    slug: 'catalogue', title: 'Catalogue-only pieces', group: 'sell', path: '/admin/products', who: 'Owners and editors',
    summary: 'Show a piece with no price. Clients ask you about it instead of buying.',
    layout: 'form',
    parts: [
      { label: "Details, care & shipping text", text: "Choose which sections show on this piece, and change the wording for this piece only.", at: {"x": 21.3, "y": 28.5} },
      { label: "How is this piece sold?", text: "Choose Sell online, or Catalogue \u2014 enquiry only for a piece with no price.", at: "admin-sale-mode" },
      { label: "Status and collection", text: "Set the piece to Published when it is ready. It stays hidden while it is a Draft.", at: "sidecard 1" },
      { label: "Save changes", text: "Nothing changes on your website until you press this.", at: "footer 1" },
    ],
    tasks: [
      { title: 'Make a piece enquiry-only', steps: ['Open the product.', 'In How is this piece sold?, choose Catalogue — enquiry only.', 'Save.', 'On the website the piece shows Price on request and an Enquire about this piece form.'] },
      { title: 'Answer an enquiry', steps: ['Open Customer requests.', 'Filter Type to Piece enquiries.', 'Open one, read it, and reply from the Reply box.'] },
    ],
    tips: ['If you switch a piece back to Sell online, check its prices. They may now read $0.'],
    faqs: [['Can shoppers still buy it?', 'No. There is no Add to bag button, and checkout refuses it.']],
  },
  {
    slug: 'collections', title: 'Collections', group: 'sell', path: '/admin/collections', who: 'Owners and editors',
    summary: 'The groups shoppers browse by, such as Rings or Bridal.',
    layout: 'cards',
    parts: [
      { label: "Add collection", text: "Creates a new group, like Rings or Bridal.", at: "headbtn 1" },
      { label: "Views", text: "Show all collections, or only Published, Draft or Archived ones.", at: "tabs 1" },
      { label: "Your collections", text: "Shown in the order set by their Sort order number. Lower numbers come first.", at: "table 1" },
      { label: "Edit", text: "Opens a collection so you can change its name, photo, note and Sort order.", at: "rowaction 1" },
    ],
    tasks: [
      { title: 'Create a collection', steps: ['Open Collections and press New collection.', 'Give it a name and a photo.', 'Add a short note if you like.', 'Set it to Published and save.'] },
      { title: 'Change the order', steps: ['Open the collection.', 'Change Sort order. Lower numbers appear first.', 'Save.'] },
    ],
    tips: ['A collection with no published products still shows, so publish products too.'],
    faqs: [['Can a piece be in two collections?', 'Each piece belongs to one collection.']],
  },
  {
    slug: 'inventory', title: 'Inventory', group: 'sell', path: '/admin/inventory', who: 'Owners and editors',
    summary: 'Stock levels for each metal option, and low-stock alerts.',
    layout: 'list',
    parts: [
      { label: "Read this first", text: "Made-to-order pieces can always be bought, so their stock is just for your records.", at: {"x": 21.3, "y": 21.5} },
      { label: "Search and views", text: "Find a piece or SKU, or see only Published, Draft or Archived items. Low stock shows items running out.", at: "search 1" },
      { label: "Stock table", text: "One row for every metal option, with how many you have and when you are warned.", at: "table 1" },
      { label: "Update stock", text: "Choose Add, Remove or Set, type a number, then press Save on that row.", at: {"x": 75.8, "y": 41.5} },
    ],
    tasks: [
      { title: 'Change stock', steps: ['Open Inventory and click the item.', 'Enter the new count or the amount to add or remove.', 'Add a short reason and save. It is recorded in the history.'] },
    ],
    tips: ['Made-to-order pieces can always be bought, so stock there is just for your records. Ready-to-ship pieces sell out at zero.'],
    faqs: [['What is the low-stock alert?', 'A number you choose. At or below it, the item is flagged.']],
  },
  {
    slug: 'discounts', title: 'Discounts', group: 'sell', path: '/admin/discounts', who: 'Owners and editors',
    summary: 'Codes shoppers enter at checkout, as a percentage or a fixed amount.',
    layout: 'list',
    parts: [
      { label: "Create discount", text: "Press this to make a new code.", at: "button 1" },
      { label: "Your codes", text: "Each code with what it takes off, whether it is active, how often it has been used and when it ends.", at: "table 1" },
      { label: "Edit or Delete", text: "Change a code, or remove it.", at: "rowaction 1" },
    ],
    tasks: [
      { title: 'Create a code', steps: ['Open Discounts.', 'Type the Code, for example WELCOME10.', 'Choose Type: percentage or fixed amount, and set the value.', 'Optionally set a Minimum order and Total uses allowed.', 'Make sure Code is turned on and save.'] },
    ],
    tips: ['Turn a code off instead of deleting it, so you keep its history.'],
    faqs: [['A client says their code failed.', 'Check it is turned on, has uses left, and the order meets the minimum.']],
  },
  {
    slug: 'requests', title: 'Customer requests', group: 'clients', path: '/admin/inquiries', who: 'Owners and editors',
    summary: 'One inbox for bookings, bespoke inquiries, piece enquiries and messages.',
    layout: 'list',
    parts: [
      { label: "Two tabs", text: "Customer inquiries is your inbox. Customer appointments is where you set your hours.", at: "tabs 1" },
      { label: "Search and filters", text: "Find a client by name or email. Narrow the list by Type and Status, then press Apply.", at: "search 1" },
      { label: "The list", text: "Who wrote, what kind of request, the booked time (if any), and its status. Click Open to read and reply.", at: "table 1" },
    ],
    detail: {
      shot: 'request-detail',
      title: 'Inside one request',
      parts: [
        { label: 'Contact and request', text: 'Who they are, how to reach them, and what they wrote.', at: 'card 1' },
        { label: 'Appointment', text: 'Only on bookings. Confirm, move, decline or complete it here.', at: 'card 2' },
        { label: 'Reply', text: 'Write to the client right here. They get it as a normal email.', at: 'card 3' },
        { label: 'History', text: 'A record of everything that happened, so your team can see it too.', at: 'card 4' },
        { label: 'Follow-up', text: 'Your own status, reminders and private notes. The client never sees these.', at: 'card 5' },
      ],
    },
    tasks: [
      { title: 'Reply to a client', steps: ['Open Customer requests and click Open on a row.', 'Read their details and message.', 'In Reply, check the subject, write your message and press Send email.', 'When it is finished, set Status to Closed and press Save follow-up.'] },
      { title: 'Keep track of work', steps: ['In Follow-up on the right, set a status.', 'Add an assignee, a next follow-up date and private notes.', 'Press Save follow-up. Clients never see these.'] },
    ],
    tips: ['New means nobody has looked yet. In progress means you are on it. Closed means finished.', 'Closed and Spam give any held appointment time back to the calendar.'],
    faqs: [['The client did not get my reply.', 'If email is not connected, replies are only recorded. Ask your developer to switch email on.']],
  },
  {
    slug: 'appointments', title: 'Appointments and availability', group: 'clients', path: '/admin/appointments', who: 'Owners and editors',
    summary: 'Choose when clients can book, and confirm or move bookings.',
    layout: 'settings',
    parts: [
      { label: "Accepting bookings", text: "The on/off switch for online booking. Turn it off while you are away.", at: "avail-switch" },
      { label: "Working days and times", text: "Tap a day to open or close it (green is open). Add or remove your times underneath.", at: "avail-days" },
      { label: "Booking rules", text: "Timezone, how much notice you need, how far ahead clients can book, and how many at once.", at: "avail-grid" },
      { label: "Save availability", text: "Press this for your changes to reach the website calendar.", at: "avail-save" },
    ],
    tasks: [
      { title: 'Set your hours', steps: ['Open Customer requests, then the Customer appointments tab.', 'Tap the days you work. Green means open.', 'Add or remove times.', 'Press Save availability.'] },
      { title: 'Close a day', steps: ['Under Days off and special days pick the date.', 'Press Add date and leave it with no times.', 'Press Save availability.'] },
      { title: 'Confirm or move a booking', steps: ['Open the booking from Customer requests.', 'Press Confirm appointment to email the client.', 'Or press Reschedule, pick a new date and time, then Move and confirm.', 'Or press Decline to give the time back.'] },
      { title: 'Pause all booking', steps: ['At the top, switch off Accepting bookings.', 'Visitors are asked to email you. Switch it back on later.'] },
    ],
    tips: ['A booked time disappears from the website calendar automatically.', 'Untick Email the client about this change to make a quiet change.'],
    faqs: [['Can I book a time that is not open?', 'Add it first as a special day, then reschedule.']],
  },
  {
    slug: 'customers', title: 'Customers', group: 'clients', path: '/admin/customers', who: 'Owners and editors',
    summary: 'Everyone who has placed an order, with their history and your notes.',
    layout: 'list',
    parts: [
      { label: "Search", text: "Find someone by name, email or phone.", at: "search 1" },
      { label: "Customer list", text: "Everyone who has ordered, with where they live, how many orders, and how much they spent.", at: "table 1" },
      { label: "Open or Delete", text: "Open to see their orders and add private notes. Delete is for owners.", at: "rowaction 1" },
    ],
    tasks: [{ title: 'Add a note about a customer', steps: ['Open Customers and click the person.', 'Write in Notes, for example a ring size or a preference.', 'Save. Only your team sees notes.'] }],
    tips: ['Appointment requests are not customers. They stay in Customer requests until someone orders.'],
    faqs: [['A client asked to be removed.', 'Owners can delete a customer. It stays in Recently deleted for 90 days.']],
  },
  {
    slug: 'subscribers', title: 'Subscribers', group: 'clients', path: '/admin/subscribers', who: 'Owners and editors',
    summary: 'People who signed up for your newsletter, with their consent recorded.',
    layout: 'list',
    parts: [
      { label: "Search", text: "Find a newsletter signup by email.", at: "search 1" },
      { label: "Views", text: "See everyone, only people subscribed, unsubscribed, or whose email bounced.", at: "tabs 1" },
      { label: "Subscriber list", text: "Each person with where they signed up and when they gave consent.", at: "table 1" },
    ],
    tasks: [{ title: 'Remove a subscriber', steps: ['Open Subscribers and search for the email.', 'Choose Delete on the row.', 'Owners only. You can restore it for 90 days from Recently deleted.'] }],
    tips: ['Only people who ticked consent are on this list.'],
    faqs: [['Where do these emails go?', 'To your connected email marketing tool, if one is set up.']],
  },
  {
    slug: 'pages', title: 'Pages and content', group: 'website', path: '/admin/content', who: 'Owners and editors',
    summary: 'Edit the words, pictures and menus on your website pages.',
    layout: 'form',
    parts: [
      { label: "Add page", text: "Creates a brand-new page on your website, for example a landing page.", at: "headbtn 1" },
      { label: "Website pages", text: "Your main pages: Homepage, Our Story, FAQ, Bridal, Shop and more. Click Edit on a row to change the words and pictures.", at: "table 1" },
      { label: "Policies", text: "A shortcut to your legal pages.", at: "card 3" },
      { label: "Menus and site-wide text", text: "The header and footer menus, the announcement bar at the top, and the thank-you message after an enquiry.", at: "table 2" },
    ],
    tasks: [
      { title: 'Change the words on a page', steps: ['Open Pages & content.', 'Find the page under Website pages and press Edit.', 'Change the text or pictures. A live preview shows your change.', 'Press Save when you are happy. Nothing goes live until you do.'] },
      { title: 'Change the menu or the announcement bar', steps: ['Scroll to Menus & site-wide text.', 'Press Edit on Navigation for the menus, or Site-wide text for the announcement bar.', 'Make your change and Save.'] },
      { title: 'Make a new page', steps: ['Press Add page at the top right.', 'Give it a title and add your content.', 'Save, then add a link to it in Navigation if you want it in the menu.'] },
    ],
    tips: ['Nothing goes live until you press Save.'],
    faqs: [['I saved but do not see it.', 'Refresh the website page. If it still looks old, wait a minute and refresh again.']],
  },
  {
    slug: 'policies', title: 'Policies', group: 'website', path: '/admin/policies', who: 'Owners and editors',
    summary: 'Shipping, returns, privacy and other legal pages, edited like a document.',
    layout: 'form',
    parts: [
      { label: "Your policies", text: "Privacy, Terms, Shipping & Returns, Repairs & Care, Cookies, Privacy choices and Accessibility.", at: "table 1" },
      { label: "Status", text: "Live means it can be seen on your website.", at: {"x": 51.5, "y": 21} },
      { label: "Edit", text: "Opens the policy like a document so you can change the wording.", at: "rowaction 1" },
    ],
    tasks: [{ title: 'Update a policy', steps: ['Open Policies and click the policy.', 'Edit the text.', 'Save. It updates in the website footer links.'] }],
    tips: ['Ask a lawyer to review wording for returns and privacy.'],
    faqs: [['Where do shoppers find these?', 'In the footer of every page.']],
  },
  {
    slug: 'theme', title: 'Theme', group: 'website', path: '/admin/theme', who: 'Owners only',
    summary: 'The colours used across the whole website.',
    layout: 'settings',
    parts: [
      { label: "Colours", text: "Seven colours build the whole website. Click a colour or type a code to change it.", at: "card 1" },
      { label: "Live preview", text: "Pick a page to see how it looks. Only you can see this until you save.", at: {"x": 55.5, "y": 14.5} },
      { label: "Reset", text: "Goes back to the original byShreen colours.", at: "button 1" },
      { label: "Save theme", text: "Makes your colours live on the website.", at: "button 2" },
    ],
    tasks: [{ title: 'Change a colour', steps: ['Open Theme.', 'Click a colour and choose a new one.', 'Check the preview.', 'Press Save theme.'] }],
    tips: ['Keep text and background far apart in lightness so it stays readable.'],
    faqs: [['I do not like my change.', 'Press Discard changes before you save.']],
  },
  {
    slug: 'emails', title: 'Email templates', group: 'website', path: '/admin/emails', who: 'Owners only',
    summary: 'The emails your website sends to clients and to you.',
    layout: 'cards',
    parts: [
      { label: "Email design", text: "Your logo and colours, used in every email. Press Save design when you change them.", at: "card 1" },
      { label: "Preview", text: "Shows how an email will look to a client.", at: {"x": 60.5, "y": 14.2} },
      { label: "Your emails", text: "Each email the website sends, with its subject and whether it is On. Click Edit to change the wording.", at: "table 1" },
    ],
    tasks: [{ title: 'Change an email', steps: ['Open Email templates and click the email.', 'Edit the subject and message.', 'Use the preview to see it.', 'Send yourself a test, then Save.'] }],
    tips: ['Always send yourself a test before saving a change.'],
    faqs: [['Emails are not arriving.', 'An email service must be connected. Ask your developer to check it.']],
  },
  {
    slug: 'media', title: 'Media', group: 'website', path: '/admin/media', who: 'Owners and editors',
    summary: 'Your library of photos and videos, ready to use on pages and products.',
    layout: 'cards',
    parts: [
      { label: "Upload photos or videos", text: "Choose files from your computer, or drag them onto the page.", at: {"x": 81.8, "y": 23.8} },
      { label: "Your uploads, Site photos, Site videos", text: "Your own uploads, plus the photos and videos already on the website.", at: {"x": 22.8, "y": 23.8} },
      { label: "Copy link or Delete", text: "Copy link lets you reuse a picture elsewhere. Delete removes it.", at: {"x": 29, "y": 63} },
    ],
    tasks: [{ title: 'Upload photos', steps: ['Open Media.', 'Press Upload photos or videos, or drop files on the page.', 'Wait for the upload to finish.', 'Use them from the picker on any product or page.'] }],
    tips: ['Use large, sharp photos. The website resizes them for you.'],
    faqs: [['Can I delete a photo that is in use?', 'The library shows where it is used, so remove it from there first.']],
  },
  {
    slug: 'instagram', title: 'Instagram', group: 'website', path: '/admin/instagram', who: 'Owners and editors',
    summary: 'The posts and reels in the Follow along section of your homepage.',
    layout: 'cards',
    parts: [
      { label: "Add a post or reel", text: "Paste the link you copied from Instagram and press Add to feed.", at: {"x": 22.8, "y": 9.5} },
      { label: "Your posts", text: "The posts on your homepage, in order. Drag, or use the arrows, to reorder.", at: {"x": 22.8, "y": 18.5} },
      { label: "Show, Reel and Remove", text: "Tick Show on website to display a post. Remove takes it off the list.", at: {"x": 35, "y": 29.5} },
    ],
    tasks: [{ title: 'Add a post', steps: ['On Instagram open the post, choose Share, then Copy link.', 'Open Instagram in the admin.', 'Paste the link under Add a post or reel.', 'Save.'] }],
    tips: ['Keep six or fewer posts so the section stays tidy.'],
    faqs: [['The post does not show.', 'Check the link is for a public post.']],
  },
  {
    slug: 'settings', title: 'Settings', group: 'setup', path: '/admin/settings', who: 'Owners only',
    summary: 'Store details, notifications, shipping, tax and shared product page text.',
    layout: 'settings',
    parts: [
      { label: "Store details", text: "Your store name, contact email, phone and address. Press Save store details.", at: "card 1" },
      { label: "Notifications", text: "Who is emailed when a request or order arrives, and which emails clients receive.", at: "card 2" },
      { label: "Integrations, shipping and tax", text: "Payments and email marketing connections, the shipping options shoppers see, and sales tax.", at: "card 3" },
      { label: "Product page text", text: "The shared care and shipping wording for every product page.", at: "card 6" },
    ],
    tasks: [
      { title: 'Choose who is emailed', steps: ['Open Settings.', 'Under Notifications add the email addresses.', 'Tick the alerts you want.', 'Press Save.'] },
      { title: 'Add a shipping option', steps: ['Open Settings and find Shipping rates.', 'Choose Add shipping rate.', 'Give it a name and a price. Use 0 for free.', 'Save shipping rates.'] },
      { title: 'Change shared product wording', steps: ['Find Product page text.', 'Edit the Care and Shipping text.', 'Save. Every product updates.'] },
    ],
    tips: ['Ask your accountant which states need sales tax.', 'Each card saves on its own, so press its own Save button.'],
    faqs: [['I cannot open Settings.', 'Settings is for owners.']],
  },
  {
    slug: 'team', title: 'Team', group: 'safety', path: '/admin/team', who: 'Owners only',
    summary: 'Who can sign in to the admin, and what they can do.',
    layout: 'list',
    parts: [
      { label: "Team members", text: "Everyone who can sign in, their role, and when they last signed in.", at: "card 1" },
      { label: "Role", text: "Owner can do everything. Editor cannot change settings, refund or delete.", at: {"x": 34.5, "y": 35.5} },
      { label: "Reset password or Deactivate", text: "Give someone a new password, or stop them signing in.", at: {"x": 76.8, "y": 35.5} },
      { label: "Add a team member", text: "Enter their name and email, choose a role, and press Add member.", at: "card 2" },
    ],
    tasks: [{ title: 'Add a teammate', steps: ['Open Team and find Add a team member.', 'Enter their name and email, and choose Editor or Owner.', 'Press Add member. A password is shown once. Copy it and send it to them privately.', 'They sign in at /admin/login with their email and that password.'] }],
    tips: ['Give people the smallest role that lets them do their job.'],
    faqs: [['Someone left the business.', 'Press Deactivate next to their name straight away.']],
  },
  {
    slug: 'activity', title: 'Activity log', group: 'safety', path: '/admin/audit-log', who: 'Owners and editors',
    summary: 'Who changed what, and when.',
    layout: 'list',
    parts: [
      { label: "Types of change", text: "Show only sign-ins, product changes, orders and so on.", at: "tabs 1" },
      { label: "Person", text: "See what one person did, then press Filter.", at: "button 1" },
      { label: "The log", text: "When it happened, who did it, and what they changed.", at: "table 1" },
    ],
    tasks: [{ title: 'Find out who changed something', steps: ['Open Activity log.', 'Scan for the item or filter by type.', 'Click the link to open it.'] }],
    tips: ['Times are New York time.'],
    faqs: [['Can I undo a change?', 'Not from here. For deletions, use Recently deleted.']],
  },
  {
    slug: 'deleted', title: 'Recently deleted', group: 'safety', path: '/admin/deleted', who: 'Owners only',
    summary: 'A safety net. Deleted items wait here for 90 days.',
    layout: 'list',
    parts: [
      { label: "Deleted items", text: "What was deleted, what kind of thing it was, and when.", at: "table 1" },
      { label: "Removed for good", text: "The date it disappears forever. Until then you can bring it back.", at: {"x": 68, "y": 27.5} },
      { label: "Restore", text: "Puts it back exactly as it was.", at: "rowaction 1" },
    ],
    tasks: [{ title: 'Bring something back', steps: ['Open Recently deleted.', 'Find the item.', 'Press Restore.'] }],
    tips: ['After 90 days an item is gone for good.'],
    faqs: [['Can editors restore?', 'No. Restoring and deleting are for owners.']],
  },
  {
    slug: 'search', title: 'Search the admin', group: 'safety', path: '/admin', who: 'Owners and editors',
    summary: 'The search box at the top finds products, pages and requests.',
    layout: 'list',
    parts: [
      { label: "Search box", text: "Type a name, a product or a word, then press Search. You can also use the search box at the top of any page.", at: {"x": 21.3, "y": 15} },
      { label: "Results", text: "Grouped into Products, Collections, Content and Inquiries. Click a result to open it.", at: {"x": 21.3, "y": 19.5} },
    ],
    tasks: [{ title: 'Find anything quickly', steps: ['Click the search box at the top of any admin page.', 'Type a few letters.', 'Press Enter and open a result.'] }],
    tips: ['Search by a client name to find their request or order.'],
    faqs: [['It finds nothing.', 'Try fewer letters or a different spelling.']],
  },
];

export function getGuide(slug) {
  return HELP_GUIDES.find((guide) => guide.slug === slug) || null;
}

/** Guide for an admin path, for the "Guide for this page" link. */
export function guideForPath(pathname) {
  const clean = String(pathname || '').replace(/\/$/, '') || '/admin';
  const rules = [
    ['/admin/products/new', 'products'], ['/admin/inquiries', 'requests'], ['/admin/appointments', 'appointments'],
    ['/admin/orders', 'orders'], ['/admin/products', 'products'], ['/admin/collections', 'collections'],
    ['/admin/inventory', 'inventory'], ['/admin/discounts', 'discounts'], ['/admin/customers', 'customers'],
    ['/admin/subscribers', 'subscribers'], ['/admin/content', 'pages'], ['/admin/policies', 'policies'],
    ['/admin/theme', 'theme'], ['/admin/emails', 'emails'], ['/admin/media', 'media'], ['/admin/instagram', 'instagram'],
    ['/admin/settings', 'settings'], ['/admin/team', 'team'], ['/admin/audit-log', 'activity'], ['/admin/deleted', 'deleted'],
    ['/admin/search', 'search'],
  ];
  const hit = rules.find(([prefix]) => clean === prefix || clean.startsWith(`${prefix}/`));
  return hit ? hit[1] : clean === '/admin' ? 'dashboard' : null;
}
