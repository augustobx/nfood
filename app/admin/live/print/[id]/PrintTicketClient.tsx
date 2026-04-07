"use client";

import { useEffect } from "react";

export function PrintTicketClient({ order, config }: { order: any; config: any }) {

  useEffect(() => {
    // Print dialog opens instantly
    const t = setTimeout(() => {
       window.print();
    }, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .page-break { page-break-after: always; margin: 0; padding: 0; border: none; }
        }
      `}} />
      <div className="bg-white text-black max-w-[80mm] mx-auto font-mono text-xs leading-tight">
        
        {/* TICKET 1: COCINA */}
        <div className="p-4">
           <div className="text-center mb-4">
             {config?.logoUrl && <img src={config.logoUrl} alt="Logo" className="w-16 mx-auto mb-2" style={{ filter: 'grayscale(100%)' }} />}
             <h1 className="text-xl font-black">{config?.appName || "NFOOD"}</h1>
             <p className="text-sm border-b border-black pb-2 border-dashed">TICKET COCINA</p>
           </div>

           <div className="mb-4">
             <p><strong>Orden:</strong> #{order.id.slice(-5).toUpperCase()}</p>
             <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleString('es-AR')}</p>
             <p><strong>Cliente:</strong> {order.clientName}</p>
             {order.needsDelivery ? (
               <p><strong>TIPO:</strong> ENVÍO</p>
             ) : (
               <p><strong>TIPO:</strong> RETIRO AL MOSTRADOR</p>
             )}
             <p><strong>Hora Est.:</strong> {order.deliveryTime}</p>
           </div>

           <div className="border-t border-b border-dashed border-black py-2 mb-4 space-y-2">
             {order.items.map((item: any, i: number) => (
               <div key={i} className="mb-2">
                 <div className="flex justify-between font-bold text-sm">
                   <span>{item.quantity}x {item.product.name}</span>
                 </div>
                 {item.addedExtras?.length > 0 && (
                   <div className="pl-4 text-[11px] font-bold">+ {item.addedExtras.map((e:any)=>e.extra.name).join(', ')}</div>
                 )}
                 {item.removedIngredients?.length > 0 && (
                   <div className="pl-4 text-[11px] font-black uppercase">- SIN: {item.removedIngredients.map((ing:any)=>ing.ingredient.name).join(', ')}</div>
                 )}
                 {item.notes && <div className="pl-4 text-[12px] font-black uppercase underline">NOTAS: {item.notes}</div>}
               </div>
             ))}
           </div>
        </div>

        <div className="page-break"></div>

        {/* TICKET 2: CLIENTE */}
        <div className="p-4">
           <div className="text-center mb-4">
             {config?.logoUrl && <img src={config.logoUrl} alt="Logo" className="w-16 mx-auto mb-2" style={{ filter: 'grayscale(100%)' }} />}
             <h1 className="text-xl font-black">{config?.appName || "NFOOD"}</h1>
             <p className="text-sm border-b border-black pb-2 border-dashed">TICKET DE PEDIDO</p>
           </div>

           <div className="mb-4">
             <p><strong>Orden:</strong> #{order.id.slice(-5).toUpperCase()}</p>
             <p><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleString('es-AR')}</p>
             <p><strong>Cliente:</strong> {order.clientName}</p>
             <p><strong>Tel:</strong> {order.clientPhone}</p>
             {order.needsDelivery ? (
               <>
                 <p><strong>TIPO:</strong> ENVÍO</p>
                 <p><strong>Dirección:</strong> {order.deliveryAddress}</p>
               </>
             ) : (
               <p><strong>TIPO:</strong> RETIRO AL MOSTRADOR</p>
             )}
             <p><strong>Hora Est.:</strong> {order.deliveryTime}</p>
           </div>

           <div className="border-t border-b border-dashed border-black py-2 mb-4 space-y-2">
             {order.items.map((item: any, i: number) => (
               <div key={i} className="mb-2">
                 <div className="flex justify-between font-bold">
                   <span>{item.quantity}x {item.product.name}</span>
                   <span>${item.subtotal.toLocaleString('es-AR')}</span>
                 </div>
                 {item.addedExtras?.length > 0 && (
                   <div className="pl-4 text-[10px]">+ {item.addedExtras.map((e:any)=>e.extra.name).join(', ')}</div>
                 )}
                 {item.removedIngredients?.length > 0 && (
                   <div className="pl-4 text-[10px]">- SIN: {item.removedIngredients.map((ing:any)=>ing.ingredient.name).join(', ')}</div>
                 )}
               </div>
             ))}
           </div>

           <div className="space-y-1 mb-4 text-sm">
             <div className="flex justify-between">
               <span>Subtotal:</span>
               <span>${order.total.toLocaleString('es-AR')}</span> 
             </div>
             <div className="flex justify-between font-black text-base border-t border-black pt-1">
               <span>TOTAL:</span>
               <span>${order.total.toLocaleString('es-AR')}</span>
             </div>
             <p className="mt-2 text-center text-[10px] font-bold border border-black p-1">
                {order.paymentMethod === "CASH" ? "A COBRAR EN EFECTIVO" : "PAGADO VÍA MERCADOPAGO"}
             </p>
           </div>

           <div className="text-center flex flex-col items-center mt-8">
             <p>¡Muchas gracias por su compra!</p>
             <p>---------------</p>
           </div>
        </div>

      </div>
    </>
  );
}
