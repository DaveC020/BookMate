document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll('.genre-option').forEach(label => {
    const checkbox = label.querySelector('input[type="checkbox"]');
    if (!checkbox) return;

   
    if (checkbox.checked) label.classList.add('selected');
    else label.classList.remove('selected');


    checkbox.addEventListener('change', () => {
      if (checkbox.checked) label.classList.add('selected');
      else label.classList.remove('selected');
    });

   
    label.addEventListener('click', (e) => {

    });
  });
});
