document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      // Reset the select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants list HTML (with delete button next to each participant)
        const participantsList = details.participants.length > 0
          ? `
            <p><strong>Current Participants:</strong></p>
            <ul class="participants-list">
              ${details.participants.map(email => `
                <li>
                  <span class="participant-email">${email}</span>
                  <button class="delete-participant" data-activity="${name}" data-email="${email}" aria-label="Unregister ${email}">🗑️</button>
                </li>
              `).join('')}
            </ul>
          `
          : '<p><em>No participants yet - be the first to join!</em></p>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsList}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Note: delete-button event handler is attached once outside this function
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities list so the newly registered participant appears
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Attach click handler for delete buttons (event delegation)
  // This is attached once to avoid creating duplicate listeners on refresh
  activitiesList.addEventListener('click', async (evt) => {
    const btn = evt.target.closest('.delete-participant');
    if (!btn) return;

    const activity = btn.getAttribute('data-activity');
    const email = btn.getAttribute('data-email');

    if (!activity || !email) return;

    if (!confirm(`Unregister ${email} from "${activity}"?`)) return;

    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
      const result = await resp.json();

      if (resp.ok) {
        messageDiv.textContent = result.message || 'Participant unregistered';
        messageDiv.className = 'success';
        messageDiv.classList.remove('hidden');
        // Refresh list
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || 'Failed to unregister participant';
        messageDiv.className = 'error';
        messageDiv.classList.remove('hidden');
      }
      setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    } catch (err) {
      console.error('Error unregistering participant:', err);
      messageDiv.textContent = 'Failed to unregister participant. Please try again.';
      messageDiv.className = 'error';
      messageDiv.classList.remove('hidden');
    }
  });

  // Initialize app
  fetchActivities();
});
