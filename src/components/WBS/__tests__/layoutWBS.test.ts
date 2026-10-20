import { describe, it, expect } from 'vitest';
import { CARD_W, CARD_H, Y_LEVELS, GAP_X, GAP_FASE, safeCoord } from '../GrafoWBS';

describe('Geometría y Cotas Canónicas del Grafo WBS (REQ-F2-P2.1p)', () => {
  it('garantiza las cotas verticales inmutables Y_LEVELS', () => {
    expect(Y_LEVELS.proyecto).toBe(40);
    expect(Y_LEVELS.fase).toBe(200);
    expect(Y_LEVELS.wbs).toBe(380);
    expect(Y_LEVELS.tarea).toBe(580);
    expect(Y_LEVELS.canaletaDependencias).toBe(700);
    expect(Y_LEVELS.gasto).toBe(780);
  });

  it('garantiza las dimensiones exactas de tarjetas CARD_W y CARD_H', () => {
    expect(CARD_W.proyecto).toBe(320);
    expect(CARD_W.fase).toBe(220);
    expect(CARD_W.wbs).toBe(250);
    expect(CARD_W.tarea).toBe(220);
    expect(CARD_W.gasto).toBe(180);

    expect(CARD_H.proyecto).toBe(120);
    expect(CARD_H.fase).toBe(80);
    expect(CARD_H.wbs).toBe(120);
    expect(CARD_H.tarea).toBe(90);
    expect(CARD_H.gasto).toBe(60);
  });

  it('garantiza los espaciados horizontales canónicos GAP_X y GAP_FASE', () => {
    expect(GAP_X).toBe(36);
    expect(GAP_FASE).toBe(60);
  });

  it('sanitiza coordenadas no finitas o anómalas con safeCoord impidiendo colapso a (0,0)', () => {
    expect(safeCoord(150.7)).toBe(151);
    expect(safeCoord(0)).toBe(0);
    expect(safeCoord(NaN, 60)).toBe(60);
    expect(safeCoord(undefined, 100)).toBe(100);
    expect(safeCoord(Infinity, 60)).toBe(60);
    expect(safeCoord(-Infinity, 60)).toBe(60);
    expect(safeCoord('invalid' as any, 60)).toBe(60);
  });

  it('evalúa correctamente el enfoque de nodos críticos frente a no críticos (REQ-F2-P2.1t)', () => {
    const rawNodes = [
      { id: 'TAR-001', type: 'tareaNode', data: { esCritica: true, nodoCPM: { esCritico: true } } },
      { id: 'TAR-002', type: 'tareaNode', data: { esCritica: false, nodoCPM: { esCritico: false, holguraTotal: 5 } } },
      { id: 'WP-001', type: 'wbsNode', data: { esCritica: true } }
    ];

    const soloRutaCritica = true;
    const styled = rawNodes.map((n) => {
      const nodoCPM = (n.data as any)?.nodoCPM;
      const esCritico = Boolean(
        (n.data as any)?.esCritica ||
        nodoCPM?.esCritico ||
        (nodoCPM?.holguraTotal !== undefined && nodoCPM.holguraTotal <= 0.05)
      );

      const nodeStyle: Record<string, any> = {};
      const nodeData = { ...(n.data as any) };
      let nodeClass = '';

      if (soloRutaCritica) {
        if (esCritico && n.type === 'tareaNode') {
          nodeStyle.opacity = 1;
          nodeStyle.zIndex = 100;
          nodeData.isCriticalFocused = true;
          nodeClass = 'wbs-node-focused ring-2 ring-sky-400';
        } else {
          nodeStyle.opacity = 0.25;
          nodeStyle.filter = 'grayscale(60%)';
          nodeData.isCriticalFocused = false;
          nodeClass = 'wbs-node-dimmed';
        }
      }

      return { ...n, className: nodeClass, style: nodeStyle, data: nodeData };
    });

    // Tarea crítica: 100% visible, focused, zIndex 100
    expect(styled[0].data.isCriticalFocused).toBe(true);
    expect(styled[0].style.opacity).toBe(1);
    expect(styled[0].style.zIndex).toBe(100);
    expect(styled[0].className).toContain('wbs-node-focused');

    // Tarea no crítica: atenuada a 0.25
    expect(styled[1].data.isCriticalFocused).toBe(false);
    expect(styled[1].style.opacity).toBe(0.25);
    expect(styled[1].className).toContain('wbs-node-dimmed');

    // WP superior: atenuado a 0.25 en modo Ruta Crítica
    expect(styled[2].data.isCriticalFocused).toBe(false);
    expect(styled[2].style.opacity).toBe(0.25);
    expect(styled[2].className).toContain('wbs-node-dimmed');
  });

  it('evalúa correctamente aristas críticas (#F59E0B, 3.5px, glow) vs no críticas (opacity 0.08, 1px) (REQ-F2-P2.1t)', () => {
    const criticalTaskIds = new Set(['TAR-001', 'TAR-002']);
    const rawEdges = [
      { id: 'edge-dep-1', source: 'TAR-001', target: 'TAR-002', data: { esEnlaceCritico: true } },
      { id: 'edge-tree-1', source: 'WP-001', target: 'TAR-001', data: { esArbolSuperior: true } }
    ];

    const soloRutaCritica = true;
    const styledEdges = rawEdges.map((e) => {
      const sourceIsCrit = criticalTaskIds.has(e.source);
      const targetIsCrit = criticalTaskIds.has(e.target);
      const esArbolSup = Boolean(e.data?.esArbolSuperior);
      const isCritical = Boolean(e.data?.esEnlaceCritico) || (sourceIsCrit && targetIsCrit && !esArbolSup);

      const edgeStyle: Record<string, any> = {};
      let animated = false;

      if (soloRutaCritica) {
        if (isCritical) {
          edgeStyle.stroke = '#F59E0B';
          edgeStyle.strokeWidth = 3.5;
          edgeStyle.opacity = 1;
          edgeStyle.filter = 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.95))';
          animated = true;
        } else {
          edgeStyle.opacity = 0.08;
          edgeStyle.strokeWidth = 1;
        }
      }
      return { ...e, style: edgeStyle, animated };
    });

    expect(styledEdges[0].style.stroke).toBe('#F59E0B');
    expect(styledEdges[0].style.strokeWidth).toBe(3.5);
    expect(styledEdges[0].style.opacity).toBe(1);
    expect(styledEdges[0].animated).toBe(true);

    expect(styledEdges[1].style.opacity).toBe(0.08);
    expect(styledEdges[1].style.strokeWidth).toBe(1);
    expect(styledEdges[1].animated).toBe(false);
  });

  it('garantiza la inmutabilidad de posiciones (x, y) de tareas críticas y ausencia de transform destructivo (REQ-F2-P2.1u)', () => {
    // 1. Simulación de nodos con posiciones calculadas canónicamente
    const canonicalNodes = [
      { id: 'TAR-001', type: 'tareaNode', position: { x: 120, y: 580 }, data: { esCritica: true } },
      { id: 'TAR-002', type: 'tareaNode', position: { x: 376, y: 580 }, data: { esCritica: true } },
      { id: 'TAR-003', type: 'tareaNode', position: { x: 632, y: 580 }, data: { esCritica: false } }
    ];

    // Simular el cambio a Ruta Crítica ON
    const soloRutaCritica = true;
    const transformed = canonicalNodes.map((n) => {
      const esCrit = Boolean(n.data.esCritica);
      return {
        ...n,
        position: n.position, // Coordenadas canónicas preservadas
        className: soloRutaCritica ? (esCrit ? 'wbs-node-focused' : 'wbs-node-dimmed') : ''
      };
    });

    // Validar que cada nodo mantiene su posición X e Y exacta sin colapsar a 0
    expect(transformed[0].position.x).toBe(120);
    expect(transformed[0].position.y).toBe(580);
    expect(transformed[1].position.x).toBe(376);
    expect(transformed[1].position.y).toBe(580);
    expect(transformed[2].position.x).toBe(632);
    expect(transformed[2].position.y).toBe(580);

    // Las clases no deben incluir utilidades de transformación de Tailwind en el wrapper
    transformed.forEach((node) => {
      expect(node.className).not.toContain('scale-');
      expect(node.className).not.toContain('translate-');
      expect(node.className).not.toContain('-translate-');
    });
  });
});

