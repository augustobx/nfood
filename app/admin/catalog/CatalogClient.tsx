"use client";

import { useState } from "react";
// CORRECCIÓN: Agregué 'ChevronDown' que se usa en los acordeones y no estaba importado
import { Plus, Tag, Carrot, Sparkles, Layers, Trash2, Pen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addCategory, toggleCategory, deleteCategory,
  upsertProduct, toggleProduct, toggleProductImage, deleteProduct,
  addIngredient, toggleIngredient, deleteIngredient,
  addExtra, toggleExtra, deleteExtra
} from "@/app/actions/admin-catalog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { updateProductRecipe, fetchRecipeForProduct } from "@/app/actions/admin-costs";
// ELIMINADO: Se quitó el import de CopyRight que generaba el error de compilación

export function CatalogClient({ initialCategories, allExtras, allIngredients, allCombos = [], supplies = [], productions = [] }: { initialCategories: any[], allExtras: any[], allIngredients: any[], allCombos?: any[], supplies?: any[], productions?: any[] }) {

  const router = useRouter();

  const categories = initialCategories;
  const ingredients = allIngredients;
  const extras = allExtras;
  const combos = allCombos;

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("catalogActiveTab") || "products";
    return "products";
  });

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (typeof window !== "undefined") localStorage.setItem("catalogActiveTab", val);
  };

  const [newCatName, setNewCatName] = useState("");
  const [newIngredient, setNewIngredient] = useState({ name: "", categoryIds: [] as string[] });
  const [newExtra, setNewExtra] = useState({ name: "", price: "" });

  const [newProduct, setNewProduct] = useState({
    id: undefined as string | undefined,
    name: "", basePrice: "", points: "0", description: "", categoryId: "", imageUrl: "",
    ingredientsData: [] as { id: string, quantity: number }[], extraIds: [] as string[],
    allowHalf: false, onlyHalf: false,
    isCombo: false, comboItemsData: [] as { id: string, quantity: number }[]
  });

  const [newCombo, setNewCombo] = useState({
    id: undefined as string | undefined,
    name: "", basePrice: "", points: "0", description: "", imageUrl: "",
    comboItemsData: [] as { id: string, quantity: number, productInfo: any }[]
  });

  const [isProductDialogOpen, setProductDialogOpen] = useState(false);
  const [isComboDialogOpen, setComboDialogOpen] = useState(false);

  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [activeRecipeProduct, setActiveRecipeProduct] = useState<any>(null);
  const [recipeItems, setRecipeItems] = useState<any[]>([]);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);

  const openRecipeDialog = async (prod: any) => {
    setActiveRecipeProduct(prod);
    setRecipeItems([]);
    setRecipeDialogOpen(true);
    try {
      const ri = await fetchRecipeForProduct(prod.id);
      setRecipeItems(ri);
    } catch (e) { }
  };

  const handleSaveRecipe = async () => {
    setIsSavingRecipe(true);
    await updateProductRecipe(activeRecipeProduct.id, recipeItems);
    toast.success("Receta guardada");
    setIsSavingRecipe(false);
    setRecipeDialogOpen(false);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const res = await addCategory(newCatName);
    if (res.success) { toast.success("Categoría creada"); setNewCatName(""); }
    else { toast.error("Error", { description: res.error }); }
  };
  const handleToggleCategory = async (id: string, current: boolean) => await toggleCategory(id, !current);

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredient.name || newIngredient.categoryIds.length === 0) {
      toast.error("Selecciona al menos una categoría"); return;
    }
    const res = await addIngredient(newIngredient.name, newIngredient.categoryIds);
    if (res.success) { toast.success("Ingrediente creado"); setNewIngredient({ name: "", categoryIds: [] }); }
    else { toast.error("Error", { description: res.error }); }
  };
  const handleToggleIngredient = async (id: string, current: boolean) => await toggleIngredient(id, !current);

  const handleCreateExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExtra.name || !newExtra.price) return;
    const res = await addExtra(newExtra.name, parseFloat(newExtra.price));
    if (res.success) { toast.success("Extra creado"); setNewExtra({ name: "", price: "" }); }
    else { toast.error("Error", { description: res.error }); }
  };
  const handleToggleExtra = async (id: string, current: boolean) => await toggleExtra(id, !current);

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
    else { toast.error("Error", { description: res.error }); }
  };

  const handleCreateCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCombo.name || !newCombo.basePrice || newCombo.comboItemsData.length === 0) return;

    const res = await upsertProduct({
      id: newCombo.id,
      name: newCombo.name,
      basePrice: parseFloat(newCombo.basePrice),
      points: parseInt(newCombo.points) || 0,
      description: newCombo.description,
      imageUrl: newCombo.imageUrl,
      categoryId: null, // Global combo
      isCombo: true,
      allowHalf: false,
      onlyHalf: false,
      ingredientsData: [],
      extraIds: [],
      comboItemsData: newCombo.comboItemsData.map(c => ({ id: c.id, quantity: c.quantity }))
    });

    if (res.success) {
      toast.success("Combo guardado");
      setComboDialogOpen(false);
      setNewCombo({ id: undefined, name: "", basePrice: "", points: "0", description: "", imageUrl: "", comboItemsData: [] });
    }
    else { toast.error("Error", { description: res.error }); }
  };

  const handleToggleProduct = async (id: string, current: boolean) => await toggleProduct(id, !current);
  const handleToggleImage = async (id: string, current: boolean) => await toggleProductImage(id, !current);

  const handleDeleteProduct = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto/combo permanentemente?")) {
      const res = await deleteProduct(id);
      if (res.success) toast.success("Eliminado correctamente");
      else toast.error("Error", { description: res.error });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta categoría y todos sus productos?")) {
      const res = await deleteCategory(id);
      if (res.success) toast.success("Eliminada correctamente");
      else toast.error("Error", { description: res.error });
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    if (confirm("¿Eliminar este ingrediente?")) {
      const res = await deleteIngredient(id);
      if (res.success) toast.success("Eliminado correctamente");
      else toast.error("Error", { description: res.error });
    }
  };

  const handleDeleteExtra = async (id: string) => {
    if (confirm("¿Eliminar este extra?")) {
      const res = await deleteExtra(id);
      if (res.success) toast.success("Eliminado correctamente");
      else toast.error("Error", { description: res.error });
    }
  };

  const handleAddComboItem = () => {
    const sel = document.getElementById("combo-product-select") as HTMLSelectElement;
    if (!sel.value) return;
    const p = categories.flatMap(c => c.products).find(x => x.id === sel.value);
    const exists = newCombo.comboItemsData.findIndex(x => x.id === sel.value);
    if (exists >= 0) {
      const nv = [...newCombo.comboItemsData];
      nv[exists].quantity += 1;
      setNewCombo({ ...newCombo, comboItemsData: nv });
    } else {
      setNewCombo({ ...newCombo, comboItemsData: [...newCombo.comboItemsData, { id: sel.value, quantity: 1, productInfo: p }] });
    }
    sel.value = "";
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
      <TabsList className="bg-slate-100 border p-1 rounded-lg">
        <TabsTrigger value="products" className="rounded-md"><Tag className="w-4 h-4 mr-2" /> Catálogo y Productos</TabsTrigger>
        <TabsTrigger value="combos" className="rounded-md"><Layers className="w-4 h-4 mr-2" /> Combos</TabsTrigger>
        <TabsTrigger value="ingredients" className="rounded-md"><Carrot className="w-4 h-4 mr-2" /> Ingredientes Globales</TabsTrigger>
        <TabsTrigger value="extras" className="rounded-md"><Sparkles className="w-4 h-4 mr-2" /> Extras Globales</TabsTrigger>
      </TabsList>

      <TabsContent value="combos" className="space-y-6 animate-in fade-in">
        <Card className="bg-slate-50 border-dashed border-2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Crea un Nuevo Combo</h3>
                <p className="text-sm text-muted-foreground">Grupos de productos que se venden juntos y permiten personalización interior.</p>
              </div>

              <Button onClick={() => {
                setNewCombo({ id: undefined, name: "", basePrice: "", points: "0", description: "", imageUrl: "", comboItemsData: [] });
                setComboDialogOpen(true);
              }}><Plus className="w-4 h-4 mr-2" /> Agregar Combo</Button>
              <Dialog open={isComboDialogOpen} onOpenChange={setComboDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full">
                  <DialogHeader>
                    <DialogTitle>Nuevo Combo</DialogTitle>
                    <DialogDescription>Define el combo y selecciona los productos que lo integran.</DialogDescription>
                  </DialogHeader>
                  <form id="add-combo" onSubmit={handleCreateCombo} className="space-y-6">

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre del Combo</Label>
                        <Input value={newCombo.name} onChange={e => setNewCombo({ ...newCombo, name: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Precio ($)</Label>
                        <Input type="number" min="0" step="0.01" value={newCombo.basePrice} onChange={e => setNewCombo({ ...newCombo, basePrice: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Puntos (Otorga)</Label>
                        <Input type="number" min="0" value={newCombo.points} onChange={e => setNewCombo({ ...newCombo, points: e.target.value })} title="Puntos para el carrito" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea value={newCombo.description} onChange={e => setNewCombo({ ...newCombo, description: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>URL de Imagen (Opcional)</Label>
                      <Input placeholder="https://..." value={newCombo.imageUrl} onChange={e => setNewCombo({ ...newCombo, imageUrl: e.target.value })} />
                    </div>

                    <div className="border-t pt-4">
                      <Label className="mb-2 block text-base font-semibold">Productos a incluir</Label>

                      <div className="flex gap-2">
                        <select className="border rounded-md px-3 text-sm flex-1 bg-white" id="combo-product-select">
                          <option value="">Selecciona un producto del cátalogo...</option>
                          {categories.flatMap(c => c.products).filter(p => !p.isCombo).map((p: any) => (
                            <option key={p.id} value={p.id}>{categories.find(c => c.id === p.categoryId)?.name}: {p.name}</option>
                          ))}
                        </select>
                        <Button type="button" onClick={handleAddComboItem} variant="secondary">Añadir</Button>
                      </div>

                      <div className="mt-4 space-y-2">
                        {newCombo.comboItemsData.length === 0 && <p className="text-xs text-muted-foreground italic p-2">No has agregado productos para este combo.</p>}
                        {newCombo.comboItemsData.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 px-3 border rounded shadow-sm bg-white">
                            <span className="font-semibold text-sm">{item.productInfo.name}</span>
                            <div className="flex gap-3 items-center">
                              <Label className="text-xs">Cant:</Label>
                              <Input className="w-16 h-8 text-xs text-center" type="number" min="1" value={item.quantity} onChange={(e) => {
                                const nb = parseInt(e.target.value) || 1;
                                const nv = [...newCombo.comboItemsData];
                                nv[idx].quantity = nb;
                                setNewCombo({ ...newCombo, comboItemsData: nv });
                              }} />
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => {
                                setNewCombo({ ...newCombo, comboItemsData: newCombo.comboItemsData.filter((_, i) => i !== idx) });
                              }}><Tag className="h-4 w-4 rotate-45" /></Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </form>
                  <DialogFooter>
                    <Button type="submit" form="add-combo" className="bg-purple-700 hover:bg-purple-800 text-white">Guardar Combo</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {combos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {combos.map(combo => (
              <Card key={combo.id}>
                <CardContent className="p-5 flex gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xl">{combo.name}</h4>
                      <div className="text-right">
                        <span className="text-lg font-bold text-purple-700">${combo.basePrice.toLocaleString('es-AR')}</span>
                        {combo.points > 0 && <span className="block text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full mt-1">{combo.points} Pts</span>}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{combo.description}</p>

                    <div className="mt-4 pt-3 border-t">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-2">Incluye:</span>
                      {combo.comboItemsConfig?.map((ci: any) => (
                        <div key={ci.id} className="text-sm flex items-center gap-2 mt-1">
                          <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs font-bold">{ci.quantity}x</span>
                          <span className="font-medium text-slate-700">{categories.flatMap(c => c.products).find(p => p.id === ci.productId)?.name || "Producto Borrado"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 justify-start border-l pl-4">
                    <span className="text-xs text-muted-foreground text-center font-medium">{combo.isActive ? 'Activo' : 'Pausado'}</span>
                    <Switch checked={combo.isActive} onCheckedChange={() => handleToggleProduct(combo.id, combo.isActive)} />
                    <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50 mt-2" onClick={() => {
                      setNewCombo({
                        id: combo.id,
                        name: combo.name,
                        basePrice: combo.basePrice.toString(),
                        points: combo.points.toString(),
                        description: combo.description || "",
                        imageUrl: combo.imageUrl || "",
                        comboItemsData: combo.comboItemsConfig?.map((ci: any) => ({ id: ci.productId, quantity: ci.quantity, productInfo: { name: ci.product?.name || "" } })) || []
                      });
                      setComboDialogOpen(true);
                    }}>
                      <Pen className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50" onClick={() => openRecipeDialog(combo)} title="Escandallo / Costos">
                      <Tag className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteProduct(combo.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground p-12 italic border rounded-xl">No hay combos registrados.</p>
        )}
      </TabsContent>

      <TabsContent value="products" className="space-y-6 animate-in fade-in">
        <Card className="bg-slate-50 border-dashed border-2">
          <CardContent className="p-6">
            <form className="flex items-end gap-4" onSubmit={handleCreateCategory}>
              <div className="flex-1 space-y-2">
                <Label>Nueva Categoría</Label>
                <Input placeholder="Ej. Hamburguesas" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
              </div>
              <Button type="submit"><Plus className="w-4 h-4 mr-2" /> Agregar Categoría</Button>
            </form>
          </CardContent>
        </Card>

        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardHeader className="flex flex-row justify-between items-center pb-2 bg-slate-50 border-b">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  {cat.name}
                </CardTitle>
              </div>
              <div className="flex items-center gap-4">
                <Switch checked={cat.isActive} onCheckedChange={() => handleToggleCategory(cat.id, cat.isActive)} />
                <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50 h-8 w-8" onClick={() => handleDeleteCategory(cat.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setNewProduct({ id: undefined, name: "", basePrice: "", points: "0", description: "", categoryId: cat.id, imageUrl: "", ingredientsData: [], extraIds: [], allowHalf: false, onlyHalf: false, isCombo: false, comboItemsData: [] });
                  setProductDialogOpen(true);
                }}><Plus className="w-4 h-4 mr-2" /> Producto</Button>
                <Dialog open={isProductDialogOpen && newProduct.categoryId === cat.id} onOpenChange={(open) => {
                  setProductDialogOpen(open);
                  if (!open) setNewProduct({ ...newProduct, categoryId: "" });
                }}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full">
                    <DialogHeader>
                      <DialogTitle>Nuevo Producto en {cat.name}</DialogTitle>
                      <DialogDescription>Define el producto y sus ingredientes.</DialogDescription>
                    </DialogHeader>
                    <form id={`add-prod-${cat.id}`} onSubmit={handleCreateProduct} className="space-y-6">

                      <div className="flex gap-4 p-4 border rounded-lg bg-blue-50/50 flex-wrap">
                        <div className="flex items-center space-x-2">
                          <Switch id="sw-half" checked={newProduct.allowHalf} onCheckedChange={(v) => setNewProduct({ ...newProduct, allowHalf: v, onlyHalf: false })} />
                          <Label htmlFor="sw-half" className="cursor-pointer">Permitir vender media (Mitad y Mitad)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="sw-only" checked={newProduct.onlyHalf} disabled={!newProduct.allowHalf} onCheckedChange={(v) => setNewProduct({ ...newProduct, onlyHalf: v })} />
                          <Label htmlFor="sw-only" className={`cursor-pointer ${!newProduct.allowHalf ? 'opacity-50' : ''}`}>Modo solo media</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio Base</Label>
                          <Input type="number" min="0" step="0.01" value={newProduct.basePrice} onChange={e => setNewProduct({ ...newProduct, basePrice: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Puntos (Otorga)</Label>
                          <Input type="number" min="0" value={newProduct.points} onChange={e => setNewProduct({ ...newProduct, points: e.target.value })} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>URL de Imagen (Opcional)</Label>
                        <Input placeholder="https://..." value={newProduct.imageUrl} onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })} />
                      </div>

                      <div className="border-t pt-4">
                        <Label className="mb-2 block text-base font-semibold">Seleccionar Ingredientes (y cantidades)</Label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          {ingredients.filter((ing: any) => ing.categories.some((c: any) => c.categoryId === cat.id) && ing.isActive).map((ing: any) => {
                            const isSelected = newProduct.ingredientsData.some(i => i.id === ing.id);
                            const qty = newProduct.ingredientsData.find(i => i.id === ing.id)?.quantity || 1;
                            return (
                              <div key={ing.id} className="flex flex-col gap-2 p-3 border rounded-lg bg-slate-50 border-slate-100">
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
                                </div>
                                {isSelected && (
                                  <div className="flex items-center space-x-2 ml-6 bg-white p-1.5 rounded border border-orange-100 shadow-sm">
                                    <Label className="text-xs text-orange-600 font-medium whitespace-nowrap">Cantidad:</Label>
                                    <Input type="number" min="0.01" step="0.01" className="h-7 w-20 text-xs px-2" value={qty} onChange={e => {
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
                          {ingredients.filter((ing: any) => ing.categories.some((c: any) => c.categoryId === cat.id)).length === 0 && (
                            <p className="text-sm text-muted-foreground italic col-span-2">No hay ingredientes asignados a esta categoría.</p>
                          )}
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <Label className="mb-2 block text-base font-semibold">Seleccionar Extras Posibles</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {extras.filter((ext: any) => ext.isActive).map((ext: any) => (
                            <div key={ext.id} className="flex items-center space-x-2 p-2 px-3 border rounded-md">
                              <Checkbox
                                id={`ext-${ext.id}`}
                                checked={newProduct.extraIds.includes(ext.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) setNewProduct({ ...newProduct, extraIds: [...newProduct.extraIds, ext.id] });
                                  else setNewProduct({ ...newProduct, extraIds: newProduct.extraIds.filter(id => id !== ext.id) });
                                }}
                              />
                              <label htmlFor={`ext-${ext.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 flex justify-between">
                                <span>{ext.name}</span>
                                <span className="text-orange-600 font-bold">+${ext.price}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                    </form>
                    <DialogFooter>
                      <Button type="submit" form={`add-prod-${cat.id}`} className="bg-slate-900 text-white">Guardar Producto</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {cat.products.filter((p: any) => !p.isCombo).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground italic">No hay productos en esta categoría.</div>
              ) : (
                <div className="divide-y relative">
                  {cat.products.filter((p: any) => !p.isCombo).map((prod: any) => (
                    <div key={prod.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{prod.name}</h4>
                          {prod.allowHalf && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">MITADES</span>}
                          {prod.onlyHalf && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">SOLO MITAD</span>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{prod.description}</p>
                        <div className="text-sm mt-1 mb-2 flex items-center gap-2">
                          <span className="font-bold text-orange-600">${prod.basePrice.toLocaleString('es-AR')}</span>
                          {' • '}
                          <span className="text-muted-foreground">{prod.ingredients?.length || 0} Ingredientes | {prod.extras?.length || 0} Extras</span>
                          {prod.points > 0 && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-700">+{prod.points} Pts</span>}
                        </div>

                        {prod.ingredients?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {prod.ingredients.map((pi: any) => (
                              <span key={pi.ingredientId} className="text-[10px] bg-slate-100 border text-slate-600 px-2 rounded-full py-0.5 font-medium">
                                {pi.ingredient.name} (x{pi.quantity})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-6 justify-center w-auto pr-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground text-center leading-tight uppercase font-bold">Imagen</span>
                          <Switch checked={prod.showImage} onCheckedChange={() => handleToggleImage(prod.id, prod.showImage)} />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground text-center leading-tight uppercase font-bold">{prod.isActive ? 'Act.' : 'Paus.'}</span>
                          <Switch checked={prod.isActive} onCheckedChange={() => handleToggleProduct(prod.id, prod.isActive)} />
                        </div>
                        <div className="flex flex-col items-center gap-1 ml-2">
                          <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50 h-8 w-8" onClick={() => {
                            setNewProduct({
                              id: prod.id,
                              name: prod.name,
                              basePrice: prod.basePrice.toString(),
                              points: prod.points.toString(),
                              description: prod.description || "",
                              categoryId: prod.categoryId,
                              imageUrl: prod.imageUrl || "",
                              allowHalf: prod.allowHalf,
                              onlyHalf: prod.onlyHalf,
                              isCombo: false,
                              ingredientsData: prod.ingredients?.map((i: any) => ({ id: i.ingredientId, quantity: i.quantity })) || [],
                              extraIds: prod.extras?.map((e: any) => e.extraId) || [],
                              comboItemsData: []
                            });
                            setProductDialogOpen(true);
                          }}>
                            <Pen className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50 h-8 w-8" onClick={() => openRecipeDialog(prod)} title="Escandallo / Costos">
                            <Tag className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 h-8 w-8" onClick={() => handleDeleteProduct(prod.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="ingredients" className="space-y-6 animate-in fade-in">
        <Card className="bg-slate-50 border-dashed border-2">
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleCreateIngredient}>
              <div className="space-y-2">
                <Label>Nuevo Ingrediente Global</Label>
                <Input placeholder="Ej. Medallón de Carne 150g" value={newIngredient.name} onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Aplica para las categorías:</Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 border rounded-md">
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
              <Button type="submit"><Plus className="w-4 h-4 mr-2" /> Crear Ingrediente</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Ingredientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y border-t mt-2">
              {ingredients.map((ing: any) => (
                <div key={ing.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <h4 className="font-semibold">{ing.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Categorías: {ing.categories.map((ic: any) => categories.find((c: any) => c.id === ic.categoryId)?.name).filter(Boolean).join(", ") || "Ninguna"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-muted-foreground">{ing.isActive ? 'Activo' : 'Pausado'}</span>
                      <Switch checked={ing.isActive} onCheckedChange={() => handleToggleIngredient(ing.id, ing.isActive)} />
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteIngredient(ing.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {ingredients.length === 0 && <div className="p-8 text-center text-muted-foreground italic">No hay ingredientes registrados.</div>}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="extras" className="space-y-6 animate-in fade-in">
        <Card className="bg-slate-50 border-dashed border-2">
          <CardContent className="p-6">
            <form className="flex items-end gap-4" onSubmit={handleCreateExtra}>
              <div className="flex-1 space-y-2">
                <Label>Nuevo Extra Global</Label>
                <Input placeholder="Ej. Porción de Papas" value={newExtra.name} onChange={e => setNewExtra({ ...newExtra, name: e.target.value })} required />
              </div>
              <div className="w-32 space-y-2">
                <Label>Precio (+ $)</Label>
                <Input type="number" min="0" step="0.01" value={newExtra.price} onChange={e => setNewExtra({ ...newExtra, price: e.target.value })} required />
              </div>
              <Button type="submit"><Plus className="w-4 h-4 mr-2" /> Agregar Extra</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listado de Extras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y border-t mt-2">
              {extras.map((ext: any) => (
                <div key={ext.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                  <div>
                    <h4 className="font-semibold">{ext.name}</h4>
                    <p className="text-lg font-bold text-orange-600 mt-1">+${ext.price}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-muted-foreground">{ext.isActive ? 'Activo' : 'Pausado'}</span>
                      <Switch checked={ext.isActive} onCheckedChange={() => handleToggleExtra(ext.id, ext.isActive)} />
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteExtra(ext.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {extras.length === 0 && <div className="p-8 text-center text-muted-foreground italic">No hay extras registrados.</div>}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Recipe Modal */}
      <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receta / Escandallo de {activeRecipeProduct?.name}</DialogTitle>
            <DialogDescription>Asigna consumos para calcular sugerencia de precio ($ Costo: {activeRecipeProduct?.suggestedCost?.toLocaleString('es-AR')})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <select id="recipe-stype" className="border rounded px-2 text-sm flex-1" onChange={() => {
                (document.getElementById('recipe-item-s') as HTMLSelectElement).value = "";
              }}>
                <option value="supply">Insumo Base</option>
                <option value="production">Preparación Intermedia</option>
              </select>
              <select id="recipe-item-s" className="border rounded px-2 text-sm flex-1">
                <option value="">Selecciona...</option>
                {supplies.map(s => <option key={s.id} value={'s_' + s.id} className="supply-opt">{s.name} ({s.purchaseUnit})</option>)}
                {productions.map(p => <option key={p.id} value={'p_' + p.id} className="prod-opt hidden">{p.name} (uds)</option>)}
              </select>
              <Input id="recipe-qty" type="number" step="0.01" className="w-24" placeholder="Cant." />
              <Button onClick={() => {
                const sVal = (document.getElementById('recipe-item-s') as HTMLSelectElement).value;
                const qVal = parseFloat((document.getElementById('recipe-qty') as HTMLInputElement).value);
                if (sVal && qVal > 0) {
                  const isSupply = sVal.startsWith('s_');
                  const id = sVal.substring(2);
                  const name = isSupply ? supplies.find(x => x.id === id).name : productions.find(x => x.id === id).name;
                  setRecipeItems([...recipeItems, {
                    supplyId: isSupply ? id : null,
                    productionId: !isSupply ? id : null,
                    quantityUsed: qVal,
                    _tempName: name
                  }]);
                }
              }}>Add</Button>
            </div>

            <div className="mt-4 border p-4 rounded bg-slate-50 min-h-[200px]">
              {recipeItems.map((ri, i) => (
                <div key={i} className="flex justify-between border-b py-2 text-sm">
                  <span>{ri._tempName || ri.supply?.name || ri.production?.name}</span>
                  <div className="flex gap-4">
                    <span className="font-bold">{ri.quantityUsed}</span>
                    <button className="text-red-500" onClick={() => setRecipeItems(recipeItems.filter((_, idx) => idx !== i))}>X</button>
                  </div>
                </div>
              ))}
              {recipeItems.length === 0 && <p className="text-muted-foreground text-xs italic">Generá la receta para descontar de inventario y calcular el FoodCost.</p>}
            </div>

            <Button onClick={handleSaveRecipe} disabled={isSavingRecipe} className="w-full">Guardar Receta</Button>
          </div>
        </DialogContent>
      </Dialog>

    </Tabs>
  );
}