// === CUSTOM NOTIFICATION SYSTEM ===

let notificationContainer = null;

// Initialize notification container
function initNotificationContainer() {
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
  }
  return notificationContainer;
}

// Get icon based on type
function getIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    book: '📚'
  };
  return icons[type] || icons.book;
}

// Get title based on type
function getTitle(type, customTitle) {
  if (customTitle) return customTitle;
  
  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    book: 'BookMate'
  };
  return titles[type] || titles.book;
}

// Show notification
function showNotification(message, type = 'book', options = {}) {
  const container = initNotificationContainer();
  
  const {
    duration = 5000,
    title = null,
    showClose = true,
    showProgress = true
  } = options;

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  const notificationTitle = getTitle(type, title);
  const icon = getIcon(type);
  
  notification.innerHTML = `
    <div class="notification-icon">${icon}</div>
    <div class="notification-content">
      <p class="notification-title">${notificationTitle}</p>
      <p class="notification-message">${message}</p>
    </div>
    ${showClose ? '<button class="notification-close" aria-label="Close">×</button>' : ''}
    ${showProgress ? '<div class="notification-progress"></div>' : ''}
  `;

  // Add to container
  container.appendChild(notification);

  // Close button handler
  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      removeNotification(notification);
    });
  }

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(notification);
    }, duration);
  }

  // Click notification to dismiss
  notification.addEventListener('click', (e) => {
    if (!e.target.classList.contains('notification-close')) {
      removeNotification(notification);
    }
  });

  return notification;
}

// Remove notification with animation
function removeNotification(notification) {
  notification.classList.add('hiding');
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// Convenience methods
function showSuccess(message, options = {}) {
  return showNotification(message, 'success', options);
}

function showError(message, options = {}) {
  return showNotification(message, 'error', options);
}

function showWarning(message, options = {}) {
  return showNotification(message, 'warning', options);
}

function showInfo(message, options = {}) {
  return showNotification(message, 'info', options);
}

function showBookNotification(message, options = {}) {
  return showNotification(message, 'book', {
    title: 'BookMate',
    ...options
  });
}

// Replace default alert function (optional)
function replaceDefaultAlert() {
  window.alert = function(message) {
    showNotification(message, 'book');
  };
}

// Export for ES6 modules (dashboard.js)
export { showNotification, showSuccess, showError, showWarning, showInfo, showBookNotification, replaceDefaultAlert };
