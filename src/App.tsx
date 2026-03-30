/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  RotateCcw, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Info,
  CheckCircle2,
  AlertCircle,
  Grid3X3,
  Scan
} from 'lucide-react';
import confetti from 'canvas-confetti';
// @ts-ignore
import solver from 'cube-solver';
import { Color, CubeState, INITIAL_STATE, COLOR_MAP, FACE_NAMES } from './types';
import { getCubeAtStep } from './lib/cubeLogic';

console.log("Kociemba Solver App Initializing...");

export default function App() {
  const [cube, setCube] = useState<CubeState>(INITIAL_STATE);
  const [initialInputState, setInitialInputState] = useState<CubeState | null>(null);
  const [activeFace, setActiveFace] = useState<keyof CubeState>('F');
  const [selectedColor, setSelectedColor] = useState<Color>('green');
  const [solution, setSolution] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update cube visualization when currentStep changes
  useEffect(() => {
    if (isSolving && initialInputState && currentStep >= 0) {
      const stateAtStep = getCubeAtStep(initialInputState, solution, currentStep);
      setCube(stateAtStep);
    } else if (!isSolving && initialInputState && currentStep === -1) {
      setCube(initialInputState);
    }
  }, [currentStep, isSolving, initialInputState, solution]);

  // Convert internal state to Kociemba format string
  const getKociembaString = (state: CubeState) => {
    const colorToLetter = (c: Color) => {
      if (c === 'white') return 'U';
      if (c === 'yellow') return 'D';
      if (c === 'red') return 'R';
      if (c === 'orange') return 'L';
      if (c === 'green') return 'F';
      if (c === 'blue') return 'B';
      return 'U';
    };

    const faces: (keyof CubeState)[] = ['U', 'R', 'F', 'D', 'L', 'B'];
    return faces.map(f => state[f].map(colorToLetter).join('')).join('');
  };

  const handleSolve = () => {
    try {
      setError(null);
      const cubeString = getKociembaString(cube);
      setInitialInputState(JSON.parse(JSON.stringify(cube))); // Save input state
      
      console.log("Solving cube:", cubeString);
      
      // Try to use the solver
      let result: string | null = null;
      
      if (typeof solver === 'function') {
        result = (solver as any)(cubeString);
      } else if (typeof (solver as any).solve === 'function') {
        result = (solver as any).solve(cubeString);
      } else if (typeof (solver as any).default === 'function') {
        result = (solver as any).default(cubeString);
      } else {
        console.error("Solver is not a function:", solver);
        throw new Error("Solver function not found. Please check console.");
      }

      if (result) {
        console.log("Solution found:", result);
        const moves = result.split(' ').filter((m: string) => m.length > 0);
        setSolution(moves);
        setCurrentStep(0);
        setIsSolving(true);
      }
    } catch (err) {
      setError("Invalid cube configuration or solver error. Please check the colors.");
      console.error("Solve error:", err);
    }
  };

  const resetCube = () => {
    setCube(INITIAL_STATE);
    setInitialInputState(null);
    setSolution([]);
    setCurrentStep(-1);
    setIsSolving(false);
    setError(null);
  };

  const updateCell = (index: number) => {
    if (isSolving) return; // Prevent editing during solution visualization
    const newFace = [...cube[activeFace]];
    newFace[index] = selectedColor;
    setCube({ ...cube, [activeFace]: newFace });
  };

  const nextStep = () => {
    if (currentStep < solution.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      setIsSolving(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const startCamera = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setError("Camera access denied. Please enable it in settings.");
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const [scannedColors, setScannedColors] = useState<Color[]>(Array(9).fill('gray'));
  const scanIntervalRef = useRef<number | null>(null);

  const rgbToColor = (r: number, g: number, b: number): Color => {
    // Convert RGB to HSL for better color recognition under varying light
    const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm), min = Math.min(rNorm, gNorm, bNorm);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
        case gNorm: h = (bNorm - rNorm) / d + 2; break;
        case bNorm: h = (rNorm - gNorm) / d + 4; break;
      }
      h /= 6;
    }

    const hue = h * 360;
    const sat = s * 100;
    const lum = l * 100;

    // Logic for Rubik's Cube colors
    if (lum > 75 && sat < 25) return 'white';
    if (hue >= 40 && hue < 75) return 'yellow';
    if (hue >= 75 && hue < 160) return 'green';
    if (hue >= 160 && hue < 260) return 'blue';
    if (hue >= 20 && hue < 40) return 'orange';
    if ((hue >= 0 && hue < 20) || (hue >= 330 && hue <= 360)) return 'red';
    
    return 'gray';
  };

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size to match video
    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Define 3x3 grid sampling points relative to the center square
    const size = Math.min(canvas.width, canvas.height) * 0.5;
    const startX = (canvas.width - size) / 2;
    const startY = (canvas.height - size) / 2;
    const step = size / 3;

    const newScanned: Color[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = startX + col * step + step / 2;
        const y = startY + row * step + step / 2;
        
        // Sample a small 10x10 area around the point
        const imageData = ctx.getImageData(x - 5, y - 5, 10, 10).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < imageData.length; i += 4) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
        }
        const count = imageData.length / 4;
        newScanned.push(rgbToColor(r / count, g / count, b / count));
      }
    }
    setScannedColors(newScanned);
    scanIntervalRef.current = requestAnimationFrame(processFrame);
  }, [isScanning]);

  useEffect(() => {
    if (isScanning) {
      scanIntervalRef.current = requestAnimationFrame(processFrame);
    } else if (scanIntervalRef.current) {
      cancelAnimationFrame(scanIntervalRef.current);
    }
    return () => {
      if (scanIntervalRef.current) cancelAnimationFrame(scanIntervalRef.current);
    };
  }, [isScanning, processFrame]);

  const captureFace = () => {
    setCube({ ...cube, [activeFace]: scannedColors });
    stopCamera();
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
      colors: scannedColors.map(c => COLOR_MAP[c])
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Grid3X3 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Kociemba Solver</h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Professional Edition</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={resetCube} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white">
            <RotateCcw size={20} />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8">
        {/* Solution Progress */}
        <AnimatePresence>
          {solution.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-white/60">Step {currentStep + 1} of {solution.length}</span>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-500 rounded-full text-xs font-bold uppercase tracking-wider">
                  {solution[currentStep]}
                </span>
              </div>
              
              <div className="flex items-center justify-center gap-8 py-4">
                <button 
                  onClick={prevStep}
                  disabled={currentStep <= 0}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                
                <div className="text-4xl font-black text-orange-500 tracking-tighter">
                  {solution[currentStep]}
                </div>

                <button 
                  onClick={nextStep}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / solution.length) * 100}%` }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 text-sm"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cube Face Editor */}
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-bold">{FACE_NAMES[activeFace]}</h2>
              <p className="text-sm text-white/40">Tap squares to apply color</p>
            </div>
            <div className="flex gap-2">
              {(['U', 'D', 'L', 'R', 'F', 'B'] as (keyof CubeState)[]).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFace(f)}
                  className={`w-8 h-8 rounded-lg border transition-all text-[10px] font-bold flex items-center justify-center ${
                    activeFace === f 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent text-white/40 border-white/10 hover:border-white/30'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="aspect-square max-w-[280px] mx-auto grid grid-cols-3 gap-2 p-2 bg-white/5 rounded-3xl border border-white/10">
            {cube[activeFace].map((color, idx) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.9 }}
                onClick={() => updateCell(idx)}
                className="aspect-square rounded-xl shadow-inner transition-colors duration-200"
                style={{ backgroundColor: COLOR_MAP[color] }}
              />
            ))}
          </div>

          {/* Color Palette */}
          <div className="flex justify-center gap-3 p-4 bg-white/5 rounded-3xl border border-white/10">
            {(Object.keys(COLOR_MAP) as Color[]).filter(c => c !== 'gray').map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-10 h-10 rounded-xl transition-all ${
                  selectedColor === color 
                    ? 'ring-4 ring-orange-500 ring-offset-4 ring-offset-[#0A0A0A] scale-110' 
                    : 'opacity-60 hover:opacity-100'
                }`}
                style={{ backgroundColor: COLOR_MAP[color] }}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={isScanning ? stopCamera : startCamera}
            className="flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all font-bold"
          >
            {isScanning ? <Pause size={20} /> : <Camera size={20} />}
            {isScanning ? 'Stop Scan' : 'Scan Face'}
          </button>
          <button 
            onClick={handleSolve}
            disabled={isSolving}
            className="flex items-center justify-center gap-3 py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl shadow-xl shadow-orange-500/20 transition-all font-bold disabled:opacity-50"
          >
            <Play size={20} />
            Solve Now
          </button>
        </div>
      </main>

      {/* Camera Overlay */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
          >
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover opacity-60"
            />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="w-64 h-64 border-2 border-orange-500 rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {scannedColors.map((color, i) => (
                    <div 
                      key={i} 
                      className="border border-white/20 transition-colors duration-200" 
                      style={{ backgroundColor: `${COLOR_MAP[color]}44` }} // 44 is hex for ~25% opacity
                    />
                  ))}
                </div>
                {/* Corner Accents */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-xl" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-xl" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-xl" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-xl" />
              </div>
              <p className="mt-8 text-white font-bold tracking-widest uppercase text-xs bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                Scanning {FACE_NAMES[activeFace]}
              </p>
              
              {/* Live Preview Grid */}
              <div className="mt-4 grid grid-cols-3 gap-1">
                {scannedColors.map((color, i) => (
                  <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: COLOR_MAP[color] }} />
                ))}
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="absolute bottom-12 flex gap-6">
              <button 
                onClick={stopCamera}
                className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md"
              >
                <ChevronLeft size={32} />
              </button>
              <button 
                onClick={captureFace}
                className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/40"
              >
                <Scan size={32} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="p-12 text-center text-white/20 text-[10px] uppercase tracking-[0.2em] font-bold">
        Powered by Kociemba Two-Phase Algorithm
      </footer>
    </div>
  );
}
