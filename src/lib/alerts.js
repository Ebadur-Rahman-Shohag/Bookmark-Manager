import Swal from 'sweetalert2';

const theme = {
  background: '#161B22',
  color: '#F0F6FC',
};

const fire = (options) => Swal.fire({ ...theme, ...options });

export const showWarning = (title, text) => fire({ icon: 'warning', title, text });

export const showError = (title, text) => fire({ icon: 'error', title, text });

export const showToast = ({ icon = 'success', title, text, timer = 2000 }) =>
  fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    text,
    timer,
    timerProgressBar: true,
    showConfirmButton: false,
  });

/** Corner toast with an Undo button; resolves to `true` if Undo was clicked before it closed. */
export const showUndoToast = async (title, timer = 5000) => {
  const result = await fire({
    toast: true,
    position: 'top-end',
    icon: 'success',
    title,
    timer,
    timerProgressBar: true,
    showConfirmButton: true,
    confirmButtonText: 'Undo',
    confirmButtonColor: '#3B82F6',
  });
  return result.isConfirmed;
};

export const confirmDelete = async () => {
  const result = await fire({
    title: 'Delete Bookmark?',
    text: 'This action cannot be undone',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#EF4444',
    cancelButtonColor: '#94A3B8',
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    focusCancel: true,
  });
  return result.isConfirmed;
};
