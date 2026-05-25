import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, Globe, Sparkles, MessageCircle } from 'lucide-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import { pcmToBase64, AudioPlayer } from '../lib/audioUtils';

interface ConversationalUIProps {
  categoryId: string;
  categoryName: string;
  mission: string;
  culturalNote: string;
}

export const ConversationalUI: React.FC<ConversationalUIProps> = ({ 
  categoryId,
  categoryName, 
  mission, 
  culturalNote 
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [aiVolume, setAiVolume] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const userAnalyserRef = useRef<AnalyserNode | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const updateVolumes = () => {
    if (userAnalyserRef.current) {
      const data = new Uint8Array(userAnalyserRef.current.frequencyBinCount);
      userAnalyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setUserVolume(avg);
    }
    if (audioPlayerRef.current) {
      setAiVolume(audioPlayerRef.current.getVolume());
    }
    animationFrameRef.current = requestAnimationFrame(updateVolumes);
  };

  const startConversation = async () => {
    setIsConnecting(true);
    try {
      // 1. Get the current session token from Amplify
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();

      if (!token) {
        throw new Error('No authentication token available');
      }

      // 2. Initialize WebSocket with the token in the protocol field
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/live`, [token]);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'setup', category: categoryId }));
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ready') {
          setIsConnecting(false);
          setIsActive(true);
          startMic();
          updateVolumes();
        } else if (msg.type === 'audio') {
          if (audioPlayerRef.current) {
            setIsSpeaking(true);
            await audioPlayerRef.current.playChunk(msg.audio);
          }
        } else if (msg.type === 'transcription') {
          setTranscription(msg.text);
        } else if (msg.type === 'interrupted') {
          if (audioPlayerRef.current) {
            audioPlayerRef.current.interrupt();
            setIsSpeaking(false);
          }
        }
      };

      ws.onclose = () => {
        stopMic();
        setIsActive(false);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };

      audioPlayerRef.current = new AudioPlayer();
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setIsConnecting(false);
    }
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      userAnalyserRef.current = analyser;
      source.connect(analyser);

      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
          wsRef.current.send(JSON.stringify({ type: 'audio', audio: base64 }));
        }
      };
    } catch (error) {
      console.error('Mic access denied:', error);
    }
  };

  const stopMic = () => {
    processorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
  };

  const endConversation = () => {
    wsRef.current?.close();
    stopMic();
    setIsActive(false);
    setTranscription('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 relative overflow-hidden">
      {/* Background cultural hint: Spanish tile pattern subtle overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #5A5A40 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10"
      >
        <span className="text-sm font-mono tracking-widest uppercase text-olive-600/60 mb-2 block">
          Conversación Real
        </span>
        <h2 className="text-4xl font-serif text-ink-900 mb-8 italic">
          Practica con <span className="text-orange-600">Mateo</span>
        </h2>

        <div className="relative mb-12">
          {/* Animated rings for speaking state */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: 0.2 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                className="absolute inset-0 border-4 border-orange-500 rounded-full"
              />
            )}
          </AnimatePresence>

          <button
            onClick={isActive ? endConversation : startConversation}
            disabled={isConnecting}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl relative z-10 ${
              isActive 
                ? 'bg-ink-900 text-white scale-110' 
                : 'bg-white text-ink-900 hover:scale-105 border border-ink-100'
            }`}
          >
            {isConnecting ? (
              <div className="w-8 h-8 border-4 border-ink-200 border-t-orange-500 rounded-full animate-spin" />
            ) : (
              <div className="relative flex items-center justify-center">
                {/* User Waveform (Blue/Green) */}
                {isActive && !isSpeaking && (
                   <div className="absolute flex items-center gap-1">
                     {[...Array(5)].map((_, i) => (
                       <motion.div
                         key={i}
                         animate={{ height: [8, 8 + (userVolume * 1.5), 8] }}
                         transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                         className="w-1.5 bg-cyan-400 rounded-full"
                       />
                     ))}
                   </div>
                )}
                {/* AI Waveform (Orange) */}
                {isActive && isSpeaking && (
                   <div className="absolute flex items-center gap-1">
                     {[...Array(5)].map((_, i) => (
                       <motion.div
                         key={i}
                         animate={{ height: [8, 8 + (aiVolume * 2), 8] }}
                         transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.08 }}
                         className="w-1.5 bg-orange-500 rounded-full"
                       />
                     ))}
                   </div>
                )}
                {!isActive && <Mic size={40} />}
                {isActive && <MicOff size={40} className="opacity-20" />}
              </div>
            )}
          </button>
        </div>

        <div className="max-w-md mx-auto min-h-[100px] flex flex-col items-center">
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key="active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-olive-700 font-medium">
                  <div className="flex space-x-1">
                    {[1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        animate={{ height: isSpeaking ? [8, 16, 8] : 8 }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                        className="w-1 bg-orange-500 rounded-full"
                      />
                    ))}
                  </div>
                  <span>{isSpeaking ? 'Mateo está hablando...' : 'Escuchándote...'}</span>
                </div>
                
                {transcription && (
                  <motion.p 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xl font-serif text-ink-800 leading-relaxed italic"
                  >
                    "{transcription}"
                  </motion.p>
                )}
              </motion.div>
            ) : (
              <motion.p 
                key="inactive"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                className="text-sm font-sans uppercase tracking-widest"
              >
                Toca para empezar a hablar
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Mission Display */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 z-10"
      >
        <div className="bg-ink-100/50 px-6 py-3 rounded-full flex items-center gap-3 border border-ink-100">
          <Sparkles size={16} className="text-orange-500" />
          <span className="text-xs font-bold text-ink-500 uppercase tracking-widest">Misión:</span>
          <span className="text-xs text-ink-800 font-medium">{mission}</span>
        </div>
      </motion.div>

      {/* Cultural Tip overlay */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-12 right-12 max-w-[200px] hidden lg:block"
      >
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-olive-50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-orange-500" />
            <span className="text-[10px] uppercase tracking-tighter font-bold text-olive-900">Consejo Cultural</span>
          </div>
          <p className="text-xs text-olive-700 italic leading-snug">
            {culturalNote}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
