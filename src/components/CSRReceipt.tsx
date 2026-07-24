import React, { useRef } from 'react';
import type { CSRReceipt as ReceiptType } from '../context/FoodFlowContext';
import { Award, ShieldCheck, Leaf, Printer, Download } from 'lucide-react';

interface CSRReceiptProps {
  receipt: ReceiptType;
  onClose?: () => void;
}

export const CSRReceipt: React.FC<CSRReceiptProps> = ({ receipt, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const triggerPDFExport = () => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    
    if (!printWindow) {
      // Fallback if popup is blocked: use visible iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '100vw';
      iframe.style.height = '100vh';
      iframe.style.zIndex = '99999';
      iframe.style.background = '#ffffff';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(generatePrintHTML());
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 300);
      }
      return;
    }

    printWindow.document.open();
    printWindow.document.write(generatePrintHTML());
    printWindow.document.close();
  };

  const generatePrintHTML = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <title>CSR_Tax_Receipt_${receipt.id}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; 
            background: #ffffff !important; 
            color: #0f172a !important; 
            padding: 24px;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .certificate-card {
            border: 5px double #059669;
            border-radius: 24px;
            padding: 40px;
            background: #f8fafc;
            max-width: 720px;
            margin: 0 auto;
            position: relative;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          }
          .cert-header {
            text-align: center;
            margin-bottom: 24px;
          }
          .badge-icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: #d1fae5;
            border: 2px solid #059669;
            color: #059669;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 14px auto;
            font-size: 32px;
          }
          .cert-title {
            font-size: 26px;
            font-weight: 800;
            color: #065f46;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .cert-subtitle {
            font-size: 11px;
            font-weight: 700;
            color: #059669;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 4px;
          }
          .divider {
            width: 140px;
            height: 3px;
            background: linear-gradient(90deg, #059669, #0d9488);
            margin: 14px auto;
            border-radius: 2px;
          }
          .cert-desc {
            text-align: center;
            font-size: 13px;
            color: #475569;
            line-height: 1.6;
            margin-bottom: 28px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            border-top: 2px dashed #cbd5e1;
            border-bottom: 2px dashed #cbd5e1;
            padding: 24px 0;
            margin-bottom: 28px;
          }
          .label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
            display: block;
          }
          .value {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 3px;
          }
          .value-emerald { color: #059669; }
          .value-sky { color: #0284c7; }
          .full-width { grid-column: span 2; }
          
          .metrics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 14px;
            margin-bottom: 32px;
          }
          .metric-card {
            padding: 14px;
            border-radius: 14px;
            text-align: center;
            background: #ffffff;
            border: 1px solid #cbd5e1;
          }
          .metric-card.emerald { background: #ecfdf5; border-color: #a7f3d0; }
          .metric-card.teal { background: #f0fdfa; border-color: #99f6e4; }
          .metric-val {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
          }
          .metric-val.emerald { color: #059669; }
          .metric-val.teal { color: #0d9488; }
          .metric-lbl {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            margin-top: 4px;
          }

          .footer-sig {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1px solid #cbd5e1;
            padding-top: 20px;
          }
          .sig-hash {
            font-family: monospace;
            font-size: 9px;
            color: #64748b;
            margin-top: 4px;
            max-width: 300px;
            word-break: break-all;
          }
          .sig-line {
            border-bottom: 1.5px solid #059669;
            padding-bottom: 4px;
            font-style: italic;
            font-weight: 700;
            font-size: 13px;
            color: #059669;
          }
        </style>
      </head>
      <body>
        <div class="certificate-card">
          <div class="cert-header">
            <div class="badge-icon">🏅</div>
            <div class="cert-title">Certificate of Social Impact</div>
            <div class="cert-subtitle">Food Redistribution & CSR Tax Verification</div>
            <div class="divider"></div>
          </div>

          <div class="cert-desc">
            This official document certifies that the surplus food listed below was successfully 
            recovered and redistributed under Section 80G tax exemption criteria to feed the community.
          </div>

          <div class="details-grid">
            <div>
              <span class="label">Certificate ID</span>
              <div class="value" style="font-family: monospace;">${receipt.id}</div>
            </div>
            <div>
              <span class="label">Redistribution Date</span>
              <div class="value">${receipt.date}</div>
            </div>
            <div>
              <span class="label">Donating Restaurant</span>
              <div class="value value-emerald">${receipt.restaurantName}</div>
            </div>
            <div>
              <span class="label">Recipient Organization</span>
              <div class="value value-sky">${receipt.ngoName}</div>
            </div>
            <div class="full-width">
              <span class="label">Surplus Food Recovered</span>
              <div class="value" style="font-size: 16px;">${receipt.dishName}</div>
            </div>
          </div>

          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-val">${receipt.weight} kg</div>
              <div class="metric-lbl">Total Weight</div>
            </div>
            <div class="metric-card emerald">
              <div class="metric-val emerald">${receipt.estimatedMeals}</div>
              <div class="metric-lbl">Meals Served</div>
            </div>
            <div class="metric-card teal">
              <div class="metric-val teal">${receipt.carbonSaved} kg</div>
              <div class="metric-lbl">CO₂ Prevented</div>
            </div>
          </div>

          <div class="footer-sig">
            <div>
              <span class="label" style="color: #059669;">✔ Verified Platform Signature</span>
              <div class="sig-hash">${receipt.signature}</div>
            </div>
            <div style="text-align: right;">
              <div class="sig-line">FoodFlow CSR System</div>
              <span class="label" style="margin-top: 4px;">Official Endorsement</span>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
      </body>
    </html>
  `;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 no-print animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-white/80 rounded-3xl overflow-hidden shadow-2xl shadow-white/20 relative">
        
        {/* Certificate Container (Printed Content Source) */}
        <div className="p-8 md:p-12 overflow-y-auto max-h-[85vh]">
          <div ref={printRef} className="border-4 border-white/80 rounded-2xl p-6 md:p-8 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-100 relative shadow-2xl">
            
            {/* Background Watermark/Aesthetic Details */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
              <Leaf size={250} className="text-emerald-400" />
            </div>

            {/* Certificate Header */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                <Award size={36} className="text-emerald-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight uppercase tracking-wider">
                Certificate of Social Impact
              </h1>
              <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mt-1">
                Food Redistribution & CSR Tax Verification
              </p>
              <div className="w-32 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full my-4" />
            </div>

            {/* Certificate Content Statement */}
            <div className="mt-6 text-center text-slate-300 text-sm leading-relaxed">
              This official document certifies that the surplus food listed below was successfully 
              recovered and redistributed under Section 80G tax exemption criteria to feed the community.
            </div>

            {/* Core Certificate Details Table */}
            <div className="mt-8 grid grid-cols-2 gap-y-4 gap-x-6 border-t border-b border-slate-800 py-6 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Certificate ID</span>
                <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">{receipt.id}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Redistribution Date</span>
                <p className="text-xs font-bold text-slate-200 mt-0.5">{receipt.date}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Donating Restaurant</span>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">{receipt.restaurantName}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Recipient Organization</span>
                <p className="text-xs font-bold text-sky-400 mt-0.5">{receipt.ngoName}</p>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Surplus Food Recovered</span>
                <p className="text-sm font-bold text-slate-100 mt-0.5">{receipt.dishName}</p>
              </div>
            </div>

            {/* Highlighted Impact Metrics */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-center items-center">
                <span className="text-lg font-black text-white">{receipt.weight} kg</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mt-1">Total Weight</span>
              </div>
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-xl flex flex-col justify-center items-center">
                <span className="text-lg font-black text-emerald-400">{receipt.estimatedMeals}</span>
                <span className="text-[9px] uppercase tracking-wider text-emerald-500/70 font-bold mt-1">Meals Served</span>
              </div>
              <div className="p-3 bg-teal-950/20 border border-teal-900/30 rounded-xl flex flex-col justify-center items-center">
                <span className="text-lg font-black text-teal-400">{receipt.carbonSaved} kg</span>
                <span className="text-[9px] uppercase tracking-wider text-teal-500/70 font-bold mt-1">CO₂ Prevented</span>
              </div>
            </div>

            {/* Certificate Footer Signature Block */}
            <div className="mt-10 flex justify-between items-end border-t border-slate-800/50 pt-6 text-left">
              <div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                  <ShieldCheck size={14} />
                  <span>Verified Platform Signature</span>
                </div>
                <span className="text-[9px] font-mono text-slate-500 block mt-1 select-all break-all max-w-[280px]">
                  {receipt.signature}
                </span>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="w-24 h-8 border-b border-emerald-500/30 flex items-center justify-center mb-1">
                  <span className="italic text-slate-400 font-bold text-xs">FoodFlow CSR</span>
                </div>
                <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase">Official Endorsement</span>
              </div>
            </div>

          </div>
        </div>

        {/* Certificate Action Header controls */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all bg-transparent hover:bg-slate-900 border border-transparent hover:border-slate-800"
            >
              Close
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={triggerPDFExport}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-750 transition-all border border-slate-700/50 shadow-md"
            >
              <Download size={14} className="text-emerald-400" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={triggerPDFExport}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active-press"
            >
              <Printer size={14} />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
export default CSRReceipt;
