import { and, eq } from 'drizzle-orm'
import { generateId } from 'better-auth'
import { auth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import {
  project,
  projectBilling,
  projectPhase,
  berechnungsschema,
  customerAddress,
  timeEntry,
  timeEntryCategory,
  timePhase,
  timePhaseSubcategory,
  customerContact,
  customer as customerTable,
  product as productTable,
  productType as productTypeTable,
} from '../../../../drizzle/schema'

function calcRoundCost(roundCount: number, rules: any[]): number {
  if (roundCount === 0) return 0
  const pauschale = rules.find((r: any) => r.type === 'Pauschale')
  const entwurf = rules.find((r: any) => r.type === 'Entwurf' || r.type === 'Zeit')
  let cost = 0
  if (pauschale) {
    cost += pauschale.geld ?? 0
    const max = pauschale.max ?? 0
    if (entwurf && roundCount > max) {
      cost += (roundCount - max) * (entwurf.geld ?? 0)
    }
  } else if (entwurf) {
    cost += roundCount * (entwurf.geld ?? 0)
  }
  return cost
}

function computeEntryBreakdown(entries: any[], allRules: any[]): any[] {
  const baseRules = allRules.filter((r: any) => !r.subcategoryId)
  const pauschale = baseRules.find((r: any) => r.type === 'Pauschale')
  const entwurf = baseRules.find((r: any) => r.type === 'Entwurf' || r.type === 'Zeit')
  const ausfallRule = baseRules.find((r: any) => r.type === 'Ausfall')

  const result: any[] = []
  let cumulativeAnzahl = 0
  let pauschaleActivated = false

  for (const entry of entries) {
    if (entry.isAusfall) {
      // Compute Ausfall cost for this round
      let ausfallCost: number | null = null
      if (ausfallRule) {
        const roundCost = calcRoundCost(cumulativeAnzahl, baseRules)
        if (ausfallRule.ausfallModus === '%') {
          ausfallCost = roundCost * ((ausfallRule.ausfallWert ?? 0) / 100)
        } else {
          ausfallCost = ausfallRule.geld ?? 0
        }
      }
      result.push({ ...entry, cost: ausfallCost, costType: 'ausfall', costNote: ausfallCost !== null ? `Ausfall` : null })
      cumulativeAnzahl = 0
      pauschaleActivated = false
    } else {
      const anzahl = entry.anzahl ?? 1
      const prevCumulative = cumulativeAnzahl
      cumulativeAnzahl += anzahl

      if (!allRules.length) {
        result.push({ ...entry, cost: null, costType: null, costNote: null })
        continue
      }

      if (pauschale) {
        const max = pauschale.max ?? 0
        if (!pauschaleActivated) {
          pauschaleActivated = true
          if (cumulativeAnzahl <= max) {
            // Triggers pauschale, fully within max
            result.push({ ...entry, cost: pauschale.geld ?? 0, costType: 'pauschale', costNote: `Pauschale (inkl. bis ${max})` })
          } else {
            // Triggers pauschale AND overage in same entry
            const overageAnzahl = cumulativeAnzahl - max
            const overageCost = entwurf ? overageAnzahl * (entwurf.geld ?? 0) : 0
            const totalCost = (pauschale.geld ?? 0) + overageCost
            result.push({ ...entry, cost: totalCost, costType: 'pauschale', costNote: `Pauschale + ${overageAnzahl} × ${entwurf?.geld ?? 0}` })
          }
        } else {
          if (prevCumulative >= max) {
            // Fully over max
            const cost = entwurf ? anzahl * (entwurf.geld ?? 0) : 0
            result.push({ ...entry, cost, costType: 'overage', costNote: `${anzahl} × ${entwurf?.geld ?? 0}` })
          } else if (cumulativeAnzahl > max) {
            // Partially within, partially over
            const overageAnzahl = cumulativeAnzahl - max
            const cost = entwurf ? overageAnzahl * (entwurf.geld ?? 0) : 0
            result.push({ ...entry, cost, costType: 'partial-overage', costNote: `${overageAnzahl} × ${entwurf?.geld ?? 0} (Überschreitung)` })
          } else {
            // Fully within max
            result.push({ ...entry, cost: 0, costType: 'included', costNote: 'Im Pauschale' })
          }
        }
      } else if (entwurf) {
        const cost = anzahl * (entwurf.geld ?? 0)
        result.push({ ...entry, cost, costType: 'zeit', costNote: `${anzahl} × ${entwurf.geld ?? 0}` })
      } else {
        result.push({ ...entry, cost: null, costType: null, costNote: null })
      }
    }
  }

  return result
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')!

  // Fetch project with all related data
  const [proj] = await db
    .select({
      id: project.id,
      name: project.name,
      customerId: project.customerId,
      customerName: customerTable.name,
      customerCurrency: customerTable.currency,
      contactId: customerContact.id,
      contactName: customerContact.name,
      contactPosition: customerContact.position,
      contactEmail: customerContact.email,
      contactPhone: customerContact.phone,
      productId: productTable.id,
      productName: productTable.name,
      productTypeId: productTypeTable.id,
      productTypeName: productTypeTable.name,
    })
    .from(project)
    .leftJoin(customerTable, eq(project.customerId, customerTable.id))
    .leftJoin(customerContact, eq(project.contactId, customerContact.id))
    .leftJoin(productTable, eq(project.productId, productTable.id))
    .leftJoin(productTypeTable, eq(project.productTypeId, productTypeTable.id))
    .where(eq(project.id, id))

  if (!proj) throw createError({ statusCode: 404, message: 'Projekt nicht gefunden' })

  // Fetch customer address
  let address: { street: string | null; city: string | null; zip: string | null; country: string | null } | null = null
  if (proj.customerId) {
    const [addr] = await db
      .select({ street: customerAddress.street, city: customerAddress.city, zip: customerAddress.zip, country: customerAddress.country })
      .from(customerAddress)
      .where(eq(customerAddress.customerId, proj.customerId))
      .limit(1)
    if (addr) address = addr
  }

  // Fetch berechnungsschema
  let schemaEntries: Record<string, any[]> = {}
  if (proj.customerId && proj.productId && proj.productTypeId) {
    const [schema] = await db
      .select({ entries: berechnungsschema.entries })
      .from(berechnungsschema)
      .where(
        and(
          eq(berechnungsschema.customerId, proj.customerId),
          eq(berechnungsschema.productId, proj.productId),
          eq(berechnungsschema.productTypeId, proj.productTypeId),
        )
      )
      .limit(1)
    if (schema) schemaEntries = schema.entries as Record<string, any[]>
  }

  // Fetch active subcategory IDs per phase
  const projectPhases = await db
    .select({ phaseId: projectPhase.phaseId, activeSubcategoryIds: projectPhase.activeSubcategoryIds })
    .from(projectPhase)
    .where(eq(projectPhase.projectId, id))
  const activeSubcategoryMap: Record<string, string[]> = {}
  for (const pp of projectPhases) {
    activeSubcategoryMap[pp.phaseId] = (pp.activeSubcategoryIds as string[]) ?? []
  }

  // Fetch subcategory names
  const allSubcategories = await db
    .select({ id: timePhaseSubcategory.id, name: timePhaseSubcategory.name })
    .from(timePhaseSubcategory)
  const subcategoryNameMap: Record<string, string> = {}
  for (const sub of allSubcategories) {
    subcategoryNameMap[sub.id] = sub.name
  }

  // Fetch ausfall categories
  const ausfallCategories = await db
    .select({ id: timeEntryCategory.id })
    .from(timeEntryCategory)
    .where(eq(timeEntryCategory.isAusfall, true))
  const ausfallCategoryIds = new Set(ausfallCategories.map(c => c.id))

  // Fetch all time entries with phase name, sorted by date
  const entries = await db
    .select({
      phaseId: timeEntry.phaseId,
      phaseName: timePhase.name,
      date: timeEntry.date,
      duration: timeEntry.duration,
      anzahl: timeEntry.anzahl,
      description: timeEntry.description,
      categoryId: timeEntry.categoryId,
      createdAt: timeEntry.createdAt,
    })
    .from(timeEntry)
    .leftJoin(timePhase, eq(timeEntry.phaseId, timePhase.id))
    .where(eq(timeEntry.projectId, id))
    .orderBy(timeEntry.date, timeEntry.createdAt)

  // Group entries by phase
  const phaseMap = new Map<string, { phaseId: string; phaseName: string; entries: any[]; cost: number | null; subcategoryExtras: { name: string; cost: number }[] | null }>()
  for (const entry of entries) {
    const phaseId = entry.phaseId
    if (!phaseMap.has(phaseId)) {
      phaseMap.set(phaseId, { phaseId, phaseName: entry.phaseName ?? '', entries: [], cost: null, subcategoryExtras: null })
    }
    phaseMap.get(phaseId)!.entries.push({
      date: entry.date,
      duration: entry.duration,
      anzahl: entry.anzahl,
      description: entry.description,
      isAusfall: entry.duration === 0 || (!!entry.categoryId && ausfallCategoryIds.has(entry.categoryId)),
    })
  }

  // Calculate cost per phase
  let totalCost: number | null = null
  for (const [phaseId, phase] of phaseMap) {
    const allRules: any[] = schemaEntries[phaseId] ?? []

    // Compute per-entry breakdown
    if (allRules.length && phase.entries.length) {
      phase.entries = computeEntryBreakdown(phase.entries, allRules)
    } else {
      phase.entries = phase.entries.map(e => ({ ...e, cost: null, costType: null, costNote: null }))
    }

    if (!allRules.length || !phase.entries.length) continue

    const baseRules = allRules.filter((r: any) => !r.subcategoryId)
    const ausfallRule = baseRules.find((r: any) => r.type === 'Ausfall')
    let grandTotal = 0

    if (baseRules.length) {
      let roundCount = 0
      for (const entry of phase.entries) {
        if (entry.isAusfall) {
          const roundCost = calcRoundCost(roundCount, baseRules)
          if (ausfallRule) {
            if (ausfallRule.ausfallModus === '%') {
              grandTotal += roundCost * ((ausfallRule.ausfallWert ?? 0) / 100)
            } else {
              grandTotal += ausfallRule.geld ?? 0
            }
          }
          roundCount = 0
        } else {
          roundCount += entry.anzahl ?? 1
        }
      }
      grandTotal += calcRoundCost(roundCount, baseRules)
    }

    // Extra cost for active subcategories
    const subcategoryExtras: { name: string; cost: number }[] = []
    for (const sid of (activeSubcategoryMap[phaseId] ?? [])) {
      const subRules = allRules.filter((r: any) => r.subcategoryId === sid)
      if (subRules.length) {
        const subCost = subRules.reduce((sum: number, r: any) => sum + (r.geld ?? 0), 0)
        grandTotal += subCost
        subcategoryExtras.push({ name: subcategoryNameMap[sid] ?? sid, cost: subCost })
      }
    }

    phase.cost = grandTotal
    phase.subcategoryExtras = subcategoryExtras.length > 0 ? subcategoryExtras : null
    if (totalCost === null) totalCost = 0
    totalCost += grandTotal
  }

  const snapshot: Record<string, any> = {
    projectId: proj.id,
    projectName: proj.name,
    createdAt: new Date().toISOString(),
    currency: proj.customerCurrency ?? 'CHF',
    customer: proj.customerId ? { id: proj.customerId, name: proj.customerName } : null,
    customerAddress: address ?? null,
    product: proj.productId ? { id: proj.productId, name: proj.productName } : null,
    productType: proj.productTypeId ? { id: proj.productTypeId, name: proj.productTypeName } : null,
    contact: proj.contactId
      ? {
          id: proj.contactId,
          name: proj.contactName,
          position: proj.contactPosition,
          email: proj.contactEmail,
          phone: proj.contactPhone,
        }
      : null,
    phases: Array.from(phaseMap.values()),
    totalCost,
  }

  // Upsert: overwrite existing billing for this project if one exists
  const [existing] = await db
    .select({ id: projectBilling.id })
    .from(projectBilling)
    .where(eq(projectBilling.projectId, id))
    .limit(1)

  if (existing) {
    await db.update(projectBilling)
      .set({ data: snapshot, createdAt: new Date() })
      .where(eq(projectBilling.id, existing.id))
    return { id: existing.id }
  }

  const billingId = generateId()
  await db.insert(projectBilling).values({ id: billingId, projectId: id, data: snapshot, createdAt: new Date() })
  return { id: billingId }
})
