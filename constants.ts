import { User, UserRole, Customer, Vehicle, SparePart, Supplier, Employee, MaintenanceCard, Invoice, InvoiceType, WorkshopStats, Currency, FuelLevel, InventoryMovement, InventoryIssueRequest, InventoryIssueRequestStatus, ReplacedPartCondition, SecondaryWarehouseItem, InventoryIssueRequestItem, ReplacedPartEntry, PurchaseInvoice, ExternalTechnician } from './types';
import { HomeIcon, UsersIcon, TruckIcon, WrenchScrewdriverIcon, ShoppingCartIcon, BriefcaseIcon, DocumentTextIcon, CogIcon, ArrowLeftOnRectangleIcon, ChartBarIcon, SunIcon, MoonIcon, LanguageIcon, AdjustmentsHorizontalIcon, CalendarDaysIcon, ArchiveBoxIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';


export const APP_NAME = "ورشة برو"; // Pro Workshop
export const APP_NAME_EN = "Workshop Pro";

export const USER_ROLES_CONFIG = {
  [UserRole.ADMIN]: { name_en: 'Admin', name_ar: 'مدير' },
  [UserRole.ACCOUNTANT]: { name_en: 'Accountant', name_ar: 'محاسب' },
  [UserRole.TECHNICIAN]: { name_en: 'Technician', name_ar: 'فني' },
};

export interface NavItem {
  id: string;
  label_en: string;
  label_ar: string;
  path: string;
  icon: React.ElementType;
  roles?: UserRole[]; // Roles that can see this item
  children?: NavItem[];
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { id: 'dashboard', label_en: 'Dashboard', label_ar: 'لوحة التحكم', path: '/', icon: HomeIcon, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.TECHNICIAN] },
  { id: 'customers', label_en: 'Customers', label_ar: 'العملاء', path: '/customers', icon: UsersIcon, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
  { id: 'suppliers', label_en: 'Suppliers', label_ar: 'الموردين', path: '/suppliers', icon: BriefcaseIcon, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] }, 
  { id: 'vehicles', label_en: 'Vehicles', label_ar: 'السيارات', path: '/vehicles', icon: TruckIcon, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.TECHNICIAN] },
  { id: 'maintenance', label_en: 'Maintenance Cards', label_ar: 'بطاقات الصيانة', path: '/maintenance-cards', icon: WrenchScrewdriverIcon, roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
  { 
    id: 'inventory', 
    label_en: 'Inventory', 
    label_ar: 'المستودع', 
    path: '/inventory', 
    icon: ShoppingCartIcon, 
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.TECHNICIAN],
    children: [
      { id: 'parts', label_en: 'Spare Parts (Main)', label_ar: 'قطع الغيار (الرئيسي)', path: '/inventory/parts', icon: CogIcon },
      { id: 'issue-requests', label_en: 'Issue Requests', label_ar: 'طلبات إخراج قطع', path: '/inventory/issue-requests', icon: ClipboardDocumentListIcon },
      { id: 'secondary-warehouse', label_en: 'Secondary Warehouse', label_ar: 'المستودع الثانوي', path: '/inventory/secondary-warehouse', icon: ArchiveBoxIcon },
    ]
  },
  { 
    id: 'invoicing', 
    label_en: 'Invoicing & Expenses', 
    label_ar: 'الفواتير والمصروفات', 
    path: '/invoicing', 
    icon: DocumentTextIcon, 
    roles: [UserRole.ADMIN, UserRole.ACCOUNTANT],
    children: [
        { id: 'outgoing', label_en: 'Outgoing Invoices', label_ar: 'فواتير صادرة', path: '/invoices/outgoing', icon: DocumentTextIcon },
        { id: 'incoming', label_en: 'Purchase Invoices', label_ar: 'الفواتير الواردة', path: '/invoices/incoming', icon: DocumentTextIcon },
        { id: 'returns', label_en: 'Return Invoices', label_ar: 'فواتير مرتجعة', path: '/invoices/returns', icon: DocumentTextIcon },
        { id: 'external_tech_invoices', label_en: 'External Technicians', label_ar: 'فواتير فنيين خارجيين', path: '/invoices/external-technicians', icon: UsersIcon }, // Moved
        { id: 'equipment', label_en: 'Workshop Equipment', label_ar: 'معدات الورشة', path: '/invoices/equipment', icon: CogIcon }, // Path might change if it becomes a type of expense invoice
        { id: 'general', label_en: 'General Expenses', label_ar: 'مصروفات عامة', path: '/invoices/general', icon: DocumentTextIcon }, // Path might change
    ]
  },
  // Expenses section removed as items are moved under Invoicing or handled as Invoice types.
  { id: 'employees', label_en: 'Employees', label_ar: 'الموظفين', path: '/employees', icon: BriefcaseIcon, roles: [UserRole.ADMIN] },
  { id: 'external-technicians-management', label_en: 'External Technicians', label_ar: 'الفنيين الخارجيين', path: '/external-technicians-management', icon: WrenchScrewdriverIcon, roles: [UserRole.ADMIN] },
  { id: 'reports', label_en: 'Reports', label_ar: 'التقارير', path: '/reports', icon: ChartBarIcon, roles: [UserRole.ADMIN, UserRole.ACCOUNTANT] },
];

export const MOCK_LOGGED_IN_USER_ID = 'user-admin-01';

export const MOCK_USERS_DATA: Record<string, User> = {
  [MOCK_LOGGED_IN_USER_ID]: { id: MOCK_LOGGED_IN_USER_ID, name: 'Admin User', username: 'admin', role: UserRole.ADMIN },
  'user-accountant-01': { id: 'user-accountant-01', name: 'Accountant User', username: 'accountant', role: UserRole.ACCOUNTANT },
  'user-tech-01': { id: 'user-tech-01', name: 'Technician User', username: 'tech1', role: UserRole.TECHNICIAN },
};


export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    internalId: 'CUST-0001',
    name: 'أحمد محمد',
    phone: '0501234567',
    email: 'ahmed@example.com',
    address: '123 شارع الملك، الرياض',
    createdAt: '2023-01-15T10:00:00Z',
    openingBalance: 150,
    totalInvoiced: 1200,
    totalPaid: 800,
    remainingBalance: 550 // 150 + 1200 - 800
  },
  {
    id: 'cust-002',
    internalId: 'CUST-0002',
    name: 'Fatima Ali',
    phone: '0559876543',
    email: 'fatima@example.com',
    address: '456 Queen St, Jeddah',
    createdAt: '2023-02-20T14:30:00Z',
    openingBalance: -200,
    totalInvoiced: 500,
    totalPaid: 600,
    remainingBalance: -300 // -200 + 500 - 600
  },
  {
    id: 'cust-003',
    internalId: 'CUST-0003',
    name: 'John Doe',
    phone: '05XXXXXXXX',
    createdAt: '2024-07-20T14:30:00Z',
    openingBalance: 500,
    totalInvoiced: 0,
    totalPaid: 0,
    remainingBalance: 500 // 500 + 0 - 0
  }
];

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'veh-001', internalId: 'VEH-0001', customerId: 'cust-001', make: 'تويوتا', model: 'كامري', year: 2022, vin: 'ABC123XYZ789', licensePlate: 'أ ب ج ١٢٣', createdAt: '2023-01-15T10:05:00Z', color: 'أحمر', engineCylinders: 4, engineNumber: 'EN12345', tireSize: '215/55R17' },
  { id: 'veh-002', internalId: 'VEH-0002', customerId: 'cust-001', make: 'Ford', model: 'F-150', year: 2020, vin: 'DEF456UVW456', licensePlate: 'XYZ 789', createdAt: '2023-03-10T11:00:00Z', color: 'Black', engineCylinders: 6, engineNumber: 'EN67890', tireSize: '275/65R18' },
  { id: 'veh-003', internalId: 'VEH-0003', customerId: 'cust-002', make: 'هيونداي', model: 'إلنترا', year: 2021, vin: 'GHI789RST123', licensePlate: 'د هـ و ٤٥٦', createdAt: '2023-02-20T14:35:00Z', color: 'أزرق', engineCylinders: 4, engineNumber: 'EN54321', tireSize: '205/60R16' },
];

export const MOCK_PARTS: SparePart[] = [
  { id: 'part-001', internalId: 'PART-0001', name: 'فلتر زيت تويوتا', sku: 'OILFILT001', quantityInStock: 50, purchasePrice: 15, sellingPrice: 25, supplierId: 'supp-001', initialStock: 60, compatibleVehicles: "Toyota Camry, Honda Accord", condition: "New" },
  { id: 'part-002', internalId: 'PART-0002', name: 'Brake Pads (Front) - Ford', sku: 'BRAKEPADF002', quantityInStock: 30, purchasePrice: 80, sellingPrice: 120, supplierId: 'supp-002', initialStock: 40, condition: "New", compatibleVehicles: "Ford F-150, Ford Explorer" },
  { id: 'part-003', internalId: 'PART-0003', name: 'بطارية 70 أمبير', sku: 'BATTERY003', quantityInStock: 20, purchasePrice: 200, sellingPrice: 300, initialStock: 20, compatibleVehicles: "All Models", condition: "Used" },
  { id: 'part-004', internalId: 'PART-0004', name: 'إطار ميشلان 205/60R16', sku: 'TIREMX001', quantityInStock: 10, purchasePrice: 100, sellingPrice: 150, supplierId: 'supp-001', initialStock: 10, condition: "New", compatibleVehicles: "Hyundai Elantra, Honda Civic"},
];

export const MOCK_SUPPLIERS: Supplier[] = [
    {
        id: 'supp-001',
        internalId: 'SUPP-0001',
        name: 'شركة قطع الغيار المتحدة',
        phone: '0112345678',
        email: 'parts@united.com',
        openingBalance: -1200, // كنا مدينين لهم بـ 1200
        totalInvoiced: 3500, // إجمالي فواتيرهم
        totalPaid: 2800, // ما دفعناه لهم
        remainingBalance: -500 // -1200 + 3500 - 2800 = -500 (ما زلنا مدينين لهم)
    },
    {
        id: 'supp-002',
        internalId: 'SUPP-0002',
        name: 'International Auto Parts',
        phone: '0129876543',
        contactPerson: 'Mr. Smith',
        openingBalance: 500, // كانوا مدينين لنا بـ 500
        totalInvoiced: 1200, // إجمالي فواتيرهم
        totalPaid: 1500, // ما دفعناه لهم
        remainingBalance: 200 // 500 + 1200 - 1500 = 200 (مدينين لنا)
    },
];

export const MOCK_EMPLOYEES: Employee[] = [
    { id: 'emp-001', internalId: 'EMP-0001', name: 'علي حسن', role: 'Technician', phone: '0511111111', hireDate: '2022-05-01', salary: 6000 },
    { id: 'emp-002', internalId: 'EMP-0002', name: 'Sarah Miller', role: 'Service Advisor', phone: '0522222222', hireDate: '2021-11-15', salary: 7500 },
    { id: 'emp-003', internalId: 'EMP-0003', name: 'خالد عبدالله', role: 'Manager', phone: '0533333333', hireDate: '2020-01-10', salary: 12000 },
    { id: 'emp-accountant-01', internalId: 'EMP-ACC01', name: 'نورة المحاسبة', role: 'Accountant', phone: '0544444444', hireDate: '2021-01-10', salary: 8000},
    { id: 'emp-004', internalId: 'EMP-0004', name: 'أحمد محمد', role: 'Technician', phone: '0555555555', hireDate: '2023-03-15', salary: 5500 },
    { id: 'emp-005', internalId: 'EMP-0005', name: 'محمد العلي', role: 'Technician', phone: '0566666666', hireDate: '2023-06-01', salary: 5800 },
    { id: 'emp-006', internalId: 'EMP-0006', name: 'Omar Hassan', role: 'Technician', phone: '0577777777', hireDate: '2022-09-10', salary: 6200 },
    { id: 'emp-007', internalId: 'EMP-0007', name: 'فيصل الأحمد', role: 'Technician', phone: '0588888888', hireDate: '2023-01-20', salary: 5700 }
];

export const MOCK_EXTERNAL_TECHNICIANS: ExternalTechnician[] = [
    { id: 'ext-tech-001', internalId: 'ET-0001', name: 'ماهر الجيربوكس', phone: '0599999999', email: 'maher.gearbox@email.com', address: 'شارع الصناعة، دمشق', specialization: 'mechanic', notes: 'خبير في إصلاح الجيربوكس والمحركات' },
    { id: 'ext-tech-002', internalId: 'ET-0002', name: 'أحمد الكهربائي', phone: '0588888888', email: 'ahmed.electric@email.com', address: 'حي الميدان، دمشق', specialization: 'electrical', notes: 'متخصص في الأنظمة الكهربائية والإلكترونية' },
    { id: 'ext-tech-003', internalId: 'ET-0003', name: 'خالد الحداد', phone: '0577777777', address: 'منطقة الصناعية، حلب', specialization: 'bodywork', notes: 'خبير في إصلاح هياكل السيارات والحدادة' },
    { id: 'ext-tech-004', internalId: 'ET-0004', name: 'محمد الدهان', phone: '0566666666', email: 'mohammed.painter@email.com', address: 'شارع النصر، حمص', specialization: 'painting', notes: 'متخصص في دهان السيارات والتشطيبات' },
    { id: 'ext-tech-005', internalId: 'ET-0005', name: 'علي الإطارات', phone: '0555555555', address: 'السوق التجاري، اللاذقية', specialization: 'tires', notes: 'خبير في إطارات السيارات والعجلات' },
    { id: 'ext-tech-006', internalId: 'ET-0006', name: 'سامر التكييف', phone: '0544444444', email: 'samer.ac@email.com', address: 'حي الزهراء، دمشق', specialization: 'ac', notes: 'متخصص في أنظمة التكييف والتبريد' }
];

export const MOCK_MAINTENANCE_CARDS: MaintenanceCard[] = [
    {
        id: 'mcard-001',
        internalId: 'MC-0001',
        vehicleId: 'veh-001', // Toyota Camry
        customerId: 'cust-001', // Ahmed Mohammed
        dateCreated: '2024-07-25T09:00:00Z',
        dateCompleted: '2024-07-28T17:00:00Z',
        status: 'Completed',
        reportedIssues: ['تغيير زيت وفلتر', 'فحص الفرامل'],
        tasks: [{id: 'task-01', description: 'تغيير زيت المحرك والفلتر', completed: true}, {id: 'task-02', description: 'فحص نظام الفرامل الأمامية والخلفية', completed: true}],
        assignedEmployeeIds: ['emp-001'],
        estimatedCost: 250,
        actualCost: 260,
        faultDescription: 'تسريب زيت من المحرك وصوت عند الضغط على الفرامل.',
        causeOfFailure: 'تلف جلدة غطاء الصمام، تآكل فحمات الفرامل.',
        odometerIn: 150200,
        odometerOut: 150210,
        fuelLevelIn: FuelLevel.HALF,
        fuelLevelOut: FuelLevel.HALF,
    },
    {
        id: 'mcard-002',
        internalId: 'MC-0002',
        vehicleId: 'veh-002', // Ford F-150
        customerId: 'cust-001', // Ahmed Mohammed
        dateCreated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        status: 'In Progress',
        reportedIssues: ['Engine noise check', 'AC not cooling'],
        tasks: [{id: 'task-03', description: 'Diagnose engine noise', completed: false}, {id: 'task-04', description: 'Inspect AC system', completed: false}],
        assignedEmployeeIds: ['emp-001'],
        estimatedCost: 300,
        faultDescription: 'صوت طقطقة من المحرك عند التشغيل، المكيف لا يبرد.',
        causeOfFailure: 'تحت الفحص',
        odometerIn: 75000,
        fuelLevelIn: FuelLevel.QUARTER,
    },
     {
        id: 'mcard-003',
        internalId: 'MC-0003',
        vehicleId: 'veh-003', // Hyundai Elantra
        customerId: 'cust-002', // Fatima Ali
        dateCreated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        status: 'Pending',
        reportedIssues: ['Routine service'],
        tasks: [{id: 'task-05', description: 'Perform 10,000km service', completed: false}],
        assignedEmployeeIds: [],
        estimatedCost: 150,
        faultDescription: 'فحص دوري وتغيير الزيوت والفلاتر اللازمة.',
        odometerIn: 22500,
        fuelLevelIn: FuelLevel.FULL,
    },
];

export const MOCK_INVOICES: Invoice[] = [
    {
        id: 'inv-001',
        invoiceNumber: 'INV-2024-001',
        type: InvoiceType.OUTGOING,
        customerId: 'cust-001',
        maintenanceCardId: 'mcard-001',
        dateIssued: '2024-07-28T18:00:00Z', 
        items: [
            { id: 'item-01', partId: 'part-001', quantity: 1, unitPrice: 25, totalPrice: 25 },
            { id: 'item-02', serviceDescription: 'أجرة تغيير الزيت', quantity: 1, unitPrice: 50, totalPrice: 50 },
        ],
        subTotal: 75,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 75,
        amountPaid: 75,
        amountDue: 0,
        paymentStatus: 'paid',
        notes: 'الرجاء الدفع خلال 7 أيام'
    },
     {
        id: 'inv-002',
        invoiceNumber: 'SUP-INV-2024-001',
        type: InvoiceType.INCOMING,
        supplierId: 'supp-001',
        dateIssued: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), 
        items: [
            { id: 'item-s01', partId: 'part-001', quantity: 20, unitPrice: 15, totalPrice: 300 },
             { id: 'item-s02', partId: 'part-003', quantity: 5, unitPrice: 200, totalPrice: 1000 },
        ],
        subTotal: 1300,
        discountAmount: 50,
        taxAmount: 0,
        totalAmount: 1250,
        amountPaid: 1000,
        amountDue: 250,
        paymentStatus: 'partiallyPaid',
    },
    {
        id: 'inv-003',
        invoiceNumber: 'INV-2024-002',
        type: InvoiceType.OUTGOING,
        customerId: 'cust-002',
        dateIssued: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
        items: [
            { id: 'item-03', serviceDescription: 'Diagnostic Fee', quantity: 1, unitPrice: 100, totalPrice: 100 },
        ],
        subTotal: 100,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 100,
        amountPaid: 0,
        amountDue: 100,
        paymentStatus: 'unpaid',
    },
    {
        id: 'inv-004',
        invoiceNumber: 'EXP-GEN-2024-001',
        type: InvoiceType.GENERAL_EXPENSE,
        dateIssued: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
        items: [ { id: 'exp-item-01', serviceDescription: 'Rent for workshop', quantity: 1, unitPrice: 1500, totalPrice: 1500 } ],
        subTotal: 1500, discountAmount: 0, taxAmount: 0, totalAmount: 1500, amountPaid: 1500, amountDue: 0, paymentStatus: 'paid'
    },
    {
        id: 'inv-ext-tech-001',
        invoiceNumber: 'EXT-TECH-2024-001',
        type: InvoiceType.EXTERNAL_TECHNICIAN,
        externalTechnicianInvoiceId: 'ext-tech-inv-id-001',
        dateIssued: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        items: [{id: 'ext-item-01', serviceDescription: 'إصلاح جيربوكس سيارة فورد', quantity: 1, unitPrice: 750, totalPrice: 750 }],
        subTotal: 750, discountAmount: 0, taxAmount: 0, totalAmount: 750, amountPaid: 750, amountDue: 0, paymentStatus: 'paid',
        notes: 'تم الدفع للفني ماهر نقداً. اسم الفني: خبير الجيربوكس ماهر'
    }
];

export const MOCK_INVENTORY_MOVEMENTS: InventoryMovement[] = [
  { 
    id: 'mov-001', 
    partId: 'part-001', 
    type: 'IN', 
    quantity: 20, 
    date: MOCK_INVOICES.find(inv => inv.id === 'inv-002')?.dateIssued || new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    relatedInvoiceId: 'inv-002',
    notes: 'Purchased from supplier'
  },
  { 
    id: 'mov-002', 
    partId: 'part-003', 
    type: 'IN', 
    quantity: 5, 
    date: MOCK_INVOICES.find(inv => inv.id === 'inv-002')?.dateIssued || new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    relatedInvoiceId: 'inv-002',
    notes: 'Purchased from supplier'
  },
  { 
    id: 'mov-003', 
    partId: 'part-001', 
    type: 'OUT', 
    quantity: 1, 
    date: MOCK_INVOICES.find(inv => inv.id === 'inv-001')?.dateIssued || '2024-07-28T18:00:00Z',
    // relatedInvoiceId: 'inv-001', // This would be set if linked to invoice directly
    relatedIssueRequestId: 'iir-001', // Assuming this part was issued via request IIR-001 for MCARD-001
    notes: 'Issued for maintenance card MC-0001'
  },
  {
    id: 'mov-004',
    partId: 'part-002',
    type: 'IN',
    quantity: 10, 
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), 
    notes: 'Stock replenishment'
  },
  {
    id: 'mov-005',
    partId: 'part-002', 
    type: 'OUT',
    quantity: 1, // Changed to 1 to match IIR-001 item 2
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
    relatedIssueRequestId: 'iir-001', // Assuming this part was issued via request IIR-001
    notes: 'Issued for maintenance card MC-0001'
  }
];

export const MOCK_INVENTORY_ISSUE_REQUESTS: InventoryIssueRequest[] = [
    {
        id: 'iir-001',
        internalId: 'IIR-2024-001',
        maintenanceCardId: 'mcard-001', 
        warehouseSource: 'main',
        dateCreated: '2024-07-25T10:00:00Z',
        dateIssued: '2024-07-25T11:00:00Z',
        dateReconciled: '2024-07-28T16:00:00Z',
        requestedByEmployeeId: 'emp-001',
        issuedByEmployeeId: 'emp-accountant-01', 
        reconciledByEmployeeId: 'emp-001',
        receivedByEmployeeId: 'emp-001',
        status: InventoryIssueRequestStatus.RECONCILED,
        items: [
            { id: 'iiritem-001', partId: 'part-001', sourceWarehouse: 'main', sourceItemId: 'part-001', quantityRequested: 1, quantityIssued: 1, notes: 'فلتر زيت للمحرك' },
            { id: 'iiritem-002', partId: 'part-002', sourceWarehouse: 'main', sourceItemId: 'part-002', quantityRequested: 1, quantityIssued: 1, notes: 'فحمات أمامية' }
        ],
        replacedParts: [
            { id: 'rpe-001', inventoryIssueRequestItemId: 'iiritem-001', partId: 'part-001', quantity: 1, condition: ReplacedPartCondition.DAMAGED, notes: 'فلتر قديم، تالف بالكامل' },
            { id: 'rpe-002', inventoryIssueRequestItemId: 'iiritem-002', customPartName: 'فحمات أمامية قديمة', quantity: 1, condition: ReplacedPartCondition.DAMAGED, notes: 'متآكلة جداً' }
        ],
        notes: 'تمت صيانة تويوتا كامري الأحمد.',
    },
    {
        id: 'iir-002',
        internalId: 'IIR-2024-002',
        maintenanceCardId: 'mcard-002', 
        warehouseSource: 'main',
        dateCreated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
        dateIssued: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3600000).toISOString(), 
        requestedByEmployeeId: 'emp-001',
        issuedByEmployeeId: 'emp-accountant-01',
        receiverCustomName: 'سائق خارجي - محمد علي',
        status: InventoryIssueRequestStatus.ISSUED, 
        items: [
            { id: 'iiritem-003', partId: 'part-004', sourceWarehouse: 'main', sourceItemId: 'part-004', quantityRequested: 4, quantityIssued: 4, notes: 'إطارات جديدة للسيارة فورد' },
            { id: 'iiritem-004', partId: 'part-003', sourceWarehouse: 'main', sourceItemId: 'part-003', quantityRequested: 1, quantityIssued: 1, notes: 'بطارية جديدة' }
        ],
        replacedParts: [], 
        notes: 'قطع لسيارة الفورد، تحت الصيانة.',
    },
    {
        id: 'iir-003',
        internalId: 'IIR-2024-003',
        // No maintenanceCardId for this example
        warehouseSource: 'secondary',
        dateCreated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), 
        requestedByEmployeeId: 'emp-002', // Service Advisor
        issuedByEmployeeId: 'emp-accountant-01',
        receivedByEmployeeId: 'emp-002',
        status: InventoryIssueRequestStatus.DRAFT, 
        items: [
            // Assuming 'swi-001' refers to part-004 (Tire) and has quantity 2 in secondary warehouse
            { id: 'iiritem-005', partId: 'part-004', sourceWarehouse: 'secondary', sourceItemId: 'swi-001', quantityRequested: 1, notes: 'إطار مستعمل للاستخدام الداخلي' }
        ],
        replacedParts: [], 
        notes: 'طلب داخلي لقطعة من المستودع الثانوي.',
    }
];

export const MOCK_SECONDARY_WAREHOUSE_ITEMS: SecondaryWarehouseItem[] = [
    {
        id: 'swi-001',
        partId: 'part-004', // Assuming part-004 is a type of tire
        derivedFromInventoryIssueRequestId: 'iir-hypothetical-000', 
        quantity: 2,
        condition: ReplacedPartCondition.REUSABLE,
        dateAdded: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
        notes: 'إطارات مستعملة بحالة جيدة، من سيارة سابقة.',
    },
    // Example: Damaged part that was moved to secondary warehouse
    {
        id: 'swi-002',
        partId: 'part-001', // Old oil filter
        derivedFromInventoryIssueRequestId: 'iir-001', 
        quantity: 1,
        condition: ReplacedPartCondition.DAMAGED, // As per IIR-001
        dateAdded: MOCK_INVENTORY_ISSUE_REQUESTS.find(r => r.id === 'iir-001')?.dateReconciled || new Date().toISOString(),
        notes: 'فلتر زيت قديم من صيانة MC-0001.',
    },
];

export const MOCK_PURCHASE_INVOICES: PurchaseInvoice[] = [
  {
    id: 'pi-001',
    internalId: 'PI-0001',
    invoiceNumber: 'SUP-2024-001',
    invoiceDate: '2024-01-15',
    supplierId: 'supp-001',
    subtotal: 1000,
    discount: 50,
    totalAfterDiscount: 950,
    amountPaid: 500,
    items: [
      {
        id: 'pii-001',
        partId: 'part-001',
        quantity: 20,
        unitPrice: 15,
        totalPrice: 300,
        notes: 'فلاتر زيت تويوتا - دفعة جديدة'
      },
      {
        id: 'pii-002',
        partId: 'part-002',
        quantity: 10,
        unitPrice: 70,
        totalPrice: 700,
        notes: 'تيل فرامل أمامي فورد'
      }
    ],
    notes: 'فاتورة شراء قطع غيار - دفعة يناير',
    createdAt: '2024-01-15T09:00:00Z',
    createdBy: 'emp-001'
  },
  {
    id: 'pi-002',
    internalId: 'PI-0002',
    invoiceNumber: 'SUP-2024-002',
    invoiceDate: '2024-02-01',
    supplierId: 'supp-002',
    subtotal: 800,
    discount: 0,
    totalAfterDiscount: 800,
    amountPaid: 800,
    items: [
      {
        id: 'pii-003',
        partId: 'part-003',
        quantity: 15,
        unitPrice: 25,
        totalPrice: 375,
        notes: 'شمعات إشعال هيونداي'
      },
      {
        id: 'pii-004',
        partId: 'part-004',
        quantity: 5,
        unitPrice: 85,
        totalPrice: 425,
        notes: 'فلاتر هواء متنوعة'
      }
    ],
    notes: 'فاتورة شراء قطع غيار - دفعة فبراير',
    createdAt: '2024-02-01T10:30:00Z',
    createdBy: 'emp-002'
  }
];

export const MOCK_WORKSHOP_STATS_PLACEHOLDER: WorkshopStats = {
    carsInWorkshop: 0,
    carsRepairedThisPeriod: 0,
    totalExpensesThisPeriod: 0,
    totalRevenueThisPeriod: 0,
    dueFromCustomers: 0,
    dueToSuppliers: 0,
};

export const ICONS = {
    HomeIcon, UsersIcon, TruckIcon, WrenchScrewdriverIcon, ShoppingCartIcon, BriefcaseIcon, DocumentTextIcon, CogIcon, ArrowLeftOnRectangleIcon, ChartBarIcon, SunIcon, MoonIcon, LanguageIcon, AdjustmentsHorizontalIcon, CalendarDaysIcon, ArchiveBoxIcon, ClipboardDocumentListIcon
};

export const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
];

export const THEME_OPTIONS = [
  { value: 'light', name_en: 'Light', name_ar: 'فاتح', icon: SunIcon },
  { value: 'dark', name_en: 'Dark', name_ar: 'داكن', icon: MoonIcon },
  { value: 'system', name_en: 'System', name_ar: 'النظام', icon: CogIcon },
];

export const DEFAULT_CURRENCY: Currency = { symbol: 'ل.س', name_en: 'Syrian Pound', name_ar: 'ليرة سورية', code: 'SYP' };

export const CURRENCY_OPTIONS: Currency[] = [
  DEFAULT_CURRENCY,
  { symbol: '$', name_en: 'US Dollar', name_ar: 'دولار أمريكي', code: 'USD' },
];

export const FUEL_LEVEL_OPTIONS = Object.values(FuelLevel).map(level => ({
  value: level,
  label_en: level.replace(/([A-Z])/g, ' $1').trim(), 
  label_ar: { 
    [FuelLevel.EMPTY]: 'فارغ',
    [FuelLevel.QUARTER]: '1/4 (ربع)',
    [FuelLevel.HALF]: '1/2 (نصف)',
    [FuelLevel.THREE_QUARTERS]: '3/4 (ثلاثة أرباع)',
    [FuelLevel.FULL]: 'ممتلئ',
  }[level]
}));


export const LABELS: Record<string, Record<string, string>> = {
  en: {
    appName: APP_NAME_EN,
    search: "Search...",
    dashboard: "Dashboard",
    customers: "Customers",
    vehicles: "Vehicles",
    maintenanceCards: "Maintenance Cards",
    inventory: "Inventory",
    spareParts: "Spare Parts (Main)",
    suppliers: "Suppliers",
    invoicing: "Invoicing & Expenses",
    outgoingInvoices: "Outgoing Invoices",
    incomingInvoices: "Incoming Invoices",
    returnInvoices: "Return Invoices",
    expenses: "Expenses",
    externalTechnicians: "External Technicians",
    externalTechnicianName: "External Technician Name",
    externalTechnicianInvoices: "External Technician Invoices",
    addNewExternalTechnicianInvoice: "Add New External Technician Invoice",
    editExternalTechnicianInvoice: "Edit External Technician Invoice",
    externalTechnicianInvoice: "External Technician Invoice",
    serviceDescriptionPlaceholder: "Service or work description",
    addItem: "Add Item",
    workshopEquipment: "Workshop Equipment",
    generalExpenses: "General Expenses",
    employees: "Employees",
    reports: "Reports",
    settings: "Settings",
    logout: "Logout",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    language: "Language",
    currency: "Currency",
    addNewCustomer: "Add New Customer",
    addNewSupplier: "Add New Supplier",
    customerName: "Customer Name",
    supplierName: "Supplier Name",
    contactPerson: "Contact Person",
    phone: "Phone",
    email: "Email",
    address: "Address",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    basicInformation: "Basic Information",
    additionalInformation: "Additional Information",
    pricing: "Pricing",
    internalId: "Internal ID",
    openingBalance: "Opening Balance",
    totalInvoiced: "Total Invoiced",
    totalPaid: "Total Paid",
    remainingBalance: "Remaining Balance",
    carsInWorkshop: "Cars in Workshop (Period)",
    carsRepairedThisPeriod: "Cars Repaired (Period)",
    totalExpensesPeriod: "Total Expenses (Period)",
    totalRevenuePeriod: "Total Revenue (Period)",
    dueFromCustomers: "Due from Customers (Period)",
    dueToSuppliers: "Due to Suppliers (Period)",
    recentActivity: "Recent Activity",
    noDataFound: "No data found.",
    loading: "Loading...",
    selectRole: "Select Role",
    pageUnderConstruction: "This page is under construction.",
    Admin: "Admin",
    Accountant: "Accountant",
    Technician: "Technician",
    Outgoing: "Outgoing",
    Incoming: "Incoming",
    ReturnCustomer: "Return (Customer)",
    ReturnSupplier: "Return (Supplier)",
    ExternalTechnicianWages: "External Technician Invoice",
    WorkshopEquipmentExpense: "Workshop Equipment",
    GeneralExpense: "General Expense",
    id: "ID",
    name: "Name",
    date: "Date", // Generic date
    status: "Status",
    totalAmount: "Total Amount",
    invoiceNumber: "Invoice #",
    customer: "Customer",
    supplier: "Supplier",
    type: "Type",
    make: "Make",
    model: "Model",
    year: "Year",
    licensePlate: "License Plate",
    vin: "VIN",
    addNewVehicle: "Add New Vehicle",
    editVehicle: "Edit Vehicle",
    vehicle: "Vehicle",
    customerRequired: "Customer is required.",
    selectCustomer: "Select Customer",
    color: "Color",
    engineCylinders: "Engine Cylinders",
    engineNumber: "Engine Number",
    tireSize: "Tire Size",
    columns: "Columns",
    toggleColumns: "Toggle Columns",
    sku: "SKU",
    quantityInStock: "Qty. in Stock",
    purchasePrice: "Purchase Price",
    sellingPrice: "Selling Price",
    addNewPart: "Add New Part",
    compatibleVehicles: "Compatible Vehicles",
    initialStock: "Initial Stock",
    editPart: "Edit Part",
    dateFilter: "Date Filter",
    allTime: "All Time",
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    thisYear: "This Year",
    customRange: "Custom Range",
    startDate: "Start Date",
    endDate: "End Date",
    apply: "Apply",
    paid: "Paid",
    partiallyPaid: "Partially Paid",
    unpaid: "Unpaid",
    overdue: "Overdue",
    addNewMaintenanceCard: "Add New Maintenance Card",
    editMaintenanceCard: "Edit Maintenance Card",
    maintenanceCard: "Maintenance Card",
    vehicleRequired: "Vehicle is required.",
    selectVehicle: "Select Vehicle",
    dateCreated: "Date Created", // Generic date created
    dateCompleted: "Date Completed",
    dateIssued: "Date Issued", // For Invoice context
    reportedIssues: "Reported Issues",
    faultDescription: "Fault Description",
    causeOfFailure: "Cause of Failure",
    odometerIn: "Odometer In (km)",
    odometerOut: "Odometer Out (km)",
    fuelLevelIn: "Fuel Level In",
    fuelLevelOut: "Fuel Level Out",
    assignedTechnicians: "Assigned Technicians",
    selectTechnicians: "Select Technicians",
    tasks: "Tasks",
    taskDescription: "Task Description",
    addTask: "Add Task",
    estimatedCost: "Estimated Cost",
    actualCost: "Actual Cost",
    notes: "Notes",
    Pending: "Pending",
    InProgress: "In Progress",
    Completed: "Completed",
    Cancelled: "Cancelled", // Status for Maintenance Card & IIR
    Empty: "Empty",
    Quarter: "1/4",
    Half: "1/2",
    ThreeQuarters: "3/4",
    Full: "Full",
    select: "Select",
    description: "Description",
    incomingQuantity: "Incoming Qty",
    outgoingQuantity: "Outgoing Qty",
    partCondition: "Part Condition",
    New: "New",
    Used: "Used",
    inventoryIssueRequests: "Inventory Issue Requests",
    secondaryWarehouse: "Secondary Warehouse",
    reusable: "Reusable",
    damaged: "Damaged",
    notPresent: "Not Present",
    addNewInventoryIssueRequest: "Add New Issue Request",
    editInventoryIssueRequest: "Edit Issue Request",
    confirmIssueRequest: "Confirm & Issue Parts",
    reconcileIssueRequest: "Reconcile Replaced Parts",
    issueRequest: "Issue Request",
    maintenanceCardRequired: "Maintenance Card is required.",
    selectMaintenanceCard: "Select Maintenance Card",
    requestedParts: "Requested Parts",
    addPartToRequest: "Add Part to Request",
    quantityRequested: "Qty. Requested",
    quantityIssued: "Qty. Issued",
    replacedPartsInfo: "Replaced Parts Information",
    addReplacedPartInfo: "Add Replaced Part Info",
    originalPart: "Original Part (from vehicle)",
    conditionOfReplacedPart: "Condition of Replaced Part",
    Draft: "Draft", // IIR Status
    Issued: "Issued", // IIR Status
    Reconciled: "Reconciled", // IIR Status
    iirDateIssued: "Date Issued", // For IIR context
    dateReconciled: "Date Reconciled",
    requestedBy: "Requested By",
    issuedBy: "Issued By", // Storekeeper
    reconciledBy: "Reconciled By",
    selectPart: "Select Part",
    customPartName: "Custom Part Name",
    items: "Items",
    part: "Part",
    quantity: "Quantity",
    derivedFrom: "Derived From (Issue Req.)",
    view: "View",
    mainWarehouse: "Main Warehouse",
    secondaryWarehouseReusable: "Secondary Warehouse (Reusable)",
    secondaryWarehouseDamaged: "Secondary Warehouse (Damaged)",
    linkToMaintenanceCard: "Link to Maintenance Card",
    createIssueRequest: "Create Issue Request",
    noIssueRequestLinked: "No issue request linked.",
    searchOrSelectCustomer: "Search or select customer",
    selectCustomerFirst: "Select customer first",
    searchOrSelectMaintenanceCard: "Search or select Maintenance Card",
    selectMaintenanceCardOptional: "Select Maintenance Card (Optional)",
    vehicleInformation: "Vehicle Information",
    warehouseSource: "Warehouse Source",
    requestDate: "Request Date",
    receivedBy: "Received By", // Receiver
    receiverCustomNameLabel: "Receiver Name (Custom)",
    searchOrSelectEmployee: "Search or select employee / Enter custom name",
    storekeeper: "Storekeeper", // IssuedBy
    selectEmployee: "Select Employee",
    selectWarehouse: "Select Warehouse",
    searchOrSelectPart: "Search or select part",
    available: "Available",
    quantityErrorTooHigh: "Requested quantity exceeds available stock.",
    partDetails: "Part Details",
    cannotEditIssuedReconciled: "Cannot edit a request that is already Issued or Reconciled.",
    cannotDeleteIssuedReconciled: "Cannot delete a request that is already Issued or Reconciled.",
    canOnlyReconcileIssued: "Only 'Issued' requests can be reconciled.",
    mustAddPartsToRequest: "You must add at least one part to the request.",
    replacedQuantityExceedsIssuedFor: "Replaced quantity exceeds issued quantity for",
    unknownPart: "Unknown Part",
    allConditions: "All Conditions",
    requestDetails: "Request Details",
    personnel: "Personnel",
    linkedMaintenanceCard: "بطاقة الصيانة المرتبطة",
    purchaseInvoices: "الفواتير الواردة",
    addNewPurchaseInvoice: "إضافة فاتورة واردة جديدة",
    editPurchaseInvoice: "تعديل فاتورة واردة",
    purchaseInvoice: "فاتورة واردة",
    supplierInvoiceNumber: "رقم فاتورة المورد",
    invoiceDate: "تاريخ الفاتورة",
    subtotal: "المجموع الفرعي",
    discount: "الحسم",
    totalAfterDiscount: "المجموع بعد الحسم",
    amountPaid: "المبلغ المدفوع",
    unitPrice: "السعر الإفرادي",
    totalPrice: "السعر الإجمالي",
    addItemToInvoice: "إضافة بند للفاتورة",
    removeItem: "حذف البند",
    invoiceDetails: "تفاصيل الفاتورة",
    invoiceItems: "بنود الفاتورة",
    selectSupplier: "اختر المورد",
    invoiceTotals: "إجماليات الفاتورة",
    createdBy: "أنشئت بواسطة",
    confirmDelete: "هل أنت متأكد من الحذف؟",
  },
  ar: {
    appName: APP_NAME,
    search: "بحث...",
    dashboard: "لوحة التحكم",
    customers: "العملاء",
    vehicles: "السيارات",
    maintenanceCards: "بطاقات الصيانة",
    inventory: "المخزون",
    spareParts: "قطع الغيار (الرئيسي)",
    suppliers: "الموردين",
    invoicing: "الفواتير والمصروفات",
    outgoingInvoices: "فواتير صادرة",
    incomingInvoices: "فواتير واردة",
    returnInvoices: "فواتير مرتجعة",
    expenses: "المصروفات",
    externalTechnicians: "الفنيين الخارجيين",
    employees: "الموظفين",
    reports: "التقارير",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    lightMode: "الوضع الفاتح",
    darkMode: "الوضع الداكن",
    language: "اللغة",
    currency: "العملة",
    // Dashboard specific labels
    totalInvoiced: "إجمالي الفواتير",
    totalPaid: "إجمالي المدفوع",
    remainingBalance: "الرصيد المتبقي",
    carsInWorkshop: "السيارات في الورشة (الفترة)",
    carsRepairedThisPeriod: "السيارات المصلحة (الفترة)",
    totalExpensesPeriod: "إجمالي المصروفات (الفترة)",
    totalRevenuePeriod: "إجمالي الإيرادات (الفترة)",
    dueFromCustomers: "مستحق من العملاء (الفترة)",
    dueToSuppliers: "مستحق للموردين (الفترة)",
    recentActivity: "النشاط الأخير",
    noDataFound: "لا توجد بيانات.",
    loading: "جاري التحميل...",
    // Date filters
    dateFilter: "فلتر التاريخ",
    allTime: "كل الأوقات",
    today: "اليوم",
    yesterday: "أمس",
    thisWeek: "هذا الأسبوع",
    thisMonth: "هذا الشهر",
    lastMonth: "الشهر الماضي",
    thisYear: "هذا العام",
    customRange: "نطاق مخصص",
    startDate: "تاريخ البداية",
    endDate: "تاريخ النهاية",
    apply: "تطبيق",
    // User roles
    Admin: "مدير",
    Accountant: "محاسب",
    Technician: "فني",
    // Common actions
    actions: "الإجراءات",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    close: "إغلاق",
    view: "عرض",
    add: "إضافة",
    // Status labels
    paid: "مدفوع",
    partiallyPaid: "مدفوع جزئياً",
    unpaid: "غير مدفوع",
    overdue: "متأخر",
    Pending: "معلق",
    InProgress: "قيد التنفيذ",
    Completed: "مكتمل",
    Cancelled: "ملغي",
    // Additional common labels
    theme: "المظهر",
    columns: "الأعمدة",
    toggleColumns: "تبديل الأعمدة",
    id: "المعرف",
    name: "الاسم",
    date: "التاريخ",
    status: "الحالة",
    totalAmount: "المبلغ الإجمالي",
    invoiceNumber: "رقم الفاتورة",
    customer: "العميل",
    supplier: "المورد",
    type: "النوع",
    quantity: "الكمية",
    // Invoice types
    Outgoing: "صادرة",
    Incoming: "واردة",
    ReturnCustomer: "مرتجع (عميل)",
    ReturnSupplier: "مرتجع (مورد)",
    ExternalTechnicianWages: "فاتورة فني خارجي",
    WorkshopEquipmentExpense: "معدات الورشة",
    GeneralExpense: "مصروف عام",
    // Customer page specific labels
    addNewCustomer: "إضافة عميل جديد",
    customerName: "اسم العميل",
    contactPerson: "الشخص المسؤول",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    address: "العنوان",
    internalId: "المعرف الداخلي",
    openingBalance: "رصيد أول المدة",
    basicInformation: "المعلومات الأساسية",
    additionalInformation: "معلومات إضافية",
    pricing: "التسعير",
    // Supplier page specific labels
    addNewSupplier: "إضافة مورد جديد",
    supplierName: "اسم المورد",
    // Vehicle page specific labels
    addNewVehicle: "إضافة سيارة جديدة",
    editVehicle: "تعديل السيارة",
    vehicle: "السيارة",
    make: "الماركة",
    model: "الموديل",
    year: "سنة الصنع",
    licensePlate: "رقم اللوحة",
    vin: "رقم الهيكل",
    color: "اللون",
    engineCylinders: "عدد الأسطوانات",
    engineNumber: "رقم المحرك",
    tireSize: "مقاس الإطار",
    customerRequired: "العميل مطلوب.",
    selectCustomer: "اختر العميل",
    vehicleInformation: "معلومات السيارة",
    "N/A": "غير متوفر",
    // Maintenance Cards page specific labels
    addNewMaintenanceCard: "إضافة بطاقة صيانة جديدة",
    editMaintenanceCard: "تعديل بطاقة الصيانة",
    maintenanceCard: "بطاقة الصيانة",
    vehicleRequired: "السيارة مطلوبة.",
    selectVehicle: "اختر السيارة",
    dateCreated: "تاريخ الإنشاء",
    dateCompleted: "تاريخ الإنجاز",
    reportedIssues: "الأعطال المبلغة",
    faultDescription: "وصف العطل",
    causeOfFailure: "سبب العطل",
    odometerIn: "عداد المسافة (دخول) كم",
    odometerOut: "عداد المسافة (خروج) كم",
    fuelLevelIn: "مستوى الوقود (دخول)",
    fuelLevelOut: "مستوى الوقود (خروج)",
    assignedTechnicians: "الفنيين المكلفين",
    selectTechnicians: "اختر الفنيين",
    tasks: "المهام",
    taskDescription: "وصف المهمة",
    addTask: "إضافة مهمة",
    notes: "ملاحظات",
    select: "اختر",
    searchOrSelectCustomer: "ابحث أو اختر العميل",
    selectCustomerFirst: "اختر العميل أولاً",
    noIssueRequestLinked: "لا يوجد طلب صرف مرتبط",
    // Fuel levels (already defined in FUEL_LEVEL_OPTIONS but adding for consistency)
    Empty: "فارغ",
    Quarter: "1/4 (ربع)",
    Half: "1/2 (نصف)",
    ThreeQuarters: "3/4 (ثلاثة أرباع)",
    Full: "ممتلئ",
    // Parts page specific labels
    addNewPart: "إضافة قطعة غيار جديدة",
    editPart: "تعديل قطعة الغيار",
    part: "قطعة الغيار",
    sku: "رمز القطعة",
    quantityInStock: "الكمية في المخزون",
    purchasePrice: "سعر الشراء",
    sellingPrice: "سعر البيع",
    compatibleVehicles: "السيارات المتوافقة",
    initialStock: "المخزون الأولي",
    partCondition: "حالة القطعة",
    New: "جديد",
    Used: "مستعمل",
    description: "الوصف",
    incomingQuantity: "الكمية الواردة",
    outgoingQuantity: "الكمية الصادرة",
    // Inventory Issue Requests page specific labels
    inventoryIssueRequests: "طلبات إخراج قطع الغيار",
    addNewInventoryIssueRequest: "إضافة طلب إخراج جديد",
    editInventoryIssueRequest: "تعديل طلب الإخراج",
    issueRequest: "طلب الإخراج",
    requestDate: "تاريخ الطلب",
    warehouseSource: "مصدر المخزن",
    mainWarehouse: "المخزن الرئيسي",
    secondaryWarehouse: "المخزن الثانوي",
    selectMaintenanceCardOptional: "اختر بطاقة الصيانة (اختياري)",
    requestedBy: "طلب بواسطة",
    receivedBy: "استلم بواسطة",
    storekeeper: "أمين المخزن",
    selectEmployee: "اختر الموظف",
    searchOrSelectEmployee: "ابحث أو اختر الموظف",
    requestedParts: "القطع المطلوبة",
    quantityRequested: "الكمية المطلوبة",
    quantityIssued: "الكمية المصروفة",
    partDetails: "تفاصيل القطعة",
    addPartToRequest: "إضافة قطعة للطلب",
    searchOrSelectPart: "ابحث أو اختر القطعة",
    available: "متوفر",
    requestDetails: "تفاصيل الطلب",
    personnel: "الموظفين",
    linkedMaintenanceCard: "بطاقة الصيانة المرتبطة",
    iirDateIssued: "تاريخ الإصدار",
    dateReconciled: "تاريخ التسوية",
    reconciledBy: "سوى بواسطة",
    replacedPartsInfo: "معلومات القطع المستبدلة",
    condition: "الحالة",
    confirmIssueRequest: "تأكيد إصدار الطلب",
    reconcileIssueRequest: "تسوية طلب الإخراج",
    issuedParts: "القطع المصروفة",
    originalPart: "القطعة الأصلية",
    customPartName: "اسم قطعة مخصص",
    addReplacedPart: "إضافة قطعة مستبدلة",
    // Status labels for inventory issue requests
    DRAFT: "مسودة",
    ISSUED: "مصدر",
    RECONCILED: "مسوى",
    CANCELLED: "ملغي",
    // Replaced part conditions
    REUSABLE: "قابل للإعادة الاستخدام",
    DAMAGED: "تالف",
    DISPOSED: "تم التخلص منه",
    // Error messages
    cannotEditIssuedReconciled: "لا يمكن تعديل الطلبات المصدرة أو المسواة",
    cannotDeleteIssuedReconciled: "لا يمكن حذف الطلبات المصدرة أو المسواة",
    canOnlyReconcileIssued: "يمكن تسوية الطلبات المصدرة فقط",
    mustAddPartsToRequest: "يجب إضافة قطع للطلب",
    quantityErrorTooHigh: "الكمية المطلوبة أكبر من المتوفر",
    replacedQuantityExceedsIssuedFor: "الكمية المستبدلة تتجاوز المصروفة لـ",
    issued: "مصروف",
    replaced: "مستبدل",
    unknownPart: "قطعة غير معروفة",
    typeToAddNew: "اكتب لإضافة جديد",
    typeToSearchOrAdd: "اكتب للبحث أو الإضافة",
    // Secondary Warehouse page specific labels
    partName: "اسم القطعة",
    partSku: "رمز القطعة",
    dateAdded: "تاريخ الإضافة",
    derivedFrom: "مشتق من",
    allConditions: "جميع الحالات",
    // External Technicians page specific labels
    externalTechnicianInvoices: "فواتير الفنيين الخارجيين",
    addNewExternalTechnicianInvoice: "إضافة فاتورة فني خارجي جديدة",
    editExternalTechnicianInvoice: "تعديل فاتورة الفني الخارجي",
    externalTechnicianName: "اسم الفني الخارجي",
    dateIssued: "تاريخ الإصدار",
    invoiceItems: "بنود الفاتورة",
    unitPrice: "سعر الوحدة",
    subTotal: "المجموع الفرعي",
    discountAmount: "مبلغ الخصم",
    amountPaid: "المبلغ المدفوع",
    amountDue: "المبلغ المستحق",
    paymentStatus: "حالة الدفع",
    unknownVehicle: "سيارة غير معروفة",
    // External Technicians management labels
    addNewExternalTechnician: "إضافة فني خارجي جديد",
    editExternalTechnician: "تعديل الفني الخارجي",
    technicianName: "اسم الفني",
    specialization: "التخصص",
    mechanicSpecialization: "فني ميكانيك",
    electricalSpecialization: "فني كهرباء",
    bodyworkSpecialization: "فني حدادة",
    paintingSpecialization: "فني دهان",
    tiresSpecialization: "فني إطارات",
    acSpecialization: "فني تكييف",
    selectSpecialization: "اختر التخصص",
    searchOrSelectTechnician: "ابحث أو اختر الفني",
    // Additional labels
    invoiceDetails: "تفاصيل الفاتورة",
    invoiceTotals: "إجماليات الفاتورة",
    confirmDelete: "هل أنت متأكد من الحذف؟",
    serviceDescriptionPlaceholder: "وصف الخدمة أو العمل",
    addItem: "إضافة بند",
  }
};