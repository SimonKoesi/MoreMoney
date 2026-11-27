import type {IntelligenceState} from '@/lib/intelligence-state';
import type {EntitySpec} from './finance-editor';
export type IntelligenceProps={data:IntelligenceState;act:(command:Record<string,unknown>)=>Promise<unknown>;edit:(spec:EntitySpec)=>void;refresh:()=>Promise<void>;query:Record<string,string>;setQuery:(values:Record<string,string>)=>void};
