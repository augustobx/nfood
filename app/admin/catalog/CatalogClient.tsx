"use client";

import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { addCategory, toggleCategory, addProduct, toggleProduct } from "@/app/actions/admin-catalog";
import { toast } from "sonner";

export function CatalogClient({ initialCategories, allExtras }: { initialCategories: any[], allExtras: any[] }) {

  const [categories, setCategories] = useState(initialCategories);

  const [newCatName, setNewCatName] = useState("");
  const [newProduct, setNewProduct] = useState({ name: "", basePrice: "", description: "", categoryId: "", imageUrl: "" });
  const [isProductDialogOpen, setProductDialogOpen] = useState(false);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    const res = await addCategory(newCatName);
    if (res.success) {
      toast.success("Categoría creada");
      setNewCatName("");
      // Using window.location.reload() for full state refresh as a shortcut, 
      // although Next.js Server Actions usually revalidate the data.
      window.location.reload(); 
    } else {
      toast.error("Error", { description: res.error });
    }
  };

  const handleToggleCategory = async (id: string, current: boolean) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: !current } : c));
    await toggleCategory(id, !current);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.basePrice || !newProduct.categoryId) return;
    
    const res = await addProduct({ 
      ...newProduct, 
      basePrice: parseFloat(newProduct.basePrice)
    });
    
    if (res.success) {
      toast.success("Producto creado");
      setProductDialogOpen(false);
      setNewProduct({ name: "", basePrice: "", description: "", categoryId: "", imageUrl: "" });
      window.location.reload();
    } else {
      toast.error("Error", { description: res.error });
    }
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
    <div className="space-y-8">
      {/* Category Creation Form */}
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

      {/* Main Catalog View */}
      <div className="space-y-6">
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
                  if (open) setNewProduct(prev => ({ ...prev, categoryId: cat.id }));
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Producto</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuevo Producto en {cat.name}</DialogTitle>
                      <DialogDescription>Completa los detalles básicos del producto.</DialogDescription>
                    </DialogHeader>
                    <form id={`add-prod-${cat.id}`} onSubmit={handleCreateProduct} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Precio ($)</Label>
                        <Input type="number" min="0" step="0.01" value={newProduct.basePrice} onChange={e=>setNewProduct({...newProduct, basePrice: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea value={newProduct.description} onChange={e=>setNewProduct({...newProduct, description: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>URL de Imagen (Opcional)</Label>
                        <Input placeholder="https://..." value={newProduct.imageUrl} onChange={e=>setNewProduct({...newProduct, imageUrl: e.target.value})} />
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
                          <span className="text-muted-foreground">{prod.ingredients?.length || 0} Ing. | {prod.extras?.length || 0} Extras</span>
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

        {categories.length === 0 && (
          <div className="text-center py-20 bg-white border border-dashed rounded-lg text-muted-foreground">
            Aún no has creado ninguna categoría.
          </div>
        )}
      </div>
    </div>
  );
}
