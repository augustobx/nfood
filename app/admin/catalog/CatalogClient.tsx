"use client";

import { useState } from "react";
import { Plus, Tag, Carrot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addCategory, toggleCategory, addProduct, toggleProduct, addIngredient, toggleIngredient, addExtra, toggleExtra } from "@/app/actions/admin-catalog";
import { toast } from "sonner";

export function CatalogClient({ initialCategories, allExtras, allIngredients }: { initialCategories: any[], allExtras: any[], allIngredients: any[] }) {

  const [categories, setCategories] = useState(initialCategories);
  const [ingredients, setIngredients] = useState(allIngredients);
  const [extras, setExtras] = useState(allExtras);

  const [newCatName, setNewCatName] = useState("");
  const [newIngredient, setNewIngredient] = useState({ name: "", categoryIds: [] as string[] });
  const [newExtra, setNewExtra] = useState({ name: "", price: "" });
  
  const [newProduct, setNewProduct] = useState({ 
    name: "", basePrice: "", description: "", categoryId: "", imageUrl: "", 
    ingredientIds: [] as string[], extraIds: [] as string[] 
  });
  
  const [isProductDialogOpen, setProductDialogOpen] = useState(false);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const res = await addCategory(newCatName);
    if (res.success) { toast.success("Categoría creada"); window.location.reload(); }
    else { toast.error("Error", { description: res.error }); }
  };
  const handleToggleCategory = async (id: string, current: boolean) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: !current } : c));
    await toggleCategory(id, !current);
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredient.name || newIngredient.categoryIds.length === 0) {
      toast.error("Selecciona al menos una categoría");
      return;
    }
    const res = await addIngredient(newIngredient.name, newIngredient.categoryIds);
    if (res.success) { toast.success("Ingrediente creado"); window.location.reload(); }
    else { toast.error("Error", { description: res.error }); }
  };
  const handleToggleIngredient = async (id: string, current: boolean) => {
    setIngredients(prev => prev.map(c => c.id === id ? { ...c, isActive: !current } : c));
    await toggleIngredient(id, !current);
  };

  const handleCreateExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExtra.name || !newExtra.price) return;
    const res = await addExtra(newExtra.name, parseFloat(newExtra.price));
    if (res.success) { toast.success("Extra creado"); window.location.reload(); }
    else { toast.error("Error", { description: res.error }); }
  };
  const handleToggleExtra = async (id: string, current: boolean) => {
    setExtras(prev => prev.map(c => c.id === id ? { ...c, isActive: !current } : c));
    await toggleExtra(id, !current);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.basePrice || !newProduct.categoryId) return;
    const res = await addProduct({ 
      ...newProduct, 
      basePrice: parseFloat(newProduct.basePrice)
    });
    if (res.success) { toast.success("Producto creado"); window.location.reload(); }
    else { toast.error("Error", { description: res.error }); }
  };
  const handleToggleProduct = async (id: string, current: boolean, categoryId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id === categoryId) {
        return { ...c, products: c.products.map((p: any) => p.id === id ? { ...p, isActive: !current } : p) }
      }
      return c;
    }));
    await toggleProduct(id, !current);
  };

  return (
    <Tabs defaultValue="products" className="space-y-8">
      <TabsList className="bg-slate-100 border p-1 rounded-lg">
        <TabsTrigger value="products" className="rounded-md"><Tag className="w-4 h-4 mr-2"/> Catálogo y Productos</TabsTrigger>
        <TabsTrigger value="ingredients" className="rounded-md"><Carrot className="w-4 h-4 mr-2"/> Ingredientes Globales</TabsTrigger>
        <TabsTrigger value="extras" className="rounded-md"><Sparkles className="w-4 h-4 mr-2"/> Extras Globales</TabsTrigger>
      </TabsList>

      <TabsContent value="products" className="space-y-6">
        <Card className="bg-slate-50 border-dashed border-2">
          <CardContent className="p-6">
            <form className="flex items-end gap-4" onSubmit={handleCreateCategory}>
              <div className="flex-1 space-y-2">
                <Label>Nueva Categoría</Label>
                <Input placeholder="Ej. Hamburguesas" value={newCatName} onChange={e=>setNewCatName(e.target.value)} required />
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
                <Dialog open={isProductDialogOpen && newProduct.categoryId === cat.id} onOpenChange={(open) => {
                  setProductDialogOpen(open);
                  if (open) setNewProduct({ name: "", basePrice: "", description: "", categoryId: cat.id, imageUrl: "", ingredientIds: [], extraIds: [] });
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Producto</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-full">
                    <DialogHeader>
                      <DialogTitle>Nuevo Producto en {cat.name}</DialogTitle>
                      <DialogDescription>Define el producto y selecciona sus ingredientes y extras.</DialogDescription>
                    </DialogHeader>
                    <form id={`add-prod-${cat.id}`} onSubmit={handleCreateProduct} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Precio Base ($)</Label>
                          <Input type="number" min="0" step="0.01" value={newProduct.basePrice} onChange={e=>setNewProduct({...newProduct, basePrice: e.target.value})} required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea value={newProduct.description} onChange={e=>setNewProduct({...newProduct, description: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>URL de Imagen (Opcional)</Label>
                        <Input placeholder="https://..." value={newProduct.imageUrl} onChange={e=>setNewProduct({...newProduct, imageUrl: e.target.value})} />
                      </div>
                      
                      <div className="border-t pt-4">
                        <Label className="mb-2 block text-base font-semibold">Seleccionar Ingredientes (disponibles en esta categoría)</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {ingredients.filter((ing:any) => ing.categories.some((c: any) => c.categoryId === cat.id) && ing.isActive).map((ing:any) => (
                            <div key={ing.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`ing-${ing.id}`}
                                checked={newProduct.ingredientIds.includes(ing.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) setNewProduct({...newProduct, ingredientIds: [...newProduct.ingredientIds, ing.id]});
                                  else setNewProduct({...newProduct, ingredientIds: newProduct.ingredientIds.filter(id => id !== ing.id)});
                                }}
                              />
                              <label htmlFor={`ing-${ing.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{ing.name}</label>
                            </div>
                          ))}
                          {ingredients.filter((ing:any) => ing.categories.some((c: any) => c.categoryId === cat.id)).length === 0 && (
                            <p className="text-sm text-muted-foreground italic col-span-2">No hay ingredientes asignados a esta categoría.</p>
                          )}
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <Label className="mb-2 block text-base font-semibold">Seleccionar Extras Posibles</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {extras.filter((ext:any) => ext.isActive).map((ext:any) => (
                            <div key={ext.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`ext-${ext.id}`}
                                checked={newProduct.extraIds.includes(ext.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) setNewProduct({...newProduct, extraIds: [...newProduct.extraIds, ext.id]});
                                  else setNewProduct({...newProduct, extraIds: newProduct.extraIds.filter(id => id !== ext.id)});
                                }}
                              />
                              <label htmlFor={`ext-${ext.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{ext.name} (+${ext.price})</label>
                            </div>
                          ))}
                        </div>
                      </div>

                    </form>
                    <DialogFooter>
                      <Button type="submit" form={`add-prod-${cat.id}`}>Guardar Producto</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {cat.products.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground italic">No hay productos en esta categoría.</div>
              ) : (
                <div className="divide-y">
                  {cat.products.map((prod: any) => (
                    <div key={prod.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-semibold">{prod.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">{prod.description}</p>
                        <div className="text-sm mt-1">
                          <span className="font-bold text-orange-600">${prod.basePrice.toLocaleString('es-AR')}</span>
                          {' • '}
                          <span className="text-muted-foreground">{prod.ingredients?.length || 0} Ingredientes | {prod.extras?.length || 0} Extras</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                         <span className="text-xs text-muted-foreground">{prod.isActive ? 'Activo' : 'Pausado'}</span>
                         <Switch checked={prod.isActive} onCheckedChange={() => handleToggleProduct(prod.id, prod.isActive, cat.id)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      <TabsContent value="ingredients" className="space-y-6">
        <Card className="bg-slate-50 border-dashed border-2">
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleCreateIngredient}>
              <div className="space-y-2">
                <Label>Nuevo Ingrediente Global</Label>
                <Input placeholder="Ej. Lechuga, Tomate" value={newIngredient.name} onChange={e=>setNewIngredient({...newIngredient, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Aplica para las categorías:</Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 border rounded-md">
                  {categories.map(c => (
                     <div key={c.id} className="flex items-center space-x-2">
                       <Checkbox 
                         id={`cat-${c.id}`}
                         checked={newIngredient.categoryIds.includes(c.id)}
                         onCheckedChange={(checked) => {
                           if (checked) setNewIngredient({...newIngredient, categoryIds: [...newIngredient.categoryIds, c.id]});
                           else setNewIngredient({...newIngredient, categoryIds: newIngredient.categoryIds.filter(id => id !== c.id)});
                         }}
                       />
                       <label htmlFor={`cat-${c.id}`} className="text-sm font-medium leading-none">{c.name}</label>
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
                {ingredients.map((ing:any) => (
                  <div key={ing.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div>
                      <h4 className="font-semibold">{ing.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Categorías: {ing.categories.map((ic:any) => categories.find(c => c.id === ic.categoryId)?.name).filter(Boolean).join(", ") || "Ninguna"}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-muted-foreground">{ing.isActive ? 'Activo' : 'Pausado'}</span>
                      <Switch checked={ing.isActive} onCheckedChange={() => handleToggleIngredient(ing.id, ing.isActive)} />
                    </div>
                  </div>
                ))}
                {ingredients.length === 0 && <div className="p-8 text-center text-muted-foreground italic">No hay ingredientes registrados.</div>}
             </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="extras" className="space-y-6">
        <Card className="bg-slate-50 border-dashed border-2">
          <CardContent className="p-6">
            <form className="flex items-end gap-4" onSubmit={handleCreateExtra}>
              <div className="flex-1 space-y-2">
                <Label>Nuevo Extra Global</Label>
                <Input placeholder="Ej. Porción de Papas" value={newExtra.name} onChange={e=>setNewExtra({...newExtra, name: e.target.value})} required />
              </div>
              <div className="w-32 space-y-2">
                <Label>Precio (+ $)</Label>
                <Input type="number" min="0" step="0.01" value={newExtra.price} onChange={e=>setNewExtra({...newExtra, price: e.target.value})} required />
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
                {extras.map((ext:any) => (
                  <div key={ext.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                    <div>
                      <h4 className="font-semibold">{ext.name}</h4>
                      <p className="text-lg font-bold text-orange-600 mt-1">+${ext.price}</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-muted-foreground">{ext.isActive ? 'Activo' : 'Pausado'}</span>
                      <Switch checked={ext.isActive} onCheckedChange={() => handleToggleExtra(ext.id, ext.isActive)} />
                    </div>
                  </div>
                ))}
                {extras.length === 0 && <div className="p-8 text-center text-muted-foreground italic">No hay extras registrados.</div>}
             </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
