const currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Construct the text to display for an appointment
 * @param {*} appointment
 * appointments look like this:
 * {
 * "id": "1",
 * "user_id": "1",
 * "title": "Dentist",
 * "description": "Checkup",
 * "start_time": "2021-03-01 09:00:00",
 * "end_time": "2021-03-01 09:30:00",
 * }
 * @returns {string} The text to display for the appointment
 */
function constructUpcomingPastAppointmentText(appointment) {
  const appOptions = { month: "long", day: "numeric", year: "numeric" };
  const startDate = new Date(appointment.start_time);
  let appTitle = appointment.title;
  const appDate = startDate.toLocaleDateString(undefined, appOptions);

  if (appTitle.length > 20) {
    appTitle = appTitle.substring(0, 20) + "...";
  }
  return appDate + " - " + appTitle;
}

function constructCalendarAppointmentText(appointment) {
  const appOptions = { month: "long", day: "numeric", year: "numeric" };
  const startDate = new Date(appointment.start_time);
  const appTitle = appointment.title;
  // get appointment time in 12-hour format
  const appTime = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  return appTitle + " - " + appTime;
}

async function loadPastAppointments() {
  const recentContainer = document.getElementById("pastAppointments");
  recentContainer.innerHTML = "";

  let userID = localStorage.getItem("user_id");
  let url = `api/appointment.php?user_id=${userID}&past=1`;
  try {
    const response = await fetch(url, {
      method: "GET",
    });
    const appointments = await response.json();
    const appOptions = { month: "long", day: "numeric", year: "numeric" };
    appointments.forEach((appointment) => {
      const element = document.createElement("div");
      element.textContent = constructUpcomingPastAppointmentText(appointment);
      recentContainer.appendChild(element);
    });
  } catch (error) {
    console.error("Error fetching past appointments:", error);
    alert("Error fetching past appointments");
    return;
  }
}

async function loadUpcomingAppointments() {
  const upcomingContainer = document.getElementById("upcomingAppointments");
  upcomingContainer.innerHTML = ""; // Clear previous entries

  let userID = localStorage.getItem("user_id");
  let url = `api/appointment.php?user_id=${userID}&upcoming=1`;

  try {
    const response = await fetch(url, {
      method: "GET",
    });
    const appointments = await response.json();
    appointments.forEach((appointment) => {
      const element = document.createElement("div");
      element.textContent = constructUpcomingPastAppointmentText(appointment);
      upcomingContainer.appendChild(element);
    });
  } catch (error) {
    console.error("Error fetching upcoming appointments:", error);
    alert("Error fetching upcoming appointments");
    return;
  }
}

async function drawCalendar(month, year) {
  const firstDay = new Date(year, month).getDay();
  const daysInMonth = 32 - new Date(year, month, 32).getDate();

  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  document.getElementById("monthYear").textContent = monthNames[month] + " " + year;

  // Fetch all appointments for the month
  let userId = localStorage.getItem("user_id");
  let appointments = [];
  try {
    const response = await fetch(
      `api/appointment.php?user_id=${userId}&year=${year}&month=${month + 1}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    appointments = await response.json();
  } catch (error) {
    console.error("Error fetching monthly appointments:", error);
    alert("Error fetching appointments for this month");
    return;
  }

  // Create headers for days of the week
  dayNames.forEach((day) => {
    const dayHeader = document.createElement("div");
    dayHeader.className = "day-header";
    dayHeader.textContent = day;
    calendar.appendChild(dayHeader);
  });

  let date = 1;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 7 && date <= daysInMonth; j++) {
      if (i === 0 && j < firstDay) {
        let cell = document.createElement("div");
        cell.className = "day";
        calendar.appendChild(cell);
      } else if (date > daysInMonth) {
        break;
      } else {
        let cell = document.createElement("div");
        cell.className = "day day-container";

        if (
          year === currentDate.getFullYear() &&
          month === currentDate.getMonth() &&
          date === currentDate.getDate()
        ) {
          cell.style.background = "green";
        }

        cell.textContent = date;
        cell.key = date;

        const formattedDate = `${year}-${(month + 1).toString().padStart(2, "0")}-${date
          .toString()
          .padStart(2, "0")}`;

        // Filter appointments for this specific day
        let dayAppointments = appointments.filter(
          (app) =>
            new Date(app.start_time).toDateString() === new Date(year, month, date).toDateString()
        );
        dayAppointments.forEach((app) => {
          if (cell.children.length >= 3) {
            return;
          }
          const appElement = document.createElement("div");
          appElement.className = "appointment";

          // if the appointment title is too long, truncate it
          if (app.title.length > 8) {
            app.title = app.title.substring(0, 8) + "...";
          }

          appElement.textContent = `${app.title} - ${new Date(app.start_time).toLocaleTimeString(
            "en-US",
            {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }
          )}`;
          cell.appendChild(appElement);
        });

        cell.onclick = async function (event) {
          const target = event.target;
          let key = "";
          if (target.className === "appointment") {
            key = target.parentElement.key;
          } else {
            key = event.target.key;
          }
          await showAppointments(year, month, key, formattedDate);
        };

        calendar.appendChild(cell);
        date++;
      }
    }
  }
}

function addMonthButtonListeners() {
  document.getElementById("prevMonth").addEventListener("click", async function () {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
    await drawCalendar(currentMonth, currentYear);
  });

  document.getElementById("nextMonth").addEventListener("click", async function () {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
    await drawCalendar(currentMonth, currentYear);
  });
}

async function showAppointments(year, month, day, date) {
  let userId = localStorage.getItem("user_id");

  //Fetch appointments for the selected date using an API endpoint
  try {
    const response = await fetch(
      `api/appointment.php?user_id=${userId}&year=${year}&month=${month + 1}&day=${day}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = await response.json();

    const modalContainer = document.getElementById("appModal");
    // Create modal content
    const modalContent = document.createElement("div");

    const modalScrollContent = document.createElement("div");
    modalScrollContent.className = "modalScrollContent";

    const appInfoDate = document.createElement("div");
    appInfoDate.className = "appDate";
    appInfoDate.textContent = date;
    modalContent.appendChild(appInfoDate);

    if (data.length === 0) {
      modalContent.textContent = "No appointments for this date.";
    } else {
      data.forEach((appointment) => {
        // Convert start and end time to 12-hour format
        const startTime = new Date(appointment.start_time).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });
        const endTime = new Date(appointment.end_time).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });

        // Set the text content
        const appInfoTitle = document.createElement("div");
        appInfoTitle.className = "appTitle";
        const appContainer = document.createElement("div");
        appContainer.className = "appContainer";

        const appBtnContainer = document.createElement("div");
        appBtnContainer.className = "appBtnContainer";

        const appInfoDesc = document.createElement("div");
        const appInfoTime = document.createElement("div");
        const removeApp = document.createElement("button");
        removeApp.className = "appDeleteBtn";
        removeApp.textContent = "delete";
        removeApp.onclick = function () {
          deleteAppointment(appointment.id);
        };

        const editApp = document.createElement("button");
        editApp.textContent = "edit";
        editApp.onclick = function () {
          editAppointment(appointment.id);
        };

        appInfoTitle.textContent = `${appointment.title}`;
        appInfoDesc.textContent = `${appointment.description}`;
        appInfoTime.textContent = `${startTime} to ${endTime}`;

        appContainer.appendChild(appInfoTitle);
        appContainer.appendChild(appInfoDesc);
        appContainer.appendChild(appInfoTime);

        appBtnContainer.appendChild(editApp);
        appBtnContainer.appendChild(removeApp);

        const outerAppContainer = document.createElement("div");
        outerAppContainer.className = "outerAppContainer";

        outerAppContainer.appendChild(appContainer);
        outerAppContainer.appendChild(appBtnContainer);

        modalScrollContent.appendChild(outerAppContainer);
      });
    }
    modalContent.appendChild(modalScrollContent);

    const divContainer = document.createElement("div");
    divContainer.className = "btnContainer";
    modalContent.appendChild(divContainer);

    const closeButton = document.createElement("button");
    closeButton.textContent = "Close";
    closeButton.className = "appCloseBtn";
    closeButton.onclick = function () {
      closeModal();
    };

    // Create button to open form
    const formButton = document.createElement("button");
    formButton.textContent = "Add Appointment";
    formButton.onclick = function () {
      showCreateAppForm(date); // Call a function to open the form
    };

    divContainer.appendChild(formButton);
    divContainer.appendChild(closeButton);

    // Create modal
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.appendChild(modalContent);

    // Append modal to modalContainer
    modalContainer.appendChild(modal);
    modalContainer.className = "modalOverlay";

    // Show modal
    modal.style.display = "block";
  } catch (error) {
    console.error("Error fetching appointments:", error);
    alert("Error fetching appointments");
    return;
  }
}

async function deleteAppointment(appointmentId) {
  const confirm = window.confirm("Are you sure you want to delete this appointment?");
  if (!confirm) {
    return;
  }

  let userId = localStorage.getItem("user_id");

  try {
    const response = await fetch(`api/appointment.php`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: appointmentId, user_id: userId }),
    });

    const data = await response.json();

    if (data && data.message) {
      alert("Appointment has been deleted");
      closeModal();
      location.reload();
      return;
    } else {
      alert("Failed to delete appointment: " + data.error);
      return;
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function editAppointment(appointmentId) {
  const userId = localStorage.getItem("user_id");

  try {
    const response = await fetch(`api/appointment.php?id=${appointmentId}&user_id=${userId}`, {
      method: "GET",
    });

    const data = await response.json();

    if (!data.error) {
      const appointment = data;

      const date = new Date(appointment.start_time);
      const formattedDate = date.toLocaleDateString();

      const form = document.createElement("form");
      form.innerHTML = `
        <div class="modal" id="innerModal">
          <div class="inputForm">
            <h1> Edit Appointment </h1>
            <h3> Date: ${formattedDate} </h3>
            <label for="title">Title:</label>
            <input type="text" id="title" name="title" value="${appointment.title}"><br>
            <label for="description">Description:</label>
            <input type="text" id="description" name="description" value="${
              appointment.description
            }"><br>
            <label for="start">Start Time:</label>
            <input type="time" id="start" name="start" value="${appointment.start_time.slice(
              11,
              16
            )}"><br>
            <label for="end">End Time:</label>
            <input type="time" id="end" name="end" value="${appointment.end_time.slice(
              11,
              16
            )}"><br>
          </div>
          <div class="btnContainer">
            <button type="button" onclick="submitEditAppointment('${appointmentId}')">Submit</button>
            <button type="button" class="appCloseBtn" onclick='closeModal()'>Close</button>
          </div>
        </div>
        `;

      const modalContainer = document.getElementById("appModal");
      modalContainer.innerHTML = "";
      modalContainer.className = "modalOverlay";

      modalContainer.appendChild(form);

      const modal = document.getElementById("innerModal");
      modal.style.display = "block";
    } else {
      alert("Failed to fetch appointment: " + data.error);
      return;
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function submitEditAppointment(appointmentId) {
  const userId = localStorage.getItem("user_id");
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  if (!title || !description || !start || !end) {
    alert("Please fill out all fields");
    return;
  }

  // Convert start time to military format
  const militaryStart = start
    .split(":")
    .map((num) => num.padStart(2, "0"))
    .join(":");

  // Convert end time to military format
  const militaryEnd = end
    .split(":")
    .map((num) => num.padStart(2, "0"))
    .join(":");

  /**
   * Check if the start time is greater than the end time.
   *
   * Check if start and end are greater than 15 minutes apart.
   */
  if (start > end) {
    alert("Start time cannot be greater than end time");
    return;
  } else {
    const startMinutes = parseInt(start.split(":")[0]) * 60 + parseInt(start.split(":")[1]);
    const endMinutes = parseInt(end.split(":")[0]) * 60 + parseInt(end.split(":")[1]);

    if (endMinutes - startMinutes < 15) {
      alert("Appointment must be at least 15 minutes long");
      return;
    }
  }

  try {
    const response = await fetch("api/appointment.php", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: appointmentId,
        user_id: userId,
        title: title,
        description: description,
        start_time: militaryStart + ":00",
        end_time: militaryEnd + ":00",
      }),
    });
    const data = await response.json();

    if (data && data.message) {
      alert("Appointment has been updated");
      closeModal();
      location.reload();
      return;
    } else {
      alert("Failed to update appointment: " + data.error);
      return;
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function closeModal() {
  const modal = document.getElementById("appModal");
  modal.className = "";
  modal.innerHTML = "";
}

function showCreateAppForm(date) {
  const form = document.createElement("form");
  form.innerHTML = `
    <div class="modal" id="innerModal">
      <div class="inputForm">
        <h1> Create Appointment </h1>
        <h3> Date: ${date} </h3>
        <label for="title">Title:</label>
        <input type="text" id="title" name="title"><br>
        <label for="description">Description:</label>
        <input type="text" id="description" name="description"><br>
        <label for="start">Start Time:</label>
        <input type="time" id="start" name="start"><br>
        <label for="end">End Time:</label>
        <input type="time" id="end" name="end"><br>
      </div>
      <div class="btnContainer">
        <button type="button" onclick="submitAppointment('${date}')">Submit</button>
        <button type="button" class="appCloseBtn" onclick='closeModal()'">Close</button>
      </div>
    </div>
    `;

  const modalContainer = document.getElementById("appModal");
  modalContainer.innerHTML = "";
  modalContainer.className = "modalOverlay";

  modalContainer.appendChild(form);

  const modal = document.getElementById("innerModal");
  modal.style.display = "block";
}

async function submitAppointment(date) {
  const userId = localStorage.getItem("user_id");
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  if (!title || !description || !start || !end) {
    alert("Please fill out all fields");
    return;
  }

  const currentDate = new Date();
  const selectedDate = new Date(date);
  if (selectedDate < currentDate) {
    const confirm = window.confirm(
      "The date you selected is in the past. Do you want to continue?"
    );
    if (!confirm) {
      return;
    }
  }

  // Convert start time to military format
  const militaryStart = start
    .split(":")
    .map((num) => num.padStart(2, "0"))
    .join(":");

  // Convert end time to military format
  const militaryEnd = end
    .split(":")
    .map((num) => num.padStart(2, "0"))
    .join(":");

  /**
   * Check if the start time is greater than the end time.
   *
   * Check if start and end are greater than 15 minutes apart.
   */
  if (start > end) {
    alert("Start time cannot be greater than end time");
    return;
  } else {
    const startMinutes = parseInt(start.split(":")[0]) * 60 + parseInt(start.split(":")[1]);
    const endMinutes = parseInt(end.split(":")[0]) * 60 + parseInt(end.split(":")[1]);

    if (endMinutes - startMinutes < 15) {
      alert("Appointment must be at least 15 minutes long");
      return;
    }
  }

  try {
    const response = await fetch("api/appointment.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `user_id=${userId}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(
        description
      )}&start_time=${militaryStart + ":00"}&end_time=${militaryEnd + ":00"}&date=${date}`,
    });

    const data = await response.json();

    if (data && data.message) {
      alert("Appointment has been created");
      closeModal();
      location.reload();
      return;
    } else {
      alert("Failed to make an appointment: " + data.error);
      return;
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function main() {
  addMonthButtonListeners();
  await drawCalendar(currentMonth, currentYear);
  await loadPastAppointments();
  await loadUpcomingAppointments();
}

document.addEventListener("DOMContentLoaded", async function () {
  await main();
});
