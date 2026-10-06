export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  status: 'Active' | 'Inactive' | 'Pending';
  notes: string;
  created_at: string;
  last_contact: string;
}

export interface Interaction {
  id: number;
  customer_id: number;
  type: 'Call' | 'Email' | 'Meeting' | 'WhatsApp' | 'Other';
  description: string;
  interaction_date: string;
  follow_up_date: string | null;
}

export interface Followup {
  id: number;
  customer_id: number;
  reason: string;
  follow_up_date: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Pending' | 'Completed';
}

export interface Settings {
  id: number;
  business_name: string;
  owner_email: string;
  owner_phone: string;
  currency: string;
  theme: string;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function pastDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDate(d);
}

function futureDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

let customers: Customer[] = [];
let interactions: Interaction[] = [];
let followups: Followup[] = [];
let settings: Settings = {
  id: 1,
  business_name: 'CRM Enterprises',
  owner_email: 'support@crm.local',
  owner_phone: '+91 98765 00000',
  currency: '₹',
  theme: 'light'
};

let nextCustomerId = 1;
let nextInteractionId = 1;
let nextFollowupId = 1;

export function resetDatabase() {
  customers = [
    {
      id: 1,
      name: "Aarav Sharma",
      email: "aarav.sharma@example.com",
      phone: "9876543210",
      company: "Sharma Electronics",
      address: "Shop 14, Lamington Road, Mumbai",
      status: "Active",
      notes: "High-value regional distributor for consumer electronics. Buys quarterly.",
      created_at: pastDays(45),
      last_contact: pastDays(2)
    },
    {
      id: 2,
      name: "Priya Patel",
      email: "priya.patel@example.com",
      phone: "9823456789",
      company: "Patel Organic Grocers",
      address: "Near SG Highway, Ahmedabad",
      status: "Active",
      notes: "Reliable monthly client. Interested in expanded organic grains catalogue.",
      created_at: pastDays(60),
      last_contact: pastDays(4)
    },
    {
      id: 3,
      name: "Rohan Mehta",
      email: "rohan.mehta@example.com",
      phone: "9712345678",
      company: "Mehta Logistics & Freight",
      address: "MIDC Phase II, Hinjewadi, Pune",
      status: "Pending",
      notes: "Evaluating fleet maintenance contract. Demo quotation sent last week.",
      created_at: pastDays(15),
      last_contact: pastDays(1)
    },
    {
      id: 4,
      name: "Ananya Iyer",
      email: "ananya.iyer@example.com",
      phone: "9934567890",
      company: "Craftisan Handmade Decor",
      address: "12th Main, Indiranagar, Bengaluru",
      status: "Active",
      notes: "Regular bulk buyer for festive corporate gifting packages.",
      created_at: pastDays(90),
      last_contact: pastDays(5)
    },
    {
      id: 5,
      name: "Vikram Singh",
      email: "vikram.singh@example.com",
      phone: "9654321098",
      company: "Singh Auto Components",
      address: "Mayapuri Industrial Area, New Delhi",
      status: "Inactive",
      notes: "Account paused due to inventory restructuring. Follow up next quarter.",
      created_at: pastDays(120),
      last_contact: pastDays(40)
    },
    {
      id: 6,
      name: "Neha Gupta",
      email: "neha.gupta@example.com",
      phone: "9845123456",
      company: "BrightPath Edutech Solutions",
      address: "Hitec City, Madhapur, Hyderabad",
      status: "Active",
      notes: "Procured software training licenses. Requested hardware quote.",
      created_at: pastDays(30),
      last_contact: pastDays(3)
    },
    {
      id: 7,
      name: "Rajesh Verma",
      email: "rajesh.verma@example.com",
      phone: "9765432109",
      company: "Verma Textile Mills",
      address: "Ring Road Market, Surat",
      status: "Pending",
      notes: "Sample fabric batch dispatched. Awaiting final quality check approval.",
      created_at: pastDays(10),
      last_contact: pastDays(2)
    },
    {
      id: 8,
      name: "Sneha Reddy",
      email: "sneha.reddy@example.com",
      phone: "9987654321",
      company: "Reddy Culinary & Catering",
      address: "TTK Road, Alwarpet, Chennai",
      status: "Active",
      notes: "Long-term client for commercial kitchen cutlery supplies.",
      created_at: pastDays(75),
      last_contact: pastDays(6)
    },
    {
      id: 9,
      name: "Aditya Joshi",
      email: "aditya.joshi@example.com",
      phone: "9811234567",
      company: "Zenith Creative Studio",
      address: "MI Road, C-Scheme, Jaipur",
      status: "Inactive",
      notes: "Completed brand design project in January. Re-engage for marketing.",
      created_at: pastDays(150),
      last_contact: pastDays(65)
    },
    {
      id: 10,
      name: "Kavita Nair",
      email: "kavita.nair@example.com",
      phone: "9871122334",
      company: "Greenfield Solar Power",
      address: "Kaloor Stadium Link Rd, Kochi",
      status: "Active",
      notes: "Rooftop solar panel maintenance partner. Very prompt payer.",
      created_at: pastDays(20),
      last_contact: pastDays(3)
    }
  ];
  nextCustomerId = 11;

  interactions = [
    { id: 1, customer_id: 1, type: "Call", description: "Discussed quarterly bulk order for smart switches and relays. Sent updated rate sheet.", interaction_date: pastDays(2), follow_up_date: futureDays(3) },
    { id: 2, customer_id: 1, type: "WhatsApp", description: "Shared revised PDF catalogue with festival wholesale discounts.", interaction_date: pastDays(8), follow_up_date: null },
    { id: 3, customer_id: 2, type: "Meeting", description: "In-person visit to retail outlet. Inspected cold storage inventory requirements.", interaction_date: pastDays(4), follow_up_date: futureDays(5) },
    { id: 4, customer_id: 2, type: "Email", description: "Emailed formal invoice copy for Order #PO-8821.", interaction_date: pastDays(12), follow_up_date: null },
    { id: 5, customer_id: 3, type: "Call", description: "Introductory discovery call regarding logistics partnership and SLA terms.", interaction_date: pastDays(1), follow_up_date: futureDays(2) },
    { id: 6, customer_id: 3, type: "Email", description: "Sent customized proposal presentation and rate card.", interaction_date: pastDays(5), follow_up_date: null },
    { id: 7, customer_id: 4, type: "WhatsApp", description: "Confirmed dispatch of 50 handmade ceramic showcase samples.", interaction_date: pastDays(5), follow_up_date: futureDays(7) },
    { id: 8, customer_id: 4, type: "Call", description: "Client requested urgent dispatch for additional 20 units.", interaction_date: pastDays(18), follow_up_date: null },
    { id: 9, customer_id: 5, type: "Call", description: "Status check on pending payments. Client requested 30 days extension.", interaction_date: pastDays(40), follow_up_date: null },
    { id: 10, customer_id: 6, type: "Meeting", description: "Virtual demo with IT training team. They appreciated the reporting features.", interaction_date: pastDays(3), follow_up_date: futureDays(4) },
    { id: 11, customer_id: 6, type: "Email", description: "Sent security compliance documentation and license agreements.", interaction_date: pastDays(9), follow_up_date: null },
    { id: 12, customer_id: 7, type: "WhatsApp", description: "Courier tracking number shared for sample swatches.", interaction_date: pastDays(2), follow_up_date: futureDays(1) },
    { id: 13, customer_id: 8, type: "Call", description: "Scheduled routine equipment servicing for next Tuesday.", interaction_date: pastDays(6), follow_up_date: futureDays(6) },
    { id: 14, customer_id: 9, type: "Email", description: "Followed up regarding annual website maintenance renewal.", interaction_date: pastDays(65), follow_up_date: null },
    { id: 15, customer_id: 10, type: "Meeting", description: "Site audit at Kochi solar farm. Signed annual maintenance contract.", interaction_date: pastDays(3), follow_up_date: futureDays(8) }
  ];
  nextInteractionId = 16;

  followups = [
    { id: 1, customer_id: 3, reason: "Confirm decision on proposal and finalize contract signing", follow_up_date: futureDays(2), priority: "High", status: "Pending" },
    { id: 2, customer_id: 7, reason: "Get confirmation on sample fabric quality and initial order quantity", follow_up_date: futureDays(1), priority: "High", status: "Pending" },
    { id: 3, customer_id: 1, reason: "Follow up on bulk order purchase order (PO) generation", follow_up_date: futureDays(3), priority: "Medium", status: "Pending" },
    { id: 4, customer_id: 6, reason: "Check if IT team reviewed the license agreement and security docs", follow_up_date: futureDays(4), priority: "Medium", status: "Pending" },
    { id: 5, customer_id: 2, reason: "Verify warehouse stock readiness for weekly organic dispatch", follow_up_date: futureDays(5), priority: "Low", status: "Pending" },
    { id: 6, customer_id: 8, reason: "Conduct scheduled routine maintenance on kitchen appliances", follow_up_date: futureDays(6), priority: "Medium", status: "Pending" },
    { id: 7, customer_id: 4, reason: "Confirm delivery receipt and client satisfaction with gift sets", follow_up_date: futureDays(7), priority: "Low", status: "Pending" },
    { id: 8, customer_id: 10, reason: "Verify advance token payment cleared for solar site", follow_up_date: futureDays(8), priority: "Medium", status: "Pending" },
    { id: 9, customer_id: 1, reason: "Send product catalogue PDF on WhatsApp", follow_up_date: pastDays(8), priority: "Low", status: "Completed" },
    { id: 10, customer_id: 2, reason: "Resolve duplicate billing query", follow_up_date: pastDays(14), priority: "High", status: "Completed" },
    { id: 11, customer_id: 6, reason: "Organize product walkthrough zoom call", follow_up_date: pastDays(10), priority: "Medium", status: "Completed" }
  ];
  nextFollowupId = 12;

  settings = {
    id: 1,
    business_name: 'CRM Enterprises',
    owner_email: 'support@crm.local',
    owner_phone: '+91 98765 00000',
    currency: '₹',
    theme: 'light'
  };
}

// Initialize on boot
resetDatabase();

// ===========================================================================
// CUSTOMER CRUD
// ===========================================================================
export function getCustomers(searchQuery?: string, statusFilter?: string): Customer[] {
  let list = [...customers];
  if (statusFilter && statusFilter.toLowerCase() !== 'all') {
    list = list.filter(c => c.status.toLowerCase() === statusFilter.toLowerCase());
  }
  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  }
  return list.sort((a, b) => b.id - a.id);
}

export function getCustomerById(id: number): Customer | undefined {
  return customers.find(c => c.id === id);
}

export function createCustomer(
  name: string,
  email: string,
  phone: string,
  company = '',
  address = '',
  status: 'Active' | 'Inactive' | 'Pending' = 'Active',
  notes = ''
): number {
  const id = nextCustomerId++;
  const today = formatDate(new Date());
  const newCustomer: Customer = {
    id,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    company: company.trim(),
    address: address.trim(),
    status,
    notes: notes.trim(),
    created_at: today,
    last_contact: today
  };
  customers.push(newCustomer);
  return id;
}

export function updateCustomer(
  id: number,
  name: string,
  email: string,
  phone: string,
  company: string,
  address: string,
  status: 'Active' | 'Inactive' | 'Pending',
  notes: string
): boolean {
  const c = customers.find(cust => cust.id === id);
  if (!c) return false;
  c.name = name.trim();
  c.email = email.trim();
  c.phone = phone.trim();
  c.company = company.trim();
  c.address = address.trim();
  c.status = status;
  c.notes = notes.trim();
  return true;
}

export function deleteCustomer(id: number): boolean {
  const index = customers.findIndex(c => c.id === id);
  if (index === -1) return false;
  customers.splice(index, 1);
  // Cascade delete interactions and followups
  interactions = interactions.filter(i => i.customer_id !== id);
  followups = followups.filter(f => f.customer_id !== id);
  return true;
}

// ===========================================================================
// INTERACTION CRUD
// ===========================================================================
export interface InteractionWithCustomer extends Interaction {
  customer_name: string;
  customer_company: string;
}

export function getInteractions(typeFilter?: string, limit?: number): InteractionWithCustomer[] {
  let list = interactions.map(i => {
    const cust = customers.find(c => c.id === i.customer_id);
    return {
      ...i,
      customer_name: cust ? cust.name : 'Unknown Customer',
      customer_company: cust ? cust.company : ''
    };
  });

  if (typeFilter && typeFilter.toLowerCase() !== 'all') {
    list = list.filter(i => i.type.toLowerCase() === typeFilter.toLowerCase());
  }

  list.sort((a, b) => {
    const dateComp = b.interaction_date.localeCompare(a.interaction_date);
    if (dateComp !== 0) return dateComp;
    return b.id - a.id;
  });

  if (limit) {
    list = list.slice(0, limit);
  }
  return list;
}

export function getCustomerInteractions(customerId: number): Interaction[] {
  return interactions
    .filter(i => i.customer_id === customerId)
    .sort((a, b) => {
      const dateComp = b.interaction_date.localeCompare(a.interaction_date);
      if (dateComp !== 0) return dateComp;
      return b.id - a.id;
    });
}

export function createInteraction(
  customerId: number,
  type: 'Call' | 'Email' | 'Meeting' | 'WhatsApp' | 'Other',
  description: string,
  interactionDate?: string,
  followUpDate?: string | null
): number {
  const id = nextInteractionId++;
  const date = interactionDate || formatDate(new Date());
  const item: Interaction = {
    id,
    customer_id: customerId,
    type,
    description: description.trim(),
    interaction_date: date,
    follow_up_date: followUpDate || null
  };
  interactions.push(item);

  // Update customer last_contact
  const cust = customers.find(c => c.id === customerId);
  if (cust) {
    cust.last_contact = date;
  }

  // If follow-up date specified, auto-schedule follow-up task
  if (followUpDate) {
    createFollowup(
      customerId,
      `Follow-up for ${type}: ${description.slice(0, 40)}...`,
      followUpDate,
      'Medium',
      'Pending'
    );
  }

  return id;
}

export function deleteInteraction(id: number): boolean {
  const index = interactions.findIndex(i => i.id === id);
  if (index === -1) return false;
  interactions.splice(index, 1);
  return true;
}

// ===========================================================================
// FOLLOW-UP CRUD
// ===========================================================================
export interface FollowupWithCustomer extends Followup {
  customer_name: string;
  customer_company: string;
  customer_phone: string;
}

export function getFollowups(statusFilter?: string, limit?: number): FollowupWithCustomer[] {
  let list = followups.map(f => {
    const cust = customers.find(c => c.id === f.customer_id);
    return {
      ...f,
      customer_name: cust ? cust.name : 'Unknown Customer',
      customer_company: cust ? cust.company : '',
      customer_phone: cust ? cust.phone : ''
    };
  });

  if (statusFilter && statusFilter.toLowerCase() !== 'all') {
    list = list.filter(f => f.status.toLowerCase() === statusFilter.toLowerCase());
  }

  list.sort((a, b) => {
    // Sort Pending first, then by date ASC
    if (a.status !== b.status) {
      return a.status === 'Pending' ? -1 : 1;
    }
    return a.follow_up_date.localeCompare(b.follow_up_date);
  });

  if (limit) {
    list = list.slice(0, limit);
  }
  return list;
}

export function getCustomerFollowups(customerId: number): Followup[] {
  return followups
    .filter(f => f.customer_id === customerId)
    .sort((a, b) => a.follow_up_date.localeCompare(b.follow_up_date));
}

export function getFollowupById(id: number): (Followup & { customer_name: string }) | undefined {
  const f = followups.find(item => item.id === id);
  if (!f) return undefined;
  const cust = customers.find(c => c.id === f.customer_id);
  return {
    ...f,
    customer_name: cust ? cust.name : 'Unknown'
  };
}

export function createFollowup(
  customerId: number,
  reason: string,
  followUpDate: string,
  priority: 'Low' | 'Medium' | 'High' = 'Medium',
  status: 'Pending' | 'Completed' = 'Pending'
): number {
  const id = nextFollowupId++;
  const f: Followup = {
    id,
    customer_id: customerId,
    reason: reason.trim(),
    follow_up_date: followUpDate,
    priority,
    status
  };
  followups.push(f);
  return id;
}

export function updateFollowup(
  id: number,
  reason: string,
  followUpDate: string,
  priority: 'Low' | 'Medium' | 'High',
  status: 'Pending' | 'Completed'
): boolean {
  const f = followups.find(item => item.id === id);
  if (!f) return false;
  f.reason = reason.trim();
  f.follow_up_date = followUpDate;
  f.priority = priority;
  f.status = status;
  return true;
}

export function toggleFollowupStatus(id: number): string | null {
  const f = followups.find(item => item.id === id);
  if (!f) return null;
  f.status = f.status === 'Completed' ? 'Pending' : 'Completed';
  return f.status;
}

export function deleteFollowup(id: number): boolean {
  const index = followups.findIndex(f => f.id === id);
  if (index === -1) return false;
  followups.splice(index, 1);
  return true;
}

// ===========================================================================
// DASHBOARD & REPORTS METRICS
// ===========================================================================
export function getDashboardData() {
  const total_customers = customers.length;
  const active_customers = customers.filter(c => c.status === 'Active').length;
  const pending_followups = followups.filter(f => f.status === 'Pending').length;
  const total_interactions = interactions.length;

  const recent_customers = [...customers].sort((a, b) => b.id - a.id).slice(0, 5);

  const recent_interactions = getInteractions(undefined, 5);

  const upcoming_followups = getFollowups('Pending', 5);

  return {
    total_customers,
    active_customers,
    pending_followups,
    total_interactions,
    recent_customers,
    recent_interactions,
    upcoming_followups
  };
}

export function getReportsData() {
  const customer_status = {
    Active: customers.filter(c => c.status === 'Active').length,
    Inactive: customers.filter(c => c.status === 'Inactive').length,
    Pending: customers.filter(c => c.status === 'Pending').length
  };

  const interaction_types = {
    Call: interactions.filter(i => i.type === 'Call').length,
    Email: interactions.filter(i => i.type === 'Email').length,
    Meeting: interactions.filter(i => i.type === 'Meeting').length,
    WhatsApp: interactions.filter(i => i.type === 'WhatsApp').length,
    Other: interactions.filter(i => i.type === 'Other').length
  };

  const followup_status = {
    Pending: followups.filter(f => f.status === 'Pending').length,
    Completed: followups.filter(f => f.status === 'Completed').length
  };

  const followup_priority = {
    High: followups.filter(f => f.priority === 'High').length,
    Medium: followups.filter(f => f.priority === 'Medium').length,
    Low: followups.filter(f => f.priority === 'Low').length
  };

  const currentMonthPrefix = formatDate(new Date()).slice(0, 7);
  const new_this_month = customers.filter(c => c.created_at.startsWith(currentMonthPrefix)).length;
  const total_customers = customers.length;
  const total_interactions = interactions.length;
  const completed_followups = followups.filter(f => f.status === 'Completed').length;

  return {
    customer_status,
    interaction_types,
    followup_status,
    followup_priority,
    total_customers,
    new_this_month,
    completed_followups,
    total_interactions
  };
}

// ===========================================================================
// SETTINGS
// ===========================================================================
export function getSettings(): Settings {
  return { ...settings };
}

export function updateSettings(
  business_name: string,
  owner_email: string,
  owner_phone: string,
  currency = '₹',
  theme = 'light'
): boolean {
  settings.business_name = business_name.trim();
  settings.owner_email = owner_email.trim();
  settings.owner_phone = owner_phone.trim();
  settings.currency = currency.trim();
  settings.theme = theme;
  return true;
}
