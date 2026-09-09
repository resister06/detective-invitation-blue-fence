'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  ArrowLeft, Bird, BookMarked, Check, CheckCircle2, ChevronLeft, ChevronRight,
  CircleHelp, Eye, Flame, Ghost, Highlighter, Layers3, Link2,
  LockKeyhole, LockOpen, MoonStar, PenLine, RotateCcw, Send, Sparkles, Stamp,
  UserRoundSearch,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

type Stage = 'intro' | 'role' | 'game' | 'verdict' | 'ending' | 'failure';
type Message = { speaker: '恶魔' | '你'; text: string };
type Highlight = { text: string; color: string };
type PageId = 'diary' | 'inserts' | 'board' | 'angel';
type RoleId = 'rabbit' | 'witch' | 'magician' | 'captain' | 'black-swan';

const BASE_QUESTIONS = 50;
const diary = [
  '我仍然经常不受控制地想起那个白色的秋日清晨。',
  '前一天下了场大雨，郊区土路上到处是路旁石堆冲出来的石头，我只好更谨慎地推着自行车前进。',
  '如果不是要回去收拾父亲的遗物，我是绝不会在这种天气回这里的。就在我胡乱思考的时候，我突然看到了一排蓝色栅栏不断靠近……除此之外什么都没有',
  '……',
  '我吓得往后退了一步，突然感到天旋地转，我立刻想到了两年前发生在这附近的连环凶杀案。',
  '我挣扎着想要逃走，可为时已晚，在我失去意识以前，我才看到那和我们不一样的……',
  '我已经离开这里太久了，好多的事，我已经记不太清。',
  '我仍然会想起那个诡异的秋日清晨，为什么要去到那个满是蓝色栅栏的地方，为什么会走上那条坎坷的土路。',
];

const fullTruth = [
  '凶手A幼年因外貌原因被霸凌，出现精神疾病。两年前，他每到雾天就会杀害过去霸凌自己的人。由于患有白化病、严重畏光，雾天成为了他选择行动的时机。A很快被捕，经过司法程序，由精神病院院长鉴定为偏执型精神分裂症，随后依照强制医疗程序被送进精神病院。',
  '两年后，精神病院院长去世，医院的管理疏漏接连出现，A一直尝试逃出精神病院。院长去世后的第三天，逆温现象形成的浓雾笼罩了整个郊区。这既没有刺眼的太阳，也没有了严厉的院长。A利用医生轮班迟到的疏忽撬开房门，在浓雾掩护下逃了出去。',
  '离开医院后，A沿着郊区的土路漫无目的地前进，直到遇见骑车返回郊区、准备收拾父亲遗物的院长之子B。A当时穿着蓝白条纹病号服。他走路很轻，苍白的皮肤和头发在浓雾中几乎不可见，只有病号服上的蓝色条纹足够显眼。',
  '雾气太浓，路上又散落着前一晚大雨从石堆中冲出的石块，B只能推车前行。A远远听见推车声，担心被认识自己的人发现并报警，于是捡起一块锐利的石头，放慢脚步。随着两人接近，B逐渐看清病号服上的蓝色竖条，却看不清A隐在白雾中的身体，恍惚间以为一排蓝色栅栏正在不断靠近。',
  'B看清A的脸后，认出他就是报纸上两年前轰动一时的连环杀人案凶手。他受惊后退，被脚下的石块绊倒，头部磕伤，一时无法站起。B挣扎着想逃走，但已经来不及了。A用现场的石头连续重击他的头部，B当场死亡。',
  '日记最后两段来自B死亡后的灵体视角。“蓝色栅栏”并非真正的栅栏，而是浓雾中被误认的蓝白条纹病号服；“失去意识”指向的也不是普通昏迷，而是死亡。',
];

const keyNodes = [
  { id: 'father', title: '院长之子', text: '死者B是本市精神病院院长C的独子。' },
  { id: 'fog', title: '逆温浓雾', text: '案发时罕见的逆温大雾笼罩了土路。' },
  { id: 'weather', title: '石块凶器', text: '致命伤来自路边被雨水冲出的石块。' },
  { id: 'bicycle', title: '推车缓行', text: '雾太浓、碎石太多且路面不平，B只能推车前进。' },
  { id: 'injury', title: '两类头部伤', text: 'B先摔倒磕碰，随后遭到连续钝器重击。' },
  { id: 'escape', title: '病人出逃', text: '清点人数时，精神病院少了一名病人。' },
  { id: 'albino', title: '苍白身影', text: '凶手白发白肤、视力受损并且畏光。' },
  { id: 'uniform', title: '蓝色栅栏', text: '所谓栅栏其实是蓝白条纹病号服。' },
  { id: 'oldcase', title: '两年前旧案', text: 'A是两年前只在雾天作案的连环杀人犯，被捕后由精神病院院长鉴定收治。' },
  { id: 'silence', title: '松动的管理', text: '院长去世后，医院管理疏漏让A得以出逃。' },
] as const;
type NodeId = typeof keyNodes[number]['id'];

const fragments = [
  { id: 'rain', label: '日记句段', title: '前夜暴雨', text: '前夜下了一场很大的雨。', pair: 'stone' },
  { id: 'stone', label: '日记句段', title: '路面石头', text: '泥土被冲开，石块散落在路面。', pair: 'rain' },
  { id: 'legacy', label: '返乡目的', title: '父亲遗物', text: '主角此行是为了收拾父亲留下的东西。', pair: 'rounds' },
  { id: 'rounds', label: '夹页残片', title: '查房记录', text: '某人的每日登记从院长去世后中断。', pair: 'legacy' },
  { id: 'fence', label: '反复描述', title: '蓝色栅栏', text: '浓雾里出现的一排蓝色竖线。', pair: 'stripe' },
  { id: 'stripe', label: '图像细节', title: '蓝色竖条', text: '白色布料上排列着蓝色竖条纹。', pair: 'fence' },
];

const initialMessages: Message[] = [];

const normalize = (value: string) => value.toLowerCase().replace(/[\s，。！？、；：“”‘’（）,.!?;:'"()-]/g, '');
const includesAny = (value: string, terms: string[]) => terms.some((term) => value.includes(normalize(term)));

function renderHighlighted(text: string, highlights: Highlight[]) {
  const related = highlights.filter((item) => text.includes(item.text)).sort((a, b) => text.indexOf(a.text) - text.indexOf(b.text));
  if (!related.length) return text;
  const result: React.ReactNode[] = [];
  let cursor = 0;
  related.forEach((item, index) => {
    const start = text.indexOf(item.text, cursor);
    if (start < cursor) return;
    result.push(text.slice(cursor, start));
    result.push(<mark key={`${item.text}-${index}`} style={{ background: item.color }}>{item.text}</mark>);
    cursor = start + item.text.length;
  });
  result.push(text.slice(cursor));
  return result;
}

export default function Home() {
  const [stage, setStage] = useState<Stage>('intro');
  const [page, setPage] = useState<PageId>('diary');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [asked, setAsked] = useState<string[]>([]);
  const [discovered, setDiscovered] = useState<NodeId[]>([]);
  const [selectedFragments, setSelectedFragments] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [annotationDraft, setAnnotationDraft] = useState('');
  const [annotations, setAnnotations] = useState<string[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [answerOne, setAnswerOne] = useState('');
  const [answerTwo, setAnswerTwo] = useState('');
  const [answerThree, setAnswerThree] = useState('');
  const [score, setScore] = useState(0);
  const [selectedRole, setSelectedRole] = useState<RoleId | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [skillUsed, setSkillUsed] = useState(false);
  const [rabbitHintsUsed, setRabbitHintsUsed] = useState(0);
  const [magicianRetrying, setMagicianRetrying] = useState(false);
  const [magicianRewinding, setMagicianRewinding] = useState(false);
  const [verdictCorrect, setVerdictCorrect] = useState<boolean[]>([false, false, false]);
  const [isAsking, setIsAsking] = useState(false);
  const [turnDirection, setTurnDirection] = useState<'next' | 'prev'>('next');
  const [pageAnimation, setPageAnimation] = useState(0);
  const [turning, setTurning] = useState(false);
  const [unlockNotice, setUnlockNotice] = useState<NodeId[]>([]);
  const [unlockNoticeSerial, setUnlockNoticeSerial] = useState(0);
  const diaryRef = useRef<HTMLDivElement>(null);
  const askingRef = useRef(false);
  const unlockNoticeTimerRef = useRef<number | null>(null);
  const unlockAudioRef = useRef<AudioContext | null>(null);
  const questionLimit = BASE_QUESTIONS + (selectedRole === 'black-swan' && skillUsed ? 10 : 0);
  const remaining = Math.max(0, questionLimit - asked.length);
  const solved = discovered.length === keyNodes.length;

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).has('new')) {
        window.history.replaceState({}, '', window.location.pathname);
        setHydrated(true);
        return;
      }
      const raw = localStorage.getItem('detective-invitation-save-v7');
      if (raw) {
        const save = JSON.parse(raw);
        setStage(save.stage ?? 'intro'); setPage(save.page ?? 'diary');
        setMessages(save.messages ?? initialMessages); setAsked(save.asked ?? []);
        setDiscovered(save.discovered ?? []); setNotes(save.notes ?? '');
        setHighlights(save.highlights ?? []); setAnnotations(save.annotations ?? []);
        setSelectedRole(save.selectedRole ?? (save.stage === 'game' ? 'black-swan' : null));
        setSkillUsed(save.skillUsed ?? false);
        setRabbitHintsUsed(save.rabbitHintsUsed ?? 0);
      }
    } catch { /* A broken save starts a new challenge. */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem('detective-invitation-save-v7', JSON.stringify({ stage, page, messages, asked, discovered, notes, highlights, annotations, selectedRole, skillUsed, rabbitHintsUsed })); } catch {}
  }, [stage, page, messages, asked, discovered, notes, highlights, annotations, selectedRole, skillUsed, rabbitHintsUsed, hydrated]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stage]);

  useEffect(() => {
    if (!magicianRewinding) return;
    const timer = window.setTimeout(() => setMagicianRewinding(false), 3400);
    return () => window.clearTimeout(timer);
  }, [magicianRewinding]);

  function prepareUnlockAudio() {
    if (typeof window === 'undefined') return null;
    const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!unlockAudioRef.current) unlockAudioRef.current = new AudioContextClass();
    if (unlockAudioRef.current.state === 'suspended') void unlockAudioRef.current.resume();
    return unlockAudioRef.current;
  }
  function playUnlockChime() {
    const context = prepareUnlockAudio();
    if (!context) return;
    const startAt = context.currentTime + .02;
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const noteAt = startAt + index * .11;
      oscillator.type = index === 2 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, noteAt);
      gain.gain.setValueAtTime(.0001, noteAt);
      gain.gain.exponentialRampToValueAtTime(index === 2 ? .18 : .12, noteAt + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, noteAt + .55);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(noteAt); oscillator.stop(noteAt + .58);
    });
  }
  function showUnlockNotice(ids: NodeId[]) {
    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length) return;
    setUnlockNotice(uniqueIds); setUnlockNoticeSerial((value) => value + 1); playUnlockChime();
    if (unlockNoticeTimerRef.current) window.clearTimeout(unlockNoticeTimerRef.current);
    unlockNoticeTimerRef.current = window.setTimeout(() => setUnlockNotice([]), 3100);
  }
  function unlockNode(id: NodeId) {
    if (discovered.includes(id)) return;
    setDiscovered((items) => items.includes(id) ? items : [...items, id]);
    showUnlockNotice([id]);
  }
  function resetCase() {
    try { localStorage.removeItem('detective-invitation-save-v7'); } catch {}
    if (unlockNoticeTimerRef.current) window.clearTimeout(unlockNoticeTimerRef.current);
    setStage('intro'); setPage('diary'); setMessages(initialMessages); setAsked([]); setDiscovered([]);
    setSelectedFragments([]); setNotes(''); setHighlights([]); setAnnotations([]); setQuestion('');
    setSelectedText(''); setAnnotationDraft(''); setAnswerOne(''); setAnswerTwo(''); setAnswerThree(''); setScore(0); setSelectedRole(null); setSkillUsed(false); setRabbitHintsUsed(0); setMagicianRetrying(false); setMagicianRewinding(false); setVerdictCorrect([false, false, false]); setUnlockNotice([]);
  }
  function restartFromGame() { if (window.confirm('返回邀请函并清空当前调查进度？')) resetCase(); }

  async function ask() {
    const value = question.trim(); const clean = normalize(value);
    if (!value || remaining <= 0 || askingRef.current) return;
    prepareUnlockAudio();
    const openEnded = includesAny(clean, ['为什么', '怎么', '怎样', '什么原因', '是谁', '哪里', '多少']);
    const yesNoForm = /[吗么？?]$/.test(value) || includesAny(clean, ['是否', '是不是', '有没有', '能否', '会不会', '难道']);
    if (openEnded || !yesNoForm) {
      const reply = !yesNoForm ? '这里是问答，不是独白。' : '是非题，我们说好的呢？换一种问法。';
      setMessages((items) => [...items, { speaker: '你', text: value }, { speaker: '恶魔', text: reply }]);
      setQuestion(''); setSelectedText(''); return;
    }
    askingRef.current = true;
    setIsAsking(true);
    let answer: { reply: string; unlockNodeIds: NodeId[] } | null = null;
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: value, history: messages.slice(-12) }),
      });
      const payload = await response.json().catch(() => null) as { reply?: unknown; unlockNodeIds?: unknown; message?: unknown } | null;
      if (!response.ok || typeof payload?.reply !== 'string') throw new Error(typeof payload?.message === 'string' ? payload.message : `DeepSeek request failed: ${response.status}`);
      const unlockNodeIds = Array.isArray(payload.unlockNodeIds)
        ? payload.unlockNodeIds.filter((id): id is NodeId => keyNodes.some((node) => node.id === id))
        : [];
      answer = { reply: payload.reply, unlockNodeIds };
    } catch (error) {
      console.warn('DeepSeek unavailable; the question was not counted.', error);
      setMessages((items) => [...items, { speaker: '你', text: value }, { speaker: '恶魔', text: '恶魔暂时无法回应，请稍后再问。' }]);
      setQuestion(''); setSelectedText('');
      return;
    } finally {
      askingRef.current = false;
      setIsAsking(false);
    }

    if (!answer) return;

    const nextAsked = [...asked, clean];
    const nextDiscovered = [...new Set([...discovered, ...answer.unlockNodeIds])];
    setAsked(nextAsked); setDiscovered(nextDiscovered); setMessages((items) => [...items, { speaker: '你', text: value }, { speaker: '恶魔', text: answer.reply }]); setQuestion(''); setSelectedText('');
    const newlyUnlocked = answer.unlockNodeIds.filter((id) => !discovered.includes(id));
    if (newlyUnlocked.length) showUnlockNotice(newlyUnlocked);
    if (nextAsked.length >= questionLimit) {
      if (newlyUnlocked.length) window.setTimeout(() => setStage('verdict'), 3000);
      else setStage('verdict');
    }
  }
  function turnPage(next: PageId) {
    if (turning || next === page) return;
    const order: PageId[] = ['diary', 'inserts', 'board', 'angel'];
    setTurnDirection(order.indexOf(next) >= order.indexOf(page) ? 'next' : 'prev');
    setTurning(true);
    window.setTimeout(() => {
      setPage(next); setPageAnimation((value) => value + 1); setTurning(false);
    }, 260);
  }
  function captureSelection() {
    const selection = window.getSelection(); const text = selection?.toString().trim() ?? '';
    if (!text || text.length > 80 || !diaryRef.current || !selection?.anchorNode || !diaryRef.current.contains(selection.anchorNode)) return;
    setSelectedText(text);
  }
  function addHighlight(color: string) {
    if (!selectedText || highlights.some((item) => item.text === selectedText) || !diary.some((paragraph) => paragraph.includes(selectedText))) return;
    setHighlights((items) => [...items, { text: selectedText, color }]);
    if (selectedText.includes('记不太清')) unlockNode('injury');
  }
  function saveAnnotation() {
    if (!selectedText || !annotationDraft.trim()) return;
    setAnnotations((items) => [...items, `「${selectedText}」— ${annotationDraft.trim()}`]); setAnnotationDraft('');
  }
  function toggleFragment(id: string) { setSelectedFragments((items) => items.includes(id) ? items.filter((item) => item !== id) : items.length >= 2 ? [items[1], id] : [...items, id]); }
  function combineFragments() {
    if (selectedFragments.length !== 2) return;
    const [a, b] = selectedFragments; const match = fragments.find((item) => item.id === a)?.pair === b;
    if (!match) { setMessages((items) => [...items, { speaker: '恶魔', text: '这两条信息之间没有形成有效的因果。' }]); return; }
    const key = [a, b].sort().join('+');
    if (key === 'rain+stone') unlockNode('weather');
    if (key === 'legacy+rounds') unlockNode('father');
    if (key === 'fence+stripe') unlockNode('uniform');
    setSelectedFragments([]);
  }
  function submitVerdict() {
    const first = normalize(answerOne); const second = normalize(answerTwo);
    const firstCorrect = includesAny(first, ['院服', '病号服', '病院服', '蓝色条纹']) && includesAny(first, ['人', '衣', '服', '条纹']);
    const result = [firstCorrect, includesAny(second, ['院长']), answerThree === 'body'];
    const nextScore = result.filter(Boolean).length;
    if (selectedRole === 'magician' && !magicianRetrying && nextScore < 3) {
      setVerdictCorrect(result);
      if (!result[0]) setAnswerOne('');
      if (!result[1]) setAnswerTwo('');
      if (!result[2]) setAnswerThree('');
      setSkillUsed(true); setMagicianRetrying(true); setMagicianRewinding(true); return;
    }
    setScore(nextScore); setStage('ending');
  }

  if (stage === 'intro') return <Intro onAccept={() => setStage('role')} />;
  if (stage === 'role') return <><RoleSelect onChoose={(role) => { if (role !== selectedRole) { setSkillUsed(false); setRabbitHintsUsed(0); setMagicianRetrying(false); setMagicianRewinding(false); setVerdictCorrect([false, false, false]); } setSelectedRole(role); setStage('game'); }} onBack={() => setStage('intro')} /><AuthorCredit/></>;
  if (stage === 'verdict') return <><Verdict answerOne={answerOne} answerTwo={answerTwo} answerThree={answerThree} onOne={setAnswerOne} onTwo={setAnswerTwo} onThree={setAnswerThree} onBack={() => setStage('game')} onSubmit={submitVerdict} onSkip={() => { setScore(0); setStage('ending'); }} magicianRetrying={magicianRetrying} magicianRewinding={magicianRewinding} verdictCorrect={verdictCorrect} /><AuthorCredit/></>;
  if (stage === 'ending') return <><Ending score={score} onReplay={resetCase} /><AuthorCredit/></>;
  if (stage === 'failure') return <><Failure found={discovered.length} onReplay={resetCase} /><AuthorCredit/></>;

  return <><IllustratedInvestigation
    page={page} pageAnimation={pageAnimation} turnDirection={turnDirection} turning={turning}
    question={question} messages={messages} remaining={remaining} askedCount={asked.length} isAsking={isAsking}
    discovered={discovered} skillUsed={skillUsed} rabbitHintsUsed={rabbitHintsUsed} solved={solved} selectedRole={selectedRole ?? 'black-swan'}
    onQuestion={setQuestion} onAsk={ask} onTurn={turnPage}
    onSkill={() => { setSkillUsed(true); if (selectedRole === 'witch') { setPage('angel'); setPageAnimation((value) => value + 1); } }}
    onRabbitHint={() => setRabbitHintsUsed((count) => { const next = Math.min(3, count + 1); if (next === 3) setSkillUsed(true); return next; })}
    onCaptainUnlock={(ids) => { const newlyUnlocked = ids.filter((id) => !discovered.includes(id)); setDiscovered((items) => [...new Set([...items, ...ids])]); if (newlyUnlocked.length) showUnlockNotice(newlyUnlocked); setSkillUsed(true); }} onVerdict={() => setStage('verdict')}
    onQuickVerdict={() => { setDiscovered(keyNodes.map((node) => node.id)); setStage('verdict'); }}
    onBack={() => setStage('role')} onRestart={restartFromGame}
  />{unlockNotice.length > 0 && <ClueUnlockCelebration key={unlockNoticeSerial} nodes={unlockNotice}/>}<AuthorCredit/></>;
}

function AuthorCredit() {
  return <div className="author-credit">作者：赵芮、汪靖翔</div>;
}

function ClueUnlockCelebration({ nodes }: { nodes: NodeId[] }) {
  const unlocked = nodes.map((id) => ({ ...keyNodes.find((node) => node.id === id)!, number: keyNodes.findIndex((node) => node.id === id) + 1 }));
  return <div className="clue-unlock-celebration" role="status" aria-live="assertive">
    <div className="unlock-screen-flash"/>
    <div className="unlock-rings" aria-hidden="true"><i/><i/><i/></div>
    <div className="unlock-sparks" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index}/>)}</div>
    <section className="unlock-card">
      <LockOpen/>
      <small>ANGELIC RECORD UPDATED</small>
      <h2>关键线索已解锁</h2>
      <div>{unlocked.map((node) => <p key={node.id}><span>{String(node.number).padStart(2, '0')}</span><strong>{node.title}</strong></p>)}</div>
      <em>{nodes.length > 1 ? `共 ${nodes.length} 条隐藏文字已显现` : '日记中的隐藏文字正在显现'}</em>
    </section>
  </div>;
}

const pageLabels: { id: PageId; label: string }[] = [
  { id: 'diary', label: '口信' }, { id: 'inserts', label: '案卷' },
  { id: 'board', label: '排查' }, { id: 'angel', label: '女巫密页' },
];

function HiddenLine({ node, discovered, children }: { node: NodeId; discovered: NodeId[]; children: React.ReactNode }) {
  const found = discovered.includes(node);
  return <span className={`hidden-ink ${found ? 'revealed' : ''}`}>{found ? children : '████████████████'}{found && <i>线索显现</i>}</span>;
}

function IllustratedInvestigation({ page, pageAnimation, turnDirection, turning, question, messages, remaining, askedCount, isAsking, discovered, skillUsed, rabbitHintsUsed, solved, selectedRole, onQuestion, onAsk, onTurn, onSkill, onRabbitHint, onCaptainUnlock, onVerdict, onQuickVerdict, onBack, onRestart }: {
  page: PageId; pageAnimation: number; turnDirection: 'next' | 'prev'; turning: boolean; question: string; messages: Message[];
  remaining: number; askedCount: number; isAsking: boolean; discovered: NodeId[]; skillUsed: boolean; rabbitHintsUsed: number; solved: boolean; selectedRole: RoleId;
  onQuestion: (value: string) => void; onAsk: () => void | Promise<void>; onTurn: (page: PageId) => void;
  onSkill: () => void; onRabbitHint: () => void; onCaptainUnlock: (ids: NodeId[]) => void; onVerdict: () => void; onQuickVerdict: () => void; onBack: () => void; onRestart: () => void;
}) {
  const [skillModal, setSkillModal] = useState(false);
  const [captainPicking, setCaptainPicking] = useState(false);
  const [captainChoices, setCaptainChoices] = useState<NodeId[]>([]);
  const historyRef = useRef<HTMLElement>(null);
  const pageIndex = pageLabels.findIndex((item) => item.id === page);
  const latestDemon = [...messages].reverse().find((message) => message.speaker === '恶魔')?.text;
  const roleName = selectedRole === 'rabbit' ? '兔子' : selectedRole === 'witch' ? '女巫' : selectedRole === 'magician' ? '魔术师' : selectedRole === 'captain' ? '船长' : '黑天鹅';
  const roleAbilityExhausted = selectedRole === 'rabbit' ? rabbitHintsUsed >= 3 : skillUsed;
  const rabbitKeywords = ['罕见病', '特殊天气', '服装特点'];
  const captainTargets = keyNodes.filter((node) => !discovered.includes(node.id));
  const captainTargetCount = Math.min(2, captainTargets.length);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const history = historyRef.current;
      if (!history) return;
      history.scrollTo({ top: history.scrollHeight, behavior: messages.length > 2 ? 'smooth' : 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages]);

  return <main className="illustrated-investigation">
    <div className="investigation-ambient" aria-hidden="true"/>
    <div className="investigation-artboard">
      <img className="investigation-base" src="/art/investigation-interface.png" alt="恶魔与天使阵营的解密桌面" draggable={false}/>
      <div className="countdown-live"><span>黎明倒计时</span><strong>{String(remaining).padStart(2, '0')}</strong><small>已提问 {askedCount} 次</small></div>
      <button className="game-back" onClick={onBack}><ArrowLeft/>更换身份</button>
      <button className="game-restart" onClick={onRestart}><RotateCcw/>重新开始</button>
      <button className="game-quick-ending" onClick={onQuickVerdict}><Stamp/>直接进入结局</button>

      <section className="painted-book" aria-label="案件日记本">
        <div key={`${page}-${pageAnimation}`} className={`book-content page-${page} flip-${turnDirection} ${turning ? 'is-fading' : ''}`}>
          {page === 'diary' && <>
            <div className="paper-half left-page"><p className="folio">被害人的口信 · I</p><h2>白色的秋日清晨</h2>{diary.slice(0, 3).map((text, index) => <p key={index}>{text}</p>)}</div>
            <div className="paper-half right-page"><p className="folio">被害人的口信 · II</p>{diary.slice(3, 6).map((text, index) => <p key={index}>{text}</p>)}<div className="spirit-divider" aria-hidden="true"><span>◆</span></div><div className="spirit-echo">{diary.slice(6).map((text, index) => <p key={index}>{text}</p>)}</div></div>
          </>}
          {page === 'inserts' && <>
            <div className="paper-half left-page dossier"><p className="folio">第 1 页 · 概况</p><h2>死者</h2><p>男，青年。<HiddenLine node="father" discovered={discovered}>本市精神病院院长的独子</HiddenLine>，长年离乡，此次回乡是为收拾父亲的遗物。</p><p>案发时间为秋日清晨，前一天刚下过大雨。<HiddenLine node="fog" discovered={discovered}>浓雾笼罩，系罕见的逆温大雾</HiddenLine>。</p><p>现场偏僻，无目击者。</p></div>
            <div className="paper-half right-page dossier"><p className="folio">第 2 页 · 现场</p><h2>土路勘验</h2><p>致命伤<HiddenLine node="weather" discovered={discovered}>是连续钝器重击，凶器就是路边被雨水冲出的石块</HiddenLine>。</p><p>死者的自行车倒在一旁。<HiddenLine node="bicycle" discovered={discovered}>雾太浓、碎石太多，路面不平，他只能推车缓行</HiddenLine>。</p><p>死者<HiddenLine node="injury" discovered={discovered}>头部有两类伤：先有摔倒磕碰的轻伤</HiddenLine>。</p></div>
          </>}
          {page === 'board' && <>
            <div className="paper-half left-page dossier"><p className="folio">第 3 页 · 排查</p><h2>清晨点名</h2><p>案发当天，<HiddenLine node="escape" discovered={discovered}>精神病院清点人数时少了一名病人</HiddenLine>。</p><p>凶手的特征：<HiddenLine node="albino" discovered={discovered}>白化病，白发白肤，视力严重受损，畏光</HiddenLine>。</p><p>蓝色栅栏是<HiddenLine node="uniform" discovered={discovered}>蓝白条纹病号服</HiddenLine>。</p></div>
            <div className="paper-half right-page dossier"><p className="folio">第 4 页 · 旧案</p><h2>被撕去的记录</h2><p><HiddenLine node="oldcase" discovered={discovered}>两年前，每到雾天，村子里就会发生手法相同的石块凶案；凶手被捕后由精神病院院长鉴定收治，严加管控。</HiddenLine></p><p><HiddenLine node="silence" discovered={discovered}>院长于案发前数日因过度劳累引发脑溢血去世；他离开后，医院内部逐渐混乱，管理较松</HiddenLine>。</p></div>
          </>}
          {page === 'angel' && <>
            <div className={`paper-half left-page angel-secret witch-vision ${selectedRole === 'witch' && skillUsed ? 'revealed' : 'sealed'}`}><Ghost/><p className="folio">女巫专属的死者通灵视角</p>{selectedRole === 'witch' && skillUsed ? <><h2>雾中的最后一眼</h2><p>在一片白色之中，我看到了那张报纸上见过的，与众不同的脸……</p><p>临死之前，我忽然想到，如果父亲还活着，绝对不会发生这种事……</p></> : <div className="seal-lock"><LockKeyhole/><strong>{selectedRole === 'witch' ? '通灵尚未发动' : '女巫封印'}</strong><span>{selectedRole === 'witch' ? '发动女巫技能后查看专属页面' : '只有选择女巫身份才能解封这一页'}</span></div>}</div>
            <div className="paper-half right-page clue-list"><p className="folio">已揭示的文字</p>{keyNodes.map((node, index) => <div className={discovered.includes(node.id) ? 'found' : ''} key={node.id}><span>{String(index + 1).padStart(2, '0')}</span><p>{discovered.includes(node.id) ? node.title : '尚未揭示'}</p></div>)}<button className={solved ? 'verdict-ready' : ''} disabled={!solved} onClick={onVerdict}>{solved ? '进入最终回答' : `还缺 ${10 - discovered.length} 条线索`}</button></div>
          </>}
        </div>
        <button className="page-arrow previous" disabled={pageIndex === 0} onClick={() => onTurn(pageLabels[pageIndex - 1].id)} aria-label="上一页"><ChevronLeft/></button>
        <button className="page-arrow next" disabled={pageIndex === pageLabels.length - 1} onClick={() => onTurn(pageLabels[pageIndex + 1].id)} aria-label="下一页"><ChevronRight/></button>
      </section>

      <button className={`secret-bookmark ${page === 'angel' ? 'active' : ''}`} onClick={() => onTurn('angel')} aria-label="打开女巫密页"><span>女巫密页</span></button>
      <div className={`demon-answer-zone ${latestDemon || isAsking ? 'visible' : ''}`}>{isAsking ? <strong>恶魔正在思考……</strong> : latestDemon && <strong>{latestDemon}</strong>}</div>
      {messages.length === 0 && <aside className="first-question-guide"><Sparkles/><span>在这里输入一个<br/><strong>回答为“是”或“否”</strong>的问题</span></aside>}
      <section className="question-console">
        <textarea value={question} onChange={(event) => onQuestion(event.target.value)} placeholder={isAsking ? '恶魔正在思考……' : remaining ? '输入你的问题' : skillUsed ? '提问机会已用尽' : `可发动${roleName}能力`} disabled={remaining === 0 || isAsking} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onAsk(); } }}/>
        <button onClick={onAsk} disabled={!question.trim() || remaining === 0 || isAsking} aria-label="发送问题"><Send/></button>
      </section>
      <section className="question-history" ref={historyRef}>{messages.map((message, index) => {
        const sequence = messages.slice(0, index + 1).filter((item) => item.speaker === '你').length;
        return <div className={message.speaker === '你' ? 'ask-row' : 'answer-row'} key={index}><span>{message.speaker === '你' ? '问' : '答'} {String(Math.max(sequence, 1)).padStart(2, '0')}</span><p>{message.text}</p></div>;
      })}</section>
      {selectedRole === 'black-swan' ? <img className={`black-swan-skill-panel ${skillUsed ? 'used' : ''}`} src="/art/black-swan-skill-panel.png" alt="" aria-hidden="true" /> : <div className={`witch-skill-panel ${selectedRole === 'captain' ? 'captain-panel' : ''} ${selectedRole === 'rabbit' ? 'rabbit-panel' : ''} ${selectedRole === 'magician' ? 'magician-panel' : ''} ${roleAbilityExhausted ? 'used' : ''}`} aria-hidden="true">{selectedRole === 'captain' ? <Layers3/> : selectedRole === 'rabbit' ? <Sparkles/> : selectedRole === 'magician' ? <RotateCcw/> : <Ghost/>}<span>{selectedRole === 'rabbit' ? `关键词 ${rabbitHintsUsed}/3` : roleAbilityExhausted ? '能力已使用' : selectedRole === 'captain' ? '线索航图' : selectedRole === 'magician' ? '时间回溯' : '女巫通灵'}</span></div>}
      <button className={`black-swan-skill ${selectedRole === 'witch' ? 'witch-skill' : ''} ${roleAbilityExhausted ? 'used' : ''}`} disabled={roleAbilityExhausted} onClick={() => { setCaptainPicking(false); setCaptainChoices([]); setSkillModal(true); }} aria-label={roleAbilityExhausted ? '能力已使用' : `${roleName}技能介绍`}><span>{roleAbilityExhausted ? '能力已使用' : '技能介绍'}</span></button>
      {skillModal && <div className="skill-modal-backdrop" role="dialog" aria-modal="true" aria-label={`${roleName}技能介绍`}>
        <div className={`skill-modal ${selectedRole === 'witch' ? 'witch-modal' : ''} ${selectedRole === 'captain' ? 'captain-modal' : ''}`}><button className="skill-close" onClick={() => setSkillModal(false)} aria-label="关闭">×</button>
          {selectedRole === 'captain' && captainPicking ? <>
            <small>THE CAPTAIN · 线索航图</small><h2>选择两处隐藏文字</h2><p>请选择要直接解锁的两处墨迹。已经揭示的线索不会出现在这里。</p>
            <div className="captain-clue-picker">{captainTargets.map((node) => { const clueNumber = keyNodes.findIndex((item) => item.id === node.id) + 1; return <button type="button" aria-label={`选择第 ${clueNumber} 条隐藏文字`} className={captainChoices.includes(node.id) ? 'selected' : ''} key={node.id} onClick={() => setCaptainChoices((items) => items.includes(node.id) ? items.filter((id) => id !== node.id) : items.length < captainTargetCount ? [...items, node.id] : items)}><span>{captainChoices.includes(node.id) ? <Check/> : null}</span>{String(clueNumber).padStart(2, '0')}</button>; })}</div>
            <div className="captain-picker-actions"><button onClick={() => { setCaptainPicking(false); setCaptainChoices([]); }}>返回介绍</button><button className="skill-confirm" disabled={captainChoices.length !== captainTargetCount || captainTargetCount === 0} onClick={() => { onCaptainUnlock(captainChoices); setSkillModal(false); setCaptainPicking(false); }}>确认解锁 {captainChoices.length}/2</button></div>
          </> : selectedRole === 'rabbit' ? <>
            <small>THE RABBIT · 梦境启示</small><h2>爱丽丝的关键词</h2><p>你拥有三次获得关键词的机会。每次发动，梦境都会显现一个新的推理方向。</p>
            <div className="rabbit-keywords">{rabbitKeywords.map((keyword, index) => <span className={index < rabbitHintsUsed ? 'revealed' : ''} key={keyword}>{index < rabbitHintsUsed ? keyword : '尚未显现'}</span>)}</div>
            <div><button onClick={() => setSkillModal(false)}>关闭</button><button className="skill-confirm" disabled={rabbitHintsUsed >= 3} onClick={onRabbitHint}>{rabbitHintsUsed >= 3 ? '提示已全部获得' : `获得关键词 ${rabbitHintsUsed + 1}/3`}</button></div>
          </> : selectedRole === 'magician' ? <>
            <small>THE MAGICIAN · 时间回溯</small><h2>再给答案一次机会</h2><p>此能力无需手动发动。首次提交最终三题时，如果存在错误，时间回溯将自动开启：错误答案会被清空，正确答案会保留并锁定，你可以重新回答错题。</p><div><button className="skill-confirm" onClick={() => setSkillModal(false)}>我知道了</button></div>
          </> : <>
            <small>{selectedRole === 'witch' ? 'THE WITCH · 死者通灵' : selectedRole === 'captain' ? 'THE CAPTAIN · 线索航图' : 'BLACK SWAN · 天使赐福'}</small><h2>{selectedRole === 'witch' ? '来自死者的回声' : selectedRole === 'captain' ? '穿透迷雾的航向' : '黑天鹅的偏爱'}</h2><p>{selectedRole === 'witch' ? '发动唯一一次通灵机会，立即打开密页，查看来自死者的专属提示。' : selectedRole === 'captain' ? '拥有直接解锁两条线索的能力。你可以从尚未揭示的文字中任意选择两条。' : <>你值得更多偏爱。发动后，本局可额外获得 <strong>10 次</strong>向恶魔提问的机会。</>}</p><div><button onClick={() => setSkillModal(false)}>暂不发动</button><button className="skill-confirm" onClick={() => { if (selectedRole === 'captain') setCaptainPicking(true); else { onSkill(); setSkillModal(false); } }}>{selectedRole === 'captain' ? '选择线索' : '确认发动'}</button></div>
          </>}
        </div>
      </div>}
      <div className="interface-shimmer" aria-hidden="true"/>
    </div>
  </main>;
}

function BookOpenIcon() { return <BookMarked/>; }

function DiaryPage({ selectedText, highlights, annotationDraft, annotations, diaryRef, onSelect, onHighlight, onDraft, onAnnotate }: { selectedText: string; highlights: Highlight[]; annotationDraft: string; annotations: string[]; diaryRef: React.RefObject<HTMLDivElement | null>; onSelect: () => void; onHighlight: (color: string) => void; onDraft: (value: string) => void; onAnnotate: () => void }) {
  const colors = ['#f0d67399', '#f29a7b99', '#77b9d099', '#93c69c99', '#bda5d299'];
  return <div className="book-page diary-spread"><section className="paper-page"><header><p>ARCHIVE 01</p><h2>无名者的日记</h2><span>恶魔所有</span></header><div className="diary-text" ref={diaryRef} onMouseUp={onSelect} onTouchEnd={onSelect}>{diary.slice(0, 4).map((paragraph, index) => <p key={index}>{renderHighlighted(paragraph, highlights)}</p>)}{diary.slice(4).map((paragraph, index) => <p key={`b-${index}`}>{renderHighlighted(paragraph, highlights)}</p>)}</div></section><section className="paper-page"><div className="highlighter-tools"><Highlighter/><span>{selectedText ? `已选：${selectedText.slice(0, 16)}${selectedText.length > 16 ? '…' : ''}` : '拖选句子进行标记'}</span>{colors.map((color) => <button key={color} style={{ '--swatch': color } as CSSProperties} onClick={() => onHighlight(color)}/>)}</div><div className="torn-photo"><MoonStar/><span>图片位置</span><small>雾中的乡间土路</small></div><div className="annotation-box"><PenLine/><Input value={annotationDraft} onChange={(event) => onDraft(event.target.value)} placeholder={selectedText ? '为选中的句子添加批注……' : '先拖选一段文字'}/><button onClick={onAnnotate} disabled={!selectedText || !annotationDraft.trim()}>写入</button></div>{annotations.length > 0 && <div className="margin-notes">{annotations.slice(-4).map((note, index) => <p key={index}>{note}</p>)}</div>}</section></div>;
}

function InsertPage({ onInspect }: { onInspect: (id: NodeId) => void }) {
  return <div className="book-page insert-spread"><section className="paper-page insert-intro"><p className="hand-note">有人把这些东西夹在了日记里。也许恶魔并不介意你看见它们。</p><button className="archive-insert newspaper" onClick={() => onInspect('fog')}><span>地方旧报 · 六年前</span><strong>浓雾中的数起无名凶案</strong><p>报道边缘被撕去，只留下模糊的日期和突然中断的案件记录。</p><i>点击检查</i></button><button className="archive-insert medical" onClick={() => onInspect('injury')}><span>病历残片</span><strong>头部钝器伤 · 认知受损</strong><p>患者无法完整复述清晨发生的事情。</p><i>点击检查</i></button></section><section className="paper-page evidence-photo-page"><button className="polaroid" onClick={() => onInspect('silence')}><div className="photo-placeholder"><Eye/></div><strong>病区值班记录</strong><small>同一名病人反复接近主角，确认他是否恢复记忆。</small><i>点击翻看背面</i></button><div className="ink-warning">不要相信表面上的形状。</div></section></div>;
}

function BoardPage({ selected, onSelect, onCombine }: { selected: string[]; onSelect: (id: string) => void; onCombine: () => void }) {
  return <div className="book-page board-spread"><section className="paper-page fragment-page"><header><p>FRAGMENTS</p><h2>选择两条信息</h2></header><div className="fragment-grid">{fragments.map((item) => <button key={item.id} className={selected.includes(item.id) ? 'selected' : ''} onClick={() => onSelect(item.id)}><small>{item.label}</small><strong>{item.title}</strong><p>{item.text}</p>{selected.includes(item.id) && <Check/>}</button>)}</div></section><section className="paper-page connection-page"><div className="connection-circle"><Link2/><strong>{selected.length} / 2</strong><span>已选信息</span></div><div className="selected-slots">{[0, 1].map((index) => { const item = fragments.find((fragment) => fragment.id === selected[index]); return <div key={index} className={item ? 'filled' : ''}>{item ? <><small>{item.label}</small><strong>{item.title}</strong></> : <span>选择一条信息</span>}</div>; })}</div><Button onClick={onCombine} disabled={selected.length !== 2}>建立关联</Button><p className="combine-tip">正确组合会解锁关键节点；错误尝试不会消耗提问机会。</p></section></div>;
}

function AngelPage({ discovered }: { discovered: NodeId[] }) {
  return <div className="book-page angel-spread"><section className="paper-page angel-letter"><div className="angel-watermark"><Sparkles/></div><p className="hand-note">我不能公然干涉恶魔的游戏，只能偷偷多添这一页。</p><h2>给监督者的秘密记录</h2><p>真正重要的并不是问了多少问题，而是你是否触碰到了故事的关键节点。</p><div className="node-orbit">{keyNodes.map((node, index) => { const found = discovered.includes(node.id); return <article className={found ? 'found' : ''} key={node.id}><span>{found ? <Check/> : index + 1}</span><div><strong>{found ? node.title : '尚未触及'}</strong><p>{found ? node.text : '继续阅读、组合信息，或向恶魔提出更准确的问题。'}</p></div></article>; })}</div></section><section className="paper-page angel-summary"><Sparkles/><span>已找到</span><strong>{discovered.length}</strong><small>共 {keyNodes.length} 个关键节点</small><Progress value={discovered.length / keyNodes.length * 100}/><p>{discovered.length === keyNodes.length ? '你已经具备面对最终问题的资格。' : '尽可能找齐线索；提问次数用尽后，恶魔仍会要求你进入最终回答。'}</p></section></div>;
}

function Intro({ onAccept }: { onAccept: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const introVideoRef = useRef<HTMLVideoElement>(null);
  function begin() {
    if (leaving || playing) return;
    const video = introVideoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => setPlaybackBlocked(true));
    }
    setVideoEnded(false);
    setOverviewOpen(false);
    setLeaving(true);
    window.setTimeout(() => {
      if (video) video.currentTime = 0;
      setPlaying(true);
      setLeaving(false);
    }, 850);
  }
  function finishIntro() {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onAccept, 950);
  }
  function resumeVideo() {
    introVideoRef.current?.play().then(() => setPlaybackBlocked(false)).catch(() => setPlaybackBlocked(true));
  }
  function showOverview(ended = false) {
    introVideoRef.current?.pause();
    setVideoEnded(ended);
    setOverviewOpen(true);
  }
  function returnToVideo() {
    const video = introVideoRef.current;
    setOverviewOpen(false);
    if (!video) return;
    if (videoEnded || video.ended) video.currentTime = 0;
    setVideoEnded(false);
    video.play().then(() => setPlaybackBlocked(false)).catch(() => setPlaybackBlocked(true));
  }
  return (
    <main className={`illustrated-opening ${playing ? 'is-video' : ''} ${leaving ? 'is-leaving' : ''}`}>
      <div className="opening-ambient" aria-hidden="true"><img src="/art/opening-cover.webp" alt=""/></div>
      <div className="opening-artboard">
        <video ref={introVideoRef} className="story-intro-video" src="/art/story-intro.mp4" preload="auto" playsInline onEnded={() => showOverview(true)}/>
        <img className="opening-cover-art" src="/art/opening-cover.webp" alt="《黎明之前》——天使与恶魔的推理游戏"/>
        <div className="opening-vignette" aria-hidden="true"/>
        <div className="opening-dust" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div>
        <button className="painted-start-hotspot" type="button" onClick={begin} aria-label="开始游戏">
          <span>开始游戏</span>
        </button>
        {playing && !overviewOpen && <button className="skip-intro" type="button" onClick={() => showOverview(false)}>跳过动画 <span>›</span></button>}
        {playing && playbackBlocked && !overviewOpen && <button className="resume-intro" type="button" onClick={resumeVideo}><span>▶</span> 点击播放介绍动画</button>}
        {overviewOpen && <div className="story-overview-backdrop" role="dialog" aria-modal="true" aria-labelledby="story-overview-title">
          <section className="story-overview-card">
            <p className="eyebrow">BEFORE THE DAWN</p>
            <h2 id="story-overview-title">故事概况</h2>
            <div className="story-overview-copy">
              <p>天使与魔鬼是平级的对立阵营。魔鬼发起了一个推理挑战，邀请全世界的推理爱好者参与：在黎明到来之前，用一晚上的时间破解出他提出的谜题，即可通关。五位侦探前来应战。</p>
              <p>天使出于担心，也为了平衡恶魔的实力，给了侦探团一些能力——也就是派出了玩家来监督整个对局。</p>
              <p>玩家可以附身在不同侦探身上，获得不同视角；附身在哪位侦探身上，就会为哪位侦探带来特殊能力，这是天使的祝福。天使还偷偷在日记本里加了一页作为提示，帮助你检查剩余线索数量。</p>
            </div>
            <div className="story-overview-actions">
              <button type="button" onClick={returnToVideo}>返回观看</button>
              <button className="confirm" type="button" onClick={finishIntro}>确认跳过</button>
            </div>
          </section>
        </div>}
        {playing && <AuthorCredit/>}
        <div className="opening-blackout" aria-hidden="true"/>
      </div>
    </main>
  );
}

function RoleSelect({ onChoose, onBack }: { onChoose: (role: RoleId) => void; onBack: () => void }) {
  const roles = [
    { id:'rabbit', name:'兔子', en:'THE RABBIT', available:true, intro:'她来自爱丽丝的梦境，无与伦比的创造力与想象力，是童话世界赋予兔子小姐的礼物。', ability:'拥有三次获得关键词的能力：罕见病、特殊天气、服装特点。', left:'8.7%', top:'22.1%', width:'15.8%', height:'66.2%' },
    { id:'witch', name:'女巫', en:'THE WITCH', available:true, intro:'古老而神秘的女巫家族是冥界与人间的桥梁。', ability:'你拥有一次通灵机会，可以获得来自死者的提示。', left:'25.0%', top:'24.8%', width:'15.3%', height:'64.1%' },
    { id:'magician', name:'魔术师', en:'THE MAGICIAN', available:true, intro:'最伟大的魔术是控制时间。', ability:'若结局答案提交错误，每道题你都拥有额外一次修改答案的机会。', left:'41.2%', top:'21.6%', width:'16.9%', height:'68.4%' },
    { id:'captain', name:'船长', en:'THE CAPTAIN', available:true, intro:'敏锐的直觉与探索的勇气能够规避海洋上的未知风险。', ability:'拥有直接解锁两条线索的能力，可以解锁任意被隐去的文字。', left:'59.5%', top:'24.6%', width:'15.0%', height:'64.2%' },
    { id:'black-swan', name:'黑天鹅', en:'THE BLACK SWAN', available:true, intro:'婉转的歌声搭配高贵优雅的气质，黑天鹅小姐一出场就能赢得观众的掌声。', ability:'你值得更多偏爱，拥有额外 10 次提问机会。', left:'75.9%', top:'21.7%', width:'15.6%', height:'66.9%' },
  ];
  const [viewing, setViewing] = useState<number | null>(null);
  const role = viewing === null ? null : roles[viewing];
  return (
    <main className="tarot-selection-screen">
      <div className="tarot-artboard">
        <img className="tarot-selection-art" src="/art/role-selection-final.png" alt="五位侦探的塔罗牌角色选择界面"/>
        <button className="tarot-back" type="button" onClick={onBack}><ArrowLeft/>返回</button>
        <div className="tarot-hitboxes">
          {roles.map((item,index) => (
            <button
              type="button"
              key={item.name}
              className={`tarot-card-hitbox ${viewing === index ? 'selected' : ''}`}
              style={{ '--card-left':item.left, '--card-top':item.top, '--card-width':item.width, '--card-height':item.height } as CSSProperties}
              onClick={() => setViewing(index)}
              aria-label={`查看${item.name}`}
              aria-pressed={viewing === index}
            >
              <span className="tarot-card-sigil"/>
              {viewing === index && <span className="tarot-card-info">
                <small>{item.en}</small>
                <strong>{item.name}</strong>
                <i aria-hidden="true"/>
                <span>{item.intro}</span>
                <em>技能效果</em>
                <b>{item.ability}</b>
                {!item.available && <u>灵体通道封印</u>}
              </span>}
            </button>
          ))}
        </div>
        <button className={`painted-confirm-hotspot ${role?.available ? 'available' : 'sealed'}`} type="button" onClick={role?.available ? () => onChoose(role.id as RoleId) : undefined} aria-disabled={!role?.available}>
          <span>{role ? (role.available ? '确认附身' : '灵体通道封印') : '选择一位侦探'}</span>
        </button>
      </div>
    </main>
  );
}

function Verdict({ answerOne, answerTwo, answerThree, onOne, onTwo, onThree, onBack, onSubmit, onSkip, magicianRetrying, magicianRewinding, verdictCorrect }: { answerOne:string; answerTwo:string; answerThree:string; onOne:(v:string)=>void; onTwo:(v:string)=>void; onThree:(v:string)=>void; onBack:()=>void; onSubmit:()=>void; onSkip:()=>void; magicianRetrying:boolean; magicianRewinding:boolean; verdictCorrect:boolean[] }) {
  return <main className="verdict-screen"><section className="verdict-sheet">
    <div className="verdict-heading"><div><p className="eyebrow">FINAL DEDUCTION</p><h1>恶魔的最终三问</h1><p>十个关键节点已经亮起。现在，给出完整的答案。</p></div><Stamp/></div>
    {magicianRetrying && <div className="magician-retry-notice"><RotateCcw/><p><strong>魔术师的技能已发动 · 时间已经回溯</strong>回答正确的题目已被保留并锁定；标红的错误题目已被清空，请重新作答。</p></div>}
    <div className={`question-block ${magicianRetrying ? verdictCorrect[0] ? 'answer-correct' : 'answer-wrong' : ''}`}><span>问题 01</span><label htmlFor="answer-one">“蓝色栅栏”究竟是什么？</label><Input id="answer-one" value={answerOne} disabled={magicianRetrying && verdictCorrect[0]} onChange={(e)=>onOne(e.target.value)} placeholder="输入你的答案"/></div>
    <div className={`question-block ${magicianRetrying ? verdictCorrect[1] ? 'answer-correct' : 'answer-wrong' : ''}`}><span>问题 02</span><label htmlFor="answer-two">主角父亲的身份是什么？</label><Input id="answer-two" value={answerTwo} disabled={magicianRetrying && verdictCorrect[1]} onChange={(e)=>onTwo(e.target.value)} placeholder="输入他的职业或身份"/></div>
    <div className={`question-block ${magicianRetrying ? verdictCorrect[2] ? 'answer-correct' : 'answer-wrong' : ''}`}><span>问题 03</span><p>凶手专挑雾天作案最重要的原因是：</p><RadioGroup value={answerThree} disabled={magicianRetrying && verdictCorrect[2]} onValueChange={(value)=>onThree(String(value))}>{[['visibility','雾天能见度低利于隐藏'],['method','特殊杀人手法只能在雾天生效'],['reaction','雾天人们反应不及时'],['body','身体原因只能在雾天出行'],['history','凶手过往经历导致对雾天有特殊偏好']].map(([value,label])=><label className="radio-option" key={value}><RadioGroupItem value={value}/><span>{label}</span></label>)}</RadioGroup></div>
    <div className="verdict-actions"><Button variant="ghost" onClick={onBack}>返回调查</Button><Button className="skip-verdict" variant="ghost" onClick={onSkip}><Eye/>跳过答题，查看答案</Button><Button onClick={onSubmit} disabled={!answerOne.trim()||!answerTwo.trim()||!answerThree}>{magicianRetrying ? '提交修改' : '封存答案'}<Stamp/></Button></div>
  </section>{magicianRewinding && <div className="magician-rewind-overlay" role="dialog" aria-modal="true" aria-labelledby="magician-rewind-title">
    <div className="rewind-aura" aria-hidden="true"><i/><i/><i/></div>
    <div className="rewind-clock" aria-hidden="true"><span className="clock-twelve">XII</span><span className="clock-three">III</span><span className="clock-six">VI</span><span className="clock-nine">IX</span><i className="hour-hand"/><i className="minute-hand"/><b/></div>
    <p>THE MAGICIAN · TIME REVERSAL</p>
    <h2 id="magician-rewind-title">答案中存在错误</h2>
    <strong>错误答案正在清除，正确答案将被保留。</strong>
    <span>时间回溯后，请重新回答未锁定的问题。</span>
  </div>}</main>;
}

function Ending({ score, onReplay }: { score:number; onReplay:()=>void }) {
  const won = score === 3;
  return <Settlement won={won} eyebrow={`${won ? 'CASE SOLVED' : 'DEDUCTION FAILED'} · ${score}/3`} title={won ? '你从恶魔手中赢回了真相' : '你的答案没能穿透浓雾'} description={won ? '所有答案均已命中。黎明到来以前，恶魔承认了你的推理。' : '最终答案存在错误，但故事不会永远被恶魔封存。'} onReplay={onReplay}/>;
}

function Failure({ found, onReplay }: { found:number; onReplay:()=>void }) {
  return <Settlement won={false} eyebrow={`CHALLENGE FAILED · ${found}/${keyNodes.length}`} title="提问的烛火已经熄灭" description={`你只触及了 ${found} / ${keyNodes.length} 个关键节点。恶魔合上日记，但你仍可查看完整真相。`} onReplay={onReplay}/>;
}

function Settlement({ won, eyebrow, title, description, onReplay }: { won:boolean; eyebrow:string; title:string; description:string; onReplay:()=>void }) {
  const [showTruth, setShowTruth] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    if (showTruth || animationDone) return;
    const timer = window.setTimeout(() => setAnimationDone(true), won ? 11910 : 11900);
    return () => window.clearTimeout(timer);
  }, [won, showTruth, animationDone]);

  return <main className={won ? 'victory-settlement' : 'defeat-settlement'}>
    {!showTruth && <img className={`settlement-video ${animationDone ? 'has-ended' : ''}`} src={won ? '/art/victory-ending.gif' : '/art/defeat-ending.gif'} alt={won ? '胜利结尾动画' : '失败结尾动画'} onError={() => setAnimationDone(true)}/>}
    {!showTruth && !animationDone && <button className="skip-settlement-animation" type="button" onClick={() => setAnimationDone(true)}>跳过动画</button>}
    <section className={`settlement-card ${showTruth ? 'showing-truth' : ''} ${animationDone || showTruth ? 'is-ready' : 'is-waiting'}`}>
    {!showTruth ? <>
      <div className="settlement-icon">{won ? <CheckCircle2/> : <Flame/>}</div>
      <p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="settlement-description">{description}</p>
      <div className="settlement-actions"><Button className="truth-button" onClick={() => setShowTruth(true)}><Eye/>查看完整真相</Button><Button variant="ghost" onClick={onReplay}><RotateCcw/>重新接受挑战</Button></div>
    </> : <>
      <div className="truth-heading"><div><p className="eyebrow">THE WHOLE TRUTH</p><h1>黎明以前的完整真相</h1></div></div>
      <div className="full-truth">{fullTruth.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      <p className="story-authorization">感谢本故事原作者授权 <strong>@sz推理之夜</strong></p>
      <div className="ethics-note"><UserRoundSearch/><div><strong>创作说明</strong><p>故事中的犯罪行为属于虚构人物的个体行为，不代表精神疾病患者或白化病群体。</p><p>本故事中白化病的特殊设定为创作需要，仅服务于悬疑叙事，无任何对现实情况的暗示影射。实际上白化病患者只是缺少合成黑色素的能力，其他方面与非白化病患者无任何区别。世界很大，总是有一部分人因为各种理由过的比另一部分人辛苦，但我们反对任何形式的歧视，希望偏见可以在各位侦探这里断绝，感谢大家理解。</p><small>Sz推理之夜全员及本游戏制作组</small></div></div>
      <div className="truth-footer-actions"><Button variant="ghost" onClick={() => setShowTruth(false)}>返回结算</Button><Button onClick={onReplay}><RotateCcw/>重新接受挑战</Button></div>
    </>}
  </section></main>;
}
