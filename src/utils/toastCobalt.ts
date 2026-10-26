import Swal from 'sweetalert2';

export const mostrarToastCobalt = (
  mensaje: string,
  tipo: 'success' | 'info' | 'warning' | 'error' = 'success',
  duracionMs: number = 2500
) => {
  return Swal.fire({
    toast: true,
    position: 'bottom-end',
    icon: tipo,
    title: mensaje,
    timer: duracionMs,
    timerProgressBar: true,
    showConfirmButton: false,
    background: '#0D1526',
    color: '#f8fafc',
    customClass: {
      popup: 'border border-slate-800/80 shadow-[0_10px_35px_-5px_rgba(2,6,23,0.8),0_0_20px_rgba(56,189,248,0.15)] rounded-2xl text-xs font-semibold select-none'
    }
  });
};
