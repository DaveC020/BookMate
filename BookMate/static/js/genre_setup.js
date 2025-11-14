document.addEventListener("DOMContentLoaded", () => {
  const genreOptions = document.querySelectorAll('.genre-option');
  const form = document.getElementById('genreForm');
  const submitBtn = document.querySelector('.btn-continue');

  // Add selection counter
  const counterDiv = document.createElement('div');
  counterDiv.className = 'selection-counter';
  counterDiv.textContent = 'No genres selected';
  submitBtn.parentNode.insertBefore(counterDiv, submitBtn);

  // Update counter function
  function updateCounter() {
    const checkedCount = document.querySelectorAll('.genre-option input[type="checkbox"]:checked').length;
    if (checkedCount === 0) {
      counterDiv.textContent = 'No genres selected';
      counterDiv.style.color = '#B17073';
    } else if (checkedCount === 1) {
      counterDiv.textContent = '1 genre selected';
      counterDiv.style.color = '#4A2D33';
    } else {
      counterDiv.textContent = `${checkedCount} genres selected`;
      counterDiv.style.color = '#4A2D33';
    }
  }

  // Initialize genre options
  genreOptions.forEach(label => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

    // Set initial state
    if (checkbox.checked) {
      label.classList.add('selected');
    }

    // Handle checkbox change
    checkbox.addEventListener('change', () => {
      updateCounter();
    });

    // Add smooth animation on click
    label.addEventListener('click', (e) => {
      // Small bounce effect
      label.style.transform = 'scale(0.95)';
      setTimeout(() => {
        label.style.transform = '';
      }, 100);
    });
  });

  // Form validation
  form.addEventListener('submit', (e) => {
    const checkedCount = document.querySelectorAll('.genre-option input[type="checkbox"]:checked').length;
    
    if (checkedCount === 0) {
      e.preventDefault();
      
      // Shake animation for button
      submitBtn.style.animation = 'shake 0.5s';
      setTimeout(() => {
        submitBtn.style.animation = '';
      }, 500);
      
      // Show alert
      alert('Please select at least one genre to continue.');
      return false;
    }

    // Success animation
    submitBtn.disabled = true;
    submitBtn.textContent = 'Loading...';
    submitBtn.style.opacity = '0.7';
  });

  // Initialize counter
  updateCounter();

  // Add keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement.tagName === 'LABEL') {
      const checkbox = document.activeElement.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    }
  });
});

// Shake animation keyframes (added dynamically)
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;
document.head.appendChild(styleSheet);
