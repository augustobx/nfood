"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ChevronDown, Plus, Minus, Search, Layers, Star, User, ReceiptText, Info, Gift } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { RouletteModal } from "@/components/RouletteModal";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// The Product Item Expandable Component
function ExpandableProductCard({ product, categoryProducts = [] }: { product: any, categoryProducts?: any[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { addItem } = useCartStore();

  const [quantity, setQuantity] = useState(1);
  const [removedIngredients, setRemovedIngredients] = useState<string[]>([]);
  const [addedExtras, setAddedExtras] = useState<any[]>([]);
  const [notes, setNotes] = useState("");
  const [secondHalf, setSecondHalf] = useState<any>(null);
  const [comboRemovedIngredients, setComboRemovedIngredients] = useState<Record<string, string[]>>({});

  const halfSiblings = categoryProducts.filter((p: any) => p.id !== product.id && p.allowHalf);

  const extrasTotal = addedExtras.reduce((sum, extra) => sum + extra.price, 0);
  let basePrice = product.basePrice;
  if (product.allowHalf && secondHalf) {
    basePrice = (product.basePrice / 2) + (secondHalf.basePrice / 2);
  }
  const unitPrice = basePrice + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const resetForm = () => {
    setQuantity(1);
    setRemovedIngredients([]);
    setAddedExtras([]);
    setNotes("");
    setSecondHalf(null);
    setComboRemovedIngredients({});
    setIsExpanded(false);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.allowHalf && !product.onlyHalf && !secondHalf) {
      toast.error("Seleccioná la otra mitad");
      return;
    }
    addItem({
      product: product,
      quantity,
      removedIngredients,
      addedExtras,
      unitPrice,
      notes,
      isHalfAndHalf: !!secondHalf,
      secondHalfProduct: secondHalf,
      comboRemovedIngredients
    });
    toast.success("¡Agregado al carrito!", {
      description: `${quantity}x ${product.name}`,
    });
    resetForm();
  };

  const handleToggleExpand = () => {
    if(!isExpanded) setIsExpanded(true);
    else resetForm();
  }

  // Animation variants
  const expandVariants = {
    hidden: { height: 0, opacity: 0, overflow: 'hidden' },
    visible: { height: 'auto', opacity: 1, overflow: 'visible', transition: { duration: 0.3, ease: 'easeOut' } }
  };

  return (
    <div className={`overflow-hidden transition-all duration-300 border-b last:border-0 ${isExpanded ? 'bg-slate-50 border-orange-200' : 'bg-white hover:bg-slate-50'}`}>
      {/* Closed Header (Preview) */}
      <div 
        className="p-4 flex gap-4 cursor-pointer relative items-center"
        onClick={handleToggleExpand}
      >
        <div className={`w-24 h-24 relative rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden transition-all ${isExpanded ? 'shadow-md ring-2 ring-orange-500 ring-offset-2' : ''} ${product.isCombo ? 'bg-purple-100' : 'bg-orange-100'}`}>
           {product.imageUrl && product.showImage ? (
             <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="96px" />
           ) : (
             <ShoppingBag className={`w-8 h-8 ${product.isCombo ? 'text-purple-300' : 'text-orange-300'}`} />
           )}
           {product.onlyHalf && <span className="absolute bottom-0 w-full text-center bg-black/60 text-white text-[10px] font-bold py-0.5">MEDIAS</span>}
        </div>
        <div className="flex-1 flex flex-col justify-center">
           <h3 className="font-bold text-lg leading-tight text-slate-800">{product.name}</h3>
           {!isExpanded && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{product.description || "Toca para personalizar."}</p>}
           <span className={`font-bold mt-1.5 inline-flex items-center gap-2 ${product.isCombo ? 'text-purple-700' : 'text-orange-600'}`}>
             ${product.basePrice.toLocaleString('es-AR')} 
             {product.allowHalf && <span className="text-[10px] uppercase bg-slate-100 text-slate-500 px-1 rounded">Mitades disp.</span>}
             {product.points > 0 && <span className="text-[10px] font-black bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded flex items-center gap-1"><Star className="w-3 h-3 fill-current"/> +{product.points} Pts</span>}
           </span>
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center bg-white shadow-sm text-slate-400">
           <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
             <ChevronDown className="w-5 h-5"/>
           </motion.div>
        </div>
      </div>

      {/* Expanded Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial="hidden" 
            animate="visible" 
            exit="hidden" 
            variants={expandVariants}
          >
            <div className="px-4 pb-6 pt-2 space-y-6">
              <p className="text-sm text-slate-600 bg-white p-3 border rounded-xl shadow-sm">{product.description || "Añade a tu pedido directamente desde aquí."}</p>
              
              {/* Halves Selector */}
              {product.allowHalf && !product.onlyHalf && (
                 <div className="space-y-3">
                    <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Elegí la otra mitad</h4>
                    <div className="grid grid-cols-2 gap-2">
                       {halfSiblings.map((sibling:any) => (
                         <div 
                           key={sibling.id} 
                           className={`p-2 border rounded-xl text-center cursor-pointer transition-all ${secondHalf?.id === sibling.id ? 'border-orange-500 bg-orange-100 ring-2 ring-orange-500/50' : 'bg-white hover:bg-slate-50'}`}
                           onClick={() => setSecondHalf(sibling)}
                         >
                           <span className="block text-xs font-bold truncate">{sibling.name}</span>
                           <span className="block text-[10px] text-muted-foreground">+${(sibling.basePrice/2).toLocaleString('es-AR')}</span>
                         </div>
                       ))}
                    </div>
                 </div>
              )}

              {/* Ingredients Config (Not Combos) */}
              {!product.isCombo && product.ingredients?.length > 0 && (
                <div className="space-y-3">
                   <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Ingredientes </h4>
                   <div className="grid gap-2 bg-white p-3 border rounded-xl">
                      {product.ingredients.map((pi:any) => (
                        <div key={pi.ingredient.id} className="flex items-center space-x-3">
                          <Checkbox 
                            id={`ing-${product.id}-${pi.ingredient.id}`}
                            defaultChecked={true}
                            disabled={!pi.isRemovable}
                            className={!pi.isRemovable ? 'opacity-50' : 'data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500'}
                            onCheckedChange={(c) => {
                               if(!c) setRemovedIngredients(v => [...v, pi.ingredient.id]);
                               else setRemovedIngredients(v => v.filter(x => x !== pi.ingredient.id));
                            }}
                          />
                          <Label htmlFor={`ing-${product.id}-${pi.ingredient.id}`} className="text-sm cursor-pointer flex-1 py-1">
                             {pi.ingredient.name}
                          </Label>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {/* Combo Personalization */}
              {product.isCombo && product.comboItemsConfig?.length > 0 && (
                 <div className="space-y-3">
                    <h4 className="font-bold text-sm text-purple-800 uppercase tracking-tight">Personalizar por dentro</h4>
                    {product.comboItemsConfig.map((ci:any) => {
                      if (!ci.product.ingredients?.length) return null;
                      return (
                         <div key={ci.id} className="bg-white p-3 border-l-4 border-purple-400 rounded-lg shadow-sm">
                           <span className="font-bold text-xs uppercase text-slate-500 block mb-2">{ci.product.name} (x{ci.quantity})</span>
                           <div className="grid gap-2 pl-1">
                             {ci.product.ingredients.map((pi:any) => (
                               <div key={pi.ingredient.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                     id={`cing-${ci.id}-${pi.ingredient.id}`}
                                     defaultChecked={true}
                                     disabled={!pi.isRemovable}
                                     className="w-4 h-4 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                     onCheckedChange={(c) => {
                                        setComboRemovedIngredients(prev => {
                                          const arr = prev[ci.id] || [];
                                          if(!c) return {...prev, [ci.id]: [...arr, pi.ingredient.id]};
                                          return {...prev, [ci.id]: arr.filter(x => x !== pi.ingredient.id)};
                                        })
                                     }}
                                  />
                                  <Label htmlFor={`cing-${ci.id}-${pi.ingredient.id}`} className="text-xs cursor-pointer"><span className="text-muted-foreground mr-1">Con</span>{pi.ingredient.name}</Label>
                               </div>
                             ))}
                           </div>
                         </div>
                      )
                    })}
                 </div>
              )}

              {/* Extras */}
              {product.extras?.length > 0 && (
                <div className="space-y-3">
                   <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight">Agregale Extras</h4>
                   <div className="grid gap-2 bg-white p-3 border rounded-xl shadow-sm">
                      {product.extras.map((pe:any) => {
                        const isAdded = addedExtras.some(e => e.id === pe.extra.id);
                        return (
                        <div key={pe.extra.id} className="flex items-center space-x-3">
                          <Checkbox 
                            id={`ext-${product.id}-${pe.extra.id}`}
                            checked={isAdded}
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            onCheckedChange={(c) => {
                               if(c) setAddedExtras(v => [...v, pe.extra]);
                               else setAddedExtras(v => v.filter(x => x.id !== pe.extra.id));
                            }}
                          />
                          <Label htmlFor={`ext-${product.id}-${pe.extra.id}`} className="text-sm cursor-pointer flex-1 py-1 flex justify-between">
                             <span>{pe.extra.name}</span>
                             <span className="text-green-600 font-bold">+${pe.extra.price}</span>
                          </Label>
                        </div>
                      )})}
                   </div>
                </div>
              )}

              <div className="pt-2">
                 <Textarea 
                   placeholder="Aclaraciones para la cocina (sin sal, bien cocido, etc)..." 
                   value={notes} onChange={e=>setNotes(e.target.value)}
                   className="bg-white border-dashed text-sm"
                 />
              </div>

              {/* Checkout Strip */}
              <div className="flex items-center gap-3 pt-2">
                 <div className="flex items-center gap-2 bg-white border shadow-sm rounded-full p-1 border-slate-200">
                    <button onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1))}} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600">-</button>
                    <span className="w-4 text-center font-bold text-lg">{quantity}</span>
                    <button onClick={(e) => { e.stopPropagation(); setQuantity(quantity + 1)}} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600">+</button>
                 </div>
                 
                 <Button 
                   onClick={handleAddToCart}
                   className={`flex-1 h-14 rounded-full shadow-lg text-lg font-bold ${product.isCombo ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30'}`}
                 >
                    Agregar • ${(totalPrice).toLocaleString('es-AR')}
                 </Button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StorefrontClient({ categories, combos, loggedClient, config, prizes = [] }: { categories: any[], combos: any[], loggedClient?: any, config?: any, prizes?: any[] }) {
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { items, getTotal, dailyPrize, setDailyPrize } = useCartStore();
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(loggedClient?.points || 0);

  useEffect(() => {
    if (loggedClient) setCurrentPoints(loggedClient.points);
  }, [loggedClient]);

  const handleRouletteWin = (prize: any) => {
     setDailyPrize(prize);
  };

  const handleToggleCategory = (id: string | null) => {
    // If strict accordion mode:
    if (openCategoryId === id) setOpenCategoryId(null);
    else setOpenCategoryId(id);
  };

  const hasItems = items.length > 0;
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!loggedClient && !sessionStorage.getItem("nfood_auth_dismissed")) {
       setIsAuthModalOpen(true);
    }
  }, [loggedClient]);

  const [showSplash, setShowSplash] = useState(config?.splashEnabled);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (config?.splashEnabled) {
      if (sessionStorage.getItem("nfood_splash_done") === "true") {
         setShowSplash(false);
         return;
      }
      const timer = setTimeout(() => {
          setShowSplash(false);
          sessionStorage.setItem("nfood_splash_done", "true");
      }, (config.splashDuration || 3) * 1000);
      return () => clearTimeout(timer);
    } else {
      setShowSplash(false);
    }
  }, [config]);

  useEffect(() => {
    if (config?.welcomeBalloonEnabled && !showSplash) {
       setShowWelcome(false); // Reset just in case
       const t1 = setTimeout(() => setShowWelcome(true), 1000);
       const t2 = setTimeout(() => { setShowWelcome(false); }, ((config.welcomeBalloonDuration || 5) * 1000) + 1000);
       return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [config?.welcomeBalloonEnabled, config?.welcomeBalloonDuration, showSplash]);

  const handleCloseAuth = () => {
    sessionStorage.setItem("nfood_auth_dismissed", "true");
    setIsAuthModalOpen(false);
  };
  
  // Flatten products for search
  const allProds = [
    ...combos,
    ...categories.flatMap(c => c.products)
  ];
  
  const searchResults = searchTerm.length > 2 
    ? allProds.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const customStyles = {
    '--brand-primary': config?.primaryColor || '#f97316',
    '--brand-secondary': config?.secondaryColor || '#9333ea',
  } as React.CSSProperties;

  if (showSplash) {
    return (
       <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center text-white p-4 text-center transition-opacity duration-500" style={{ backgroundColor: config?.primaryColor || '#f97316', ...customStyles }}>
          {config?.logoUrl ? <img src={config.logoUrl} className="w-32 h-32 object-contain animate-pulse mb-6" /> : <div className="text-6xl mb-6 animate-bounce">🍕</div>}
          <h1 className="text-4xl font-black">{config?.appName || 'nfood'}</h1>
          <div className="mt-8 w-24 h-1.5 bg-white/30 rounded-full overflow-hidden">
             <motion.div initial={{width:0}} animate={{width:'100%'}} transition={{duration: config.splashDuration || 3}} className="h-full bg-white rounded-full"></motion.div>
          </div>
       </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-32" style={customStyles}>
      
      {/* Header Banner */}
      <div className="bg-brand-primary pb-12 pt-12 px-4 rounded-b-[40px] shadow-sm mb-[-20px] relative z-0 border-b-4" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
         
         <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
           {loggedClient ? (
             <div className="flex gap-2">
               <Link href="/profile">
                 <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 hover:bg-white/30 transition-colors cursor-pointer border border-white/20">
                   <ReceiptText className="w-4 h-4 text-white" />
                   <span className="text-white font-bold text-sm tracking-tight hidden md:inline">Ver Pedidos</span>
                 </div>
               </Link>
               <Link href="/profile">
                 <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 hover:bg-white/30 transition-colors cursor-pointer border border-white/20">
                   <Star className="w-4 h-4 text-yellow-300 fill-current" />
                   <span className="text-white font-bold text-sm tracking-tight">{currentPoints} Pts</span>
                 </div>
               </Link>
             </div>
           ) : (
             <button onClick={() => setIsAuthModalOpen(true)} className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 hover:bg-white/30 transition-colors border border-white/20 shadow-sm">
                 <User className="w-4 h-4 text-white" />
                 <span className="text-white font-bold text-sm tracking-tight">Ingresar o Registrarse</span>
             </button>
           )}
         </div>

         <div className="max-w-2xl mx-auto flex flex-col items-center text-center mt-2 relative z-10">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2 drop-shadow-md">{config?.appName || 'nfood'}</h1>
            <p className="text-white opacity-90 font-medium md:text-lg max-w-sm drop-shadow-sm">
                Hola {loggedClient?.name ? loggedClient.name.split(' ')[0] : 'comensal'}, ¿qué vas a pedir hoy?
            </p>
         </div>
      </div>

      <div className="max-w-xl mx-auto px-4 relative z-10 space-y-6 mt-6">
        
        {config?.globalDiscount > 0 && (
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-2xl p-4 shadow-lg flex items-center justify-center gap-2 border-2 border-white">
            <Star className="w-6 h-6 text-yellow-300 fill-current animate-pulse" />
            <span className="font-black text-lg tracking-tight">¡Hoy tenés {config.globalDiscount}% OFF en toda la tienda!</span>
          </div>
        )}
        
        {/* Search Bar */}
        <div className="bg-white p-2 border shadow-lg shadow-orange-500/5 rounded-2xl flex items-center gap-2 sticky top-4 z-40">
           <Search className="w-5 h-5 text-muted-foreground ml-2" />
           <Input 
             placeholder="Buscar productos o combos..." 
             className="border-0 shadow-none focus-visible:ring-0 px-2 h-10 text-base"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
           {searchTerm && <Button variant="ghost" size="sm" onClick={() => setSearchTerm("")}>x</Button>}
        </div>

        {/* Searching mode */}
        {searchTerm.length > 2 ? (
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
             <div className="p-4 border-b bg-slate-50/50">
               <h3 className="font-black text-lg text-slate-800">Resultados para "{searchTerm}"</h3>
             </div>
             {searchResults.length > 0 ? (
               searchResults.map(p => <ExpandableProductCard key={p.id} product={p} categoryProducts={categories.find(c => c.id === p.categoryId)?.products || []}/>)
             ) : (
               <div className="p-8 text-center text-muted-foreground">No encontramos nada con ese nombre.</div>
             )}
          </div>
        ) : (
          /* Normal Accordion Mode */
          <div className="space-y-4">
            
            {/* Combos Accordion */}
            {combos.length > 0 && (
              <motion.div layout className="bg-white rounded-3xl shadow-sm border overflow-hidden border-purple-200" transition={{duration:0.3}}>
                 <button 
                   onClick={() => handleToggleCategory('combos')} 
                   className="w-full p-5 flex items-center justify-between text-left focus:outline-none focus-visible:bg-slate-50 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                         <Layers className="w-6 h-6 text-purple-600" />
                       </div>
                       <div>
                         <h2 className="text-xl font-black text-slate-800 tracking-tight">Promos y Combos</h2>
                         <p className="text-sm text-purple-600 font-medium">{combos.length} opciones increíbles</p>
                       </div>
                    </div>
                    <motion.div animate={{ rotate: openCategoryId === 'combos' ? 180 : 0 }}>
                      <ChevronDown className="w-6 h-6 text-slate-400" />
                    </motion.div>
                 </button>

                 <AnimatePresence>
                   {openCategoryId === 'combos' && (
                     <motion.div 
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 'auto', opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       transition={{ duration: 0.3 }}
                       className="border-t"
                     >
                       {combos.map(product => (
                         <ExpandableProductCard key={product.id} product={product} />
                       ))}
                     </motion.div>
                   )}
                 </AnimatePresence>
              </motion.div>
            )}

            {/* Standard Categories */}
            {categories.filter(c => c.products?.length > 0).map(category => (
               <motion.div layout key={category.id} className="bg-white rounded-3xl shadow-sm border overflow-hidden" transition={{duration:0.3}}>
                 <button 
                   onClick={() => handleToggleCategory(category.id)} 
                   className="w-full p-5 flex items-center justify-between text-left focus:outline-none focus-visible:bg-slate-50 transition-colors"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                         <span className="font-bold font-mono text-lg text-orange-600">{category.name.charAt(0)}</span>
                       </div>
                       <div>
                         <h2 className="text-xl font-black text-slate-800 tracking-tight">{category.name}</h2>
                         <p className="text-sm text-slate-500 font-medium">{category.products.length} productos</p>
                       </div>
                    </div>
                    <motion.div animate={{ rotate: openCategoryId === category.id ? 180 : 0 }}>
                      <ChevronDown className="w-6 h-6 text-slate-400" />
                    </motion.div>
                 </button>

                 <AnimatePresence>
                   {openCategoryId === category.id && (
                     <motion.div 
                       initial={{ height: 0, opacity: 0 }}
                       animate={{ height: 'auto', opacity: 1 }}
                       exit={{ height: 0, opacity: 0 }}
                       transition={{ duration: 0.3 }}
                       className="border-t"
                     >
                       {category.products.map((product:any) => (
                         <ExpandableProductCard key={product.id} product={product} categoryProducts={category.products} />
                       ))}
                     </motion.div>
                   )}
                 </AnimatePresence>
               </motion.div>
            ))}

          </div>
        )}
      </div>

      {/* Floating Sticky Cart Button */}
      <AnimatePresence>
        {hasItems && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 w-full p-4 md:p-6 z-50 pointer-events-none"
          >
             <div className="max-w-xl mx-auto pointer-events-auto">
               <Link href="/cart">
                 <Button className="w-full h-16 rounded-[2rem] bg-brand-primary hover:bg-black text-white shadow-2xl flex items-center justify-between px-6 text-lg group">
                   <div className="flex items-center gap-3">
                     <div className="relative">
                        <ShoppingBag className="w-6 h-6 text-white" />
                        <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">{items.reduce((acc, i)=>acc+i.quantity,0)}</span>
                     </div>
                     <span className="font-bold tracking-tight">Ver Carrito</span>
                   </div>
                   <span className="font-black text-white">
                     ${(() => {
                        let base = getTotal();
                        let disc = base * (1 - (config?.globalDiscount || 0)/100);
                        if (dailyPrize?.type === "PERCENT") disc -= disc * (dailyPrize.value/100);
                        if (dailyPrize?.type === "AMOUNT") disc = Math.max(0, disc - dailyPrize.value);
                        return disc;
                     })().toLocaleString('es-AR')}
                   </span>
                 </Button>
               </Link>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWelcome && (
           <motion.div
             initial={{ opacity: 0, y: 50, scale: 0.9 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 50, scale: 0.9 }}
             className="fixed bottom-32 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 z-[100] max-w-sm w-[calc(100%-2rem)]"
           >
             <div className="bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-start gap-4 border border-slate-700">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="flex-1 pt-1">
                   <p className="font-semibold text-sm leading-tight text-white">{config?.welcomeBalloonText}</p>
                </div>
                <button onClick={() => setShowWelcome(false)} className="text-slate-500 hover:text-white pt-1">✕</button>
             </div>
           </motion.div>
        )}
      </AnimatePresence>

      {config?.isRouletteActive && prizes.length > 0 && !showSplash && (
         <div className="fixed bottom-[110px] right-6 z-[90]">
           <motion.div
             animate={{ y: [0, -10, 0] }}
             transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
           >
             <button 
               onClick={() => {
                   if (!loggedClient) {
                       toast.error("Iniciá sesión para jugar");
                       setIsAuthModalOpen(true);
                       return;
                   }
                   setIsRouletteOpen(true);
               }} 
               className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-[0_0_20px_rgba(249,115,22,0.6)] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border-[3px] border-white focus:outline-none"
             >
                <Gift className="w-8 h-8 animate-pulse drop-shadow-md" />
             </button>
           </motion.div>
         </div>
      )}

      <RouletteModal 
        isOpen={isRouletteOpen} 
        onClose={() => setIsRouletteOpen(false)} 
        prizes={prizes} 
        onWin={handleRouletteWin} 
        cost={config?.rouletteCost || 0}
        clientId={loggedClient?.id}
        currentPoints={currentPoints}
        onPointsUpdate={setCurrentPoints}
      />

      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuth} />
    </div>
  );
}
