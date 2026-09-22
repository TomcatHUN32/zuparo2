import React, { useState } from 'react';
import { Printer, X, Copy, Check, Utensils, Receipt, Phone, MapPin, Clock, AlertCircle } from 'lucide-react';
import { formatFt } from '../mock/mockData';
import { toast } from 'sonner';

export const KitchenTicketModal = ({ order, isOpen, onClose }) => {
  const [mode, setMode] = useState('kitchen'); // 'kitchen' | 'receipt'
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const orderTime = order.createdAt
    ? new Date(order.createdAt).toLocaleString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleTimeString('hu-HU');

  const handlePrint = () => {
    window.print();
  };

  const getPlainText = () => {
    let txt = `================================\n`;
    txt += mode === 'kitchen' ? `      ZUPARO - KONYHA BLOKK      \n` : `     ZUPARO ÉTTEREM - NYUGTA     \n`;
    txt += `================================\n`;
    txt += `Rendelésszám: ${order.id}\n`;
    txt += `Időpont: ${orderTime}\n`;
    txt += `Típus: ${order.type === 'delivery' ? 'KISZÁLLÍTÁS' : order.type === 'pickup' ? 'ELVITEL' : 'HELYBEN'}\n`;
    txt += `Csatorna: ${order.isOnlineOrder || order.payment === 'online' ? 'ONLINE RENDELÉS' : (order.channel || 'Saját')}\n`;
    txt += `--------------------------------\n`;
    txt += `Vendég: ${order.customerName || 'Névtelen'}\n`;
    txt += `Telefon: ${order.phone || '-'}\n`;
    if (order.type === 'delivery') {
      txt += `Cím: ${order.zip || ''} ${order.city || ''}, ${order.street || ''} ${order.floor || ''}\n`;
    }
    if (order.note) {
      txt += `MEGJEGYZÉS: ${order.note}\n`;
    }
    txt += `--------------------------------\n`;
    txt += `TÉTELEK:\n`;
    (order.items || []).forEach((it, idx) => {
      txt += `${idx + 1}. [ ${it.qty} db ] ${it.name}`;
      if (mode === 'receipt') {
        txt += ` - ${formatFt(it.price * it.qty)}`;
      }
      txt += `\n`;
      if (it.note) {
        txt += `   >> Megj.: ${it.note}\n`;
      }
    });
    txt += `--------------------------------\n`;
    if (mode === 'receipt') {
      txt += `Részösszeg: ${formatFt(order.subtotal || 0)}\n`;
      if (order.deliveryFee) txt += `Szállítás: ${formatFt(order.deliveryFee)}\n`;
      if (order.discountAmount) txt += `Kedvezmény: -${formatFt(order.discountAmount)}\n`;
      txt += `ÖSSZESEN: ${formatFt(order.total || 0)}\n`;
      txt += `Fizetés: ${order.payment === 'cash' ? 'Készpénz' : order.payment === 'card' ? 'Bankkártya' : 'Online fizetés'}\n`;
    }
    txt += `================================\n`;
    return txt;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getPlainText());
    setCopied(true);
    toast.success('Blokk szöveg vágólapra másolva!');
    setTimeout(() => setCopied(false), 2000);
  };

  const isOnline = order.isOnlineOrder || order.channel === 'online' || order.payment === 'online' || order.source === 'web';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
              <Printer size={18} />
            </div>
            <div>
              <div className="text-base font-bold text-white">Nyomtatási előnézet</div>
              <div className="text-xs text-neutral-400">Rendelés: <span className="text-amber-400 font-mono font-bold">{order.id}</span></div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900 px-6 pt-3 gap-2">
          <button
            onClick={() => setMode('kitchen')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
              mode === 'kitchen'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Utensils size={15} /> Konyhai blokk
          </button>
          <button
            onClick={() => setMode('receipt')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
              mode === 'receipt'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Receipt size={15} /> Vendég nyugta
          </button>
        </div>

        {/* Scrollable Receipt Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-950 flex justify-center">
          {/* Printable Ticket Paper Card */}
          <div
            id="kitchen-ticket-print-area"
            className="w-full max-w-[360px] bg-white text-black p-6 rounded-lg shadow-xl font-mono text-xs border border-neutral-300 leading-tight"
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-neutral-400 pb-3 mb-3">
              <div className="font-bold text-lg tracking-wider">ZUPARO ÉTTEREM</div>
              <div className="text-neutral-600 text-[10px]">3734 Szuhogy, Petőfi u. 12.</div>
              <div className="text-neutral-600 text-[10px]">Tel: +36 48 123 456</div>
              <div className="mt-2 inline-block font-extrabold text-sm px-3 py-1 bg-black text-white rounded">
                {mode === 'kitchen' ? '*** KONYHA BLOKK ***' : 'VENDÉG NYUGTA'}
              </div>
              <div className="mt-1">
                {order.channel === 'foodora' ? (
                  <span className="inline-block font-black text-xs px-2.5 py-0.5 bg-black text-white rounded tracking-wide">
                    🛵 [ FOODORA RENDELÉS ]
                  </span>
                ) : order.channel === 'falatozz' ? (
                  <span className="inline-block font-black text-xs px-2.5 py-0.5 bg-black text-white rounded tracking-wide">
                    🍕 [ FALATOZZ.HU RENDELÉS ]
                  </span>
                ) : (
                  <span className="inline-block font-bold text-xs px-2 py-0.5 bg-neutral-200 text-black rounded tracking-wide">
                    {order.isOnlineOrder || order.payment === 'online' ? '🌐 [ SAJÁT ONLINE WEBSHOP ]' : '👑 [ SAJÁT / HÁZI RENDELÉS ]'}
                  </span>
                )}
              </div>
            </div>

            {/* Order meta */}
            <div className="space-y-1 mb-3 text-[11px] border-b border-dashed border-neutral-400 pb-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Rendelésszám:</span>
                <span className="font-black text-sm">{order.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Időpont:</span>
                <span className="font-bold">{orderTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Típus:</span>
                <span className="font-extrabold uppercase px-1.5 py-0.5 bg-neutral-200 rounded">
                  {order.type === 'delivery' ? 'Kiszállítás' : order.type === 'pickup' ? 'Elvitel' : 'Helyben'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Forrás:</span>
                <span className="font-bold">
                  {isOnline ? '🌐 ONLINE RENDELÉS' : order.channel === 'foodora' ? 'Foodora' : order.channel === 'falatozz' ? 'Falatozz' : 'Helyi / Telefon'}
                </span>
              </div>
            </div>

            {/* Customer info */}
            <div className="mb-3 border-b border-dashed border-neutral-400 pb-3 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-600">Vendég:</span>
                <span className="font-bold">{order.customerName || 'Névtelen'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Telefon:</span>
                <span className="font-bold">{order.phone || '-'}</span>
              </div>
              {order.type === 'delivery' && (
                <div>
                  <div className="text-neutral-600">Szállítási cím:</div>
                  <div className="font-bold mt-0.5 pl-2 border-l-2 border-black">
                    {order.zip} {order.city}, {order.street}
                    {order.floor ? ` (${order.floor})` : ''}
                  </div>
                </div>
              )}
              {order.note && (
                <div className="mt-2 p-2 bg-neutral-100 rounded border border-neutral-300">
                  <div className="font-bold text-[10px] text-red-600 uppercase flex items-center gap-1">
                    <AlertCircle size={10} /> Megjegyzés:
                  </div>
                  <div className="font-bold text-neutral-800 text-[11px] mt-0.5">{order.note}</div>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="mb-3 border-b border-dashed border-neutral-400 pb-3">
              <div className="font-bold text-[11px] mb-2 pb-1 border-b border-neutral-200 flex justify-between">
                <span>TÉTEL</span>
                {mode === 'receipt' && <span>ÁR</span>}
              </div>
              <div className="space-y-2">
                {(order.items || []).map((it, idx) => (
                  <div key={idx} className="pb-1 border-b border-neutral-100 last:border-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-1.5 flex-1 pr-2">
                        <span className="font-black text-sm text-black bg-neutral-200 px-1 rounded min-w-[28px] text-center">
                          {it.qty}×
                        </span>
                        <span className="font-bold text-[12px] leading-snug">{it.name}</span>
                      </div>
                      {mode === 'receipt' && (
                        <div className="font-bold text-[11px] whitespace-nowrap">
                          {formatFt(it.price * it.qty)}
                        </div>
                      )}
                    </div>
                    {it.note && (
                      <div className="text-[10px] text-red-600 font-semibold pl-8 mt-0.5">
                        * {it.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="text-right text-[10px] text-neutral-600 mt-2">
                Összesen tételek száma:{' '}
                <span className="font-bold text-black">
                  {(order.items || []).reduce((s, it) => s + (it.qty || 1), 0)} db
                </span>
              </div>
            </div>

            {/* Receipt Totals (shown only in receipt mode) */}
            {mode === 'receipt' && (
              <div className="space-y-1 text-[11px] border-b border-dashed border-neutral-400 pb-3 mb-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Részösszeg:</span>
                  <span>{formatFt(order.subtotal || order.total || 0)}</span>
                </div>
                {Boolean(order.deliveryFee) && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Szállítási díj:</span>
                    <span>{formatFt(order.deliveryFee)}</span>
                  </div>
                )}
                {Boolean(order.packagingFee) && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Csomagolási díj:</span>
                    <span>{formatFt(order.packagingFee)}</span>
                  </div>
                )}
                {Boolean(order.drsFee) && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">DRS visszaváltási díj:</span>
                    <span>{formatFt(order.drsFee)}</span>
                  </div>
                )}
                {Boolean(order.discountAmount) && (
                  <div className="flex justify-between text-red-600">
                    <span>Kedvezmény ({order.couponCode || 'Kupon'}):</span>
                    <span>-{formatFt(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center font-extrabold text-sm pt-1 border-t border-neutral-300">
                  <span>FIZETENDŐ:</span>
                  <span className="text-base">{formatFt(order.total || 0)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-600 pt-1">
                  <span>Fizetési mód:</span>
                  <span className="font-bold text-black uppercase">
                    {order.payment === 'cash' ? 'Készpénz' : order.payment === 'card' ? 'Bankkártya' : 'Online bankkártya'}
                  </span>
                </div>
              </div>
            )}

            {/* Kitchen bottom notice */}
            <div className="text-center pt-2 text-[10px] text-neutral-500">
              {mode === 'kitchen' ? (
                <div className="font-bold text-neutral-700">JÓ ÉTVÁGYAT KÍVÁNUNK!</div>
              ) : (
                <>
                  <div>Köszönjük a rendelést!</div>
                  <div className="text-[9px] text-neutral-400 mt-0.5">Egyszerűsített számviteli bizonylat</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950">
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Másolva!' : 'Szöveg másolása'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold transition-colors"
            >
              Mégse
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
            >
              <Printer size={15} /> Nyomtatás ({mode === 'kitchen' ? 'Konyha blokk' : 'Nyugta'})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitchenTicketModal;
