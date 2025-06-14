export enum UserRole {
  ADMIN = 'Admin',
  ACCOUNTANT = 'Accountant',
  TECHNICIAN = 'Technician',
}

export enum InvoiceType {
  OUTGOING = 'Outgoing', // Customer
  INCOMING = 'Incoming', // Supplier
  RETURN_CUSTOMER = 'Return (Customer)',
  RETURN_SUPPLIER = 'Return (Supplier)',
  EXTERNAL_TECHNICIAN = 'External Technician Wages', // This will represent the invoice/document from the external technician
  WORKSHOP_EQUIPMENT = 'Workshop Equipment',
  GENERAL_EXPENSE = 'General Expense',
}

export enum FuelLevel {
  EMPTY = 'Empty',
  QUARTER = '1/4',
  HALF = '1/2',
  THREE_QUARTERS = '3/4',
  FULL = 'Full',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
}

export interface Customer {
  id: string;
  internalId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
  openingBalance?: number; // قيمة حساب أول المدة
  // الحقول المحسوبة - لا تُدخل يدوياً
  totalInvoiced?: number; // إجمالي الفواتير الصادرة
  totalPaid?: number; // إجمالي المبالغ المدفوعة
  remainingBalance?: number; // الرصيد المتبقي (openingBalance + totalInvoiced - totalPaid)
}

export interface Vehicle {
  id: string;
  internalId: string; 
  customerId: string;
  make: string;
  model: string;
  year: number;
  vin: string; 
  licensePlate: string;
  createdAt: string;
  color?: string;
  engineCylinders?: number;
  engineNumber?: string;
  tireSize?: string;
}

export interface SparePart {
  id: string;
  internalId: string; 
  name: string;
  sku: string; 
  quantityInStock: number; 
  purchasePrice: number;
  sellingPrice: number;
  supplierId?: string;
  description?: string;
  compatibleVehicles?: string; 
  initialStock?: number; 
  condition?: 'New' | 'Used'; // New field for part condition upon purchase
}

export interface InventoryMovement {
  id: string;
  partId: string;
  type: 'IN' | 'OUT'; 
  quantity: number;
  date: string;
  notes?: string;
  relatedInvoiceId?: string; 
  relatedIssueRequestId?: string; // Link to inventory issue request
}

export interface Supplier {
  id: string;
  internalId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  openingBalance?: number; // قيمة حساب أول المدة
  // الحقول المحسوبة - لا تُدخل يدوياً
  totalInvoiced?: number; // إجمالي الفواتير الواردة من المورد
  totalPaid?: number; // إجمالي المبالغ المدفوعة للمورد
  remainingBalance?: number; // الرصيد المتبقي (openingBalance + totalInvoiced - totalPaid)
}

export interface Employee {
  id: string;
  internalId: string; 
  name: string;
  role: 'Technician' | 'Accountant' | 'Service Advisor' | 'Manager'; 
  phone: string;
  email?: string;
  hireDate: string;
  salary?: number;
}

export interface MaintenanceTask {
  id: string;
  description: string;
  estimatedHours?: number;
  completed: boolean;
}

export interface MaintenanceCard {
  id: string;
  internalId: string; 
  vehicleId: string;
  customerId: string;
  dateCreated: string;
  dateCompleted?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  reportedIssues: string[]; 
  tasks: MaintenanceTask[];
  assignedEmployeeIds: string[]; 
  notes?: string;
  estimatedCost?: number;
  actualCost?: number;
  faultDescription?: string;
  causeOfFailure?: string;
  odometerIn?: number;
  odometerOut?: number;
  fuelLevelIn?: FuelLevel | string; 
  fuelLevelOut?: FuelLevel | string;
  // inventoryIssueRequestIds?: string[]; // To link to issue requests made for this card
}

export interface InvoiceItem {
  id: string;
  partId?: string; 
  serviceDescription?: string; 
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  // Fields for items sourced from issue requests or secondary warehouse
  sourceIssueRequestId?: string; // If part came from a main warehouse issue request
  sourceSecondaryWarehouseItemId?: string; // If part came from secondary warehouse
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  customerId?: string; 
  supplierId?: string; 
  maintenanceCardId?: string; 
  externalTechnicianInvoiceId?: string; // If this IS an external tech invoice, it's its own ID. If customer invoice INCLUDES one, this links to it.
  dateIssued: string;
  dueDate?: string;
  items: InvoiceItem[];
  subTotal: number;
  discountAmount: number;
  taxAmount: number; 
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: 'paid' | 'partiallyPaid' | 'unpaid' | 'overdue';
  notes?: string;
  // For customer invoices, list of source documents
  linkedInventoryIssueRequestIds?: string[];
  linkedSecondaryWarehouseIssueRequestIds?: string[]; // Future
  linkedExternalTechInvoiceIds?: string[]; // IDs of InvoiceType.EXTERNAL_TECHNICIAN
}

export interface WorkshopStats {
  carsInWorkshop: number;
  carsRepairedThisPeriod: number;
  totalExpensesThisPeriod: number;
  totalRevenueThisPeriod: number;
  dueFromCustomers: number;
  dueToSuppliers: number;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
  labelKey: string; 
}

export interface Currency {
  symbol: string;
  name_en: string;
  name_ar: string;
  code: string; 
}

// --- New Types for Inventory Issue Request and Secondary Warehouse ---

export enum ReplacedPartCondition {
  REUSABLE = 'Reusable',
  DAMAGED = 'Damaged',
  NOT_PRESENT = 'Not Present',
}

export interface InventoryIssueRequestItem {
  id: string; // Unique ID for this line item in the request
  partId: string; // From SparePart (if main warehouse) or SecondaryWarehouseItem.partId (if secondary)
  sourceWarehouse: 'main' | 'secondary'; // To track where it came from
  sourceItemId: string; // ID of SparePart or SecondaryWarehouseItem
  quantityRequested: number;
  quantityIssued?: number; // Actual quantity taken from warehouse
  notes?: string;
}

export interface ReplacedPartEntry {
  id: string; // Unique ID for this replaced part entry
  inventoryIssueRequestItemId?: string; // Links to the item in InventoryIssueRequest.items that was used
  customPartName?: string; // If the replaced part is not a standard inventory item
  customPartNumber?: string; // If the replaced part is not a standard inventory item
  partId?: string; // If it corresponds to an existing SparePart definition (e.g. an old version of the same part)
  quantity: number;
  condition: ReplacedPartCondition;
  notes?: string;
}

export enum InventoryIssueRequestStatus {
  DRAFT = 'Draft', // Request created, not yet processed
  ISSUED = 'Issued', // Parts taken from main warehouse
  RECONCILED = 'Reconciled', // Replaced parts info recorded, parts moved to secondary/scrapped
  CANCELLED = 'Cancelled',
}

export interface InventoryIssueRequest {
  id: string;
  internalId: string; // e.g., IIR-0001
  maintenanceCardId?: string; // Link to maintenance card - NOW OPTIONAL
  warehouseSource: 'main' | 'secondary'; // NEW: Source warehouse for the request
  dateCreated: string; // User-settable date for the request
  dateIssued?: string; // When parts are confirmed taken from main warehouse
  dateReconciled?: string; // When replaced parts are processed
  requestedByEmployeeId?: string; // Employee who requested
  issuedByEmployeeId?: string; // Storekeeper - Employee who issued parts from store (can be set in form)
  reconciledByEmployeeId?: string; // Employee who recorded replaced parts
  receivedByEmployeeId?: string; // Employee who will receive the parts (ID if employee)
  receiverCustomName?: string; // Custom name if not an employee
  status: InventoryIssueRequestStatus;
  items: InventoryIssueRequestItem[]; // Parts requested from warehouse
  replacedParts: ReplacedPartEntry[]; // Info about parts taken off the vehicle after maintenance
  notes?: string;
}

export interface SecondaryWarehouseItem {
  id: string;
  partId: string; // References SparePart.id for its definition (name, SKU etc.)
  derivedFromInventoryIssueRequestId: string;
  quantity: number;
  condition: ReplacedPartCondition.REUSABLE | ReplacedPartCondition.DAMAGED; // Only these states are stored
  dateAdded: string;
  notes?: string;
  // value?: number; // Future: for financial tracking based on settings
  // isSold?: boolean; // Future: to mark if used or sold from secondary warehouse
}

// Representing an invoice from an external technician.
// Can be listed and then selected to be part of a main customer invoice.
// This is essentially a specific use of the main Invoice interface.
// We will use InvoiceType.EXTERNAL_TECHNICIAN for this.
// The ExternalTechniciansPage will list Invoices of this type.
// When creating a customer Invoice, user can select one or more of these.
export interface MappedPartForCombobox {
  id: string; // original part id (SparePart.id or SecondaryWarehouseItem.id)
  displayId: string; // unique id for combobox usage, potentially prefixed
  name: string;
  sku?: string;
  compatibleVehicles?: string;
  availableQuantity: number;
  condition?: 'New' | 'Used' | ReplacedPartCondition; // From SparePart or SecondaryWarehouseItem
  warehouse: 'main' | 'secondary';
  originalPartData: SparePart | SecondaryWarehouseItem; // To access full data if needed
}

// Purchase Invoice (Incoming Invoice) Types
export interface PurchaseInvoice {
  id: string;
  internalId: string; // e.g., PI-0001
  invoiceNumber: string; // Supplier's invoice number
  invoiceDate: string;
  supplierId: string;
  subtotal: number; // Total before discount
  discount: number; // Discount amount
  totalAfterDiscount: number; // Total after discount
  amountPaid: number; // Amount paid to supplier
  items: PurchaseInvoiceItem[];
  notes?: string;
  createdAt: string;
  createdBy: string; // Employee ID who created the invoice
}

export interface PurchaseInvoiceItem {
  id: string;
  partId: string; // References SparePart.id
  quantity: number;
  unitPrice: number; // Purchase price per unit
  totalPrice: number; // quantity * unitPrice
  notes?: string;
}