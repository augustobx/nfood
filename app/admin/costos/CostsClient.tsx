"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ReceiptText, PackageOpen } from "lucide-react";
import { registerExpense, createSupply, deleteSupply, createProduction, deleteProduction } from "@/app/actions/admin-costs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CostsClient({ initialSupplies, initialProductions }: { initialSupplies: any[], initialProductions: any[] }) {
  const [supplies, setSupplies] = useState(initialSupplies);
  const [productions, setProductions] = useState(initialProductions);

  // States for Supply
  const [supplyForm, setSupplyForm] = useState({ name: "", purchaseUnit: "Kg", purchasePrice: "", purchaseQuantity: "1", wastePercentage: "0" });
  
  // States for Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState({ amount: "", quantity: "" });

  // States for Production
  const [prodForm, setProdForm] = useState({ name: "", yieldUnits: "1" });
  const [prodItems, setProdItems] = useState<{supplyId: string, quantityUsed: number}[]>([]);

  const handleAddSupply = async () => {
    if(!supplyForm.name) return toast.error("Nombre requerido");
    try {
      const data = {
        name: supplyForm.name,
        purchaseUnit: supplyForm.purchaseUnit,
        purchasePrice: Number(supplyForm.purchasePrice) || 0,
        purchaseQuantity: Number(supplyForm.purchaseQuantity) || 1,
        wastePercentage: Number(supplyForm.wastePercentage) || 0,
      };
      await createSupply(data);
      toast.success("Insumo creado");
      window.location.reload();
    } catch(e) {
      toast.error("Error al crear");
    }
  };

  const handleAddProduction = async () => {
    if(!prodForm.name) return toast.error("Nombre requerido");
    if(prodItems.length === 0) return toast.error("Agrega ingredientes");
    try {
      const data = {
         name: prodForm.name,
         yieldUnits: Number(prodForm.yieldUnits) || 1,
         items: prodItems
      };
      await createProduction(data);
      toast.success("Preparación creada");
      window.location.reload();
    } catch(e) {
      toast.error("Error al crear");
    }
  };

  const handleRegisterExpense = async () => {
    if(!showExpenseModal) return;
    try {
      await registerExpense({
        supplyId: showExpenseModal,
        amount: Number(expenseForm.amount),
        quantity: Number(expenseForm.quantity)
      });
      toast.success("Gasto registrado y stock actualizado");
      setShowExpenseModal(null);
      window.location.reload(); // Quick refresh to update tables
    } catch(e) {
      toast.error("Error al registrar gasto");
    }
  };

  const delSupply = async (id:string) => {
    if(confirm('¿Eliminar insumo?')) {
      await deleteSupply(id);
      window.location.reload();
    }
  };

  const delProd = async (id:string) => {
     if(confirm('¿Eliminar preparación?')) {
      await deleteProduction(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
       <Tabs defaultValue="insumos" className="w-full">
         <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
           <TabsTrigger value="insumos">Insumos (Bodega)</TabsTrigger>
           <TabsTrigger value="produccion">Preparaciones</TabsTrigger>
         </TabsList>
         
         <TabsContent value="insumos" className="space-y-6 mt-4">
            {/* Form */}
            <Card>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-6 gap-4">
                 <div className="space-y-1 col-span-2">
                   <Label>Nombre del Insumo</Label>
                   <Input value={supplyForm.name} onChange={e=>setSupplyForm({...supplyForm, name: e.target.value})} placeholder="Ej: Carne Picada Especial" />
                 </div>
                 <div className="space-y-1">
                   <Label>Unidad</Label>
                   <Input value={supplyForm.purchaseUnit} onChange={e=>setSupplyForm({...supplyForm, purchaseUnit: e.target.value})} placeholder="Kg, Litro, Unid..." />
                 </div>
                 <div className="space-y-1">
                   <Label>Precio ($)</Label>
                   <Input type="number" value={supplyForm.purchasePrice} onChange={e=>setSupplyForm({...supplyForm, purchasePrice: e.target.value})} placeholder="Ej: 5000" />
                 </div>
                 <div className="space-y-1">
                   <Label>x Cantidad (Unidades)</Label>
                   <Input type="number" value={supplyForm.purchaseQuantity} onChange={e=>setSupplyForm({...supplyForm, purchaseQuantity: e.target.value})} />
                 </div>
                 <div className="space-y-1">
                   <Label>Merma (%)</Label>
                   <Input type="number" value={supplyForm.wastePercentage} onChange={e=>setSupplyForm({...supplyForm, wastePercentage: e.target.value})} />
                 </div>
                 <div className="col-span-1 md:col-span-6 flex justify-end">
                   <Button onClick={handleAddSupply}><Plus className="w-4 h-4 mr-2"/> Cargar Insumo</Button>
                 </div>
              </CardContent>
            </Card>

            {/* List */}
            <div className="border rounded-md">
              <table className="w-full text-sm text-left">
                 <thead className="bg-slate-100 uppercase text-slate-500 font-semibold text-xs border-b">
                   <tr>
                     <th className="px-4 py-3">Insumo</th>
                     <th className="px-4 py-3">Unidad Compra</th>
                     <th className="px-4 py-3">Factor Costo (Merma)</th>
                     <th className="px-4 py-3">Costo Base / Unidad</th>
                     <th className="px-4 py-3 text-right">Acciones</th>
                   </tr>
                 </thead>
                 <tbody>
                    {supplies.map(s => {
                      const netCost = (s.purchasePrice / s.purchaseQuantity) / (1 - (s.wastePercentage / 100));
                      return (
                        <tr key={s.id} className="border-b bg-white hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold">{s.name}</td>
                          <td className="px-4 py-3">{s.purchaseQuantity} {s.purchaseUnit} a ${s.purchasePrice.toLocaleString('es-AR')}</td>
                          <td className="px-4 py-3">-{s.wastePercentage}%</td>
                          <td className="px-4 py-3 text-orange-600 font-bold">${netCost.toLocaleString('es-AR', {maximumFractionDigits:2})}</td>
                          <td className="px-4 py-3 flex gap-2 justify-end">
                            <Button variant="outline" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200" onClick={() => setShowExpenseModal(s.id)}>
                               <ReceiptText className="w-3 h-3 mr-1"/> Comprar
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => delSupply(s.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                 </tbody>
              </table>
            </div>
         </TabsContent>

         <TabsContent value="produccion" className="space-y-6 mt-4">
            <Card>
              <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="space-y-1 col-span-2">
                   <Label>Nombre de Preparación</Label>
                   <Input value={prodForm.name} onChange={e=>setProdForm({...prodForm, name: e.target.value})} placeholder="Ej: Medallón de Hamburguesa" />
                 </div>
                 <div className="space-y-1">
                   <Label>Rinde / Unidades Finales</Label>
                   <Input type="number" value={prodForm.yieldUnits} onChange={e=>setProdForm({...prodForm, yieldUnits: e.target.value})} />
                 </div>
                 <div className="col-span-1 flex items-end">
                   <Button onClick={handleAddProduction} className="w-full"><PackageOpen className="w-4 h-4 mr-2"/> Guardar Preparación</Button>
                 </div>

                 {/* Ingredient picker */}
                 <div className="col-span-1 md:col-span-4 bg-slate-50 p-4 rounded-xl border mt-2 space-y-4">
                    <h4 className="font-bold text-sm">Desgaste de Insumos</h4>
                    <div className="flex gap-2">
                       <select id="s-picker" className="h-10 border rounded px-3 text-sm flex-1">
                         <option value="">Selecciona insumo...</option>
                         {supplies.map(s => <option key={s.id} value={s.id}>{s.name} ({s.purchaseUnit})</option>)}
                       </select>
                       <Input id="q-picker" type="number" className="w-32" placeholder="Cantidad" />
                       <Button type="button" onClick={() => {
                          const sid = (document.getElementById('s-picker') as HTMLSelectElement).value;
                          const sq = (document.getElementById('q-picker') as HTMLInputElement).value;
                          if(sid && sq) {
                             if(!prodItems.find(x => x.supplyId === sid)) {
                               setProdItems([...prodItems, { supplyId: sid, quantityUsed: Number(sq) }]);
                             }
                          }
                       }} variant="secondary">Add</Button>
                    </div>
                    {prodItems.length > 0 && (
                      <ul className="text-sm space-y-1">
                        {prodItems.map((pi, idx) => {
                          const sname = supplies.find(x => x.id === pi.supplyId)?.name;
                          return (
                            <li key={idx} className="flex justify-between border-b pb-1">
                              <span>{sname}</span>
                              <div className="flex gap-4">
                                <span className="font-bold">{pi.quantityUsed} uds</span>
                                <button onClick={()=>setProdItems(prodItems.filter(x => x.supplyId !== pi.supplyId))} className="text-red-500">x</button>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                 </div>
              </CardContent>
            </Card>

            <div className="border rounded-md">
              <table className="w-full text-sm text-left">
                 <thead className="bg-slate-100 uppercase text-slate-500 font-semibold text-xs border-b">
                   <tr>
                     <th className="px-4 py-3">Preparación</th>
                     <th className="px-4 py-3">Insumos Utilizados</th>
                     <th className="px-4 py-3">Rinde Total</th>
                     <th className="px-4 py-3 text-right">Acciones</th>
                   </tr>
                 </thead>
                 <tbody>
                    {productions.map((p:any) => (
                      <tr key={p.id} className="border-b bg-white hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-purple-700">{p.name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                           {p.items.map((i:any) => `${i.supply.name} (${i.quantityUsed})`).join(', ')}
                        </td>
                        <td className="px-4 py-3 font-bold">{p.yieldUnits} uds</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => delProd(p.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
            </div>

         </TabsContent>
       </Tabs>

       {/* Expense Modal */}
       {showExpenseModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl relative">
               <h3 className="text-xl font-bold mb-4">Registrar Compra / Factura</h3>
               <div className="space-y-4">
                  <div className="space-y-1">
                    <Label>Monto Total Facturado ($)</Label>
                    <Input type="number" placeholder="Ej: 15000" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm, amount: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label>Cantidad física ingresada (unidades de compra)</Label>
                    <Input type="number" placeholder="Ej: 1" value={expenseForm.quantity} onChange={e=>setExpenseForm({...expenseForm, quantity: e.target.value})} />
                  </div>
                  <div className="pt-4 flex gap-2">
                     <Button variant="outline" className="flex-1" onClick={() => setShowExpenseModal(null)}>Cancelar</Button>
                     <Button className="flex-1" onClick={handleRegisterExpense}>Guardar Factura</Button>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
