document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful:', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  }

  const countdownEl = document.getElementById('countdown');
  const trackerTable = document.getElementById('tracker');
  const gradeEl = document.getElementById('grade');
  const startDate = new Date('2025-03-31'); // Starting Monday
  const totalWeeks = 8;
  const totalDays = 7;
  const targetDate = new Date('2025-05-25T09:00:00');

  // Countdown timer update
  function updateCountdown() {
    const now = new Date();
    const diff = targetDate - now;
    if (diff <= 0) {
      countdownEl.textContent = "Exam time!";
      clearInterval(timerInterval);
      return;
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    countdownEl.textContent = `${days}d : ${hours}h left`;
  }
  updateCountdown();
  const timerInterval = setInterval(updateCountdown, 1000);

  // Helper to format dates
  function formatDate(date) {
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
  }

  // Create table header with week headings
  const headerRow = document.createElement('tr');
  const emptyHeader = document.createElement('th');
  emptyHeader.textContent = "";
  headerRow.appendChild(emptyHeader);
  for (let w = 0; w < totalWeeks; w++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const th = document.createElement('th');
    th.innerHTML = `<strong>Week ${w + 1}</strong> (${formatDate(weekStart)} - ${formatDate(weekEnd)})`;
    headerRow.appendChild(th);
    headerRow.classList.add('week-row');
  }
  trackerTable.appendChild(headerRow);

  // Day names starting with Monday
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Create rows for each day
  for (let d = 0; d < totalDays; d++) {
    const row = document.createElement('tr');
    const dayHeader = document.createElement('th');
    dayHeader.textContent = dayNames[d];
    dayHeader.className = 'day-header';
    row.appendChild(dayHeader);
    for (let w = 0; w < totalWeeks; w++) {
      const cell = document.createElement('td');
      cell.className = 'cell';
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + w * 7 + d);
      const dateString = cellDate.toISOString().split('T')[0];
      cell.title = dateString;
      const savedScore = localStorage.getItem(dateString) || '';
      cell.textContent = savedScore;
      cell.addEventListener('click', () => {
        let score = prompt(`Enter study hours for ${dateString}:`, savedScore);
        if (score !== null) {
          score = score.trim();
          if (score !== '' && isNaN(parseFloat(score))) {
            alert('Please enter a valid number.');
            return;
          }
          if (score === '') {
            cell.textContent = '';
            localStorage.removeItem(dateString);
          } else {
            cell.textContent = score;
            localStorage.setItem(dateString, score);
          }
          updateGrade();
        }
      });
      row.appendChild(cell);
    }
    trackerTable.appendChild(row);
  }

  // Helper: Get all date keys corresponding to the table cells
  function getAllDateKeys() {
    const keys = [];
    for (let w = 0; w < totalWeeks; w++) {
      for (let d = 0; d < totalDays; d++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + w * 7 + d);
        keys.push(cellDate.toISOString().split('T')[0]);
      }
    }
    return keys;
  }

  // Grading algorithm: Consistency Score Calculation
  function calculateGrade() {
    const keys = getAllDateKeys();
    const scores = [];
    keys.forEach(key => {
      const val = localStorage.getItem(key);
      if (val && !isNaN(val)) {
        scores.push(parseFloat(val));
      }
    });
    if (scores.length === 0) return 0;
    let totalDiff = 0;
    scores.forEach(s => { totalDiff += Math.abs(s - 8); });
    const avgDiff = totalDiff / scores.length;
    let totalFluctuation = 0;
    for (let i = 0; i < scores.length - 1; i++) {
      totalFluctuation += Math.abs(scores[i + 1] - scores[i]);
    }
    const avgFluctuation = scores.length > 1 ? totalFluctuation / (scores.length - 1) : 0;
    let finalScore = 100 - 2 * avgDiff - avgFluctuation;
    finalScore = Math.max(0, Math.min(100, finalScore));
    return Math.round(finalScore);
  }

  function updateGrade() {
    const score = calculateGrade();
    gradeEl.textContent = `Consistency: ${score}/100`;
  }
  updateGrade();
});
