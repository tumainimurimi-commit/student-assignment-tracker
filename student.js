

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

//Turns a datetime-local value into "Due Oct 26, 11:59 PM" 
function formatDueDate(date) {
  return `Due ${date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;
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

  // Rebuild clean task objects (protects against corrupted/old data)
  tasks = stored.map((task, index) => {
    const rawDueTime = Number(task.rawDueTime) || 0;
    const dueDate =
      task.dueDate && task.dueDate.trim() !== ""
        ? task.dueDate
        : rawDueTime
        ? formatDueDate(new Date(rawDueTime))
        : "No due date";

    return {
      id: Number(task.id) || index + 1,
      title: String(task.title || "Untitled assignment"),
      course: String(task.course || "No course"),
      dueDate: dueDate,
      rawDueTime: rawDueTime,
      priority: String(task.priority || "low").toLowerCase(),
      completed: Boolean(task.completed),
    };
  });

  nextId = tasks.length > 0 ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
}

//adding new tasks
function addTask() {
  const taskTitle    = taskTitleInput.value.trim();
  const taskCourse   = taskCourseInput.value.trim();
  const taskDue      = taskInputDue.value;
  const taskPriority = taskPriorityInput.value;

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

  const taskEntry = {
    id: nextId++,
    title: taskTitle,
    course: taskCourse,
    dueDate: formatDueDate(date),
    rawDueTime: date.getTime(),
    priority: taskPriority.toLowerCase(),
    completed: false,
  };

  tasks.push(taskEntry);
  saveTasks();

  taskForm.reset();

  // Make sure the user can see the task they just added
  applyFilters("all");
  render();
}

//rendering task on the webpage
function renderTasks(taskArray) {
  taskList.innerHTML = "";

  // Empty state
  if (!taskArray || taskArray.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "task-empty";
    emptyLi.textContent = "No assignments to show here yet.";
    emptyLi.style.cssText =
      "text-align:center;color:#7e7a7a;font-size:0.9rem;padding:24px;background:#ffffff;border-radius:12px;";
    taskList.append(emptyLi);
    return;
  }

  taskArray.forEach((task) => {
    const newLi = document.createElement("li");
    newLi.className = "task-item";
    newLi.dataset.id = `${task.id}`;
    if (task.completed) newLi.classList.add("completed");

    // Checkbox
    const checkInput = document.createElement("input");
    checkInput.type = "checkbox";
    checkInput.checked = task.completed;
    checkInput.className = "task-checkbox";
    checkInput.setAttribute("aria-label", "Mark as complete");

    // Content wrapper
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

    // Priority badge
    const spanPriority = document.createElement("span");
    spanPriority.classList.add(
      "task-priority",
      `priority-${task.priority.toLowerCase()}`
    );
    spanPriority.textContent = task.priority;

    // Options button
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "task-menu";
    optionButton.setAttribute("aria-label", "More options");

    const newIcon = document.createElement("i");
    newIcon.classList.add("fa-solid", "fa-ellipsis-vertical");

    optionButton.append(newIcon);
    newP.append(spanCourse, spanDue);
    newDiv.append(newH3, newP);
    newLi.append(checkInput, newDiv, spanPriority, optionButton);
    taskList.append(newLi);
  });
}

//filtering search on the search bar
function getVisibleTasks() {
  const now         = Date.now();
  const startOfDay  = getStartOfToday();
  const endOfDay    = getEndOfToday();
  const endOfWeek   = getEndOfWeek();

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

  // Apply the search text on top of the active filter
  if (currentSearch !== "") {
    filteredTasks = filteredTasks.filter((task) => {
      return (
        task.title.toLowerCase().includes(currentSearch) ||
        task.course.toLowerCase().includes(currentSearch)
      );
    });
  }

  return filteredTasks;
}

/* Applies a filter chip and repaints everything */
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

  // Overdue (still to be done)
  const overdue = tasks.filter(
    (task) => !task.completed && task.rawDueTime < now
  ).length;
  overdueInfo.textContent = overdue;

  // Due this week (still to be done)
  const dueWeek = tasks.filter(
    (task) =>
      !task.completed && task.rawDueTime > now && task.rawDueTime < endOfWeek
  ).length;
  dueInfo.textContent = dueWeek;

  // Due today (still to be done)
  const dueToday = tasks.filter(
    (task) =>
      !task.completed &&
      task.rawDueTime >= startOfDay &&
      task.rawDueTime < endOfDay
  ).length;
  dueTodayInfo.textContent = dueToday;

  // Completed
  const completed = tasks.filter((task) => task.completed).length;
  completedInfo.textContent = completed;

  // Small extra touch: the bell tells you how many are overdue
  if (notificationBell) {
    notificationBell.title = `${overdue} overdue assignment${
      overdue === 1 ? "" : "s"
    }`;
  }
}

//The main render
function render() {
  renderTasks(getVisibleTasks());
  summaryDisplayer();
}
//greeting with the right time
function updateGreeting() {
  const hour = new Date().getHours();
  let partOfDay = "Hello";

  if (hour < 12) partOfDay = "Good morning";
  else if (hour < 18) partOfDay = "Good afternoon";
  else partOfDay = "Good evening";

  greetingMessage.textContent = `${partOfDay}, ${STUDENT_NAME}`;
}
//event listeners on the page
/* --- Add a task --- */
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask();
});

/* --- Filter chips --- */
filterContainer.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-filter]");
  if (!btn) return;

  applyFilters(btn.dataset.filter);
});

/* --- Clear filters --- */
clearFilter.addEventListener("click", () => {
  currentSearch = "";
  if (searchInput) searchInput.value = "";
  applyFilters("all");
});

/* --- Search --- */
submitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  currentSearch = searchInput.value.trim().toLowerCase();
  render();
});

searchInput.addEventListener("input", () => {
  currentSearch = searchInput.value.trim().toLowerCase();
  render();
});

/* --- Check / uncheck a task --- */
taskList.addEventListener("change", (event) => {
  if (!event.target.matches('input[type="checkbox"]')) return;

  const checkbox = event.target;
  const li = checkbox.closest("[data-id]");
  if (!li) return;

  const taskId = Number(li.dataset.id);
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.completed = checkbox.checked;

  saveTasks();   // persist the change
  render();      // repaint list + summary
});

//call the function for innitializing the webpage
updateGreeting();
loadTasksFromLocalStorage();
applyFilters("all");   
