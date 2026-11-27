import { z } from 'zod';
const id = z.string().uuid();
const text = z.string().trim().min(1).max(160);
const amount = z.number().int().min(0).max(2_000_000_000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d=new Date(v+'T12:00:00Z'); return !isNaN(+d) && d.toISOString().slice(0,10)===v; }, 'Ungültiges Datum');
export const command = z.discriminatedUnion('op', [
  z.object({op:z.literal('account'), name:text, type:text, openingCents:z.number().int().min(-2_000_000_000).max(2_000_000_000)}),
  z.object({op:z.literal('archiveAccount'), id, archived:z.boolean()}),
  z.object({op:z.literal('deleteAccount'), id, deleteBookings:z.boolean().default(false)}),
  z.object({op:z.literal('transaction'), requestId:id, title:text, amountCents:amount.positive(), kind:z.enum(['income','expense']), date, accountId:id, category:z.string().max(100).default(''), note:z.string().max(2000).default(''), budgetId:id.optional(), itemId:id.optional()}),
  z.object({op:z.literal('deleteTransaction'), id}),
  z.object({op:z.literal('transfer'), requestId:id, from:id, to:id, amountCents:amount.positive(), date}).refine(d=>d.from!==d.to,'Verschiedene Konten wählen'),
  z.object({op:z.literal('budget'), name:text, description:z.string().max(2000).default(''), limitCents:amount}),
  z.object({op:z.literal('archiveBudget'), id, archived:z.boolean()}),
  z.object({op:z.literal('duplicateBudget'), id}),
  z.object({op:z.literal('item'), budgetId:id, name:text, plannedCents:amount, quantity:z.number().int().min(1).max(1000), category:z.string().max(100).default('')}),
  z.object({op:z.literal('updateItem'), id, name:text, plannedCents:amount, quantity:z.number().int().min(1).max(1000), category:z.string().max(100), note:z.string().max(2000)}),
  z.object({op:z.literal('toggleItem'), id, done:z.boolean()}),
  z.object({op:z.literal('statusItem'), id, status:z.enum(['Wunschliste','Geplant','Bestellt','Geliefert','Erledigt'])}),
  z.object({op:z.literal('deleteItem'), id}),
  z.object({op:z.literal('link'), itemId:id, label:text, url:z.url().refine(v=>['http:','https:'].includes(new URL(v).protocol),'Nur HTTP(S)-Links')}),
  z.object({op:z.literal('deleteLink'), id}),
  z.object({op:z.literal('alternative'), itemId:id, name:text, priceCents:amount, shippingCents:amount}),
  z.object({op:z.literal('activateAlternative'), id}),
  z.object({op:z.literal('project'), name:text, description:z.string().max(2000).default('')}),
  z.object({op:z.literal('task'), projectId:id, name:text}),
  z.object({op:z.literal('toggleTask'), id, done:z.boolean()}),
  z.object({op:z.literal('deleteTask'), id}),
  z.object({op:z.literal('goal'), name:text, targetCents:amount.positive()}),
  z.object({op:z.literal('contribute'), id, amountCents:amount.positive(), requestId:id.optional()}),
  z.object({op:z.literal('recurring'), name:text, amountCents:amount.positive(), interval:z.enum(['weekly','monthly','quarterly','halfyearly','yearly']), dueDate:date}),
  z.object({op:z.literal('deleteRecurring'), id}),
  z.object({op:z.literal('loan'),id,name:text,principalCents:amount.positive(),interestBps:z.number().int().min(0).max(10000),termMonths:z.number().int().min(1).max(600),firstDueDate:date}),
  z.object({op:z.literal('installment'),id,name:text,totalCents:amount.positive(),downPaymentCents:amount,rateCents:amount.positive(),firstDueDate:date}),
  z.object({op:z.literal('payInstallment'),id,index:z.number().int().min(0).max(600),accountId:id,date}),
  z.object({op:z.literal('deleteInstallment'),id}),
  z.object({op:z.literal('privacy'),enabled:z.boolean()}),
  z.object({op:z.literal('settings'), theme:z.enum(['dark','light']), reserveCents:amount, widgets:z.string().max(200)}),
]);
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const url = new URL(request.url);
  // Next's internal request URL may use localhost while the browser uses 127.0.0.1.
  // Validate the actual Host explicitly; never trust arbitrary forwarded hosts.
  let browserUrl:URL;
  try { browserUrl = new URL(url.protocol+'//'+(request.headers.get('host')||url.host)); }
  catch {return false;}
  if (!['127.0.0.1','localhost'].includes(browserUrl.hostname)) return false;
  if (origin && origin !== browserUrl.origin) return false;
  const dest = request.headers.get('sec-fetch-site');
  return !dest || ['same-origin','none'].includes(dest);
}
