"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, ReceiptText, PackageOpen, Info, AlertTriangle, ChefHat } from "lucide-react";
import { registerExpense, createSupply, deleteSupply, createProduction, deleteProduction } from "@/app/actions/admin-costs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function CostsClient({ initialSupplies, initialProductions }: { initialSupplies: any[], initialProductions: any[] }) {
  const [supplies, setSupplies] = useState(initialSupplies);
  const [productions, setProductions] = useState(initialProductions);

  // States for Supply
  const [supplyForm, setSupplyForm] = useState({ name: "", purchaseUnit: "", purchasePrice: "", purchaseQuantity: "", wastePercentage: "0" });

  // States for Expense Modal
  const [showExpenseModal, setShowExpenseModal] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState({ amount: "", quantity: "" });

  // States for Production
  const [prodForm, setProdForm] = useState({ name: "", yieldUnits: "1" });
  const [prodItems, setProdItems] = useState<{ supplyId: string, quantityUsed: number }[]>([]);

  const handleAddSupply = async () => {
    if (!supplyForm.name) return toast.error("Por favor, ingresá un nombre para el insumo.");
    if (!supplyForm.purchaseUnit) return toast.error("La unidad de compra es obligatoria.");
    if (!supplyForm.purchasePrice || !supplyForm.purchaseQuantity) return toast.error("Completá el precio y cantidad base.");

    try {
      const data = {
        name: supplyForm.name,
        purchaseUnit: supplyForm.purchaseUnit,
        purchasePrice: Number(supplyForm.purchasePrice) || 0,
        purchaseQuantity: Number(supplyForm.purchaseQuantity) || 1,
        wastePercentage: Number(supplyForm.wastePercentage) || 0,
      };
      await createSupply(data);
      toast.success("¡Insumo creado correctamente!");
      window.location.reload();
    } catch (e) {
      toast.error("Hubo un error al guardar el insumo.");
    }
  };

  const handleAddProduction = async () => {
    if (!prodForm.name) return toast.error("Por favor, dale un nombre a la preparación.");
    if (prodItems.length === 0) return toast.error("Debés agregar al menos un insumo a la receta.");
    try {
      const data = {
        name: prodForm.name,
        yieldUnits: Number(prodForm.yieldUnits) || 1,
        items: prodItems
      };
      await createProduction(data);
      toast.success("¡Preparación guardada!");
      window.location.reload();
    } catch (e) {
      toast.error("Hubo un error al guardar la preparación.");
    }
  };

  const handleRegisterExpense = async () => {
    if (!showExpenseModal) return;
    if (!expenseForm.amount || !expenseForm.quantity) return toast.error("Completá monto y cantidad.");
    try {
      await registerExpense({
        supplyId: showExpenseModal,
        amount: Number(expenseForm.amount),
        quantity: Number(expenseForm.quantity)
      });
      toast.success("¡Gasto registrado exitosamente!");
      setShowExpenseModal(null);
      window.location.reload();
    } catch (e) {
      toast.error("Error al registrar la factura.");
    }
  };

  const delSupply = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este insumo? Las recetas que lo usen podrían fallar.')) {
      await deleteSupply(id);
      window.location.reload();
    }
  };

  const delProd = async (id: string) => {
    if (confirm('¿Eliminar esta preparación?')) {
      await deleteProduction(id);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Bodega y Recetas</h1>
        <p className="text-muted-foreground text-lg">Administrá tus compras y controlá el costo real de tus platos.</p>
      </div>

      <Tabs defaultValue="insumos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="insumos" className="rounded-lg text-base data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">1. Insumos Base</TabsTrigger>
          <TabsTrigger value="produccion" className="rounded-lg text-base data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">2. Preparaciones</TabsTrigger>
        </TabsList>

        {/* PESTAÑA 1: INSUMOS (MATERIA PRIMA) */}
        <TabsContent value="insumos" className="space-y-8 mt-6 animate-in fade-in">

          {/* Tarjeta de Carga de Insumo Explicada */}
          <Card className="border-2 border-orange-100 shadow-sm overflow-hidden">
            <div className="bg-orange-50/50 border-b border-orange-100 px-6 py-4 flex items-start gap-4">
              <div className="bg-orange-100 p-3 rounded-full text-orange-600 mt-1">
                <PackageOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-orange-900">Dar de alta un nuevo Insumo</h3>
                <p className="text-sm text-orange-800/70 leading-relaxed max-w-2xl">
                  El insumo es la <strong>materia prima tal cual la comprás al proveedor</strong> (ej. Bolsa de Papas, Horma de Queso, Cajón de Pan). Aquí definís cómo lo comprás habitualmente para calcular su costo base.
                </p>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <Label className="text-base font-bold text-slate-800">1. ¿Qué estás comprando?</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div className="space-y-2">
                      <Label className="text-slate-500">Nombre descriptivo</Label>
                      <Input
                        value={supplyForm.name}
                        onChange={e => setSupplyForm({ ...supplyForm, name: e.target.value })}
                        placeholder="Ej: Queso Cheddar (Horma)"
                        className="bg-white border-slate-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-500 flex items-center gap-1">
                        Unidad de medida
                        <span title="Cómo lo vas a pesar/contar al usarlo en la cocina.">
                          <Info className="w-3 h-3 text-blue-500 cursor-help" />
                        </span>
                      </Label>
                      <Input
                        value={supplyForm.purchaseUnit}
                        onChange={e => setSupplyForm({ ...supplyForm, purchaseUnit: e.target.value })}
                        placeholder="Ej: Kg, Litros, Unidades, Gramos"
                        className="bg-white border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <Label className="text-base font-bold text-slate-800">2. ¿Cuánto te cuesta normalmente?</Label>
                  <p className="text-xs text-slate-500 mb-4">Esta información sirve para establecer el costo teórico antes de registrar facturas reales.</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                    <div className="space-y-2">
                      <Label className="text-slate-500">Precio promedio ($)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500 font-bold">$</span>
                        <Input
                          type="number"
                          min="0"
                          value={supplyForm.purchasePrice}
                          onChange={e => setSupplyForm({ ...supplyForm, purchasePrice: e.target.value })}
                          placeholder="Ej: 8500"
                          className="bg-white pl-8 border-slate-300"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center pt-8 text-slate-400 font-bold hidden md:flex">
                      RINDE PARA 👉
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-500">Cantidad que trae ese precio</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0" step="0.01"
                          value={supplyForm.purchaseQuantity}
                          onChange={e => setSupplyForm({ ...supplyForm, purchaseQuantity: e.target.value })}
                          placeholder="Ej: 3.5"
                          className="bg-white border-slate-300"
                        />
                        <span className="bg-slate-200 text-slate-600 px-3 py-2 rounded-md font-medium text-sm flex items-center justify-center border border-slate-300">
                          {supplyForm.purchaseUnit || "Uds."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-red-50/50 p-4 rounded-xl border border-red-100 flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1">
                    <Label className="text-base font-bold text-red-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> 3. Desperdicio / Merma (%)
                    </Label>
                    <p className="text-xs text-red-800/70 mt-1 max-w-sm">
                      Ejemplo: Si comprás 1Kg de carne pero al limpiarle la grasa te quedan 800g, tenés un <strong>20%</strong> de merma. Esto hace que el producto final sea más caro.
                    </p>
                  </div>
                  <div className="w-full md:w-48 relative">
                    <Input
                      type="number"
                      min="0" max="99"
                      value={supplyForm.wastePercentage}
                      onChange={e => setSupplyForm({ ...supplyForm, wastePercentage: e.target.value })}
                      className="bg-white border-red-200 text-red-900 font-bold text-center pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-red-500 font-bold">%</span>
                  </div>
                </div>

              </div>

              <div className="mt-6 flex justify-end border-t pt-6">
                <Button
                  onClick={handleAddSupply}
                  size="lg"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 shadow-lg shadow-orange-600/20 rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-2" /> Guardar en Bodega
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Listado Explicado */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Bodega Actual
              <Badge variant="secondary" className="font-mono">{supplies.length} Insumos</Badge>
            </h3>

            {supplies.length === 0 ? (
              <div className="p-12 border-2 border-dashed rounded-2xl bg-white text-center">
                <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Tu bodega está vacía. Cargá tu primer insumo arriba.</p>
              </div>
            ) : (
              <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 uppercase text-slate-500 font-bold text-[10px] border-b tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Insumo</th>
                      <th className="px-6 py-4">Ref. Compra</th>
                      <th className="px-6 py-4">Merma</th>
                      <th className="px-6 py-4 bg-orange-50/50 text-orange-800">Costo Neto x Unidad</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {supplies.map(s => {
                      const netCost = (s.purchasePrice / s.purchaseQuantity) / (1 - (s.wastePercentage / 100));
                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 font-black text-slate-800 text-base">{s.name}</td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-slate-500 flex flex-col">
                              <span>${s.purchasePrice.toLocaleString('es-AR')}</span>
                              <span className="font-medium text-slate-700">Por {s.purchaseQuantity} {s.purchaseUnit}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {s.wastePercentage > 0 ? (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold text-xs">-{s.wastePercentage}%</span>
                            ) : (
                              <span className="text-slate-400 text-xs">0%</span>
                            )}
                          </td>
                          <td className="px-6 py-4 bg-orange-50/30">
                            <div className="flex flex-col">
                              <span className="text-orange-700 font-black text-base">${netCost.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                              <span className="text-[10px] text-orange-600/70 uppercase font-bold">Por 1 {s.purchaseUnit}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 flex gap-2 justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white border-slate-300 text-slate-700 hover:bg-slate-100 font-bold"
                              onClick={() => setShowExpenseModal(s.id)}
                              title="Registrar una compra real para actualizar precios"
                            >
                              <ReceiptText className="w-4 h-4 mr-2 text-blue-500" /> Factura
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => delSupply(s.id)} className="hover:bg-red-50">
                              <Trash2 className="w-5 h-5 text-red-400 hover:text-red-600" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* PESTAÑA 2: PREPARACIONES (RECETAS INTERMEDIAS) */}
        <TabsContent value="produccion" className="space-y-8 mt-6 animate-in fade-in">

          <Card className="border-2 border-purple-100 shadow-sm overflow-hidden">
            <div className="bg-purple-50/50 border-b border-purple-100 px-6 py-4 flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-full text-purple-600 mt-1">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-purple-900">Crear Preparación (Receta Base)</h3>
                <p className="text-sm text-purple-800/70 leading-relaxed max-w-2xl">
                  Acá combinás insumos para crear cosas nuevas que luego usarás en tus platos. <br />
                  <em>Ejemplo: Agregás 2Kg de Harina + 1L de Agua = <strong>Produce 30 Panes de Hamburguesa</strong>.</em>
                </p>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label className="text-base font-bold text-slate-800">Nombre de lo que vas a cocinar</Label>
                  <Input
                    value={prodForm.name}
                    onChange={e => setProdForm({ ...prodForm, name: e.target.value })}
                    placeholder="Ej: Salsa Cheddar Casera"
                    className="h-12 text-lg font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-bold text-slate-800 flex items-center gap-2">
                    Rinde final
                    <span title="Cuántas porciones o unidades te salen con la receta que vas a armar abajo.">
                      <Info className="w-3 h-3 text-blue-500 cursor-help" />
                    </span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number" min="1"
                      value={prodForm.yieldUnits}
                      onChange={e => setProdForm({ ...prodForm, yieldUnits: e.target.value })}
                      className="h-12 font-bold text-center text-lg"
                    />
                    <div className="bg-slate-100 border border-slate-200 text-slate-500 flex items-center px-4 rounded-md font-bold text-sm">
                      Porciones / Uds.
                    </div>
                  </div>
                </div>

                {/* Armado de receta */}
                <div className="col-span-1 md:col-span-3 bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-6 mt-2">
                  <div>
                    <Label className="text-base font-bold text-slate-800">¿Qué insumos lleva esta preparación?</Label>
                    <p className="text-xs text-slate-500">Agregá los insumos de tu bodega y la cantidad exacta que usás.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-lg border shadow-sm">
                    <select id="s-picker" className="h-12 border-0 bg-transparent px-3 font-medium text-slate-700 flex-1 focus:ring-0 outline-none">
                      <option value="">Buscar insumo en bodega...</option>
                      {supplies.map(s => <option key={s.id} value={s.id}>{s.name} (Medido en {s.purchaseUnit})</option>)}
                    </select>

                    <div className="flex items-center gap-2 border-l pl-3">
                      <Input id="q-picker" type="number" step="0.01" className="w-24 h-10 border-slate-200" placeholder="Cant." />
                      <Button
                        type="button"
                        onClick={() => {
                          const sid = (document.getElementById('s-picker') as HTMLSelectElement).value;
                          const sq = (document.getElementById('q-picker') as HTMLInputElement).value;
                          if (sid && sq) {
                            if (!prodItems.find(x => x.supplyId === sid)) {
                              setProdItems([...prodItems, { supplyId: sid, quantityUsed: Number(sq) }]);
                            } else {
                              toast.error("Ese insumo ya está en la lista.");
                            }
                          } else {
                            toast.error("Seleccioná un insumo y su cantidad.");
                          }
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-white"
                      >
                        Sumar Insumo
                      </Button>
                    </div>
                  </div>

                  {/* Preview de la Receta */}
                  {prodItems.length > 0 && (
                    <div className="bg-white border rounded-xl overflow-hidden mt-4">
                      <div className="bg-slate-100 px-4 py-2 border-b text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Receta Actual
                      </div>
                      <ul className="divide-y">
                        {prodItems.map((pi, idx) => {
                          const supplyInfo = supplies.find(x => x.id === pi.supplyId);
                          return (
                            <li key={idx} className="flex justify-between items-center px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700">{supplyInfo?.name}</span>
                                <Badge variant="outline" className="text-slate-500 font-mono">
                                  Usa {pi.quantityUsed} {supplyInfo?.purchaseUnit}
                                </Badge>
                              </div>
                              <button
                                onClick={() => setProdItems(prodItems.filter(x => x.supplyId !== pi.supplyId))}
                                className="text-red-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors"
                                title="Quitar de la receta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end border-t pt-6">
                <Button
                  onClick={handleAddProduction}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 shadow-lg shadow-purple-600/20 rounded-xl"
                >
                  <ChefHat className="w-5 h-5 mr-2" /> Guardar Preparación
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Tus Preparaciones
              <Badge variant="secondary" className="font-mono bg-purple-100 text-purple-700 hover:bg-purple-100">{productions.length} Recetas</Badge>
            </h3>

            {productions.length === 0 ? (
              <div className="p-12 border-2 border-dashed rounded-2xl bg-white text-center">
                <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No tenés preparaciones armadas. Creá una arriba.</p>
              </div>
            ) : (
              <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 uppercase text-slate-500 font-bold text-[10px] border-b tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Nombre de la Receta</th>
                      <th className="px-6 py-4 w-1/2">Insumos que la componen</th>
                      <th className="px-6 py-4 bg-purple-50/50 text-purple-800">Resultado Final</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {productions.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 font-black text-slate-800 text-base">{p.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {p.items.map((i: any, idx: number) => (
                              <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md border">
                                {i.supply.name} ({i.quantityUsed}{i.supply.purchaseUnit})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 bg-purple-50/30 font-black text-purple-700 text-base">
                          {p.yieldUnits} Porciones
                        </td>
                        <td className="px-6 py-4 text-right opacity-40 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => delProd(p.id)} className="hover:bg-red-50">
                            <Trash2 className="w-5 h-5 text-red-400 hover:text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Expense Modal (Facturas) */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-[99] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">

            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <ReceiptText className="w-6 h-6" />
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-2">Ingresar Factura</h3>
            <p className="text-sm text-slate-500 mb-6">
              Al registrar una compra real de este insumo, <strong>el sistema actualizará automáticamente el precio promedio</strong> y todos tus costos se recalcularán solos.
            </p>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Monto total pagado ($)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-500 font-bold">$</span>
                  <Input
                    type="number"
                    min="0"
                    className="h-12 pl-8 text-lg font-medium border-slate-300 bg-slate-50"
                    placeholder="Ej: 15000"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-slate-700">Cantidad física comprada</Label>
                <p className="text-[10px] text-slate-400 -mt-1 leading-tight">¿Cuántas unidades de este insumo te trajeron por ese precio?</p>
                <Input
                  type="number"
                  min="0" step="0.01"
                  className="h-12 text-lg font-medium border-slate-300 bg-slate-50"
                  placeholder="Ej: 2"
                  value={expenseForm.quantity}
                  onChange={e => setExpenseForm({ ...expenseForm, quantity: e.target.value })}
                />
              </div>

              <div className="pt-6 flex gap-3">
                <Button variant="outline" className="flex-1 h-12 font-bold text-slate-600" onClick={() => setShowExpenseModal(null)}>Cancelar</Button>
                <Button className="flex-1 h-12 font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20" onClick={handleRegisterExpense}>Cargar Factura</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}