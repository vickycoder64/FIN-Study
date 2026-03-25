import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Coins, Flame, Droplets, Bell, BookOpen, Map, Hammer,
  Sparkles, Flag, Crown, Users, Heart, ArrowUpCircle, Sun,
  CheckCircle2, Lock, Building, HandCoins, ScrollText
} from 'lucide-react';

// --- Types ---
type UpgradeCategory = 'construction' | 'worship' | 'expansion' | 'decoration';

interface Upgrade {
  id: string;
  name: string;
  category: UpgradeCategory;
  cost: number;
  devotionCost: number;
  passiveCoins: number;
  passiveDevotion: number;
  description: string;
  icon: React.ElementType;
  reqLevel: number;
}

// --- Game Data ---
const UPGRADES: Upgrade[] = [
  // Construction
  { id: 'bricks_sand', name: 'Bricks & Sand', category: 'construction', cost: 50, devotionCost: 0, passiveCoins: 1, passiveDevotion: 0, description: 'Basic building materials for the foundation.', icon: Hammer, reqLevel: 1 },
  { id: 'cement_rebar', name: 'Cement & Rebar', category: 'construction', cost: 200, devotionCost: 50, passiveCoins: 5, passiveDevotion: 0, description: 'Strengthen the temple structure.', icon: Building, reqLevel: 2 },
  { id: 'stone_carvings', name: 'Stone Carvings', category: 'construction', cost: 1000, devotionCost: 200, passiveCoins: 20, passiveDevotion: 5, description: 'Beautiful carvings for the pillars.', icon: Sparkles, reqLevel: 3 },
  { id: 'marble_tiles', name: 'Marble Tiles', category: 'construction', cost: 5000, devotionCost: 1000, passiveCoins: 100, passiveDevotion: 20, description: 'Pristine flooring for the sanctum.', icon: Map, reqLevel: 4 },
  
  // Worship
  { id: 'matches_camphor', name: 'Matches & Camphor', category: 'worship', cost: 20, devotionCost: 0, passiveCoins: 0, passiveDevotion: 1, description: 'Essential items for daily aarti.', icon: Flame, reqLevel: 1 },
  { id: 'lamp_ghee', name: 'Lamp (Ghee/Oil)', category: 'worship', cost: 100, devotionCost: 20, passiveCoins: 0, passiveDevotion: 3, description: 'Keep the eternal flame burning.', icon: Sun, reqLevel: 2 },
  { id: 'copper_lota', name: 'Copper Lota & Water Pots', category: 'worship', cost: 500, devotionCost: 100, passiveCoins: 2, passiveDevotion: 10, description: 'For holy water and abhishekam.', icon: Droplets, reqLevel: 3 },
  { id: 'grand_bell', name: 'Grand Bell', category: 'worship', cost: 2000, devotionCost: 500, passiveCoins: 10, passiveDevotion: 50, description: 'A massive bell whose sound purifies the air.', icon: Bell, reqLevel: 4 },

  // Decoration
  { id: 'red_flag', name: 'Red Flag (Lal Dhwaj)', category: 'decoration', cost: 150, devotionCost: 30, passiveCoins: 2, passiveDevotion: 5, description: 'A sacred flag fluttering atop the temple.', icon: Flag, reqLevel: 2 },
  { id: 'furniture', name: 'Furniture & Seating', category: 'decoration', cost: 800, devotionCost: 150, passiveCoins: 15, passiveDevotion: 5, description: 'Comfortable seating for devotees.', icon: Users, reqLevel: 3 },
  { id: 'kalash', name: 'Golden Kalash', category: 'decoration', cost: 3000, devotionCost: 800, passiveCoins: 50, passiveDevotion: 100, description: 'The crowning glory of the temple peak.', icon: Crown, reqLevel: 4 },
  { id: 'donor_plaque', name: 'Donor\'s Plaque', category: 'decoration', cost: 15000, devotionCost: 2000, passiveCoins: 300, passiveDevotion: 50, description: 'Honor the generous contributors.', icon: ScrollText, reqLevel: 5 },

  // Expansion
  { id: 'prangan', name: 'Prangan (Courtyard)', category: 'expansion', cost: 10000, devotionCost: 1500, passiveCoins: 200, passiveDevotion: 100, description: 'A large courtyard for gatherings and festivals.', icon: Map, reqLevel: 4 },
  { id: 'bhoomi_daan', name: 'Bhoomi Daan (Land)', category: 'expansion', cost: 50000, devotionCost: 5000, passiveCoins: 1000, passiveDevotion: 500, description: 'Acquire more land for a massive complex.', icon: Map, reqLevel: 5 },
  { id: 'vidya_daan', name: 'Vidya Daan (Gurukul)', category: 'expansion', cost: 100000, devotionCost: 10000, passiveCoins: 2000, passiveDevotion: 2000, description: 'Establish a school for Vedic studies.', icon: BookOpen, reqLevel: 6 },
];

const LEVELS = [
  { level: 1, name: 'Small Shrine', reqDevotion: 0 },
  { level: 2, name: 'Village Temple', reqDevotion: 100 },
  { level: 3, name: 'Town Mandir', reqDevotion: 500 },
  { level: 4, name: 'Grand Temple', reqDevotion: 2500 },
  { level: 5, name: 'Sacred Complex', reqDevotion: 10000 },
  { level: 6, name: 'Divine Pilgrimage', reqDevotion: 50000 },
];

export default function App() {
  const [coins, setCoins] = useState(0);
  const [devotion, setDevotion] = useState(0);
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<UpgradeCategory | 'actions'>('actions');
  const [lastAartiTime, setLastAartiTime] = useState(0);
  const [clickEffects, setClickEffects] = useState<{ id: number; x: number; y: number; text: string }[]>([]);

  // Calculate current level
  const currentLevelInfo = [...LEVELS].reverse().find(l => devotion >= l.reqDevotion) || LEVELS[0];
  const nextLevelInfo = LEVELS.find(l => l.level === currentLevelInfo.level + 1);
  const levelProgress = nextLevelInfo 
    ? ((devotion - currentLevelInfo.reqDevotion) / (nextLevelInfo.reqDevotion - currentLevelInfo.reqDevotion)) * 100 
    : 100;

  // Calculate passive income
  const passiveCoins = purchasedUpgrades.reduce((total, id) => {
    const upgrade = UPGRADES.find(u => u.id === id);
    return total + (upgrade?.passiveCoins || 0);
  }, 0);

  const passiveDevotion = purchasedUpgrades.reduce((total, id) => {
    const upgrade = UPGRADES.find(u => u.id === id);
    return total + (upgrade?.passiveDevotion || 0);
  }, 0);

  // Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCoins(prev => prev + passiveCoins);
      setDevotion(prev => prev + passiveDevotion);
    }, 1000);
    return () => clearInterval(interval);
  }, [passiveCoins, passiveDevotion]);

  const addClickEffect = (e: React.MouseEvent, text: string) => {
    const newEffect = { id: Date.now(), x: e.clientX, y: e.clientY, text };
    setClickEffects(prev => [...prev, newEffect]);
    setTimeout(() => {
      setClickEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
    }, 1000);
  };

  const handleManualCollect = (e: React.MouseEvent) => {
    const earnCoins = 1 + Math.floor(currentLevelInfo.level * 1.5);
    const earnDevotion = 1 + Math.floor(currentLevelInfo.level * 0.5);
    setCoins(prev => prev + earnCoins);
    setDevotion(prev => prev + earnDevotion);
    addClickEffect(e, `+${earnCoins} Coins`);
  };

  const performAarti = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastAartiTime < 60000) return; // 1 min cooldown
    
    const earnCoins = 50 * currentLevelInfo.level;
    const earnDevotion = 20 * currentLevelInfo.level;
    
    setCoins(prev => prev + earnCoins);
    setDevotion(prev => prev + earnDevotion);
    setLastAartiTime(now);
    addClickEffect(e, `Aarti Performed!`);
  };

  const performArjithaSeva = (e: React.MouseEvent) => {
    const cost = 100 * currentLevelInfo.level;
    if (coins >= cost) {
      setCoins(prev => prev - cost);
      const earnDevotion = 50 * currentLevelInfo.level;
      setDevotion(prev => prev + earnDevotion);
      addClickEffect(e, `+${earnDevotion} Devotion`);
    }
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    if (
      !purchasedUpgrades.includes(upgrade.id) && 
      coins >= upgrade.cost && 
      devotion >= upgrade.devotionCost &&
      currentLevelInfo.level >= upgrade.reqLevel
    ) {
      setCoins(prev => prev - upgrade.cost);
      setDevotion(prev => prev - upgrade.devotionCost);
      setPurchasedUpgrades(prev => [...prev, upgrade.id]);
    }
  };

  // Visual representation of the temple based on level and upgrades
  const renderTempleVisual = () => {
    const hasKalash = purchasedUpgrades.includes('kalash');
    const hasFlag = purchasedUpgrades.includes('red_flag');
    const hasPrangan = purchasedUpgrades.includes('prangan');
    const hasGurukul = purchasedUpgrades.includes('vidya_daan');

    return (
      <div className="relative w-full h-64 md:h-96 bg-gradient-to-b from-sky-300 to-sky-100 dark:from-slate-800 dark:to-slate-900 rounded-2xl overflow-hidden shadow-inner flex items-end justify-center pb-8 border-4 border-amber-600/20">
        {/* Sun/Moon */}
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute top-8 right-8 text-amber-400 opacity-80"
        >
          <Sun size={64} />
        </motion.div>

        {/* Background Elements */}
        {hasPrangan && (
          <div className="absolute bottom-0 w-full h-16 bg-stone-300 dark:bg-stone-700 border-t-4 border-stone-400 dark:border-stone-600" />
        )}
        
        {hasGurukul && (
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute bottom-8 left-4 md:left-12 flex flex-col items-center"
          >
            <div className="w-24 h-20 bg-orange-100 dark:bg-orange-900 border-2 border-orange-800 rounded-t-lg flex items-center justify-center">
              <BookOpen className="text-orange-800 dark:text-orange-200" size={32} />
            </div>
            <div className="text-xs font-bold text-orange-900 dark:text-orange-100 mt-1 bg-white/50 px-2 rounded">Gurukul</div>
          </motion.div>
        )}

        {/* Main Temple Structure */}
        <motion.div 
          className="relative flex flex-col items-center z-10 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleManualCollect}
        >
          {/* Flag */}
          {hasFlag && (
            <motion.div 
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-16 right-4 text-red-500 origin-bottom-left"
            >
              <Flag size={48} fill="currentColor" />
            </motion.div>
          )}

          {/* Kalash */}
          {hasKalash && (
            <div className="absolute -top-8 text-amber-500">
              <Crown size={40} fill="currentColor" />
            </div>
          )}

          {/* Temple Body based on Level */}
          {currentLevelInfo.level === 1 && (
            <div className="w-32 h-32 bg-stone-200 dark:bg-stone-700 rounded-t-full border-4 border-stone-400 flex items-center justify-center shadow-xl">
              <Sparkles className="text-amber-500" size={32} />
            </div>
          )}
          {currentLevelInfo.level === 2 && (
            <div className="flex flex-col items-center">
              <div className="w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-b-[80px] border-b-orange-600" />
              <div className="w-28 h-32 bg-orange-100 dark:bg-orange-900 border-4 border-orange-800 flex items-center justify-center shadow-xl">
                <div className="w-12 h-20 bg-orange-950 rounded-t-full" />
              </div>
            </div>
          )}
          {currentLevelInfo.level >= 3 && (
            <div className="flex flex-col items-center">
              {/* Shikhar (Tower) */}
              <div className="w-0 h-0 border-l-[80px] border-l-transparent border-r-[80px] border-r-transparent border-b-[120px] border-b-orange-500 relative">
                <div className="absolute top-10 -left-4 w-8 h-8 border-t-4 border-l-4 border-orange-300 rounded-tl-full opacity-50" />
                <div className="absolute top-10 -right-4 w-8 h-8 border-t-4 border-r-4 border-orange-300 rounded-tr-full opacity-50" />
              </div>
              {/* Base */}
              <div className="w-48 h-40 bg-orange-50 dark:bg-orange-950 border-4 border-orange-800 flex flex-col items-center justify-end pb-0 shadow-2xl relative">
                {/* Pillars */}
                {purchasedUpgrades.includes('stone_carvings') && (
                  <>
                    <div className="absolute left-2 top-0 bottom-0 w-4 bg-stone-300 border-x border-stone-400" />
                    <div className="absolute right-2 top-0 bottom-0 w-4 bg-stone-300 border-x border-stone-400" />
                  </>
                )}
                {/* Door */}
                <div className="w-20 h-28 bg-orange-900 rounded-t-full border-4 border-orange-950 flex items-center justify-center overflow-hidden relative">
                  <motion.div 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute bottom-4 w-8 h-8 bg-amber-500 rounded-full blur-md"
                  />
                  <Flame className="text-amber-400 z-10" size={24} fill="currentColor" />
                </div>
              </div>
              {/* Steps */}
              {purchasedUpgrades.includes('marble_tiles') ? (
                <div className="w-64 h-6 bg-stone-100 border-b-4 border-stone-300" />
              ) : (
                <div className="w-56 h-6 bg-stone-400 border-b-4 border-stone-600" />
              )}
            </div>
          )}
        </motion.div>

        {/* Click Instruction */}
        <div className="absolute bottom-2 text-sm font-medium text-stone-600 dark:text-stone-300 opacity-70 animate-pulse pointer-events-none">
          Tap Temple to Collect Chadava
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-sans selection:bg-amber-200 dark:selection:bg-amber-900">
      {/* Click Effects */}
      <AnimatePresence>
        {clickEffects.map(effect => (
          <motion.div
            key={effect.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -50, scale: 1.2 }}
            exit={{ opacity: 0 }}
            className="fixed pointer-events-none z-50 font-bold text-amber-500 drop-shadow-md"
            style={{ left: effect.x, top: effect.y }}
          >
            {effect.text}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto p-4 md:p-6 flex flex-col h-screen">
        
        {/* Header Dashboard */}
        <header className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm border border-stone-200 dark:border-stone-700 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center border-2 border-amber-500">
              <Crown className="text-amber-600 dark:text-amber-400" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{currentLevelInfo.name}</h1>
              <p className="text-sm text-stone-500 dark:text-stone-400 font-medium">Level {currentLevelInfo.level}</p>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Coins size={24} />
                <span className="text-2xl font-bold font-mono">{Math.floor(coins).toLocaleString()}</span>
              </div>
              <span className="text-xs font-medium text-stone-500">+{passiveCoins}/sec</span>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                <Heart size={24} />
                <span className="text-2xl font-bold font-mono">{Math.floor(devotion).toLocaleString()}</span>
              </div>
              <span className="text-xs font-medium text-stone-500">+{passiveDevotion}/sec</span>
            </div>
          </div>
        </header>

        {/* Level Progress */}
        {nextLevelInfo && (
          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-stone-600 dark:text-stone-400">Progress to {nextLevelInfo.name}</span>
              <span className="text-orange-600 dark:text-orange-400">{Math.floor(devotion)} / {nextLevelInfo.reqDevotion} Devotion</span>
            </div>
            <div className="h-3 w-full bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-orange-400 to-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, levelProgress))}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* Left Column: Visuals */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {renderTempleVisual()}
            
            {/* Quick Stats/Info */}
            <div className="bg-white dark:bg-stone-800 rounded-2xl p-6 shadow-sm border border-stone-200 dark:border-stone-700 flex-1">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles className="text-amber-500" size={20} />
                Temple Status
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between border-b border-stone-100 dark:border-stone-700 pb-2">
                  <span className="text-stone-500">Upgrades Purchased</span>
                  <span className="font-bold">{purchasedUpgrades.length} / {UPGRADES.length}</span>
                </li>
                <li className="flex justify-between border-b border-stone-100 dark:border-stone-700 pb-2">
                  <span className="text-stone-500">Passive Income</span>
                  <span className="font-bold text-amber-600">{passiveCoins} Coins/s</span>
                </li>
                <li className="flex justify-between border-b border-stone-100 dark:border-stone-700 pb-2">
                  <span className="text-stone-500">Passive Devotion</span>
                  <span className="font-bold text-orange-600">{passiveDevotion} Devotion/s</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Actions & Shop */}
          <div className="lg:col-span-7 bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 flex flex-col overflow-hidden">
            
            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto border-b border-stone-200 dark:border-stone-700 p-2 gap-2 hide-scrollbar">
              {[
                { id: 'actions', label: 'Rituals', icon: Flame },
                { id: 'construction', label: 'Build', icon: Hammer },
                { id: 'worship', label: 'Worship', icon: Bell },
                { id: 'decoration', label: 'Decor', icon: Flag },
                { id: 'expansion', label: 'Expand', icon: Map },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' 
                      : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-stone-50 dark:bg-stone-800/50">
              
              {activeTab === 'actions' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Daily Aarti */}
                  <div className="bg-white dark:bg-stone-800 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/50 text-orange-600 rounded-xl">
                        <Flame size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Daily Aarti</h3>
                        <p className="text-xs text-stone-500">Perform aarti to gather devotees.</p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-stone-100 dark:border-stone-700">
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-stone-500">Reward:</span>
                        <span className="font-bold text-amber-600">+{50 * currentLevelInfo.level} Coins, +{20 * currentLevelInfo.level} Devotion</span>
                      </div>
                      <button 
                        onClick={performAarti}
                        disabled={Date.now() - lastAartiTime < 60000}
                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                      >
                        {Date.now() - lastAartiTime < 60000 ? 'Wait 1 min...' : 'Perform Aarti'}
                      </button>
                    </div>
                  </div>

                  {/* Arjitha Seva */}
                  <div className="bg-white dark:bg-stone-800 p-5 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/50 text-purple-600 rounded-xl">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Arjitha Seva</h3>
                        <p className="text-xs text-stone-500">Pay for special pujas and rituals.</p>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-stone-100 dark:border-stone-700">
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-stone-500">Cost:</span>
                        <span className="font-bold text-amber-600">{100 * currentLevelInfo.level} Coins</span>
                      </div>
                      <div className="flex justify-between text-sm mb-3">
                        <span className="text-stone-500">Reward:</span>
                        <span className="font-bold text-orange-600">+{50 * currentLevelInfo.level} Devotion</span>
                      </div>
                      <button 
                        onClick={performArjithaSeva}
                        disabled={coins < 100 * currentLevelInfo.level}
                        className="w-full py-3 bg-stone-800 dark:bg-stone-700 hover:bg-stone-900 dark:hover:bg-stone-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sponsor Seva
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'actions' && (
                <div className="grid grid-cols-1 gap-4">
                  {UPGRADES.filter(u => u.category === activeTab).map(upgrade => {
                    const isPurchased = purchasedUpgrades.includes(upgrade.id);
                    const canAfford = coins >= upgrade.cost && devotion >= upgrade.devotionCost;
                    const levelMet = currentLevelInfo.level >= upgrade.reqLevel;

                    return (
                      <div 
                        key={upgrade.id} 
                        className={`bg-white dark:bg-stone-800 p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row gap-4 items-start sm:items-center transition-all ${
                          isPurchased 
                            ? 'border-green-500/30 bg-green-50/30 dark:bg-green-900/10' 
                            : !levelMet 
                              ? 'border-stone-200 dark:border-stone-700 opacity-60 grayscale'
                              : 'border-stone-200 dark:border-stone-700 hover:border-amber-300'
                        }`}
                      >
                        <div className={`p-4 rounded-xl shrink-0 ${isPurchased ? 'bg-green-100 dark:bg-green-900/50 text-green-600' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'}`}>
                          <upgrade.icon size={28} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-lg">{upgrade.name}</h4>
                            {isPurchased && <CheckCircle2 size={16} className="text-green-500" />}
                            {!levelMet && <span className="text-xs font-bold bg-stone-200 dark:bg-stone-700 px-2 py-0.5 rounded text-stone-500 flex items-center gap-1"><Lock size={12}/> Lvl {upgrade.reqLevel}</span>}
                          </div>
                          <p className="text-sm text-stone-500 dark:text-stone-400 mb-2">{upgrade.description}</p>
                          <div className="flex flex-wrap gap-3 text-xs font-medium">
                            {upgrade.passiveCoins > 0 && (
                              <span className="text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">+{upgrade.passiveCoins} Coins/s</span>
                            )}
                            {upgrade.passiveDevotion > 0 && (
                              <span className="text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md">+{upgrade.passiveDevotion} Devotion/s</span>
                            )}
                          </div>
                        </div>

                        <div className="w-full sm:w-auto shrink-0 flex flex-col gap-2 mt-2 sm:mt-0">
                          {isPurchased ? (
                            <div className="px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold rounded-xl text-center border border-green-200 dark:border-green-800">
                              Purchased
                            </div>
                          ) : (
                            <button
                              onClick={() => buyUpgrade(upgrade)}
                              disabled={!canAfford || !levelMet}
                              className="px-6 py-3 bg-stone-900 dark:bg-stone-700 hover:bg-stone-800 dark:hover:bg-stone-600 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center min-w-[120px]"
                            >
                              <span>Buy</span>
                              <div className="flex items-center gap-2 text-xs font-normal opacity-90 mt-0.5">
                                {upgrade.cost > 0 && <span className="flex items-center gap-1"><Coins size={10}/> {upgrade.cost}</span>}
                                {upgrade.devotionCost > 0 && <span className="flex items-center gap-1"><Heart size={10}/> {upgrade.devotionCost}</span>}
                              </div>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
