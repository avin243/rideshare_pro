const searchForm = document.querySelector("#ride-search");
const fromInput = document.querySelector("#from");
const toInput = document.querySelector("#to");
const rideCards = [...document.querySelectorAll(".ride-card")];
const rideCount = document.querySelector("#ride-count");
const emptyState = document.querySelector("#empty-state");
const toast = document.querySelector("#toast");
let toastTimeout;

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const from = fromInput.value.trim().toLocaleLowerCase();
  const to = toInput.value.trim().toLocaleLowerCase();
  let visibleRides = 0;

  for (const card of rideCards) {
    const matchesFrom = !from || card.dataset.from.toLocaleLowerCase().includes(from);
    const matchesTo = !to || card.dataset.to.toLocaleLowerCase().includes(to);
    const isMatch = matchesFrom && matchesTo;

    card.hidden = !isMatch;
    if (isMatch) visibleRides += 1;
  }

  rideCount.textContent = `${visibleRides} ${visibleRides === 1 ? "ride" : "rides"} available`;
  emptyState.hidden = visibleRides !== 0;
  document.querySelector("#rides-title").scrollIntoView({ behavior: "smooth", block: "start" });
});

for (const button of document.querySelectorAll(".seat-button")) {
  button.addEventListener("click", () => {
    const isSelected = button.classList.toggle("is-selected");
    button.setAttribute("aria-pressed", String(isSelected));
    button.innerHTML = isSelected
      ? 'Seat selected <span aria-hidden="true">✓</span>'
      : 'Select seat <span aria-hidden="true">→</span>';

    const destination = button.closest(".ride-card").dataset.to.split(",")[0];
    toast.textContent = isSelected
      ? `Seat selected for ${destination}. This is a demo—no booking was made.`
      : `Seat selection removed for ${destination}.`;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  });
}
