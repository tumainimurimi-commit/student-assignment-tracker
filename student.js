//select all the HTML element
const searchInput       = document.querySelector("#searchInput");
const submitForm        = document.querySelector("#submitForm");
const greetingMessage   = document.querySelector("#greetingMessage");
const notificationBell  = document.querySelector("#notificationBell");
const avatarProfile     = document.querySelector("#avatarProfile");

const overdueInfo       = document.querySelector("#overdueInfo");
const dueInfo           = document.querySelector("#dueInfo");
const dueTodayInfo      = document.querySelector("#dueTodayInfo");
const completedInfo     = document.querySelector("#completedInfo");

const filterContainer   = document.querySelector("#filterContainer");
const filterButton      = document.querySelectorAll("[data-filter]");
const clearFilter       = document.querySelector("#clearFilter");

const taskForm          = document.querySelector("#taskForm");
const taskTitleInput    = document.querySelector("#taskTitleInput");
const taskCourseInput   = document.querySelector("#taskCourseInput");
const taskInputDue      = document.querySelector("#taskInputDue");
const taskPriorityInput = document.querySelector("#taskPriorityInput");
const taskList          = document.querySelector("#taskList");

//state
const STORAGE_KEY  = "taskData";
const STUDENT_NAME = "Tumaini";

let tasks         = [];
let nextId        = 1;
let currentFilter = "all";
let currentSearch = "";

//date helpers
function getStartOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getEndOfToday() {
  return getStartOfToday() + 24 * 60 * 60 * 1000;
}

function getEndOfWeek() {
  return getStartOfToday() + 7 * 24 * 60 * 60 * 1000;
}

//Turns a Date into "Due Oct 26, 11:59 PM"
function formatDueDate(date) {
  return `Due ${date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
}

//Turns a timestamp into a value the datetime-local input understands
function toDatetimeLocalValue(timestamp) {
  const d   = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

//escaping text before putting it inside HTML
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":  return "&amp;";
      case "<":  return "&lt;";
      case ">":  return "&gt;";
      case '"':  return "&quot;";
      case "'":  return "&#39;";
      default:   return char;
    }
  });
}

//local storage data
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
  let stored = [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    stored = data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Could not read saved tasks:", error);
    stored = [];
  }

  if (!Array.isArray(stored)) stored = [];

  //Rebuild clean task objects (protects against corrupted or old data)
  tasks = stored.map((task, index) => {
    const rawDueTime = Number(task.rawDueTime) || 0;

    const dueDate =
      task.dueDate && String(task.dueDate).trim() !== ""
        ? task.dueDate
        : rawDueTime
        ? formatDueDate(new Date(rawDueTime))
        : "No due date";

    return {
      id:         Number(task.id) || index + 1,
      title:      String(task.title || "Untitled assignment"),
      course:     String(task.course || "No course"),
      dueDate:    dueDate,
      rawDueTime: rawDueTime,
      priority:   String(task.priority || "low").toLowerCase(),
      completed:  Boolean(task.completed),
    };
  });

  nextId = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
}

//avatar of the young man (inline SVG so it always works)
function setupAvatar() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#4dabf7"/>
          <stop offset="100%" stop-color="#a855f7"/>
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#bg)"/>
      <path d="M28 100 Q28 72 50 72 Q72 72 72 100 Z" fill="#2e8fe0"/>
      <rect x="43" y="56" width="14" height="16" fill="#f0b892"/>
      <circle cx="50" cy="42" r="18" fill="#f5c6a0"/>
      <path d="M31 40 Q29 20 50 20 Q71 20 69 40 Q69 30 58 26 Q50 23 42 26 Q31 30 31 40 Z" fill="#2c1b18"/>
      <circle cx="43" cy="43" r="2.2" fill="#172033"/>
      <circle cx="57" cy="43" r="2.2" fill="#172033"/>
      <path d="M44 50 Q50 55 56 50" stroke="#8a4b32" stroke-width="1.8"
            fill="none" stroke-linecap="round"/>
      <ellipse cx="37" cy="48" rx="3" ry="2" fill="#e8a087" opacity="0.5"/>
      <ellipse cx="63" cy="48" rx="3" ry="2" fill="#e8a087" opacity="0.5"/>
    </svg>`;

  const dataUri =
    "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg.trim());

  if (avatarProfile) {
    avatarProfile.innerHTML = "";
    const img = document.createElement("img");
    img.src = dataUri;
    img.alt = "Profile picture";
    avatarProfile.append(img);
  }
}

//adding new tasks
function addTask() {
  const taskTitle    = taskTitleInput.value.trim();
  const taskCourse   = taskCourseInput.value.trim();
  const taskDue      = taskInputDue.value;
  const taskPriority = taskPriorityInput.value;

  //validation of the user input
  if (taskTitle === "") {
    alert("Enter the title of the assignment.");
    taskTitleInput.focus();
    return;
  }
  if (taskCourse === "") {
    alert("Enter the name of the course.");
    taskCourseInput.focus();
    return;
  }
  if (taskDue === "") {
    alert("Select the due date and time.");
    taskInputDue.focus();
    return;
  }
  if (taskPriority === "") {
    alert("Please select the priority level of the task.");
    taskPriorityInput.focus();
    return;
  }

  const date = new Date(taskDue);
  if (isNaN(date.getTime())) {
    alert("The due date and time is not valid.");
    return;
  }

  //building the task object and pushing it into the array
  const taskEntry = {
    id:         nextId++,
    title:      taskTitle,
    course:     taskCourse,
    dueDate:    formatDueDate(date),
    rawDueTime: date.getTime(),
    priority:   taskPriority.toLowerCase(),
    completed:  false,
  };

  tasks.push(taskEntry);
  saveTasks();

  taskForm.reset();

  //make sure the user can see the task they just added
  applyFilters("all");
  render();
}

//rendering task on the webpage
function renderTasks(taskArray) {
  taskList.innerHTML = "";

  //empty state when nothing to show
  if (!taskArray || taskArray.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "task-empty";
    emptyLi.textContent = "No assignments to show here yet.";
    emptyLi.style.cssText =
      "text-align:center;color:#7e7a7a;font-size:0.9rem;" +
      "padding:24px;background:#ffffff;border-radius:12px;";
    taskList.append(emptyLi);
    return;
  }

  //loop over the task and build each list item
  taskArray.forEach((task) => {
    const newLi = document.createElement("li");
    newLi.className = "task-item";
    newLi.dataset.id = `${task.id}`;
    if (task.completed) newLi.classList.add("completed");

    //the checkbox
    const checkInput = document.createElement("input");
    checkInput.type = "checkbox";
    checkInput.checked = task.completed;
    checkInput.className = "task-checkbox";
    checkInput.setAttribute("aria-label", "Mark as complete");

    //the content wrapper
    const newDiv = document.createElement("div");
    newDiv.className = "task-content";

    const newH3 = document.createElement("h3");
    newH3.className = "task-title";
    newH3.textContent = task.title;

    const newP = document.createElement("p");
    newP.className = "task-meta";

    const spanCourse = document.createElement("span");
    spanCourse.className = "task-course";
    spanCourse.textContent = task.course;

    const spanDue = document.createElement("span");
    spanDue.className = "task-due";
    spanDue.textContent = task.dueDate;

    newP.append(spanCourse, spanDue);
    newDiv.append(newH3, newP);

    //the priority badge
    const spanPriority = document.createElement("span");
    spanPriority.classList.add(
      "task-priority",
      `priority-${task.priority.toLowerCase()}`
    );
    spanPriority.textContent = task.priority;

    //the 3 dot menu button together with its dropdown
    const menuWrapper = document.createElement("div");
    menuWrapper.className = "task-menu-wrapper";

    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "task-menu";
    optionButton.setAttribute("aria-label", "More options");
    optionButton.setAttribute("aria-haspopup", "true");

    const newIcon = document.createElement("i");
    newIcon.classList.add("fa-solid", "fa-ellipsis-vertical");
    optionButton.append(newIcon);

    //the dropdown panel with the options
    const dropdown = document.createElement("div");
    dropdown.className = "task-dropdown";
    dropdown.setAttribute("role", "menu");

    const toggleLabel = task.completed ? "Mark Incomplete" : "Mark Complete";
    const toggleIcon  = task.completed
      ? "fa-solid fa-rotate-left"
      : "fa-solid fa-check";

    dropdown.innerHTML = `
      <button type="button" data-action="toggle" role="menuitem">
        <i class="${toggleIcon}"></i> ${toggleLabel}
      </button>
      <button type="button" data-action="edit" role="menuitem">
        <i class="fa-solid fa-pen"></i> Edit Task
      </button>
      <button type="button" data-action="delete" role="menuitem" class="danger">
        <i class="fa-solid fa-trash"></i> Delete Task
      </button>
    `;

    menuWrapper.append(optionButton, dropdown);

    //adding everything into the list item and to the list
    newLi.append(checkInput, newDiv, spanPriority, menuWrapper);
    taskList.append(newLi);
  });
}

//closing any open 3 dot menu
function closeAllMenus() {
  document
    .querySelectorAll(".task-menu-wrapper.open")
    .forEach((w) => w.classList.remove("open"));
}

//clicking the 3 dots or the options inside the menu
taskList.addEventListener("click", (event) => {
  //clicking the 3 dot button itself
  const menuBtn = event.target.closest(".task-menu");
  if (menuBtn) {
    const wrapper = menuBtn.closest(".task-menu-wrapper");
    const wasOpen = wrapper.classList.contains("open");
    closeAllMenus();
    if (!wasOpen) wrapper.classList.add("open");
    return;
  }

  //clicking an option inside the dropdown
  const option = event.target.closest("[data-action]");
  if (option) {
    const li     = option.closest("[data-id]");
    const action = option.dataset.action;
    if (!li) return;

    const taskId = Number(li.dataset.id);
    closeAllMenus();

    if (action === "toggle")      toggleComplete(taskId);
    else if (action === "edit")   startEditTask(taskId);
    else if (action === "delete") deleteTask(taskId);
  }
});

//clicking outside closes the menu
document.addEventListener("click", (event) => {
  if (!event.target.closest(".task-menu-wrapper")) closeAllMenus();
});

//escape key closes the menu
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAllMenus();
});

//marking a task complete from the 3 dot menu
function toggleComplete(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  render();
}

//editing a task on the webpage
function startEditTask(taskId) {
  const li   = taskList.querySelector(`[data-id="${taskId}"]`);
  const task = tasks.find((t) => t.id === taskId);
  if (!li || !task) return;

  li.classList.add("editing");

  //building the inline edit form
  li.innerHTML = `
    <div class="edit-form">
      <input type="text" class="edit-title"
             value="${escapeHtml(task.title)}" placeholder="Assignment title">
      <input type="text" class="edit-course"
             value="${escapeHtml(task.course)}" placeholder="Course">
      <input type="datetime-local" class="edit-due"
             value="${toDatetimeLocalValue(task.rawDueTime)}">
      <select class="edit-priority">
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <div class="edit-actions">
        <button type="button" class="edit-cancel">Cancel</button>
        <button type="button" class="edit-save">Save</button>
      </div>
    </div>
  `;

  //selecting the current priority
  li.querySelector(".edit-priority").value = task.priority;

  //focus the title
  const titleField = li.querySelector(".edit-title");
  titleField.focus();
  titleField.setSelectionRange(titleField.value.length, titleField.value.length);

  //save button
  li.querySelector(".edit-save").addEventListener("click", () => {
    saveEdit(taskId, li);
  });

  //cancel button
  li.querySelector(".edit-cancel").addEventListener("click", () => {
    render();
  });

  //enter saves, escape cancels
  li.querySelectorAll("input").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveEdit(taskId, li);
      } else if (e.key === "Escape") {
        e.preventDefault();
        render();
      }
    });
  });
}

//saving the edited task back into the array
function saveEdit(taskId, li) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  const newTitle    = li.querySelector(".edit-title").value.trim();
  const newCourse   = li.querySelector(".edit-course").value.trim();
  const newDue      = li.querySelector(".edit-due").value;
  const newPriority = li.querySelector(".edit-priority").value;

  //validation
  if (newTitle === "") {
    alert("The title cannot be empty.");
    return;
  }
  if (newCourse === "") {
    alert("The course cannot be empty.");
    return;
  }
  if (newDue === "") {
    alert("Please select a due date and time.");
    return;
  }

  const date = new Date(newDue);
  if (isNaN(date.getTime())) {
    alert("The due date and time is not valid.");
    return;
  }

  //updating the task
  task.title      = newTitle;
  task.course     = newCourse;
  task.dueDate    = formatDueDate(date);
  task.rawDueTime = date.getTime();
  task.priority   = newPriority.toLowerCase();

  saveTasks();
  render();
}

//deleting a task from the list
function deleteTask(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  const confirmed = confirm(`Delete "${task.title}"? This cannot be undone.`);
  if (!confirmed) return;

  tasks = tasks.filter((t) => t.id !== taskId);
  saveTasks();
  render();
}

//filtering search on the search bar
function getVisibleTasks() {
  const now        = Date.now();
  const startOfDay = getStartOfToday();
  const endOfDay   = getEndOfToday();
  const endOfWeek  = getEndOfWeek();

  let filteredTasks = [];

  if (currentFilter === "all") {
    filteredTasks = tasks.filter((task) => !task.completed);
  } else if (currentFilter === "dueToday") {
    filteredTasks = tasks.filter(
      (task) =>
        !task.completed &&
        task.rawDueTime >= startOfDay &&
        task.rawDueTime < endOfDay
    );
  } else if (currentFilter === "thisWeek") {
    filteredTasks = tasks.filter(
      (task) =>
        !task.completed &&
        task.rawDueTime >= startOfDay &&
        task.rawDueTime < endOfWeek
    );
  } else if (currentFilter === "overdue") {
    filteredTasks = tasks.filter(
      (task) => !task.completed && task.rawDueTime < now
    );
  } else if (currentFilter === "completed") {
    filteredTasks = tasks.filter((task) => task.completed);
  }

  //applying the search text on top of the active filter
  if (currentSearch !== "") {
    filteredTasks = filteredTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(currentSearch) ||
        task.course.toLowerCase().includes(currentSearch)
    );
  }

  return filteredTasks;
}

//applies a filter chip and repaints everything
function applyFilters(value) {
  currentFilter = value;

  filterButton.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === value);
  });

  render();
}

//summary displayer cards
function summaryDisplayer() {
  const now        = Date.now();
  const startOfDay = getStartOfToday();
  const endOfDay   = getEndOfToday();
  const endOfWeek  = getEndOfWeek();

  //overdue (still to be done)
  const overdue = tasks.filter(
    (task) => !task.completed && task.rawDueTime < now
  ).length;
  overdueInfo.textContent = overdue;

  //due this week (still to be done)
  const dueWeek = tasks.filter(
    (task) =>
      !task.completed && task.rawDueTime > now && task.rawDueTime < endOfWeek
  ).length;
  dueInfo.textContent = dueWeek;

  //due today (still to be done)
  const dueToday = tasks.filter(
    (task) =>
      !task.completed &&
      task.rawDueTime >= startOfDay &&
      task.rawDueTime < endOfDay
  ).length;
  dueTodayInfo.textContent = dueToday;

  //completed
  const completed = tasks.filter((task) => task.completed).length;
  completedInfo.textContent = completed;

  //small extra touch: the bell tells you how many are overdue
  if (notificationBell) {
    notificationBell.title = `${overdue} overdue assignment${
      overdue === 1 ? "" : "s"
    }`;
  }
}

//the main render
function render() {
  renderTasks(getVisibleTasks());
  summaryDisplayer();
}

//greeting with the right time
function updateGreeting() {
  const hour = new Date().getHours();
  let partOfDay;

  if (hour < 12)       partOfDay = "Good morning";
  else if (hour < 17)  partOfDay = "Good afternoon";
  else if (hour < 21)  partOfDay = "Good evening";
  else                 partOfDay = "Good night";

  greetingMessage.textContent = `${partOfDay}, ${STUDENT_NAME}`;
}

//event listeners on the page
/* --- add a task --- */
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask();
});

/* --- filter chips --- */
filterContainer.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-filter]");
  if (!btn) return;
  applyFilters(btn.dataset.filter);
});

/* --- clear filters --- */
clearFilter.addEventListener("click", () => {
  currentSearch = "";
  if (searchInput) searchInput.value = "";
  applyFilters("all");
});

/* --- search form submit --- */
submitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  currentSearch = searchInput.value.trim().toLowerCase();
  render();
});

/* --- live search as the user types --- */
searchInput.addEventListener("input", () => {
  currentSearch = searchInput.value.trim().toLowerCase();
  render();
});

/* --- checkbox click to mark a task complete --- */
taskList.addEventListener("change", (event) => {
  if (!event.target.matches('input[type="checkbox"]')) return;

  const checkbox = event.target;
  const li = checkbox.closest("[data-id]");
  if (!li) return;

  const taskId = Number(li.dataset.id);
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.completed = checkbox.checked;
  saveTasks();
  render();
});

//call the function for innitializing the webpage
setupAvatar();
updateGreeting();
loadTasksFromLocalStorage();
applyFilters("all");

//refresh the greeting every minute so it stays correct
setInterval(updateGreeting, 60 * 1000);
