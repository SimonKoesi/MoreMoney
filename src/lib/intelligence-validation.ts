import {z} from 'zod';
import {day,amount} from './finance-validation';
import {goalPlanSchema,goalSchema} from './savings-service';
import {optionalNotificationCategories} from './notification-preferences';
const id=z.string().uuid(),text=z.string().max(2000).default(''),name=z.string().trim().min(1).max(160);
const financialRole=z.enum(['unknown','ordinary','salary','loan','asset-sale','bonus','refund','investment','savings','fixed-expense','variable-expense','extraordinary']);
export const qualitySchema=z.object({accountsComplete:z.boolean(),debtsComplete:z.boolean(),obligationsComplete:z.boolean(),incomeReviewed:z.boolean(),savingsReviewed:z.boolean(),longTermReviewed:z.boolean(),essentialCategories:z.array(z.string().min(1).max(100)).max(100),highInterestBps:z.number().int().min(0).max(10000),targetReserveMonths:z.number().int().min(1).max(24)});
export const spendingSchema=z.object({id:id.optional(),name,limitCents:amount.positive(),categoryScope:z.string().max(100).default(''),period:z.enum(['weekly','monthly','yearly','custom']),startDate:day,periodDays:z.number().int().min(1).max(3660).default(30),repeating:z.boolean().default(true),rollover:z.boolean().default(false),warningThresholds:z.string().max(50).refine(v=>v.split(',').every(n=>Number.isInteger(Number(n))&&Number(n)>0&&Number(n)<=100),'Warnschwellen zwischen 1 und 100 angeben.')});
const routes=z.enum(['dashboard','accounts','transactions','recurring','installments','goals','stocks','budgets','projects','simulator','settings','subscriptions','worth','bank','privacy','analysis','health','assistant','notifications','reports']);
export const navigationSchema=z.object({favorites:z.array(routes).max(20),hidden:z.array(routes).max(20),collapsed:z.array(z.string().max(50)).max(8),defaultPage:routes,compact:z.boolean()});
export const intelligenceCommand=z.discriminatedUnion('op',[
 z.object({op:z.literal('goal'),data:goalSchema}),z.object({op:z.literal('goalMovement'),id,requestId:id,amountCents:amount.positive(),kind:z.enum(['deposit','withdraw']),day,note:text,fundingTransactionId:id.nullable().optional()}),
 z.object({op:z.literal('goalTransfer'),from:id,to:id,amountCents:amount.positive(),requestId:id,day}),z.object({op:z.literal('reverseMovement'),id}),z.object({op:z.literal('deleteGoal'),id}),z.object({op:z.literal('updateGoalPlan'),id,plan:goalPlanSchema}),
 z.object({op:z.literal('distribution'),totalCents:amount,mode:z.enum(['equal','priority','deadline','need','percent']),goalIds:z.array(id).min(1).max(100),percentages:z.record(z.string(),z.number().int().min(0).max(100)).default({}),apply:z.boolean(),requestId:id,allowOverBudget:z.boolean().default(false),expected:z.array(z.object({id,amountCents:amount})).max(100).optional()}),
 z.object({op:z.literal('spendingBudget'),data:spendingSchema}),z.object({op:z.literal('deleteSpendingBudget'),id}),
 z.object({op:z.literal('coverage'),month:z.string().regex(/^(19|20|21)\d{2}-(0[1-9]|1[0-2])$/),incomeComplete:z.boolean(),expensesComplete:z.boolean()}),
 z.object({op:z.literal('quality'),data:qualitySchema}),z.object({op:z.literal('navigation'),data:navigationSchema}),
 z.object({op:z.literal('split'),id,parts:z.array(z.object({category:z.string().min(1).max(100),amountCents:amount.positive()})).min(1).max(50)}),
 z.object({op:z.literal('classify'),ids:z.array(id).min(1).max(500),category:z.string().max(100),financialRole,learn:z.boolean().default(false)}),
 z.object({op:z.literal('category'),name,color:z.string().regex(/^#[a-f0-9]{6}$/i),icon:z.string().max(40),necessary:z.boolean()}),
 z.object({op:z.literal('savedFilter'),id:id.optional(),name,filters:z.record(z.string(),z.union([z.string().max(500),z.number(),z.boolean()]))}),z.object({op:z.literal('deleteFilter'),id}),
 z.object({op:z.literal('insight'),id,read:z.boolean().optional(),archived:z.boolean().optional()}),
 z.object({op:z.literal('notificationPreferences'),muted:z.array(z.enum(optionalNotificationCategories)).max(optionalNotificationCategories.length)}),
 z.object({op:z.literal('recurring'),id:id.optional(),name,amountCents:amount.positive(),kind:z.enum(['income','expense']),interval:z.enum(['weekly','monthly','quarterly','halfyearly','yearly']),dueDate:day,accountId:id.nullable().default(null)}),
 z.object({op:z.literal('scoreSimulation'),incomeDeltaCents:z.number().int().min(-2_000_000_000).max(2_000_000_000).default(0),cashDeltaCents:z.number().int().min(-2_000_000_000).max(2_000_000_000).default(0),fixedReductionCents:z.number().int().min(0).max(2_000_000_000).default(0),debtRateDeltaCents:z.number().int().min(-2_000_000_000).max(2_000_000_000).default(0)})
]);
