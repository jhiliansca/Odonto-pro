import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { catalogoApi } from '../../../../services/catalogoApi';
import type { Material, ResumenCatalogo } from '../../../../services/catalogoApi';
import './InventorySummary.css';

const InventorySummary: React.FC = () => {
    const [materiales, setMateriales] = useState<Material[]>([]);
    const [resumen, setResumen] = useState<ResumenCatalogo | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const cargar = useCallback(async () => {
        try {
            setCargando(true);
            setError(null);
            const [datosMateriales, datosResumen] = await Promise.all([
                catalogoApi.materiales(),
                catalogoApi.resumen(),
            ]);
            setMateriales(datosMateriales);
            setResumen(datosResumen);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo cargar el inventario');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        void cargar();
        const intervalo = window.setInterval(() => { void cargar(); }, 15000);
        return () => window.clearInterval(intervalo);
    }, [cargar]);

    const categorias = useMemo(() => {
        const grupos = new Map<string, Material[]>();
        materiales.forEach((material) => {
            const categoria = material.categoria || 'Sin categoría';
            const lista = grupos.get(categoria) || [];
            lista.push(material);
            grupos.set(categoria, lista);
        });
        const total = Math.max(materiales.length, 1);
        return Array.from(grupos.entries())
            .map(([categoria, items]) => ({
                categoria,
                cantidad: items.length,
                porcentaje: (items.length / total) * 100,
                stockBajo: items.filter((item) => item.estadoStock !== 'normal').length,
            }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 4);
    }, [materiales]);

    return (
        <div className="inventory-summary-panel">
            <div className="panel-header">
                <h2>Resumen de Inventario</h2>
                <button className="view-all-button" onClick={() => { void cargar(); }}>Actualizar</button>
            </div>
            {error && <div className="inventory-stats">{error}</div>}
            <div className="inventory-summary-list">
                {!cargando && !error && materiales.length === 0 && (
                    <div className="inventory-category">
                        <h3>Sin datos de inventario</h3>
                        <div className="inventory-stats">No hay materiales registrados en el catálogo.</div>
                    </div>
                )}
                {categorias.map((categoria, indice) => (
                    <div className="inventory-category" key={categoria.categoria}>
                        <h3>{categoria.categoria}</h3>
                        <div className="inventory-progress">
                            <div
                                className="progress-bar"
                                style={{
                                    width: `${Math.max(categoria.porcentaje, 4)}%`,
                                    backgroundColor: ['#448aff', '#ff9800', '#16a34a', '#ef4444'][indice % 4],
                                }}
                            ></div>
                        </div>
                        <div className="inventory-stats">
                            {categoria.cantidad} ítems{resumen ? ` · ${categoria.stockBajo} con stock bajo` : ''}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InventorySummary;
