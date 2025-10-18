// === CUSTOM CONFIRMATION DIALOG ===

/**
 * Show a custom confirmation dialog
 * @param {string} message - The confirmation message
 * @param {Object} options - Configuration options
 * @returns {Promise<boolean>} - Resolves to true if OK, false if Cancel
 */
export function showConfirm(message, options = {}) {
  return new Promise((resolve) => {
    const {
      title = 'Confirm',
      icon = '❓',
      okText = 'OK',
      cancelText = 'Cancel',
      okClass = '',
      cancelClass = ''
    } = options;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';

    // Build dialog HTML
    dialog.innerHTML = `
      <div class="confirm-header">
        <div class="confirm-icon">${icon}</div>
        <h2 class="confirm-title">${title}</h2>
      </div>
      <div class="confirm-message">${message}</div>
      <div class="confirm-buttons">
        <button class="confirm-btn confirm-btn-cancel ${cancelClass}" data-action="cancel">
          ${cancelText}
        </button>
        <button class="confirm-btn confirm-btn-ok ${okClass}" data-action="ok">
          ${okText}
        </button>
      </div>
    `;

    // Append to overlay
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Handle button clicks
    const handleClick = (e) => {
      const button = e.target.closest('.confirm-btn');
      if (!button) return;

      const action = button.dataset.action;
      cleanup();
      resolve(action === 'ok');
    };

    // Handle ESC key
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
      }
      // Handle Enter key for OK
      if (e.key === 'Enter') {
        cleanup();
        resolve(true);
      }
    };

    // Handle overlay click (click outside)
    const handleOverlayClick = (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    };

    // Cleanup function
    const cleanup = () => {
      overlay.removeEventListener('click', handleClick);
      overlay.removeEventListener('click', handleOverlayClick);
      document.removeEventListener('keydown', handleKeydown);
      
      // Fade out animation
      overlay.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 200);
    };

    // Add event listeners
    overlay.addEventListener('click', handleClick);
    overlay.addEventListener('click', handleOverlayClick);
    document.addEventListener('keydown', handleKeydown);

    // Focus OK button for accessibility
    setTimeout(() => {
      const okButton = dialog.querySelector('.confirm-btn-ok');
      if (okButton) okButton.focus();
    }, 100);
  });
}

/**
 * Show delete confirmation
 * @param {string} itemName - Name of item to delete
 * @returns {Promise<boolean>}
 */
export function confirmDelete(itemName = 'this item') {
  return showConfirm(
    `Are you sure you want to remove ${itemName}?`,
    {
      title: 'Confirm Removal',
      icon: '🗑️',
      okText: 'Remove',
      cancelText: 'Cancel'
    }
  );
}

/**
 * Show book removal confirmation
 * @param {string} bookTitle - Title of the book
 * @returns {Promise<boolean>}
 */
export function confirmBookRemoval(bookTitle = 'this book') {
  return showConfirm(
    `Remove "${bookTitle}" from your list?`,
    {
      title: 'Remove Book',
      icon: '📚',
      okText: 'Remove',
      cancelText: 'Keep'
    }
  );
}

/**
 * Show generic confirmation
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>}
 */
export function confirm(message) {
  return showConfirm(message, {
    title: 'BookMate',
    icon: '📖',
    okText: 'OK',
    cancelText: 'Cancel'
  });
}

// Add fadeOut animation to CSS if not exists
if (!document.querySelector('#confirm-dialog-animations')) {
  const style = document.createElement('style');
  style.id = 'confirm-dialog-animations';
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}
