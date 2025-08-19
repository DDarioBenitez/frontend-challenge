import { useMemo, useState } from "react";
import type { Product } from "../types/Product";
import "./QuoteModal.css";
import { computePricing } from "../data/pricing";

/** IVA in Chile (19%) */
const IVA = 0.19;

/** CLP formatter (no decimals) */
const formatCLP = (n: number) => Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(Math.round(n));

/** --- RUT helpers (Chile) --- */
// Removes dots and normalizes hyphen
const cleanRut = (rut: string) => rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
// Calculates verification digit
const calcDV = (rutNumber: string) => {
    let M = 0,
        S = 1;
    for (; rutNumber; rutNumber = (rutNumber as any).slice(0, -1)) {
        S = (S + Number(rutNumber.slice(-1)) * (9 - (M++ % 6))) % 11;
    }
    return S ? String(S - 1) : "K";
};
// Validates RUT (nnnnnnn-dv)
const validateRut = (rut: string) => {
    const c = cleanRut(rut);
    if (!/^\d{1,8}[0-9K]$/.test(c)) return false;
    const body = c.slice(0, -1);
    const dv = c.slice(-1);
    return calcDV(body) === dv;
};
// Formats RUT like 12.345.678-9
const formatRut = (rut: string) => {
    const c = cleanRut(rut);
    if (!c) return "";
    const body = c.slice(0, -1);
    const dv = c.slice(-1);
    const withDots = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${withDots}-${dv}`;
};

type QuoteModalProps = {
    /** Controlled open/close by parent */
    open: boolean;
    onClose: () => void;

    /** Product context */
    product: Product;

    /** Quantity to quote */
    quantity: number;

    /** Optional override if caller already computed unit price */
    unitPriceOverride?: number;

    /** Optional override if caller already computed net subtotal (unit*qty) */
    netSubtotalOverride?: number;
};

const QuoteModal = ({ open, onClose, product, quantity, unitPriceOverride, netSubtotalOverride }: QuoteModalProps) => {
    // --- Company form state (Chile) ---
    const [rut, setRut] = useState("");
    const [razon, setRazon] = useState("");
    const [giro, setGiro] = useState("");
    const [email, setEmail] = useState("");
    const [telefono, setTelefono] = useState("");
    const [region, setRegion] = useState("");
    const [comuna, setComuna] = useState("");
    const [direccion, setDireccion] = useState("");
    const [notas, setNotas] = useState("");

    const rutOk = useMemo(() => (rut ? validateRut(rut) : true), [rut]);

    // --- Pricing summary ---
    const computed = computePricing(product, quantity);
    const unitPrice = unitPriceOverride ?? computed.unitPrice;
    const netSubtotal = netSubtotalOverride ?? computed.netSubtotal;
    const discountPercent = computed.discountPercent;

    const iva = netSubtotal * IVA;
    const total = netSubtotal + iva;

    // --- Export JSON ---
    const handleExportJSON = () => {
        const payload = {
            type: "cotizacion",
            issuedAt: new Date().toISOString(),
            company: {
                rut: formatRut(rut),
                razon,
                giro,
                email,
                telefono,
                region,
                comuna,
                direccion,
                notas,
            },
            items: [
                {
                    id: product.id,
                    sku: product.sku,
                    name: product.name,
                    qty: quantity,
                    unitPriceCLP: unitPrice,
                    lineNetCLP: netSubtotal,
                    discountPercent: Number(discountPercent.toFixed(1)),
                },
            ],
            totals: {
                netCLP: Math.round(netSubtotal),
                ivaRate: 19,
                ivaCLP: Math.round(iva),
                totalCLP: Math.round(total),
            },
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `cotizacion_${product.sku}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // --- Print / Save as PDF ---
    const handlePrint = () => {
        const w = window.open("", "_blank", "noopener,noreferrer");
        if (!w) return;
        w.document.write(`
      <html>
        <head>
          <title>Cotización</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin: 0 0 8px; }
            small { color:#555; }
            .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px 24px; margin-top: 12px; }
            .box { padding:12px; border:1px solid #eee; border-radius:8px; }
            .totals { margin-top:16px; }
            .totals div { display:flex; justify-content:space-between; margin:6px 0; }
            .total { font-size: 18px; font-weight: bold; }
            table { width:100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border:1px solid #eee; padding:8px; text-align:left; }
            th { background:#fafafa; }
          </style>
        </head>
        <body>
          <h1>Cotización</h1>
          <small>Emitida: ${new Date().toLocaleString("es-CL")}</small>

          <div class="grid">
            <div class="box">
              <h3>Empresa</h3>
              <div>RUT: ${rut ? formatRut(rut) : "-"}</div>
              <div>Razón Social: ${razon || "-"}</div>
              <div>Giro: ${giro || "-"}</div>
              <div>Email: ${email || "-"}</div>
              <div>Teléfono: ${telefono || "-"}</div>
              <div>Región/Comuna: ${region || "-"} / ${comuna || "-"}</div>
              <div>Dirección: ${direccion || "-"}</div>
            </div>
            <div class="box">
              <h3>Resumen</h3>
              <div>Producto: ${product.name} (${product.sku})</div>
              <div>Cantidad: ${quantity}</div>
              <div>Precio unitario: ${formatCLP(unitPrice)}</div>
              <div>Descuento: ${discountPercent.toFixed(1)}%</div>
              <div class="totals">
                <div><span>Subtotal (neto)</span><strong>${formatCLP(netSubtotal)}</strong></div>
                <div><span>IVA (19%)</span><strong>${formatCLP(iva)}</strong></div>
                <div class="total"><span>Total</span><strong>${formatCLP(total)}</strong></div>
              </div>
            </div>
          </div>

          <h3>Ítems</h3>
          <table>
            <thead><tr><th>SKU</th><th>Producto</th><th>Cant.</th><th>Unitario</th><th>Total (neto)</th></tr></thead>
            <tbody>
              <tr>
                <td>${product.sku}</td>
                <td>${product.name}</td>
                <td>${quantity}</td>
                <td>${formatCLP(unitPrice)}</td>
                <td>${formatCLP(netSubtotal)}</td>
              </tr>
            </tbody>
          </table>

          ${notas ? `<h3>Notas</h3><div>${notas}</div>` : ""}

          <script>window.print();</script>
        </body>
      </html>
    `);
        w.document.close();
    };

    return (
        <>
            <div className={`quote-overlay ${open ? "open" : ""}`} onClick={onClose} aria-hidden={!open} />

            <aside className={`quote-modal ${open ? "open" : ""}`} role="dialog" aria-modal="true" aria-label="Simulador de Cotización">
                <header className="quote-header">
                    <h3 className="p1-medium">Simulador de Cotización</h3>
                    <button className="icon-btn" onClick={close} aria-label="Cerrar">
                        <span className="material-icons">close</span>
                    </button>
                </header>

                <div className="quote-body">
                    {/* Company form */}
                    <section className="section">
                        <h4 className="section-title">Datos de empresa (Chile)</h4>
                        <div className="form-grid">
                            <div className={`field ${rut && !rutOk ? "error" : ""}`}>
                                <label>RUT</label>
                                <input type="text" inputMode="text" placeholder="12.345.678-9" value={rut} onChange={(e) => setRut(e.target.value)} />
                                {!rutOk && <small className="error-text">RUT inválido</small>}
                            </div>
                            <div className="field">
                                <label>Razón social</label>
                                <input type="text" value={razon} onChange={(e) => setRazon(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Giro</label>
                                <input type="text" value={giro} onChange={(e) => setGiro(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Email</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Teléfono</label>
                                <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Región</label>
                                <input type="text" value={region} onChange={(e) => setRegion(e.target.value)} />
                            </div>
                            <div className="field">
                                <label>Comuna</label>
                                <input type="text" value={comuna} onChange={(e) => setComuna(e.target.value)} />
                            </div>
                            <div className="field field-full">
                                <label>Dirección</label>
                                <input type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                            </div>
                            <div className="field field-full">
                                <label>Notas</label>
                                <textarea rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
                            </div>
                        </div>
                    </section>

                    {/* Quote summary */}
                    <section className="section">
                        <h4 className="section-title">Resumen</h4>
                        <div className="summary">
                            <div className="summary-row">
                                <span>Producto</span>
                                <strong>
                                    {product.name} ({product.sku})
                                </strong>
                            </div>
                            <div className="summary-row">
                                <span>Cantidad</span>
                                <strong>{quantity}</strong>
                            </div>
                            <div className="summary-row">
                                <span>Precio unitario</span>
                                <strong>{formatCLP(unitPrice)}</strong>
                            </div>
                            <div className="summary-row">
                                <span>Descuento</span>
                                <strong>{discountPercent.toFixed(1)}%</strong>
                            </div>
                            <div className="divider" />
                            <div className="summary-row">
                                <span>Subtotal (neto)</span>
                                <strong>{formatCLP(netSubtotal)}</strong>
                            </div>

                            <div className="summary-row">
                                <span>IVA (19%)</span>
                                <strong>{formatCLP(iva)}</strong>
                            </div>
                            <div className="summary-row total">
                                <span>Total</span>
                                <strong>{formatCLP(total)}</strong>
                            </div>
                        </div>
                    </section>
                </div>

                <footer className="quote-footer">
                    <button className="btn btn-ghost" onClick={handleExportJSON}>
                        Exportar JSON
                    </button>
                    <button className="btn btn-primary" onClick={handlePrint} disabled={!rutOk && !!rut}>
                        Imprimir / Guardar PDF
                    </button>
                </footer>
            </aside>
        </>
    );
};

export default QuoteModal;
