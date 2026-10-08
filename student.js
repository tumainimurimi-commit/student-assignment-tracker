//selecting all the necessary HTML element with the Id
const searchInput = document.querySelector("#searchInput");
const submitForm = document.querySelector("#submitForm");
const greetingMessage = document.querySelector("#greetingMessage");
const notificationBell = document.querySelector("#notificationBell");
const avatarProfile = document.querySelector("#avatarProfile");
const dueInfo = document.querySelector("#dueInfo");
const dueTodayInfo = document.querySelector("#dueTodayInfo");
const completedInfo = document.querySelector("#completedInfo");
const filterContainer = document.querySelector("#filterContainer");
const filterButton = document.querySelectorAll("[data-filter]");
const clearFilter = document.querySelector("#clearFilter");
const taskForm = document.querySelector("#taskForm");
const taskTitleInput = document.querySelector("#taskTitleInput");
const taskCourseInput = document.querySelector("#taskCourseInput");
const taskInputDue = document.querySelector("#taskInputDue");
const taskPriorityInput = document.querySelector("#taskPriorityInput");
const taskList = document.querySelector("#taskList");

let tasks = [];
let nextId = 1;

//Grabbing the task from the user input and updating then on the array
function addTask() {
  const taskTitle = taskTitleInput.value.trim();
  const taskCourse = taskCourseInput.value.trim();
  const taskDue = taskInputDue.value;
  const taskPriority = taskPriorityInput.value;

  if (taskTitle === "") {
    alert("Enter the title of the assignment.");
    return;
  }
  if (taskCourse === "") {
    alert("Enter the name of the course.");
    return;
  }
  if (taskDue === "") {
    alert("Select the due date and time.");
    return;
  }
  if (taskPriority === "") {
    alert("Please select the priority level of the task");
    return;
  }

  const date = new Date(taskDue);

  const dateFormat = `Due ${date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;

  const taskEntry = {
    id: nextId++,
    title: taskTitle,
    course: taskCourse,
    dueDate: dateFormat,
    rawDueTime: date.getTime(),
    priority: taskPriority,
    completed:false
    
  };
  tasks.push(taskEntry);
  const key='taskData';
  const value=JSON.stringify(tasks);
  localStorage.setItem(key,value);
  
  taskForm.reset();
  renderTasks(tasks);
  summaryDisplayer();
}

// rendering input from the user to the webpage dynamically and creating the list on the webpage
function renderTasks(taskArray=tasks) {

  taskList.innerHTML="";

  taskArray.forEach((task) => {
    const newLi = document.createElement("li");
    newLi.className = "task-item";
    newLi.dataset.id = `${task.id}`;

    const checkInput = document.createElement("input");
    checkInput.type = "checkbox";
    checkInput.checked=task.completed
    checkInput.className = "task-checkbox";
    checkInput.setAttribute("aria-label", "Mark as complete");

    const newDiv = document.createElement("div");
    newDiv.className = "task-content";

    const newH3 = document.createElement("h3");
    newH3.className = "task-title";
    newH3.textContent = `${task.title}`;

    const newP = document.createElement("p");
    newP.className = "task-meta";

    const spanCourse = document.createElement("span");
    spanCourse.className = "task-course";
    spanCourse.textContent = `${task.course}`;

    const spanDue = document.createElement("span");
    spanDue.className = "task-due";
    spanDue.textContent = `${task.dueDate}`;

    const spanPriority = document.createElement("span");
    spanPriority.classList.add("task-priority", `priority-${task.priority.toLowerCase()}`);
    spanPriority.textContent = `${task.priority}`;

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

    // console.log('Has the list been rendered on the page')
  });
}


const today = new Date();
today.setHours(0, 0, 0, 0);
const startOfToday = today.getTime();

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const endOfToday = tomorrow.getTime();

const endOfWeek = startOfToday + 7 * 24 * 60 * 60 * 1000;

//function that applies the files the filter on on the page
function applyFilters(value) {
  const now = Date.now();
  let filteredTasks=[];

  if(value==='all'){
    filteredTasks= tasks.filter((task)=>!task.completed);
  }else if(value === "dueToday"){
    filteredTasks=tasks.filter((task)=>{
      return task.rawDueTime >= startOfToday && task.rawDueTime < endOfToday;
    })
  }else if(value==="thisWeek"){
    filteredTasks=tasks.filter((task)=>{
      return task.rawDueTime >= startOfToday && task.rawDueTime < endOfWeek;
    })
  }else if(value==="overdue"){
    filteredTasks=tasks.filter((task)=>{
      return task.rawDueTime < now && !task.completed;
    })
  }else if(value==="completed"){
    filteredTasks=tasks.filter((task)=>{
      return task.completed
    })
  }
  renderTasks(filteredTasks);
}

//summary display of the of the program
function summaryDisplayer() {
  const now = Date.now();
  const overdueTasks = tasks.filter((task) => {
    return task.rawDueTime < now;
  });
  const overdue = overdueTasks.length;
  overdueInfo.textContent = overdue;

  const dueThisWeek = tasks.filter((due) => {
    return due.rawDueTime > now && due.rawDueTime < endOfWeek;
  });
  const dueWeek=dueThisWeek.length;
  dueInfo.textContent = dueWeek;

  const dueToday=tasks.filter((today)=>{
    return today.rawDueTime >=startOfToday && today.rawDueTime <= endOfToday
  });
  const todayTotal=dueToday.length;
  dueTodayInfo.textContent=todayTotal;

  const completedTask=tasks.filter((task)=> task.completed);
  const completed=completedTask.length;
  completedInfo.textContent=completed;

}
//Function that preforms the action of filtering the task content
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTask();
});

filterContainer.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-filter]");
  if (!btn) return;

  //remove the active class from all the button
  const filterBtn = document.querySelectorAll(".filter-btn");
  filterBtn.forEach((btn) => {
    btn.classList.remove("active");
  });
  //add active class when clicked
  btn.classList.add("active");

  //reading the dataset values
  const datasetValue = btn.dataset.filter;
  applyFilters(datasetValue);
});

clearFilter.addEventListener("click", () => {
  applyFilters("all");
  filterButton.forEach((btn) => {
    btn.classList.remove("active");
  });
  const allBtn = document.querySelector('[data-filter="all"]');
  allBtn.classList.add("active");
});
 
//function that loads the task from the local storage and displays it on the webpage 
function loadTasksFromLocalStorage() {
  const data=localStorage.getItem('taskData');
  if(!data)return;
  if(data){
    const parsedTasks=JSON.parse(data);
    tasks=[];
    tasks.push(...parsedTasks);
    nextId=tasks.length>0?Math.max(...tasks.map(task=>task.id))+1:1;
    renderTasks();
    summaryDisplayer();
  }
}

//event listener for the checkbox that was click to complete the tasks
taskList.addEventListener('change', (event)=>{
  if(!event.target.matches('input[type="checkbox"]'))return;

  const checkbox = event.target;
  const li=checkbox.closest('[data-id]');
  if(!li)return;

  const taskId=Number(li.dataset.id);

  const taskComplete=tasks.find((task)=>task.id===taskId);
  if(!taskComplete)return;

  taskComplete.completed = checkbox.checked;

  const newLi = checkbox.closest('li');
  newLi.classList.toggle("completed", taskComplete.completed);

  renderTasks();
  summaryDisplayer();

});

summaryDisplayer();
loadTasksFromLocalStorage();
