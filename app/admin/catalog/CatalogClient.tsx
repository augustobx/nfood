"use client";

import { useState } from "react";
import { Plus, Tag, Carrot, Sparkles, Layers, Trash2, Pen, ChevronDown, PackagePlus, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  addCategory, toggleCategory, deleteCategory,
  upsertProduct, toggleProduct, toggleProductImage, deleteProduct,
  addIngredient, toggleIngredient, deleteIngredient, restockIngredient,
  addExtra, toggleExtra, deleteExtra
} from "@/app/actions/admin-catalog";

export function CatalogClient({ initialCategories, allExtras, allIngredients, allCombos = [] }: { initialCategories: any[], allExtras: any[], allIngredients: any[], allCombos?: any[] }) {

  const router = useRouter();
  const categories = initialCategories;
  const ingredients = allIngredients;
  const extras = allExtras;
  const combos = allCombos;

  const [activeTab, setActiveTab] = useState("products");

  const [newCatName, setNewCatName] = useState("");
  const [newExtra, setNewExtra] = useState({ name: "", price: "" });

  // --- NUEVO ESTADO DE INGREDIENTES CON STOCK/COSTO ---
  const [newIngredient, setNewIngredient] = useState({
    name: "", categoryIds: [] as string[],
    purchaseVolume: "", purchasePrice: "", yieldUnits: ""
  });

  const [restockModal, setRestockModal] = useState<string | null>(null);
  const [restockForm, setRestockForm] = useState({ purchaseVolume: "", purchasePrice: "", yieldUnits: "" });

  const [newProduct, setNewProduct] = useState({
    id: undefined as string | undefined,
    name: "", basePrice: "", points: "0", description: "", categoryId: "", imageUrl: "",
    ingredientsData: [] as { id: string, quantity: number }[], extraIds: [] as string[],
    allowHalf: false, onlyHalf: false,
    isCombo: false, comboItemsData: [] as { id: string, quantity: number }[]
  });

  const [isProductDialogOpen, setProductDialogOpen] = useState(false);

  // Funciones de Ingredientes
  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredient.name || newIngredient.categoryIds.length === 0) return toast.error("Selecciona un nombre y categoría");
    if (!newIngredient.purchasePrice || !newIngredient.yieldUnits) return toast.error("Completá el precio y cuánto rinde");

    const res = await addIngredient({
      name: newIngredient.name,
      categoryIds: newIngredient.categoryIds,
      purchaseVolume: newIngredient.purchaseVolume,
      purchasePrice: Number(newIngredient.purchasePrice),
      yieldUnits: Number(newIngredient.yieldUnits)
    });

    if (res.success) {
      toast.success("Ingrediente y Stock creados");
      setNewIngredient({ name: "", categoryIds: [], purchaseVolume: "", purchasePrice: "", yieldUnits: "" });
    }
    else toast.error("Error al crear ingrediente");
  };

  const handleRestock = async () => {
    if (!restockModal || !restockForm.purchasePrice || !restockForm.yieldUnits) return toast.error("Completá los datos");
    const res = await restockIngredient(
      restockModal,
      Number(restockForm.purchasePrice),
      Number(restockForm.yieldUnits),
      restockForm.purchaseVolume
    );
    if (res.success) {
      toast.success("Stock actualizado y costo recalculado");
      setRestockModal(null);
      setRestockForm({ purchaseVolume: "", purchasePrice: "", yieldUnits: "" });
    }
  };

  // Funciones de Producto
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.basePrice || !newProduct.categoryId) return;

    const res = await upsertProduct({
      ...newProduct,
      id: newProduct.id,
      basePrice: parseFloat(newProduct.basePrice),
      points: parseInt(newProduct.points) || 0,
      isCombo: false,
      comboItemsData: []
    });

    if (res.success) {
      toast.success("Producto guardado");
      setProductDialogOpen(false);
      setNewProduct({ id: undefined, name: "", basePrice: "", points: "0", description: "", categoryId: "", imageUrl: "", ingredientsData: [], extraIds: [], allowHalf: false, onlyHalf: false, isCombo: false, comboItemsData: [] });
    }
    else toast.error("Error al guardar producto");
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto permanentemente?")) {
      const res = await deleteProduct(id);
      if (res.success) toast.success("Eliminado correctamente");
    }
  };

  // Utilidad para calcular el costo de la hamburguesa en tiempo real
  const calculateRecipeCost = () => {
    return newProduct.ingredientsData.reduce((total, ingData) => {
      const ingInfo = ingredients.find(i => i.id === ingData.id);
      return total + ((ingInfo?.costPerUnit || 0) * ingData.quantity);
    }, 0);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
      <TabsList className="bg-slate-100 border p-1 rounded-lg">
        <TabsTrigger value="products" className="rounded-md"><Tag className="w-4 h-4 mr-2" /> Menú / Productos</TabsTrigger>
        <TabsTrigger value="ingredients" className="rounded-md"><Carrot className="w-4 h-4 mr-2" /> Ingredientes y Stock</TabsTrigger>
      </TabsList>

      {/* PESTAÑA: PRODUCTOS */}
      <TabsContent value="products" className="space-y-6 animate-in fade-in">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardHeader className="flex flex-row justify-between items-center pb-2 bg-slate-50 border-b">
              <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5 text-muted-foreground" /> {cat.name}</CardTitle>
              <div className="flex items-center gap-4">
                <Button size="sm" variant="outline" onClick={() => {
                  setNewProduct({ id: undefined, name: "", basePrice: "", points: "0", description: "", categoryId: cat.id, imageUrl: "", ingredientsData: [], extraIds: [], allowHalf: false, onlyHalf: false, isCombo: false, comboItemsData: [] });
                  setProductDialogOpen(true);
                }}><Plus className="w-4 h-4 mr-2" /> Agregar al Menú</Button>

                <Dialog open={isProductDialogOpen && newProduct.categoryId === cat.id} onOpenChange={(open) => {
                  setProductDialogOpen(open);
                  if (!open) setNewProduct({ ...newProduct, categoryId: "" });
                }}>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-full">
                    <DialogHeader>
                      <DialogTitle>Armar Producto</DialogTitle>
                      <DialogDescription>Construye la receta. El sistema calculará el costo automáticamente.</DialogDescription>
                    </DialogHeader>
                    <form id={`add-prod-${cat.id}`} onSubmit={handleCreateProduct} className="space-y-6">

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre en el Menú</Label>
                          <Input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio de Venta ($)</Label>
                          <Input type="number" min="0" step="0.01" value={newProduct.basePrice} onChange={e => setNewProduct({ ...newProduct, basePrice: e.target.value })} required />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-end mb-2">
                          <Label className="text-base font-semibold">Ingredientes de la Receta</Label>

                          {/* INDICADOR INTELIGENTE DE COSTOS */}
                          <div className="bg-slate-100 px-3 py-1.5 rounded-lg border text-sm flex gap-4">
                            <div>Costo: <strong className="text-red-600">${calculateRecipeCost().toFixed(2)}</strong></div>
                            <div>Sugerido (x3): <strong className="text-green-600">${(calculateRecipeCost() * 3).toFixed(2)}</strong></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {ingredients.filter((ing: any) => ing.categories.some((c: any) => c.categoryId === cat.id) && ing.isActive).map((ing: any) => {
                            const isSelected = newProduct.ingredientsData.some(i => i.id === ing.id);
                            const qty = newProduct.ingredientsData.find(i => i.id === ing.id)?.quantity || 1;
                            return (
                              <div key={ing.id} className={`flex flex-col gap-2 p-3 border rounded-lg ${isSelected ? 'bg-orange-50 border-orange-200' : 'bg-slate-50'}`}>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`ing-${ing.id}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      if (checked) setNewProduct({ ...newProduct, ingredientsData: [...newProduct.ingredientsData, { id: ing.id, quantity: 1 }] });
                                      else setNewProduct({ ...newProduct, ingredientsData: newProduct.ingredientsData.filter(i => i.id !== ing.id) });
                                    }}
                                  />
                                  <label htmlFor={`ing-${ing.id}`} className="text-sm font-semibold cursor-pointer">{ing.name}</label>
                                  <span className="text-[10px] text-slate-400">(${ing.costPerUnit.toFixed(0)} c/u)</span>
                                </div>
                                {isSelected && (
                                  <div className="flex items-center space-x-2 ml-6 bg-white p-1.5 rounded border shadow-sm">
                                    <Label className="text-xs font-medium">Lleva (Uds):</Label>
                                    <Input type="number" min="1" className="h-7 w-16 text-xs px-2 text-center" value={qty} onChange={e => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setNewProduct({
                                        ...newProduct,
                                        ingredientsData: newProduct.ingredientsData.map(i => i.id === ing.id ? { ...i, quantity: val } : i)
                                      });
                                    }} />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                    </form>
                    <DialogFooter>
                      <Button type="submit" form={`add-prod-${cat.id}`} className="bg-slate-900 text-white w-full">Guardar Producto</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="divide-y relative">
                {cat.products.filter((p: any) => !p.isCombo).map((prod: any) => (
                  <div key={prod.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{prod.name}</h4>
                      <div className="text-sm mt-1 mb-2 flex items-center gap-2">
                        <span className="font-bold text-orange-600">${prod.basePrice.toLocaleString('es-AR')}</span>
                      </div>
                      {prod.ingredients?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {prod.ingredients.map((pi: any) => (
                            <span key={pi.ingredientId} className="text-[10px] bg-slate-100 border text-slate-600 px-2 rounded-full py-0.5 font-medium">
                              {pi.ingredient.name} (Lleva {pi.quantity})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center justify-center pr-4">
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50" onClick={() => {
                        setNewProduct({
                          id: prod.id, name: prod.name, basePrice: prod.basePrice.toString(), points: prod.points.toString(), description: prod.description || "", categoryId: prod.categoryId, imageUrl: prod.imageUrl || "", allowHalf: prod.allowHalf, onlyHalf: prod.onlyHalf, isCombo: false,
                          ingredientsData: prod.ingredients?.map((i: any) => ({ id: i.ingredientId, quantity: i.quantity })) || [], extraIds: prod.extras?.map((e: any) => e.extraId) || [], comboItemsData: []
                        });
                        setProductDialogOpen(true);
                      }}><Pen className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteProduct(prod.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      {/* PESTAÑA: INGREDIENTES Y STOCK (EL MODELO SIMPLE) */}
      <TabsContent value="ingredients" className="space-y-6 animate-in fade-in">

        <Card className="bg-orange-50/30 border-orange-200 shadow-sm">
          <CardHeader className="pb-3 border-b bg-white/50">
            <CardTitle className="text-orange-800 flex items-center gap-2"><Calculator className="w-5 h-5" /> Ingresar Nueva Materia Prima</CardTitle>
            <CardDescription>Ejemplo: "100 kg de carne picada", "$10000", "Rinde 100 medallones".</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleCreateIngredient}>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nombre del Ingrediente Final</Label>
                  <Input placeholder="Ej. Medallón de Carne 150g" className="bg-white" value={newIngredient.name} onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })} required />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Referencia de Compra (Opcional)</Label>
                  <Input placeholder="Ej. 100 Kg de carne picada" className="bg-white" value={newIngredient.purchaseVolume} onChange={e => setNewIngredient({ ...newIngredient, purchaseVolume: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white border rounded-xl">
                <div className="space-y-2">
                  <Label className="text-slate-500">¿Cuánto pagaste en total?</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-bold">$</span>
                    <Input type="number" min="0" className="pl-8 font-bold" placeholder="Ej: 10000" value={newIngredient.purchasePrice} onChange={e => setNewIngredient({ ...newIngredient, purchasePrice: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-500">¿Cuántas unidades sacás de ahí?</Label>
                  <div className="relative">
                    <Input type="number" min="1" className="pr-12 font-bold" placeholder="Ej: 100" value={newIngredient.yieldUnits} onChange={e => setNewIngredient({ ...newIngredient, yieldUnits: e.target.value })} required />
                    <span className="absolute right-3 top-2.5 text-slate-500 text-xs font-bold">Uds.</span>
                  </div>
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  {newIngredient.purchasePrice && newIngredient.yieldUnits ? (
                    <div className="bg-green-50 border border-green-200 text-green-800 p-2 rounded-md text-center">
                      <span className="text-xs block">Cada unidad te cuesta:</span>
                      <span className="font-black text-lg">${(Number(newIngredient.purchasePrice) / Number(newIngredient.yieldUnits)).toFixed(2)}</span>
                    </div>
                  ) : (
                    <div className="bg-slate-100 p-2 rounded-md text-center text-slate-400 text-xs h-full flex items-center justify-center">El costo se calcula automático</div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label>¿En qué categorías se va a poder usar?</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 border rounded-md">
                  {categories.map((c: any) => (
                    <div key={c.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${c.id}`}
                        checked={newIngredient.categoryIds.includes(c.id)}
                        onCheckedChange={(checked) => {
                          if (checked) setNewIngredient({ ...newIngredient, categoryIds: [...newIngredient.categoryIds, c.id] });
                          else setNewIngredient({ ...newIngredient, categoryIds: newIngredient.categoryIds.filter(id => id !== c.id) });
                        }}
                      />
                      <label htmlFor={`cat-${c.id}`} className="text-sm font-medium leading-none cursor-pointer">{c.name}</label>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-bold"><Plus className="w-5 h-5 mr-2" /> Guardar Ingrediente y Sumar Stock</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Control de Stock de Ingredientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y mt-2">
              {ingredients.map((ing: any) => (
                <div key={ing.id} className="p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:bg-slate-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg text-slate-800">{ing.name}</h4>
                      <Badge variant={ing.stock > 10 ? "secondary" : "destructive"}>{ing.stock} en Stock</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex gap-4">
                      <span>Costo: <strong className="text-orange-600">${ing.costPerUnit.toFixed(2)} c/u</strong></span>
                      {ing.purchaseVolume && <span>Ref: {ing.purchaseVolume}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" onClick={() => setRestockModal(ing.id)}>
                      <PackagePlus className="w-4 h-4 mr-2" /> Cargar Compra
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={async () => {
                      if (confirm("Eliminar ingrediente?")) {
                        await deleteIngredient(ing.id);
                        window.location.reload();
                      }
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* MODAL DE RECUPERACIÓN DE STOCK */}
      <Dialog open={!!restockModal} onOpenChange={(open) => !open && setRestockModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresar Factura / Stock</DialogTitle>
            <DialogDescription>Al ingresar los datos de tu nueva compra, sumaremos las unidades al stock y actualizaremos el precio de costo de tu receta.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>¿Qué compraste? (Ref)</Label>
              <Input placeholder="Ej: 10 Kg de carne" value={restockForm.purchaseVolume} onChange={e => setRestockForm({ ...restockForm, purchaseVolume: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pagué en total ($)</Label>
                <Input type="number" min="0" value={restockForm.purchasePrice} onChange={e => setRestockForm({ ...restockForm, purchasePrice: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Rinde (Unidades)</Label>
                <Input type="number" min="1" value={restockForm.yieldUnits} onChange={e => setRestockForm({ ...restockForm, yieldUnits: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleRestock} className="w-full bg-blue-600 hover:bg-blue-700">Actualizar Stock y Costos</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}