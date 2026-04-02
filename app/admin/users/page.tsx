import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Star, Receipt } from "lucide-react";
import { PointsEditor } from "./PointsEditor";

export default async function AdminUsersPage() {
  const users = await prisma.client.findMany({
    include: {
      _count: {
        select: { orders: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalPointsGiven = users.reduce((acc, u) => acc + u.points, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-bold tracking-tight">Clientes y Puntos</h2>
           <p className="text-muted-foreground">Administración del sistema de fidelización.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Registrados</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos Emitidos Totales</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalPointsGiven}</div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
           <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-bold">
              <tr>
                 <th className="px-6 py-4">Usuario (Teléfono)</th>
                 <th className="px-6 py-4">Nombre</th>
                 <th className="px-6 py-4 text-right">Órdenes</th>
                 <th className="px-6 py-4 text-right">Puntos Acumulados</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
             {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                   <td className="px-6 py-4 font-bold text-slate-800">{u.phone}</td>
                   <td className="px-6 py-4 text-slate-600">{u.name || <span className="italic text-slate-400">Sin nombre</span>}</td>
                   <td className="px-6 py-4 text-right">
                     <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full text-xs font-medium"><Receipt className="w-3 h-3" /> {u._count.orders}</span>
                   </td>
                   <td className="px-6 py-4 text-right">
                     <PointsEditor clientId={u.id} initialPoints={u.points} />
                   </td>
                </tr>
             ))}
             {users.length === 0 && (
                <tr>
                   <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Todavía no hay clientes registrados.</td>
                </tr>
             )}
           </tbody>
        </table>
      </div>
    </div>
  );
}
