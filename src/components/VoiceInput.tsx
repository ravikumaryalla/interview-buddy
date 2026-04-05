import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, Send, Trash2, Bot, Volume2, Square,
  Loader2, Radio, PhoneOff, PhoneCall, Sparkles, AudioWaveform
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAppStore } from '../store/useAppStore';
import { chatWithAI, transcribeAudio, getRealtimeToken } from '../lib/ai';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AutoTextarea } from '@/components/ui/auto-textarea';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab        = 'chat' | 'live';
type AudioSrc   = 'mic' | 'system';
type LiveStatus = 'idle' | 'connecting' | 'connected' | 'error';

interface LiveMsg { id: string; role: 'user' | 'ai'; text: string }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2); }

// Safely extract a plain string from ReactNode (react-markdown v10 may pass elements, not raw strings)
function toCodeString(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(toCodeString).join('')
  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>
    return toCodeString(el.props.children)
  }
  return ''
}

// ─── Component ───────────────────────────────────────────────────────────────
export const VoiceInput: React.FC = () => {
  const { selectedModel, currentSolution, currentProblem, setCredits } = useAppStore();
  const [tab, setTab] = useState<Tab>('chat');

  // ── CHAT TAB state ─────────────────────────────────────────────────────────
  const [inputMode, setInputMode]     = useState<AudioSrc>('mic');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript]   = useState('');
  const [chatMsgs, setChatMsgs]       = useState<{ role: string; content: string }[]>([]);
  const [isTyping, setIsTyping]       = useState(false);

  const recorderRef     = useRef<MediaRecorder | null>(null);
  const chunksRef       = useRef<Blob[]>([]);
  const streamRef       = useRef<MediaStream | null>(null);
  const chatBottomRef   = useRef<HTMLDivElement>(null);

  // ── LIVE TAB state ─────────────────────────────────────────────────────────
  const [liveAudioSrc, setLiveAudioSrc] = useState<AudioSrc>('mic');
  const [liveStatus, setLiveStatus]     = useState<LiveStatus>('idle');
  const [liveError, setLiveError]       = useState('');
  const [liveMsgs, setLiveMsgs]         = useState<LiveMsg[]>([]);
  const [streamingAI, setStreamingAI]           = useState('');
  const [streamingInterviewer, setStreamingInterviewer] = useState('');
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [aiSpeaking, setAiSpeaking]     = useState(false);

  const pcRef         = useRef<RTCPeerConnection | null>(null);
  const dcRef         = useRef<RTCDataChannel | null>(null);
  const audioElRef    = useRef<HTMLAudioElement | null>(null);
  const localTrackRef = useRef<MediaStreamTrack | null>(null);
  const liveBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs, isTyping]);
  useEffect(() => { liveBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [liveMsgs, streamingAI, streamingInterviewer]);

  // ── Chat helpers ──────────────────────────────────────────────────────────
  const startRecording = async (src: AudioSrc) => {
    try {
      let stream: MediaStream;
      if (src === 'mic') {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } else {
        const srcId = await window.electronAPI.getDesktopAudioSource();
        if (!srcId) throw new Error('No desktop audio source found');
        const s = await navigator.mediaDevices.getUserMedia({
          audio: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: srcId } } as any,
          video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: srcId, maxWidth: 1, maxHeight: 1 } } as any,
        });
        s.getVideoTracks().forEach(t => t.stop());
        stream = new MediaStream(s.getAudioTracks());
      }
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.start(1000);
      recorderRef.current = rec;
      setIsRecording(true);
    } catch (e: any) { alert('Audio error: ' + e.message); }
  };

  const stopRecording = async () => {
    const rec = recorderRef.current;
    if (!rec) return;
    await new Promise<void>(res => { rec.onstop = () => res(); rec.stop(); });
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; recorderRef.current = null;
    setIsRecording(false);
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    chunksRef.current = [];
    if (blob.size < 1000) { setTranscript('[No audio captured]'); return; }
    setIsTranscribing(true);
    try { setTranscript(await transcribeAudio(blob)); }
    catch (e: any) { setTranscript('[Transcription failed: ' + e.message + ']'); }
    finally { setIsTranscribing(false); }
  };

  const sendChat = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const msg = text.trim();
    setChatMsgs(p => [...p, { role: 'user', content: msg }]);
    setTranscript('');
    setIsTyping(true);
    const hist = chatMsgs;
    try {
      const sys = currentSolution
        ? `You are an expert interview assistant. The user is solving: "${currentProblem}". Summary: "${currentSolution.summary}". Approach: "${currentSolution.approach}". Answer follow-ups clearly.`
        : 'You are a helpful coding interview assistant. Answer concisely.';
      setChatMsgs(p => [...p, { role: 'assistant', content: '' }]);
      await chatWithAI(msg, hist, sys, selectedModel, (delta) => {
        setChatMsgs(p => {
          const last = p[p.length - 1];
          return [...p.slice(0, -1), { ...last, content: last.content + delta }];
        });
      });
    } catch (e: any) {
      setChatMsgs(p => [...p, { role: 'assistant', content: 'Error: ' + (e?.message ?? 'Unknown') }]);
    } finally { setIsTyping(false); }
  };

  // ── Live Voice: connect ───────────────────────────────────────────────────
  const connectLive = useCallback(async () => {
    setLiveStatus('connecting'); setLiveError(''); setLiveMsgs([]); setStreamingAI(''); setStreamingInterviewer('');

    try {
      // Get audio track
      let audioTrack: MediaStreamTrack;
      if (liveAudioSrc === 'mic') {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioTrack = s.getAudioTracks()[0];
      } else {
        const srcId = await window.electronAPI.getDesktopAudioSource();
        if (!srcId) throw new Error('No desktop audio source found');
        const s = await navigator.mediaDevices.getUserMedia({
          audio: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: srcId } } as any,
          video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: srcId, maxWidth: 1, maxHeight: 1 } } as any,
        });
        s.getVideoTracks().forEach(t => t.stop());
        audioTrack = s.getAudioTracks()[0];
      }
      localTrackRef.current = audioTrack;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      // Suppress audio output — display text only
      pc.ontrack = () => { /* intentionally ignore audio track */ };

      pc.addTrack(audioTrack);

      // Data channel for JSON events
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      dc.addEventListener('open', () => {
        const isSysAudio = liveAudioSrc === 'system';
        const instructions = currentSolution
          ? `You are an expert coding interview assistant. ${isSysAudio ? 'You are listening to an interviewer speaking. Analyze their question and give the user concise hints and approaches — do NOT give the full answer.' : `The user is solving: "${currentProblem}". Help them with hints, explanations, and guidance. Be conversational.`}`
          : `You are an expert coding interview assistant. ${isSysAudio ? 'Listen to the interviewer and give the user silent hints and advice.' : 'Help the user practice coding interviews. Be conversational, encouraging, and precise.'}`;

        dc.send(JSON.stringify({
          type: 'session.update',
          session: {
            modalities: ['text'],
            instructions,
            voice: 'alloy',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 500 },
          },
        }));
        setLiveStatus('connected');
      });

      dc.addEventListener('message', (e) => {
        try {
          const ev = JSON.parse(e.data);
          switch (ev.type) {
            case 'input_audio_buffer.speech_started':
              setUserSpeaking(true); setStreamingInterviewer(''); break;
            case 'input_audio_buffer.speech_stopped':
              setUserSpeaking(false); break;
            case 'conversation.item.input_audio_transcription.delta':
              if (ev.delta) setStreamingInterviewer(p => p + ev.delta); break;
            case 'conversation.item.input_audio_transcription.completed':
              setStreamingInterviewer('');
              if (ev.transcript?.trim()) setLiveMsgs(p => [...p, { id: uid(), role: 'user', text: ev.transcript.trim() }]);
              break;
            case 'response.created':
              setAiSpeaking(true); setStreamingAI(''); break;
            case 'response.audio_transcript.delta':
            case 'response.text.delta':
              setStreamingAI(p => p + (ev.delta ?? '')); break;
            case 'response.audio_transcript.done':
            case 'response.text.done': {
              const final = (ev.transcript ?? ev.text ?? '').trim();
              if (final) { setLiveMsgs(p => [...p, { id: uid(), role: 'ai', text: final }]); }
              setStreamingAI(''); setAiSpeaking(false); break;
            }
            case 'response.done':
              setAiSpeaking(false); break;
            case 'error':
              setLiveError(ev.error?.message ?? 'Realtime API error');
              console.error('Realtime error:', ev.error); break;
          }
        } catch { /* non-JSON frame */ }
      });

      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          setLiveStatus('error'); setLiveError('Connection lost. Try reconnecting.');
        }
      });

      // SDP exchange — get ephemeral token from backend first
      const ephemeralToken = await getRealtimeToken();
      // Deduct credits, then refresh balance
      const { api } = await import('../lib/api');
      const me = await api.user.me();
      setCredits(me.credits);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const resp = await fetch('https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview', {
        method: 'POST',
        body: offer.sdp,
        headers: { Authorization: `Bearer ${ephemeralToken}`, 'Content-Type': 'application/sdp' },
      });
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`OpenAI ${resp.status}: ${err}`);
      }
      const answerSdp = await resp.text();
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (e: any) {
      console.error('Live connect error:', e);
      setLiveError(e?.message ?? 'Failed to connect');
      setLiveStatus('error');
      disconnectLive();
    }
  }, [liveAudioSrc, currentProblem, currentSolution, setCredits]);

  const disconnectLive = useCallback(() => {
    dcRef.current?.close(); dcRef.current = null;
    pcRef.current?.close(); pcRef.current = null;
    localTrackRef.current?.stop(); localTrackRef.current = null;
    setLiveStatus('idle'); setUserSpeaking(false); setAiSpeaking(false); setStreamingAI(''); setStreamingInterviewer('');
  }, []);

  useEffect(() => () => disconnectLive(), [disconnectLive]);

  const QUICK = ['Explain this solution', 'Optimize space complexity', 'Edge cases?', 'Time complexity?'];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* Top tabs */}
      <div className="flex items-center justify-center border-b border-border shrink-0 bg-panel/60 backdrop-blur-sm px-3 py-2">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full">
          <TabsList className="w-full h-8">
            <TabsTrigger value="chat" className="flex-1 h-7 text-xs gap-1.5">
              <Bot size={12} /> Chat
            </TabsTrigger>
            <TabsTrigger value="live" className="flex-1 h-7 text-xs gap-1.5">
              <Radio size={12} /> Live Voice
              {liveStatus === 'connected' && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_4px_rgba(74,222,128,0.5)]" />
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── CHAT TAB ───────────────────────────────────────────────────────── */}
      {tab === 'chat' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
            <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-0.5">
              <button onClick={() => { if (isRecording) stopRecording(); setInputMode('mic'); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${inputMode === 'mic' ? 'bg-panel text-accent shadow-sm' : 'text-foreground/45 hover:text-foreground/70'}`}>
                <Mic size={11} /> Mic
              </button>
              <button onClick={() => { if (isRecording) stopRecording(); setInputMode('system'); }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${inputMode === 'system' ? 'bg-panel text-accent shadow-sm' : 'text-foreground/45 hover:text-foreground/70'}`}>
                <Volume2 size={11} /> Speaker
              </button>
            </div>
            {chatMsgs.length > 0 && (
              <button onClick={() => { setChatMsgs([]); setTranscript(''); }}
                className="flex items-center gap-1 text-[10px] text-foreground/30 hover:text-red-400 px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors">
                <Trash2 size={10} /> Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 no-scrollbar min-h-0">
            {chatMsgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 select-none">
                <div className="w-11 h-11 rounded-2xl gradient-bg flex items-center justify-center glow-accent"><Bot size={18} className="text-white" /></div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground/60">Ask me anything</p>
                  <p className="text-xs text-foreground/30 mt-0.5">Type, record via mic, or capture speaker output</p>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {QUICK.map(q => (
                    <button key={q} onClick={() => sendChat(q)} disabled={isTyping}
                      className="px-2.5 py-1 bg-panel border border-border rounded-full text-[11px] text-foreground/60 hover:text-accent hover:border-accent/40 disabled:opacity-40 transition-colors">{q}</button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {chatMsgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                      ${m.role === 'user' ? 'bg-accent text-white rounded-br-sm' : 'bg-panel border border-border text-foreground/80 rounded-bl-sm'}`}>
                      {m.role === 'user' ? m.content : (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-4 prose-li:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-pre:my-2 prose-pre:p-0 prose-pre:bg-transparent">
                          <ReactMarkdown
                            components={{
                              code({ className, children }) {
                                const match = /language-(\w+)/.exec(className || '')
                                const code = toCodeString(children).replace(/\n$/, '')
                                return match ? (
                                  <div className="rounded-lg overflow-hidden my-1.5">
                                    <SyntaxHighlighter
                                      language={match[1]}
                                      style={vscDarkPlus}
                                      PreTag="div"
                                      customStyle={{ margin: 0, padding: '0.65rem 0.85rem', fontSize: '0.74rem', background: 'rgba(0,0,0,0.5)' }}
                                    >
                                      {code}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code className="bg-black/25 px-1 py-0.5 rounded text-[0.8em] font-mono">{children}</code>
                                )
                              },
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 px-3 py-2.5 bg-panel border border-border rounded-2xl rounded-bl-sm">
                      {[0, 0.15, 0.3].map((d, i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: `${d}s`, animationDuration: '0.9s' }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 p-3 border-t border-border space-y-2">
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs text-red-400 font-medium flex-1">
                  {inputMode === 'mic' ? 'Recording mic…' : 'Recording speaker output…'}
                </span>
                <span className="text-[10px] text-red-400/60">click ■ to stop & transcribe</span>
              </div>
            )}
            {isTranscribing && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg">
                <Loader2 size={12} className="text-accent animate-spin" />
                <span className="text-xs text-accent font-medium">Transcribing with Whisper…</span>
              </div>
            )}
            <AutoTextarea
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendChat(transcript);
                }
              }}
              placeholder={isRecording ? 'Recording…' : isTranscribing ? 'Transcribing…' : 'Type a question…'}
              disabled={isTranscribing}
              startAdornment={
                <button
                  onClick={isRecording ? stopRecording : () => startRecording(inputMode)}
                  disabled={isTranscribing}
                  className={`p-1.5 rounded-lg transition-colors ${isRecording ? 'bg-red-500/15 text-red-400' : 'text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5'}`}
                >
                  {isRecording ? <Square size={15} /> : inputMode === 'mic' ? <Mic size={15} /> : <Volume2 size={15} />}
                </button>
              }
              endAdornment={
                <Button
                  size="icon"
                  onClick={() => sendChat(transcript)}
                  disabled={!transcript.trim() || isTyping || isTranscribing}
                  className="h-8 w-8"
                >
                  <Send size={13} />
                </Button>
              }
            />
          </div>
        </div>
      )}

      {/* ── LIVE VOICE TAB ─────────────────────────────────────────────────── */}
      {tab === 'live' && (
        <div className="flex flex-col flex-1 min-h-0">

          {liveStatus !== 'connected' ? (
            /* ─ Disconnected screen ─ */
            <div className="flex flex-col items-center justify-center flex-1 gap-5 p-6 select-none">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center
                ${liveStatus === 'connecting' ? 'bg-accent/10' : liveStatus === 'error' ? 'bg-red-500/10' : 'bg-accent/10'}`}>
                {liveStatus === 'connecting'
                  ? <Loader2 size={28} className="text-accent animate-spin" />
                  : <AudioWaveform size={28} className={liveStatus === 'error' ? 'text-red-400' : 'text-accent'} />}
              </div>

              <div className="text-center">
                <p className="text-sm font-semibold text-foreground/80">
                  {liveStatus === 'connecting' ? 'Connecting…' : liveStatus === 'error' ? 'Connection failed' : 'Live Voice'}
                </p>
                <p className="text-xs text-foreground/40 mt-1 max-w-[220px] leading-relaxed">
                  {liveStatus === 'error'
                    ? liveError
                    : 'Real-time conversation with AI using OpenAI Realtime API'}
                </p>
              </div>

              {/* Audio source selector */}
              {liveStatus !== 'connecting' && (
                <div className="flex bg-background border border-border rounded-lg p-0.5 w-full max-w-[240px]">
                  <button onClick={() => setLiveAudioSrc('mic')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all
                      ${liveAudioSrc === 'mic' ? 'bg-panel text-accent shadow-sm' : 'text-foreground/45 hover:text-foreground/70'}`}>
                    <Mic size={12} /> Microphone
                  </button>
                  <button onClick={() => setLiveAudioSrc('system')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all
                      ${liveAudioSrc === 'system' ? 'bg-panel text-accent shadow-sm' : 'text-foreground/45 hover:text-foreground/70'}`}>
                    <Volume2 size={12} /> Speaker
                  </button>
                </div>
              )}

              <p className="text-[10px] text-foreground/30 text-center max-w-[220px] leading-relaxed">
                {liveAudioSrc === 'mic'
                  ? 'Speak directly — AI responds with voice in real time'
                  : 'Captures speaker output — AI gives you silent text hints as the interviewer speaks'}
              </p>

              {liveStatus !== 'connecting' && (
                <Button onClick={connectLive} className="px-6 h-9 gap-2">
                  <PhoneCall size={14} /> Start Live Session
                </Button>
              )}
            </div>
          ) : (
            /* ─ Connected screen ─ */
            <div className="flex flex-col flex-1 min-h-0">

              {/* Status bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-medium text-green-400">Live</span>
                  <span className="text-[10px] text-foreground/30">
                    · {liveAudioSrc === 'mic' ? 'Microphone' : 'Speaker output'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {userSpeaking && (
                    <span className="flex items-center gap-1 text-[10px] text-blue-400 font-medium">
                      <Mic size={10} className="animate-pulse" /> You
                    </span>
                  )}
                  {aiSpeaking && (
                    <span className="flex items-center gap-1 text-[10px] text-accent font-medium">
                      <Sparkles size={10} className="animate-pulse" /> AI
                    </span>
                  )}
                  <Button variant="destructive" size="sm" onClick={disconnectLive} className="h-6 text-[11px] gap-1">
                    <PhoneOff size={10} /> End
                  </Button>
                </div>
              </div>

              {/* Transcript */}
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 no-scrollbar min-h-0">
                {liveMsgs.length === 0 && !streamingAI && !streamingInterviewer ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-foreground/25 select-none">
                    <AudioWaveform size={28} />
                    <p className="text-xs text-center">
                      {liveAudioSrc === 'mic' ? 'Start speaking — AI is listening' : 'AI is listening to speaker output…'}
                    </p>
                  </div>
                ) : (
                  <>
                    {liveMsgs.map(m => (
                      <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                          ${m.role === 'user'
                            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20 rounded-br-sm'
                            : 'bg-panel border border-border text-foreground/80 rounded-bl-sm'}`}>
                          {m.role === 'user' && <span className="text-[10px] text-blue-400/60 block mb-0.5">{liveAudioSrc === 'system' ? 'Interviewer' : 'You'}</span>}
                          {m.role === 'ai' && <span className="text-[10px] text-accent/60 block mb-0.5 flex items-center gap-1"><Sparkles size={9} /> AI</span>}
                          {m.role === 'ai' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-4 prose-li:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-pre:my-2 prose-pre:p-0 prose-pre:bg-transparent">
                              <ReactMarkdown
                                components={{
                                  code({ className, children }) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    const code = toCodeString(children).replace(/\n$/, '')
                                    return match ? (
                                      <div className="rounded-lg overflow-hidden my-1.5">
                                        <SyntaxHighlighter
                                          language={match[1]}
                                          style={vscDarkPlus}
                                          PreTag="div"
                                          customStyle={{ margin: 0, padding: '0.65rem 0.85rem', fontSize: '0.74rem', background: 'rgba(0,0,0,0.5)' }}
                                        >
                                          {code}
                                        </SyntaxHighlighter>
                                      </div>
                                    ) : (
                                      <code className="bg-black/25 px-1 py-0.5 rounded text-[0.8em] font-mono">{children}</code>
                                    )
                                  },
                                }}
                              >
                                {m.text}
                              </ReactMarkdown>
                            </div>
                          ) : m.text}
                        </div>
                      </div>
                    ))}
                    {/* Streaming interviewer transcription */}
                    {streamingInterviewer && (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm text-sm bg-blue-500/10 border border-blue-500/20 text-blue-300 leading-relaxed">
                          <span className="text-[10px] text-blue-400/60 block mb-0.5 flex items-center gap-1">
                            <Mic size={9} className="animate-pulse" /> {liveAudioSrc === 'system' ? 'Interviewer' : 'You'}
                          </span>
                          {streamingInterviewer}<span className="inline-block w-1 h-3.5 bg-blue-400/60 ml-0.5 animate-pulse rounded-sm" />
                        </div>
                      </div>
                    )}
                    {/* Streaming AI response */}
                    {streamingAI && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-bl-sm text-sm bg-panel border border-border text-foreground/80 leading-relaxed">
                          <span className="text-[10px] text-accent/60 block mb-0.5 flex items-center gap-1"><Sparkles size={9} /> AI</span>
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-4 prose-li:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-pre:my-2 prose-pre:p-0 prose-pre:bg-transparent">
                            <ReactMarkdown
                              components={{
                                code({ className, children }) {
                                  const match = /language-(\w+)/.exec(className || '')
                                  const code = toCodeString(children).replace(/\n$/, '')
                                  return match ? (
                                    <div className="rounded-lg overflow-hidden my-1.5">
                                      <SyntaxHighlighter
                                        language={match[1]}
                                        style={vscDarkPlus}
                                        PreTag="div"
                                        customStyle={{ margin: 0, padding: '0.65rem 0.85rem', fontSize: '0.74rem', background: 'rgba(0,0,0,0.5)' }}
                                      >
                                        {code}
                                      </SyntaxHighlighter>
                                    </div>
                                  ) : (
                                    <code className="bg-black/25 px-1 py-0.5 rounded text-[0.8em] font-mono">{children}</code>
                                  )
                                },
                              }}
                            >
                              {streamingAI}
                            </ReactMarkdown>
                          </div>
                          <span className="inline-block w-1 h-3.5 bg-accent/60 ml-0.5 animate-pulse rounded-sm" />
                        </div>
                      </div>
                    )}
                    <div ref={liveBottomRef} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
