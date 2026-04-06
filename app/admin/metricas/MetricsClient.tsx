"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, AlertOctagon, Utensils, ArrowUpRight } from "lucide-react";
import {
   LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, subDays, isAfter, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

export function MetricsClient({ orders, expenses, products }: { orders: any[], expenses: any[], products: any[] }) {
   const [timeRange, setTimeRange] = useState("30");

   const { filteredOrders, filteredExpenses, chartData, totals } = useMemo(() => {
      let startDate = new Date(0);
      const now = new Date();

      if (timeRange !== "all") {
         startDate = startOfDay(subDays(now, parseInt(timeRange) - 1));
      }

      const fOrders = orders.filter(o => isAfter(new Date(o.createdAt), startDate));
      const fExpenses = expenses.filter(e => isAfter(new Date(e.date), startDate));

      let tRevenue = 0;
      fOrders.forEach(o => tRevenue += o.total);

      let tExpenses = 0;
      fExpenses.forEach(e => tExpenses += e.amount);

      const dataMap: Record<string, { date: string, ventas: number, gastos: number }> = {};

      if (timeRange !== "all") {
         for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
            const d = format(subDays(now, i), 'yyyy-MM-dd');
            dataMap[d] = { date: d, ventas: 0, gastos: 0 };
         }
      }

      fOrders.forEach(o => {
         const d = format(new Date(o.createdAt), 'yyyy-MM-dd');
         if (!dataMap[d]) dataMap[d] = { date: d, ventas: 0, gastos: 0 };
         dataMap[d].ventas += o.total;
      });

      fExpenses.forEach(e => {
         const d = format(new Date(e.date), 'yyyy-MM-dd');
         if (!dataMap[d]) dataMap[d] = { date: d, ventas: 0, gastos: 0 };
         dataMap[d].gastos += e.amount;
      });

      const cData = Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));

      const cDataFormatted = cData.map(d => ({
         ...d,
         fechaStr: format(new Date(d.date + "T12:00:00"), "d MMM", { locale: es })
      }));

      return {
         filteredOrders: fOrders,
         filteredExpenses: fExpenses,
         chartData: cDataFormatted,
         totals: {
            revenue: tRevenue,
            expenses: tExpenses,
            profit: tRevenue - tExpenses,
            foodCostPct: tRevenue > 0 ? (tExpenses / tRevenue) * 100 : 0
         }
      };
   }, [orders, expenses, timeRange]);

   const analyzedProducts = products.map(p => {
      const fcPercent = p.basePrice > 0 ? (p.suggestedCost / p.basePrice) * 100 : 0;
      let status = "green";
      if (fcPercent > 35) status = "red";
      else if (fcPercent > 25) status = "yellow";

      return { ...p, fcPercent, status };
   }).sort((a, b) => b.fcPercent - a.fcPercent);

   const redAlerts = analyzedProducts.filter(p => p.status === 'red');

   return (
      <div className="space-y-6">

         <div className="flex justify-between items-center">
            <Select value={timeRange} onValueChange={(v) => v && setTimeRange(v)}>
               <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Selecciona..." />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="7">Últimos 7 días</SelectItem>
                  <SelectItem value="30">Últimos 30 días</SelectItem>
                  <SelectItem value="90">Últimos 90 días</SelectItem>
                  <SelectItem value="all">Historico Total</SelectItem>
               </SelectContent>
            </Select>
         </div>

         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ventas Brutas</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold">${totals.revenue.toLocaleString('es-AR')}</div>
                  <p className="text-xs text-muted-foreground">Ingresos totales del período</p>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gastos Insumos</CardTitle>
                  <Utensils className="h-4 w-4 text-orange-500" />
               </CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold text-orange-600">-${totals.expenses.toLocaleString('es-AR')}</div>
                  <p className="text-xs text-muted-foreground">Costo de mercadería vendida teórica</p>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Utilidad Operativa</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
               </CardHeader>
               <CardContent>
                  <div className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                     ${totals.profit.toLocaleString('es-AR')}
                  </div>
                  <p className="text-xs text-muted-foreground">Ventas - Costos de materia prima</p>
               </CardContent>
            </Card>

            <Card className={`${totals.foodCostPct > 35 ? 'border-red-400 bg-red-50' : totals.foodCostPct > 0 ? 'border-green-400 bg-green-50' : ''}`}>
               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold">Food Cost % (Real)</CardTitle>
                  {totals.foodCostPct > 35 ? <AlertOctagon className="h-4 w-4 text-red-500" /> : <DollarSign className="h-4 w-4 text-green-500" />}
               </CardHeader>
               <CardContent>
                  <div className={`text-2xl font-black ${totals.foodCostPct > 35 ? 'text-red-600' : 'text-green-700'}`}>
                     {totals.foodCostPct.toFixed(1)}%
                  </div>
                  <p className={`text-xs ${totals.foodCostPct > 35 ? 'text-red-600' : 'text-green-600'}`}>
                     {totals.foodCostPct > 35 ? 'Peligro (Ideal < 33%)' : 'Rentabilidad saludable'}
                  </p>
               </CardContent>
            </Card>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>Flujo de Ingresos vs Gastos</CardTitle>
               <CardDescription>Comparativa diaria de facturación contra compras de bodega.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="fechaStr" tickLine={false} tickMargin={10} axisLine={false} style={{ fontSize: '12px' }} />
                     <YAxis tickFormatter={(val) => `$${val / 1000}k`} tickLine={false} axisLine={false} style={{ fontSize: '12px' }} />
                     <Tooltip formatter={(value: number) => `$${value.toLocaleString('es-AR')}`} labelStyle={{ color: 'black' }} />
                     <Legend />
                     <Line type="monotone" name="Ventas ($)" dataKey="ventas" stroke="#22c55e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                     <Line type="monotone" name="Gastos ($)" dataKey="gastos" stroke="#f97316" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  </LineChart>
               </ResponsiveContainer>
            </CardContent>
         </Card>

         <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-red-200">
               <CardHeader className="bg-red-50/50 rounded-t-xl border-b border-red-100">
                  <CardTitle className="text-red-700 font-bold flex items-center gap-2">
                     <AlertOctagon className="w-5 h-5" /> Sugerencia de Precios (Riesgo Alto)
                  </CardTitle>
                  <CardDescription>Estos productos tienen un costo de producción que supera el 35% de su precio de venta, ahogando tu margen de ganancia.</CardDescription>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="divide-y">
                     {redAlerts.length === 0 && <p className="p-6 text-center text-sm font-medium text-green-600">¡Excelente! Ningún producto está en la zona roja de FoodCost.</p>}
                     {redAlerts.map(p => (
                        <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                           <div>
                              <h4 className="font-bold text-slate-800">{p.name}</h4>
                              <p className="text-xs text-muted-foreground">Vended a: ${p.basePrice} | Cuesta: ${p.suggestedCost.toLocaleString('es-AR', { maximumFractionDigits: 1 })}</p>
                           </div>
                           <div className="text-right">
                              <span className="bg-red-100 text-red-700 font-black px-2 py-1 rounded text-sm block">FC: {p.fcPercent.toFixed(1)}%</span>
                              <span className="text-[10px] text-red-500 font-medium">Sube el precio</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="bg-slate-50 rounded-t-xl border-b">
                  <CardTitle className="text-slate-800 font-bold flex items-center gap-2">
                     <ArrowUpRight className="w-5 h-5" /> Todos los Escandallos (Food Cost)
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                  <div className="divide-y">
                     {analyzedProducts.filter(p => p.status !== 'red').map(p => (
                        <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                           <div>
                              <h4 className="font-semibold text-slate-800 text-sm">{p.name}</h4>
                              <p className="text-xs text-muted-foreground">${p.suggestedCost.toLocaleString('es-AR', { maximumFractionDigits: 1 })} / ${p.basePrice}</p>
                           </div>
                           <div className="text-right">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                 }`}>
                                 {p.fcPercent > 0 ? `${p.fcPercent.toFixed(1)}%` : 'Sin Costos'}
                              </span>
                           </div>
                        </div>
                     ))}
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
   );
}