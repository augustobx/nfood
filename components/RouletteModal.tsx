"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deductRoulettePoints } from "@/app/actions/client-games";
import { toast } from "sonner";
import confetti from "canvas-confetti";

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
   const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
   return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
   };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
   const start = polarToCartesian(x, y, radius, endAngle);
   const end = polarToCartesian(x, y, radius, startAngle);
   const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
   const d = [
      "M", x, y,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
   ].join(" ");
   return d;
}

export function RouletteModal({
   isOpen,
   onClose,
   prizes,
   onWin,
   cost = 0,
   clientId,
   currentPoints = 0,
   onPointsUpdate
}: {
   isOpen: boolean;
   onClose: () => void;
   prizes: any[];
   onWin: (prize: any) => void;
   cost?: number;
   clientId?: string;
   currentPoints?: number;
   onPointsUpdate?: (p: number) => void;
}) {
   const [isSpinning, setIsSpinning] = useState(false);
   const [rotation, setRotation] = useState(0);
   const [wonPrize, setWonPrize] = useState<any>(null);

   useEffect(() => {
      if (isOpen) {
         setWonPrize(null);
         setRotation(0);
         setIsSpinning(false);
      }
   }, [isOpen]);

   const playTickSound = () => {
      try {
         const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
         const ctx = new AudioContext();
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();
         osc.connect(gain);
         gain.connect(ctx.destination);
         osc.type = "sine";
         osc.frequency.setValueAtTime(800, ctx.currentTime);
         osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
         gain.gain.setValueAtTime(0.3, ctx.currentTime);
         gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
         osc.start(ctx.currentTime);
         osc.stop(ctx.currentTime + 0.1);
      } catch (e) { }
   };

   const playWinSound = () => {
      try {
         const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
         const ctx = new AudioContext();
         const osc = ctx.createOscillator();
         const gain = ctx.createGain();
         osc.connect(gain);
         gain.connect(ctx.destination);
         osc.type = "sine";

         // Tada chord approximation
         osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
         osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
         osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
         osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6

         gain.gain.setValueAtTime(0, ctx.currentTime);
         gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
         gain.gain.setValueAtTime(0.5, ctx.currentTime + 0.4);
         gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);

         osc.start(ctx.currentTime);
         osc.stop(ctx.currentTime + 1.5);
      } catch (e) { }
   };

   const triggerConfetti = () => {
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
         confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#f97316', '#a855f7', '#fde047']
         });
         confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#f97316', '#a855f7', '#fde047']
         });

         if (Date.now() < end) {
            requestAnimationFrame(frame);
         }
      };
      frame();
   };

   const handleSpin = async () => {
      if (isSpinning || wonPrize) return;
      if (!prizes || prizes.length === 0) return;

      if (cost > 0) {
         if (!clientId) return toast.error("Necesitás iniciar sesión.");
         if (currentPoints < cost) return toast.error("No tenés suficientes puntos.", { description: `Necesitás ${cost} Pts.` });

         setIsSpinning(true);
         const res = await deductRoulettePoints(clientId, cost);
         if (!res.success) {
            setIsSpinning(false);
            return toast.error(res.error);
         }
         // CORRECCIÓN: Se agregó ?? 0 para evitar que TypeScript falle si remainingPoints es undefined
         if (onPointsUpdate) onPointsUpdate(res.remainingPoints ?? 0);
      } else {
         setIsSpinning(true);
      }

      const rand = Math.random() * 100;
      let sum = 0;
      let selectedPrize = prizes[0];
      for (const p of prizes) {
         sum += p.probability;
         if (rand <= sum) {
            selectedPrize = p;
            break;
         }
      }

      const totalPrizes = prizes.length;
      const sliceAngle = 360 / totalPrizes;
      const prizeIndex = prizes.findIndex(p => p.id === selectedPrize.id);

      // The pointer is at 0 degrees (top center). 
      // The prize segment starts at prizeIndex * sliceAngle and ends at (prizeIndex + 1) * sliceAngle.
      // To land in the center of the prize:
      const targetAngle = 360 - (prizeIndex * sliceAngle + sliceAngle / 2);
      const spins = 5;
      const finalRotation = (360 * spins) + targetAngle;

      setRotation(finalRotation);

      // Illusion of ticking sync
      let startTime = Date.now();
      const spinDuration = 5000;
      let lastTickAngle = 0;

      const tickInterval = setInterval(() => {
         const elapsed = Date.now() - startTime;
         if (elapsed >= spinDuration) {
            clearInterval(tickInterval);
            setIsSpinning(false);
            setWonPrize(selectedPrize);
            playWinSound();
            triggerConfetti();
            onWin(selectedPrize);
            return;
         }

         // Calculate current angle using easeOutQuart approximation to match css transition
         const progress = elapsed / spinDuration;
         const easeProgress = 1 - Math.pow(1 - progress, 4);
         const currentTotalAngle = finalRotation * easeProgress;

         // If we passed a slice boundary
         const currentSliceTick = Math.floor(currentTotalAngle / sliceAngle);
         if (currentSliceTick > lastTickAngle) {
            playTickSound();
            lastTickAngle = currentSliceTick;
         }
      }, 16); // 60fps check
   };

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
         <button onClick={onClose} disabled={isSpinning} className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer z-50 transition-colors">
            <X className="w-8 h-8" />
         </button>

         {wonPrize ? (
            <motion.div
               initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
               animate={{ scale: 1, opacity: 1, rotate: 0 }}
               transition={{ type: "spring", stiffness: 200, damping: 20 }}
               className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-[0_0_100px_rgba(249,115,22,0.4)] relative overflow-hidden ring-4 ring-orange-500"
            >
               <div className="w-20 h-20 bg-gradient-to-tr from-yellow-300 to-orange-500 text-white flex items-center justify-center rounded-full mx-auto mb-4 shadow-lg">
                  <Gift className="w-10 h-10 animate-bounce" />
               </div>
               <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2">¡GAAAAANASTE!</h2>
               <p className="text-slate-500 font-medium mb-6">Un premio exclusivo se acaba de agregar a tu carrito.</p>

               <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-dashed border-orange-300 p-6 rounded-2xl mb-8 shadow-inner">
                  <p className="font-black text-3xl text-orange-600">{wonPrize.name}</p>
               </div>

               <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600 font-bold h-14 text-lg rounded-xl shadow-lg shadow-orange-500/30" onClick={onClose}>
                  Confirmar y Usar Premio
               </Button>
            </motion.div>
         ) : (
            <motion.div
               initial={{ y: 100, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="flex flex-col items-center max-w-md w-full"
            >
               <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-2 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-tighter">
                  ¡Probá tu suerte!
               </h2>
               <p className="text-white/90 text-center mb-8 font-medium text-lg drop-shadow-md">
                  Girá la ruleta por tan solo <strong className="text-yellow-400">{cost} Pts</strong>.
               </p>

               {/* Rueda Wrapper */}
               <div className="relative w-[320px] h-[320px] md:w-[400px] md:h-[400px] mb-8">
                  {/* Pointer / Flapper */}
                  <div className="absolute -top-6 left-1/2 -ml-6 w-12 h-16 z-40 drop-shadow-[0_5px_5px_rgba(0,0,0,0.6)]">
                     <svg viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <defs>
                           <linearGradient id="pointerGrad" x1="20" y1="0" x2="20" y2="50" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#fef08a" />
                              <stop offset="1" stopColor="#b45309" />
                           </linearGradient>
                        </defs>
                        <path d="M20 50L4 15C4 15 8 2 20 2C32 2 36 15 36 15L20 50Z" fill="url(#pointerGrad)" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
                        <circle cx="20" cy="14" r="5" fill="#1e293b" />
                        <circle cx="20" cy="14" r="2" fill="#94a3b8" />
                     </svg>
                  </div>

                  {/* SVG Roulette Wheel */}
                  <div
                     className="w-full h-full rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.6)] bg-slate-800 border-[8px] border-slate-700 relative overflow-hidden ring-4 ring-slate-900"
                     style={{
                        transform: `rotate(${rotation}deg)`,
                        transition: 'transform 5s cubic-bezier(0.1, 0.9, 0.2, 1)',
                     }}
                  >
                     <svg viewBox="0 0 300 300" width="100%" height="100%" className="w-full h-full">
                        {prizes.map((p, i) => {
                           const sliceAngle = 360 / prizes.length;
                           const startAngle = i * sliceAngle;
                           const endAngle = startAngle + sliceAngle;
                           const midAngle = startAngle + (sliceAngle / 2);

                           const textRadius = 105;
                           const textX = 150 + textRadius * Math.sin(midAngle * Math.PI / 180);
                           const textY = 150 - textRadius * Math.cos(midAngle * Math.PI / 180);

                           // If it's on the left side, flip 180 deg so it's readable
                           const textRotation = midAngle > 180 ? midAngle + 90 : midAngle - 90;

                           const d = describeArc(150, 150, 150, startAngle, endAngle);

                           return (
                              <g key={p.id}>
                                 <path d={d} fill={p.bgColor} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />

                                 <text
                                    x={textX}
                                    y={textY}
                                    fill={p.textColor}
                                    fontSize="13"
                                    fontWeight="900"
                                    letterSpacing="0.5"
                                    fontFamily="system-ui, sans-serif"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                    transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                                    style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.3)' }}
                                 >
                                    {p.name.length > 15 ? p.name.substring(0, 14) + ".." : p.name}
                                 </text>
                              </g>
                           );
                        })}

                        {/* Inner decorative rings */}
                        <circle cx="150" cy="150" r="30" fill="#1e293b" />
                        <circle cx="150" cy="150" r="22" fill="#334155" />
                        <circle cx="150" cy="150" r="14" fill="#eab308" />
                        <circle cx="150" cy="150" r="6" fill="#ca8a04" />

                        {/* Outer pins rings */}
                        <circle cx="150" cy="150" r="145" fill="transparent" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                        <circle cx="150" cy="150" r="148" fill="transparent" stroke="rgba(0,0,0,0.2)" strokeWidth="4" />

                        {/* Outer pins */}
                        {prizes.map((p, i) => {
                           const sliceAngle = 360 / prizes.length;
                           const startAngle = i * sliceAngle;
                           const pinX = 150 + 138 * Math.sin(startAngle * Math.PI / 180);
                           const pinY = 150 - 138 * Math.cos(startAngle * Math.PI / 180);
                           return (
                              <g key={'pin' + i}>
                                 <circle cx={pinX} cy={pinY} r="5" fill="#ca8a04" />
                                 <circle cx={pinX} cy={pinY} r="3" fill="#fef08a" />
                              </g>
                           );
                        })}

                        {/* 3D Glossy Overlay */}
                        <circle cx="150" cy="150" r="150" fill="url(#gloss)" pointerEvents="none" />
                        <defs>
                           <radialGradient id="gloss" cx="30%" cy="30%" r="70%">
                              <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                              <stop offset="30%" stopColor="rgba(255,255,255,0.1)" />
                              <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
                           </radialGradient>
                        </defs>
                     </svg>
                  </div>
                  {/* Overlay shadow for depth */}
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] pointer-events-none z-10 border-[6px] border-slate-800"></div>
               </div>

               <Button
                  size="lg"
                  className="bg-gradient-to-b from-yellow-400 to-orange-500 text-white hover:from-yellow-300 hover:to-orange-400 font-black h-16 w-full max-w-[320px] text-xl shadow-[0_8px_0_#9a3412,0_15px_20px_rgba(0,0,0,0.4)] active:shadow-[0_0px_0_#9a3412,0_0px_0_rgba(0,0,0,0)] active:translate-y-2 transition-all rounded-[2rem] uppercase tracking-wide border-2 border-orange-300/50"
                  onClick={handleSpin}
                  disabled={isSpinning}
               >
                  {isSpinning ? "Girando..." : "¡Girar por " + cost + " Pts!"}
               </Button>
            </motion.div>
         )}
      </div>
   );
}