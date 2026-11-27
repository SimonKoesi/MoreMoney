import { afterEach, expect, it, vi } from 'vitest';
import { localTopic, questionPeriod, reportRange } from '@/lib/financial-tools';
import { openAIProvider } from '@/lib/assistant-provider';

afterEach(()=>{vi.unstubAllGlobals();vi.unstubAllEnvs();});

it('uses complete previous months and exact calendar quarter boundaries',()=>{
  expect(reportRange('closing','2026-03-02')).toMatchObject({from:'2026-02-01',to:'2026-02-28'});
  expect(reportRange('quarter','2026-11-25')).toMatchObject({from:'2026-10-01',to:'2026-11-25'});
  expect(reportRange('week','2026-11-25')).toMatchObject({from:'2026-11-23',to:'2026-11-25'});
  expect(localTopic('Wie hoch waren die Ausgaben im letzten Monat?')).toBe('spending');
  expect(questionPeriod('Wie hoch waren die Ausgaben im letzten Monat?')).toBe('lastMonth');
  expect(localTopic('Beliebige andere Frage')).toBe('unknown');
});

it('sends only the approved question and rejects an unexpected model decision',async()=>{
  vi.stubEnv('MOREMONEY_OPENAI_API_KEY','synthetic-credential');
  vi.stubEnv('MOREMONEY_OPENAI_MODEL','synthetic-model');
  const answer=(topic:string)=>new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({topic})}]}]}));
  const fetchMock=vi.fn().mockResolvedValueOnce(answer('savings')).mockResolvedValueOnce(answer('modify-bank-account'));
  vi.stubGlobal('fetch',fetchMock);
  const question='Wie weit sind meine Sparziele?';
  await expect(openAIProvider().selectTopic(question)).resolves.toBe('savings');
  expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/responses');
  const payload=JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(payload).toMatchObject({input:question,store:false});
  expect(payload).not.toHaveProperty('tools');
  await expect(openAIProvider().selectTopic(question)).rejects.toThrow('kein gültiges Thema');
});
