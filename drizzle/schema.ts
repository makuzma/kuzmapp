import { pgTable, text, timestamp, boolean, integer, real, primaryKey, json, unique } from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  calendarColor: text('calendar_color').notNull().default('#3b82f6'),
  notificationPages: json('notification_pages').$type<string[]>().default([]),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const role = pgTable('role', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('neutral'),
  pages: json('pages').$type<string[]>().notNull().default([]),
  vacationDays: integer('vacation_days').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const userRole = pgTable('user_role', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull().references(() => role.id, { onDelete: 'cascade' }),
}, t => [primaryKey({ columns: [t.userId, t.roleId] })])

export const group = pgTable('group', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('neutral'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const userGroup = pgTable('user_group', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  groupId: text('group_id').notNull().references(() => group.id, { onDelete: 'cascade' }),
}, t => [primaryKey({ columns: [t.userId, t.groupId] })])

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
})

export const twoFactor = pgTable('two_factor', {
  id: text('id').primaryKey(),
  secret: text('secret').notNull(),
  backupCodes: text('backup_codes').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const projectType = pgTable('project_type', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('i-lucide-folder'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const projectStatus = pgTable('project_status', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull().default('neutral'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const customer = pgTable('customer', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  currency: text('currency').notNull().default('EUR'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const customerAddress = pgTable('customer_address', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customer.id, { onDelete: 'cascade' }),
  street: text('street'),
  city: text('city'),
  zip: text('zip'),
  country: text('country'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const customerContact = pgTable('customer_contact', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customer.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: text('position'),
  email: text('email'),
  phone: text('phone'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const product = pgTable('product', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const productType = pgTable('product_type', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const productProductType = pgTable('product_product_type', {
  productId: text('product_id').notNull().references(() => product.id, { onDelete: 'cascade' }),
  productTypeId: text('product_type_id').notNull().references(() => productType.id, { onDelete: 'cascade' }),
}, t => [primaryKey({ columns: [t.productId, t.productTypeId] })])

export const productProjectType = pgTable('product_project_type', {
  productId: text('product_id').notNull().references(() => product.id, { onDelete: 'cascade' }),
  typeId: text('type_id').notNull().references(() => projectType.id, { onDelete: 'cascade' }),
}, t => [primaryKey({ columns: [t.productId, t.typeId] })])

export const customerProduct = pgTable('customer_product', {
  customerId: text('customer_id').notNull().references(() => customer.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => product.id, { onDelete: 'cascade' }),
}, t => [primaryKey({ columns: [t.customerId, t.productId] })])

export const customerProjectType = pgTable('customer_project_type', {
  customerId: text('customer_id').notNull().references(() => customer.id, { onDelete: 'cascade' }),
  typeId: text('type_id').notNull().references(() => projectType.id, { onDelete: 'cascade' }),
}, t => [primaryKey({ columns: [t.customerId, t.typeId] })])

export const project = pgTable('project', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  typeId: text('type_id').references(() => projectType.id, { onDelete: 'set null' }),
  statusId: text('status_id').references(() => projectStatus.id, { onDelete: 'set null' }),
  customerId: text('customer_id').references(() => customer.id, { onDelete: 'set null' }),
  contactId: text('contact_id').references(() => customerContact.id, { onDelete: 'set null' }),
  productId: text('product_id').references(() => product.id, { onDelete: 'set null' }),
  productTypeId: text('product_type_id').references(() => productType.id, { onDelete: 'set null' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  startDate: timestamp('start_date'),
  deadline: timestamp('deadline'),
  archivedAt: timestamp('archived_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const timePhase = pgTable('time_phase', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  allowFiles: boolean('allow_files').notNull().default(false),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const timePhaseProjectType = pgTable('time_phase_project_type', {
  phaseId: text('phase_id').notNull().references(() => timePhase.id, { onDelete: 'cascade' }),
  typeId: text('type_id').notNull().references(() => projectType.id, { onDelete: 'cascade' }),
}, t => [primaryKey({ columns: [t.phaseId, t.typeId] })])

export const timePhaseSubcategory = pgTable('time_phase_subcategory', {
  id: text('id').primaryKey(),
  phaseId: text('phase_id').notNull().references(() => timePhase.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const timeEntryCategory = pgTable('time_entry_category', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  isAusfall: boolean('is_ausfall').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const timeEntry = pgTable('time_entry', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  phaseId: text('phase_id').notNull().references(() => timePhase.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').references(() => timeEntryCategory.id, { onDelete: 'set null' }),
  subcategoryIds: json('subcategory_ids').$type<string[]>().notNull().default([]),
  date: text('date').notNull(),
  description: text('description').notNull().default(''),
  anzahl: integer('anzahl'),
  duration: integer('duration').notNull(),
  filePath: text('file_path'),
  lastEditedByUserId: text('last_edited_by_user_id').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const projectPhase = pgTable('project_phase', {
  projectId: text('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  phaseId: text('phase_id').notNull().references(() => timePhase.id, { onDelete: 'cascade' }),
  activeSubcategoryIds: json('active_subcategory_ids').$type<string[]>().notNull().default([]),
}, t => [primaryKey({ columns: [t.projectId, t.phaseId] })])

export const image = pgTable('image', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  originalName: text('original_name').notNull(),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const berechnungsschema = pgTable('berechnungsschema', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customer.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => product.id, { onDelete: 'cascade' }),
  productTypeId: text('product_type_id').notNull().references(() => productType.id, { onDelete: 'cascade' }),
  entries: json('entries').$type<Record<string, any[]>>().notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, t => [unique().on(t.customerId, t.productId, t.productTypeId)])

export const calendarEvent = pgTable('calendar_event', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull().default(''),
  color: text('color').notNull().default('#3b82f6'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const calendarFerien = pgTable('calendar_ferien', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  halfDay: boolean('half_day').notNull().default(false),
  halfDayPart: text('half_day_part'),
  color: text('color').notNull().default('#3b82f6'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const vacation = pgTable('vacation', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  description: text('description').notNull().default(''),
  approved: boolean('approved').notNull().default(false),
  approvedBy: text('approved_by').references(() => user.id, { onDelete: 'set null' }),
  isCompensation: boolean('is_compensation').notNull().default(false),
  compensationDays: real('compensation_days'),
  halfDay: boolean('half_day').notNull().default(false),
  halfDayPart: text('half_day_part'),
  halfDayDate: text('half_day_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const projectFile = pgTable('project_file', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  originalName: text('original_name').notNull(),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull().default(''),
  fileSize: integer('file_size').notNull().default(0),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const projectPin = pgTable('project_pin', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  fileId: text('file_id').references(() => projectFile.id, { onDelete: 'cascade' }),
  x: real('x').notNull(),
  y: real('y').notNull(),
  comment: text('comment').notNull(),
  authorName: text('author_name').notNull().default(''),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const activityLog = pgTable('activity_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  target: text('target'),
  meta: json('meta').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const appComment = pgTable('app_comment', {
  id: text('id').primaryKey(),
  targetType: text('target_type').notNull(),
  targetId: text('target_id').notNull(),
  subject: text('subject').notNull().default(''),
  text: text('text').notNull(),
  authorName: text('author_name').notNull().default(''),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  replyToId: text('reply_to_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const projectBilling = pgTable('project_billing', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  data: json('data').$type<Record<string, any>>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const companyInfo = pgTable('company_info', {
  id: text('id').primaryKey(),
  name: text('name').notNull().default(''),
  phone: text('phone').notNull().default(''),
  address: text('address').notNull().default(''),
  contactPerson: text('contact_person').notNull().default(''),
  logoPath: text('logo_path'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const portfolio = pgTable('portfolio', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('blue'),
  portfolioType: text('portfolio_type').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const cashBalance = pgTable('cash_balance', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  portfolioId: text('portfolio_id').references(() => portfolio.id, { onDelete: 'set null' }),
  label: text('label').notNull().default(''),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('CHF'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const metalHolding = pgTable('metal_holding', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  metalKey: text('metal_key').notNull(),
  coinType: text('coin_type').notNull().default(''),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull().default('oz'),
  purchaseDate: text('purchase_date'),
  purchasePricePerOz: real('purchase_price_per_oz'),
  purchaseCurrency: text('purchase_currency').notNull().default('CHF'),
  portfolioId: text('portfolio_id').references(() => portfolio.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const saule3a = pgTable('saule3a', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  label: text('label').notNull().default(''),
  amount: real('amount').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const stockWatchlist = pgTable('stock_watchlist', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  exchange: text('exchange').notNull().default(''),
  currency: text('currency').notNull().default(''),
  shares: real('shares'),
  purchasePrice: real('purchase_price'),
  purchaseDate: text('purchase_date'),
  portfolioId: text('portfolio_id').references(() => portfolio.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
