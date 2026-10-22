export type CategoriaVida =
  | 'SALUD_DEPORTE'
  | 'DESARROLLO_ESTUDIO'
  | 'LABORAL_HONORARIO'
  | 'FINANZAS_TRAMITES'
  | 'SOCIAL_FAMILIA'
  | 'PERSONAL_DESCANSO';

export type TipoCompromiso = 'HABITUAL' | 'PUNTUAL' | 'META';

export type FrecuenciaCiclo =
  | 'DIARIA'
  | 'DIARIA_LABORAL'
  | 'FIN_SEMANA'
  | 'SEMANAL'
  | 'QUINCENAL'
  | 'MENSUAL'
  | 'NINGUNA';

export type EstadoActividad =
  | '01_Backlog'
  | '02_Por_Hacer'
  | '03_En_Curso'
  | '04_Completado'
  | '05_Archivado';

export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'error';

export type AlcanceRecurrencia = 'SINGLE' | 'FUTURE' | 'ALL';

export interface ActividadPersonal {
  id: string; // UUID primary key
  user_id: string;
  codigo_legado: string; // ACT-XXX
  nombre_actividad: string;
  tipo_compromiso: TipoCompromiso;
  categoria_vida: CategoriaVida;
  meta_macro_nombre?: string;
  unidad_medida?: string;
  meta_objetivo_total?: number;
  valor_acumulado_actual?: number;
  meta_diaria_estandar?: number;
  nivel_rescate_minimo?: number;
  estado: EstadoActividad;
  racha_actual: number;
  fecha_programada: string; // YYYY-MM-DD
  fecha_fin?: string; // YYYY-MM-DD para finalización o corte de serie
  hora_inicio?: string; // HH:mm
  duracion_horas: number;
  agendado_calendar: 'Sí' | 'No';
  id_evento_calendar?: string;
  monto_gasto_asociado?: number;
  notas_checklist?: string;
  frecuencia_ciclo?: FrecuenciaCiclo;
  regla_repeticion?: string;
  excepciones_fechas?: string[]; // Fechas omitidas en modo SINGLE
  actividad_padre_id?: string; // Enlace a serie maestra si es instancia desacoplada
  ultima_fecha_completado?: string; // YYYY-MM-DD día de última compleción
  proxima_fecha_programada?: string; // YYYY-MM-DD siguiente fecha proyectada
  historial_fechas?: string[]; // Fechas YYYY-MM-DD donde se completó la actividad
  created_at?: string;
  updated_at: string;
  version: number;
  sync_status: SyncStatus;
}

export interface SubtareaPaso {
  id: string; // UUID primary key
  user_id: string;
  codigo_legado: string; // SUB-XXX
  id_padre_vinculado: string; // TAR-XXX o ACT-XXX
  tipo_padre: 'TAREA' | 'ACTIVIDAD';
  numero_paso: number;
  descripcion_paso: string;
  completado: boolean;
  fecha_completado?: string;
  created_at?: string;
  updated_at: string;
  version: number;
  sync_status: SyncStatus;
}

export interface CategoriaConfig {
  clave: CategoriaVida;
  nombre: string;
  icono: string;
  colorBarra: string;
  badgeClase: string;
  accentBorder: string;
}

export const CATEGORIAS_VIDA_MAP: Record<CategoriaVida, CategoriaConfig> = {
  SALUD_DEPORTE: {
    clave: 'SALUD_DEPORTE',
    nombre: 'Salud & Deporte',
    icono: 'HeartPulse',
    colorBarra: 'bg-emerald-500',
    badgeClase: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    accentBorder: 'hover:border-emerald-500/50'
  },
  DESARROLLO_ESTUDIO: {
    clave: 'DESARROLLO_ESTUDIO',
    nombre: 'Desarrollo Personal',
    icono: 'BookOpen',
    colorBarra: 'bg-blue-500',
    badgeClase: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    accentBorder: 'hover:border-blue-500/50'
  },
  LABORAL_HONORARIO: {
    clave: 'LABORAL_HONORARIO',
    nombre: 'Trabajo & Carrera',
    icono: 'Briefcase',
    colorBarra: 'bg-violet-500',
    badgeClase: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    accentBorder: 'hover:border-violet-500/50'
  },
  FINANZAS_TRAMITES: {
    clave: 'FINANZAS_TRAMITES',
    nombre: 'Finanzas & Admin',
    icono: 'Wallet',
    colorBarra: 'bg-purple-500',
    badgeClase: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    accentBorder: 'hover:border-purple-500/50'
  },
  SOCIAL_FAMILIA: {
    clave: 'SOCIAL_FAMILIA',
    nombre: 'Hogar & Familia',
    icono: 'Users',
    colorBarra: 'bg-amber-500',
    badgeClase: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    accentBorder: 'hover:border-amber-500/50'
  },
  PERSONAL_DESCANSO: {
    clave: 'PERSONAL_DESCANSO',
    nombre: 'Ocio & Social',
    icono: 'Coffee',
    colorBarra: 'bg-pink-500',
    badgeClase: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    accentBorder: 'hover:border-pink-500/50'
  }
};

// ============================================================================
// MÓDULO: METAS, PLANES E HITOS CUANTITATIVOS (N:M CON HÁBITOS)
// ============================================================================

export type TipoMeta = 'CUANTITATIVA' | 'CUALITATIVA' | 'PROYECTO_ASOCIADO';

export interface MetaPlanRecord {
  id: string; // UUID primary key
  user_id: string;
  codigo_legado: string; // MET-XXX
  nombre_meta: string;
  descripcion?: string;
  categoria_vida: CategoriaVida;
  tipo_meta?: TipoMeta | string;
  unidad_medida?: string;
  meta_objetivo_total: number;
  valor_acumulado_actual: number;
  nivel_rescate_minimo: number;
  peso_hitos_pct: number;
  peso_habitos_pct: number;
  fecha_inicio?: string; // YYYY-MM-DD
  fecha_fin?: string; // YYYY-MM-DD
  estado: string; // '01_Backlog' | '02_En_Progreso' | '03_Completado' | '04_En_Pausa' | '05_Archivado'
  proyecto_id?: string | null;
  created_at?: string;
  updated_at: string;
  version: number;
  sync_status: SyncStatus;
}

export interface HitoPlanRecord {
  id: string; // UUID primary key
  user_id: string;
  codigo_legado: string; // HIT-PLN-XXX
  meta_id: string;
  titulo_hito: string;
  orden_secuencia: number;
  fecha_objetivo?: string; // YYYY-MM-DD
  completado: boolean;
  fecha_completado?: string; // YYYY-MM-DD
  peso_relativo: number;
  created_at?: string;
  updated_at: string;
  version: number;
  sync_status: SyncStatus;
}

export type ModoComputoVinculo = 'VOLUMEN_DIRECTO' | 'TASA_CONVERSION' | 'CHECK_BINARIO';

export interface HabitoMetaVinculo {
  id: string; // UUID primary key
  user_id: string;
  habito_id: string; // Referencia a actividad_personal (hábito)
  meta_id: string; // Referencia a meta_plan
  modo_computo: ModoComputoVinculo | string;
  factor_conversion: number;
  peso_contribucion_pct: number;
  meta_volumen_esperada: number;
  created_at?: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface HabitoLogRecord {
  id: string; // UUID primary key
  user_id: string;
  habito_id: string;
  fecha_registro: string; // YYYY-MM-DD
  hora_registro?: string; // HH:mm
  completado: boolean;
  valor_cuantitativo_sumado?: number;
  es_rescate?: boolean;
  nota_contexto?: string;
  created_at?: string;
  updated_at: string;
  sync_status: SyncStatus;
}

// ============================================================================
// MÓDULO 3: HITOS / WBS Y GESTOR DE NOTAS MARKDOWN
// ============================================================================

export type TipoElementoWBS = 'PAQUETE_TRABAJO' | 'HITO_MARCADOR';
export type EstadoHito = '01_Pendiente' | '02_En_Progreso' | '03_Completado';

export interface HitoWbsRecord {
  id: string; // UUID primary key
  user_id: string;
  codigo_legado: string; // 'WP-001' o 'HIT-001'
  proyecto_id: string;
  tipo_elemento_wbs: TipoElementoWBS;
  wbs_code: string; // ej. '1.1', '1.2.1'
  fase_asociada: string; // '01_INICIACION', '02_PLANIFICACION', etc.
  nombre_elemento: string;
  estado: EstadoHito;
  peso_pct: number; // 0.00 a 1.00 (suma fase = 1.0)
  fecha_limite: string; // YYYY-MM-DD
  fecha_real_fin?: string;
  presupuesto_asignado: number;
  duracion_estimada_dias?: number;
  criterio_dod?: string;
  dependencia_hito_id?: string; // Código legado de dependencia(s)
  entregable_link?: string;
  created_at?: string;
  updated_at: string;
  version: number;
  sync_status: SyncStatus;
}

export type TipoNota = 'TEXTO' | 'CHECKLIST' | 'WISHLIST' | 'TABLA' | 'TEXTO_LIBRE';

export interface ChecklistItem {
  id: string;
  texto: string;
  completado: boolean;
}

export interface WishlistMeta {
  costoEstimado?: number;
  montoRealGastado?: number;
  moneda?: 'PEN' | 'USD';
  prioridad?: 'ALTA' | 'MEDIA' | 'BAJA' | string;
  comprado?: boolean;
  urlReferencia?: string;
  tienda?: string;
  estado?: 'DESEADO' | 'EN_PROCESO' | 'CONSEGUIDO' | 'ARCHIVADO' | string;
  estadoDeseo?: string;
  fechaConseguido?: string | null;
  nivelDeseo?: string;
  enlaceReferencia?: string;
}

export interface AdjuntoDrive {
  id: string;
  nombre: string;
  url: string;
  mimeType: string;
}

export type TipoEntidadVinculable =
  | 'PROYECTO'
  | 'HITO'
  | 'TAREA'
  | 'ACTIVIDAD'
  | 'HABITO'
  | 'GASTO'
  | 'INGRESO'
  | 'IDEA'
  | 'FINANZAS';

export interface VinculoEntidad {
  tipo: TipoEntidadVinculable;
  codigo: string; // ej. TAR-001, ACT-002, GAS-005, PRO-001
  titulo: string;
  id_entidad?: string;
}

export interface NotaRecord {
  id: string; // UUID primary key
  user_id: string;
  codigo_legado: string; // 'NOT-00001'
  titulo: string;
  contenido_markdown: string;
  tipo_nota: TipoNota | string;
  checklists_json: ChecklistItem[];
  wishlist_json?: WishlistMeta;
  color_tema: string; // Token de color o HEX
  color?: string; // Alias canónico de conveniencia
  es_fijada: boolean;
  fijada?: boolean; // Alias canónico de conveniencia
  block_nombre?: string; // Block / Cuaderno agrupador (ej. 'General', 'Proyectos', etc.)
  adjuntos_drive_json: AdjuntoDrive[];
  enlaces_entidades_json: VinculoEntidad[];
  etiquetas: string[];
  created_at?: string;
  updated_at: string;
  version: number;
  sync_status: SyncStatus;
}

// ============================================================================
// CONTRATOS CPM (CRITICAL PATH METHOD)
// ============================================================================

export interface NodoCalculadoCPM {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoElementoWBS;
  wbsCode: string;
  fase: string;
  duracion: number;
  pesoPct: number;
  estado: EstadoHito;
  predecesores: string[]; // Códigos o IDs
  sucesores: string[];
  es: number; // Early Start
  ef: number; // Early Finish
  ls: number; // Late Start
  lf: number; // Late Finish
  holguraTotal: number; // LS - ES
  esCritico: boolean; // holguraTotal <= 0.0001
}

export interface ResultadoCalculoCPM {
  nodos: Map<string, NodoCalculadoCPM>;
  duracionProyecto: number;
  rutaCritica: string[]; // Códigos de nodos en ruta crítica
  tieneCiclos: boolean;
  cicloDetectado?: string[];
  balancePonderaciones: {
    fase: string;
    sumaPesos: number;
    estaBalanceada: boolean;
  }[];
}

// ============================================================================
// MÓDULO 7: ENTIDADES CANÓNICAS DEL CHASIS MAESTRO (PROYECTOS, TAREAS, FINANZAS, IDEAS)
// ============================================================================

export interface ProyectoRecord {
  id: string;
  user_id: string;
  codigo_legado: string; // PRO-XXX
  nombre_proyecto: string;
  tipo_iniciativa: 'Personal' | 'Profesional' | 'Inversiones' | 'Social' | string;
  categoria_tshirt?: string;
  magnitud_complejidad?: string;
  arquetipo_proyecto?: string;
  estado_proyecto: string;
  avance_real_pct: number;
  fecha_inicio_plan?: string;
  fecha_fin_plan?: string;
  moneda_base: 'PEN' | 'USD';
  presupuesto_tope: number;
  costo_ejecutado_real_pen: number;
  costo_ejecutado_real_usd: number;
  north_star_okr?: string;
  criterios_aceptacion_dod?: string;
  entregable_tangible_objeto?: string;
  fase_ciclo_vida?: string;
  ultima_revision?: string;
  health_status?: string;
  health_motivo?: string;
  spi?: number;
  cpi?: number;
  terceros_involucrados?: string;
  alcance_detallado_url_drive?: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface TareaRecord {
  id: string;
  user_id: string;
  codigo_legado: string; // TAR-XXX
  proyecto_codigo?: string;
  hito_codigo?: string;
  nombre_tarea_actividad: string;
  estado_tarea: '01_Backlog' | '02_Por_Hacer' | '03_En_Proceso' | '04_Completado' | '05_Archivado' | string;
  prioridad_eisenhower?: string;
  nivel_energia_requerido?: string;
  horas_estimadas?: number;
  horas_reales?: number;
  fecha_programada?: string;
  hora_inicio?: string; // HH:mm
  agendado_calendar?: 'Sí' | 'No';
  id_dependencia?: string;
  responsable_ejecutor?: string;
  notas_impedimentos?: string;
  es_mav?: boolean;
  costo_real_pen?: number;
  archivado?: boolean;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface GastoRecord {
  id: string;
  user_id: string;
  codigo_legado: string; // GAS-XXX
  tipo_origen: string;
  id_origen_vinculado?: string;
  categoria_gasto: string;
  fecha_gasto: string;
  descripcion_gasto: string;
  moneda_original: 'PEN' | 'USD' | 'EUR';
  monto_original: number;
  tipo_cambio: number;
  monto_pen: number;
  modalidad?: string;
  metodo_pago?: string;
  estado_pago: 'PAGADO' | 'PENDIENTE' | 'PROGRAMADO' | string;
  comprobante_url?: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface IngresoRecord {
  id: string;
  user_id: string;
  codigo_legado: string; // ING-XXX
  tipo_origen: string;
  categoria_ingreso: string;
  fecha_ingreso: string;
  descripcion_ingreso: string;
  moneda_original: 'PEN' | 'USD' | 'EUR';
  monto_original: number;
  tipo_cambio: number;
  monto_pen: number;
  metodo_cobro?: string;
  cuenta_destino?: string;
  estado_cobro: 'COBRADO' | 'PENDIENTE' | string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface IdeaRecord {
  id: string;
  user_id: string;
  codigo_legado: string; // IDE-XXX
  enunciado_idea: string;
  detalle_contexto?: string;
  tipo_captura: 'TEXTO' | 'VOZ' | 'ARCHIVO' | 'FOTO' | string;
  url_adjunto_drive?: string;
  transcripcion_texto?: string;
  clarificacion_ia?: string;
  estado: 'CAPTURA' | 'REVISADA' | 'CONVERTIDA' | 'ARCHIVADA' | string;
  entidad_convertida?: string;
  id_entidad_destino?: string;
  fecha_captura: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface CuotaRecord {
  id: string;
  user_id: string;
  codigo_legado: string; // CUO-XXX
  id_credito_padre?: string;
  entidad_financiera: string;
  numero_cuota: number;
  total_cuotas: number;
  monto_cuota: number;
  moneda: 'PEN' | 'USD';
  fecha_vencimiento: string;
  estado_cuota: 'PAGADO' | 'PENDIENTE' | 'VENCIDO' | string;
  updated_at: string;
  sync_status: SyncStatus;
}
