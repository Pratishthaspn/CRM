import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getInteractions,
  getCustomerInteractions,
  createInteraction,
  deleteInteraction,
  getFollowups,
  getCustomerFollowups,
  createFollowup,
  updateFollowup,
  toggleFollowupStatus,
  deleteFollowup,
  getDashboardData,
  getReportsData,
  getSettings,
  updateSettings,
  resetDatabase
} from './src/models.js';

declare module 'express-session' {
  interface SessionData {
    flash?: { category: string; message: string }[];
  }
}

interface RequestWithFlash extends Request {
  flash?: (category: string, message: string) => void;
}

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

function parseId(param: string | string[] | undefined): number {
  if (Array.isArray(param)) return parseInt(param[0], 10);
  return parseInt(param || '0', 10);
}

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Body parsing and sessions
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SECRET_KEY || 'crm-college-project-secret-2026',
    resave: false,
    saveUninitialized: true
  })
);

// Static assets
app.use('/static/css', express.static(path.join(process.cwd(), 'public/css')));
app.use('/static/js', express.static(path.join(process.cwd(), 'public/js')));
app.use(express.static(path.join(process.cwd(), 'public')));

// Template filters and helpers
app.locals.badgeColor = function (status: string | undefined): string {
  const map: Record<string, string> = {
    active: 'badge-active',
    inactive: 'badge-inactive',
    pending: 'badge-pending',
    completed: 'badge-completed',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low'
  };
  return map[String(status || '').toLowerCase()] || 'badge-default';
};

app.locals.getInitials = function (name: string | undefined): string {
  if (!name) return 'CR';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Flash messages middleware
app.use((req: RequestWithFlash, res: Response, next: NextFunction) => {
  res.locals.flashMessages = req.session.flash || [];
  req.session.flash = [];
  res.locals.settings = getSettings();
  req.flash = (category: string, message: string) => {
    if (!req.session.flash) req.session.flash = [];
    req.session.flash.push({ category, message });
  };
  next();
});

function validateCustomerForm(name: string, email: string, phone: string): string | null {
  if (!name || name.trim().length < 2) {
    return 'Customer full name is required (minimum 2 characters).';
  }
  const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!email || !emailPattern.test(email.trim())) {
    return 'Please enter a valid email address (e.g., name@example.com).';
  }
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 7) {
    return 'Please enter a valid phone number (at least 7 digits).';
  }
  return null;
}

// ---------------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------------
app.get('/', (req: Request, res: Response) => {
  res.redirect('/dashboard');
});

app.get('/dashboard', (req: Request, res: Response) => {
  const data = getDashboardData();
  const settings = getSettings();
  res.render('dashboard', { data, settings });
});

// ---------------------------------------------------------------------------
// CUSTOMERS CRUD
// ---------------------------------------------------------------------------
app.get('/customers', (req: Request, res: Response) => {
  const searchQuery = String(req.query.search || '').trim();
  const statusFilter = String(req.query.status || 'All').trim();
  const customers = getCustomers(searchQuery, statusFilter);
  const settings = getSettings();

  res.render('customers', {
    customers,
    searchQuery,
    statusFilter,
    settings
  });
});

app.post('/customers/add', (req: RequestWithFlash, res: Response) => {
  const { name, email, phone, company, address, status, notes } = req.body;
  const error = validateCustomerForm(name, email, phone);
  if (error) {
    req.flash?.('danger', error);
    return res.redirect('/customers');
  }

  const validStatus = ['Active', 'Inactive', 'Pending'].includes(status) ? status : 'Active';
  const newId = createCustomer(name, email, phone, company, address, validStatus, notes);
  req.flash?.('success', `Customer '${name}' added successfully! (ID: #CUST-${newId})`);
  res.redirect('/customers');
});

app.get('/customers/:id', (req: RequestWithFlash, res: Response) => {
  const customerId = parseId(req.params.id);
  const customer = getCustomerById(customerId);

  if (!customer) {
    req.flash?.('warning', `Customer ID #${customerId} was not found.`);
    return res.redirect('/customers');
  }

  const interactions = getCustomerInteractions(customerId);
  const followups = getCustomerFollowups(customerId);
  const settings = getSettings();

  res.render('customer_details', {
    customer,
    interactions,
    followups,
    settings
  });
});

app.post('/customers/edit/:id', (req: RequestWithFlash, res: Response) => {
  const customerId = parseId(req.params.id);
  const { name, email, phone, company, address, status, notes } = req.body;

  const error = validateCustomerForm(name, email, phone);
  const backUrl = req.get('Referrer') || `/customers/${customerId}`;
  if (error) {
    req.flash?.('danger', error);
    return res.redirect(backUrl);
  }

  const validStatus = ['Active', 'Inactive', 'Pending'].includes(status) ? status : 'Active';
  updateCustomer(customerId, name, email, phone, company, address, validStatus, notes);
  req.flash?.('success', `Customer details for '${name}' updated successfully.`);
  res.redirect(backUrl);
});

app.post('/customers/delete/:id', (req: RequestWithFlash, res: Response) => {
  const customerId = parseId(req.params.id);
  const customer = getCustomerById(customerId);
  const custName = customer ? customer.name : `#${customerId}`;

  deleteCustomer(customerId);
  req.flash?.('info', `Customer '${custName}' deleted.`);
  res.redirect('/customers');
});

// ---------------------------------------------------------------------------
// INTERACTIONS
// ---------------------------------------------------------------------------
app.get('/interactions', (req: Request, res: Response) => {
  const typeFilter = String(req.query.type || 'All').trim();
  const interactions = getInteractions(typeFilter);
  const customers = getCustomers();
  const settings = getSettings();

  res.render('interactions', {
    interactions,
    typeFilter,
    customers,
    settings
  });
});

app.post('/interactions/add', (req: RequestWithFlash, res: Response) => {
  const { customer_id, type, description, interaction_date, follow_up_date } = req.body;
  const backUrl = req.get('Referrer') || '/interactions';

  if (!customer_id) {
    req.flash?.('danger', 'Please select a valid customer.');
    return res.redirect(backUrl);
  }
  if (!description || !description.trim()) {
    req.flash?.('danger', 'Please provide brief notes/description for the interaction.');
    return res.redirect(backUrl);
  }

  const validTypes = ['Call', 'Email', 'Meeting', 'WhatsApp', 'Other'];
  const interType = validTypes.includes(type) ? type : 'Call';

  createInteraction(
    parseInt(String(customer_id), 10),
    interType,
    description,
    interaction_date || undefined,
    follow_up_date || null
  );

  req.flash?.('success', 'Interaction logged successfully.');
  res.redirect(backUrl);
});

app.post('/interactions/delete/:id', (req: RequestWithFlash, res: Response) => {
  const interactionId = parseId(req.params.id);
  deleteInteraction(interactionId);
  req.flash?.('info', 'Interaction deleted.');
  res.redirect(req.get('Referrer') || '/interactions');
});

// ---------------------------------------------------------------------------
// FOLLOW-UPS
// ---------------------------------------------------------------------------
app.get('/followups', (req: Request, res: Response) => {
  const statusFilter = String(req.query.status || 'All').trim();
  const followups = getFollowups(statusFilter);
  const customers = getCustomers();
  const settings = getSettings();

  res.render('followups', {
    followups,
    statusFilter,
    customers,
    settings
  });
});

app.post('/followups/add', (req: RequestWithFlash, res: Response) => {
  const { customer_id, reason, follow_up_date, priority } = req.body;
  const backUrl = req.get('Referrer') || '/followups';

  if (!customer_id) {
    req.flash?.('danger', 'Please select a customer for this follow-up.');
    return res.redirect(backUrl);
  }
  if (!reason || !reason.trim()) {
    req.flash?.('danger', 'Follow-up reason cannot be empty.');
    return res.redirect(backUrl);
  }
  if (!follow_up_date) {
    req.flash?.('danger', 'Please select a scheduled follow-up date.');
    return res.redirect(backUrl);
  }

  const validPriority = ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium';
  createFollowup(parseInt(String(customer_id), 10), reason, follow_up_date, validPriority, 'Pending');
  req.flash?.('success', 'Follow-up task scheduled successfully.');
  res.redirect(backUrl);
});

app.post('/followups/edit/:id', (req: RequestWithFlash, res: Response) => {
  const followupId = parseId(req.params.id);
  const { reason, follow_up_date, priority, status } = req.body;
  const backUrl = req.get('Referrer') || '/followups';

  if (!reason || !follow_up_date) {
    req.flash?.('danger', 'Reason and date are required.');
    return res.redirect(backUrl);
  }

  const validPriority = ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium';
  const validStatus = ['Pending', 'Completed'].includes(status) ? status : 'Pending';

  updateFollowup(followupId, reason, follow_up_date, validPriority, validStatus);
  req.flash?.('success', 'Follow-up updated successfully.');
  res.redirect(backUrl);
});

app.post('/followups/toggle/:id', (req: RequestWithFlash, res: Response) => {
  const followupId = parseId(req.params.id);
  const newStatus = toggleFollowupStatus(followupId);
  if (newStatus) {
    req.flash?.('success', `Follow-up marked as ${newStatus}!`);
  }
  res.redirect(req.get('Referrer') || '/followups');
});

app.post('/followups/delete/:id', (req: RequestWithFlash, res: Response) => {
  const followupId = parseId(req.params.id);
  deleteFollowup(followupId);
  req.flash?.('info', 'Follow-up deleted.');
  res.redirect(req.get('Referrer') || '/followups');
});

// ---------------------------------------------------------------------------
// REPORTS & ANALYTICS
// ---------------------------------------------------------------------------
app.get('/reports', (req: Request, res: Response) => {
  const reportsData = getReportsData();
  const settings = getSettings();
  res.render('reports', { reports: reportsData, settings });
});

app.get('/api/reports-data', (req: Request, res: Response) => {
  res.json(getReportsData());
});

// ---------------------------------------------------------------------------
// SETTINGS & DATABASE RESET
// ---------------------------------------------------------------------------
app.get('/settings', (req: Request, res: Response) => {
  const settings = getSettings();
  res.render('settings', { settings });
});

app.post('/settings', (req: RequestWithFlash, res: Response) => {
  const { business_name, owner_email, owner_phone, currency, theme } = req.body;
  updateSettings(
    business_name || 'CRM',
    owner_email || 'support@crm.local',
    owner_phone || '+91 98765 00000',
    currency || '₹',
    theme || 'light'
  );
  req.flash?.('success', 'Settings saved successfully.');
  res.redirect('/settings');
});

app.post('/reset-database', (req: RequestWithFlash, res: Response) => {
  resetDatabase();
  req.flash?.('info', 'Database successfully reset to initial realistic sample data!');
  res.redirect('/dashboard');
});

// ---------------------------------------------------------------------------
// PROJECT ZIP DOWNLOAD
// ---------------------------------------------------------------------------
app.get(['/download-project-zip', '/download-zip'], (req: Request, res: Response) => {
  const zip = new AdmZip();
  const baseDir = process.cwd();

  const filesToInclude = [
    'server.ts',
    'package.json',
    'tsconfig.json',
    'vercel.json',
    'README.md',
    'src/models.ts',
    'public/css/style.css',
    'public/js/script.js',
    'views/dashboard.ejs',
    'views/customers.ejs',
    'views/customer_details.ejs',
    'views/followups.ejs',
    'views/interactions.ejs',
    'views/reports.ejs',
    'views/settings.ejs',
    'views/layout/header.ejs',
    'views/layout/footer.ejs'
  ];

  for (const rel of filesToInclude) {
    const full = path.join(baseDir, rel);
    if (fs.existsSync(full)) {
      zip.addLocalFile(full, path.dirname('crm_project/' + rel));
    }
  }

  const zipBuffer = zip.toBuffer();
  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': 'attachment; filename="CRM_Project.zip"'
  });
  res.send(zipBuffer);
});

// Start Server
app.listen(PORT, HOST, () => {
  console.log(`CRM Application listening on http://${HOST}:${PORT}`);
});

export default app;
export { app };
