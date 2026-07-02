
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const themeToggle = document.getElementById('theme-toggle');
const authToggle = document.getElementById('auth-toggle');
const authOverlay = document.getElementById('auth-overlay');
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showLoginBtn = document.getElementById('show-login');
const showSignupBtn = document.getElementById('show-signup');
const switchToSignupLink = document.getElementById('switch-to-signup');
const switchToLoginLink = document.getElementById('switch-to-login');
const addTaskBtn = document.getElementById('add-task-btn');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const searchInput = document.getElementById('search-input');
const filterPriority = document.getElementById('filter-priority');
const sortBy = document.getElementById('sort-by');
const calendarDays = document.getElementById('calendar-days');
const monthYear = document.getElementById('month-year');
const prevMonth = document.getElementById('prev-month');
const nextMonth = document.getElementById('next-month');
const dayTasks = document.getElementById('day-tasks');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const subjectBars = document.getElementById('subject-bars');

// ADD THIS CODE - Reminder System DOM Elements
const reminderBell = document.getElementById('reminder-bell');
const reminderCount = document.getElementById('reminder-count');
const reminderEmailInput = document.getElementById('reminder-email');
const notificationHistoryList = document.getElementById('notification-history-list');
// END ADD

// ADD THIS CODE - Task Tracking DOM Elements
const filterStatus = document.getElementById('filter-status');
// END ADD

// State
let tasks = JSON.parse(localStorage.getItem('studyPlannerTasks')) || [];
let notificationHistory = JSON.parse(localStorage.getItem('studyPlannerNotificationHistory')) || [];
let reminderEmail = localStorage.getItem('studyPlannerReminderEmail') || '';
let users = JSON.parse(localStorage.getItem('studyPlannerUsers')) || [];
let loggedInUser = localStorage.getItem('studyPlannerAuthUser') || null;
let currentDate = new Date();
let currentTaskId = null;

// ADD THIS CODE - Ensure all tasks have status field
tasks = tasks.map(task => ({
    ...task,
    status: task.status || (task.completed ? 'Completed' : 'Pending')
}));
// END ADD

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    reminderEmailInput.value = reminderEmail;

    if (!loggedInUser) {
        authOverlay.classList.add('show');
    } else {
        authOverlay.classList.remove('show');
    }

    renderTasks();
    renderCalendar();
    updateDashboard();
    renderProgressChart();
    renderNotificationHistory();
    checkReminders();
});

// ADD THIS CODE - Request Notification Permission on Load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
// END ADD

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.dataset.section;
        showSection(sectionId);
    });
});

function showSection(sectionId) {
    sections.forEach(section => section.classList.remove('active'));
    navLinks.forEach(link => link.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
}

// Auth flow
function openModal(modal) {
    modal.classList.add('show');
}

function closeModal(modal) {
    modal.classList.remove('show');
}

function loginSuccess(email) {
    loggedInUser = email;
    localStorage.setItem('studyPlannerAuthUser', email);
    authOverlay.classList.remove('show');
    closeModal(loginModal);
    closeModal(signupModal);
    if (typeof window.updateAuthButton === 'function') window.updateAuthButton();
    alert(`Welcome back, ${email}!`);
}

if (authToggle) {
    const updateAuthButton = () => {
        if (loggedInUser) {
            authToggle.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        } else {
            authToggle.innerHTML = '<i class="fas fa-user"></i> Login / Signup';
        }
    };

    updateAuthButton();

    authToggle.addEventListener('click', () => {
        if (loggedInUser) {
            if (confirm('Do you want to logout?')) {
                loggedInUser = null;
                localStorage.removeItem('studyPlannerAuthUser');
                authOverlay.classList.add('show');
                updateAuthButton();
            }
            return;
        }

        authOverlay.classList.add('show');
        closeModal(loginModal);
        closeModal(signupModal);
    });

    window.updateAuthButton = updateAuthButton; // keep available
}

if (showLoginBtn) {
    showLoginBtn.addEventListener('click', () => {
        openModal(loginModal);
        closeModal(signupModal);
    });
}

if (showSignupBtn) {
    showSignupBtn.addEventListener('click', () => {
        openModal(signupModal);
        closeModal(loginModal);
    });
}

if (switchToSignupLink) {
    switchToSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(loginModal);
        openModal(signupModal);
    });
}

if (switchToLoginLink) {
    switchToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal(signupModal);
        openModal(loginModal);
    });
}

document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-modal');
        if (modalId) {
            document.getElementById(modalId).classList.remove('show');
        }
    });
});

// Theme Toggle
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
});

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme');
    themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Auth forms handling
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            loginSuccess(email);
            renderTasks();
            updateDashboard();
            renderProgressChart();
        } else {
            alert('Invalid login credentials. Please check your email and password.');
        }
    });
}

if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value.trim().toLowerCase();
        const password = document.getElementById('signup-password').value;

        if (!email || !password) {
            alert('Both email and password are required for signup.');
            return;
        }

        if (users.some(u => u.email === email)) {
            alert('This email is already registered. Please login or use a different email.');
            return;
        }

        users.push({ email, password });
        localStorage.setItem('studyPlannerUsers', JSON.stringify(users));
        loginSuccess(email);
        renderTasks();
        updateDashboard();
        renderProgressChart();
    });
}

// Task Management
addTaskBtn.addEventListener('click', () => {
    currentTaskId = null;
    document.getElementById('modal-title').textContent = 'Add Task';
    taskForm.reset();
    taskModal.classList.add('show');
});

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const taskData = {
        id: currentTaskId || Date.now(),
        title: document.getElementById('task-title').value,
        subject: document.getElementById('task-subject').value,
        deadline: document.getElementById('task-deadline').value,
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        completed: false
    };
    
    if (currentTaskId) {
        const index = tasks.findIndex(t => t.id === currentTaskId);
        tasks[index] = taskData;
    } else {
        tasks.push(taskData);
    }
    
    saveTasks();
    renderTasks();
    updateDashboard();
    renderCalendar();
    renderProgressChart();
    taskModal.classList.remove('show');
});

function renderTasks() {
    let filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchInput.value.toLowerCase()) ||
                             task.subject.toLowerCase().includes(searchInput.value.toLowerCase());
        const matchesPriority = !filterPriority.value || task.priority === filterPriority.value;
        const matchesStatus = !filterStatus.value || task.status === filterStatus.value;
        return matchesSearch && matchesPriority && matchesStatus;
    });
    
    // Sort tasks
    filteredTasks.sort((a, b) => {
        switch (sortBy.value) {
            case 'deadline':
                return new Date(a.deadline) - new Date(b.deadline);
            case 'priority':
                const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            case 'title':
                return a.title.localeCompare(b.title);
            default:
                return 0;
        }
    });
    
    taskList.innerHTML = '';
    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.innerHTML = `
        <div class="task-header">
            <div>
                <h3 class="task-title">${task.title}</h3>
                <p><strong>Subject:</strong> ${task.subject}</p>
            </div>
            <div>
                <span class="task-priority ${task.priority}">${task.priority}</span>
                <span class="task-status ${task.status.replace(' ', '')}">${task.status}</span>
            </div>
        </div>
        <div class="task-details">
            <div>
                <p><i class="fas fa-calendar"></i> ${formatDate(task.deadline)}</p>
                <p><i class="fas fa-clock"></i> ${formatTime(task.deadline)}</p>
            </div>
            <div class="task-actions">
                <button class="btn-secondary edit-btn" data-id="${task.id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn-danger delete-btn" data-id="${task.id}"><i class="fas fa-trash"></i> Delete</button>
                <button class="btn-secondary complete-btn" data-id="${task.id}">
                    <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i> ${task.completed ? 'Undo' : 'Complete'}
                </button>
            </div>
        </div>
    `;
    
    // Event listeners
    div.querySelector('.edit-btn').addEventListener('click', () => editTask(task.id));
    div.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
    div.querySelector('.complete-btn').addEventListener('click', () => toggleComplete(task.id));
    
    return div;
}

function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    currentTaskId = id;
    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-subject').value = task.subject;
    document.getElementById('task-deadline').value = task.deadline;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-status').value = task.status;
    taskModal.classList.add('show');
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        renderTasks();
        updateDashboard();
        renderCalendar();
        renderProgressChart();
    }
}

function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateDashboard();
        renderProgressChart();
    }
}

// Search and Filter
searchInput.addEventListener('input', renderTasks);
filterPriority.addEventListener('change', renderTasks);
sortBy.addEventListener('change', renderTasks);

// ADD THIS CODE - Status Filter Event Listener
filterStatus.addEventListener('change', renderTasks);
// END ADD

// ADD THIS CODE - Email Notification Settings Listener
if (reminderEmailInput) {
    reminderEmailInput.addEventListener('change', (e) => {
        reminderEmail = e.target.value.trim();
        localStorage.setItem('studyPlannerReminderEmail', reminderEmail);
    });
}
// END ADD

// Calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthYear.textContent = `${currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    calendarDays.innerHTML = '';
    
    for (let i = 0; i < 42; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        
        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + i);
        
        if (currentDay.getMonth() === month) {
            dayElement.textContent = currentDay.getDate();
            
            // Check if today
            const today = new Date();
            if (currentDay.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }
            
            // Check if has tasks
            const dayTasks = tasks.filter(task => {
                const taskDate = new Date(task.deadline);
                return taskDate.toDateString() === currentDay.toDateString();
            });
            
            if (dayTasks.length > 0) {
                dayElement.classList.add('has-tasks');
            }
            
            dayElement.addEventListener('click', () => showDayTasks(currentDay));
        }
        
        calendarDays.appendChild(dayElement);
    }
}

prevMonth.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

nextMonth.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

function showDayTasks(date) {
    const dayTasksList = tasks.filter(task => {
        const taskDate = new Date(task.deadline);
        return taskDate.toDateString() === date.toDateString();
    });
    
    if (dayTasksList.length === 0) {
        dayTasks.innerHTML = `<h3>No tasks for ${date.toDateString()}</h3>`;
    } else {
        dayTasks.innerHTML = `<h3>Tasks for ${date.toDateString()}</h3>`;
        dayTasksList.forEach(task => {
            const taskElement = createTaskElement(task);
            dayTasks.appendChild(taskElement);
        });
    }
    
    dayTasks.classList.add('show');
}

// UPDATE THIS CODE - Enhanced Progress Display
function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => !t.completed && new Date(t.deadline) < new Date()).length;
    
    document.getElementById('total-tasks').textContent = total;
    document.getElementById('completed-tasks').textContent = completed;
    document.getElementById('pending-tasks').textContent = pending;
    document.getElementById('overdue-tasks').textContent = overdue;
    
    const completedPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pendingPercentage = total > 0 ? Math.round((pending / total) * 100) : 0;
    
    progressFill.style.width = `${completedPercentage}%`;
    progressText.innerHTML = `
        <span style="color: var(--success-color)">${completedPercentage}% Completed</span> | 
        <span style="color: var(--warning-color)">${pendingPercentage}% Pending</span>
    `;
    
    // Add animation class
    progressFill.classList.add('animate-progress');
    setTimeout(() => progressFill.classList.remove('animate-progress'), 1000);

    // Track task status distribution
    renderTaskTracker();
}
// END UPDATE

// ADD THIS CODE - Task Tracker Rendering
function renderTaskTracker() {
    const pending = tasks.filter(t => t.status === 'Pending').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const completed = tasks.filter(t => t.status === 'Completed').length;

    const tracker = document.getElementById('task-tracker');
    if (!tracker) return;

    tracker.innerHTML = `
        <div class="track-item">Pending: ${pending}</div>
        <div class="track-item">In Progress: ${inProgress}</div>
        <div class="track-item">Completed: ${completed}</div>
    `;
}

function addNotificationHistory(title, details) {
    const timestamp = new Date().toLocaleString();
    notificationHistory.unshift({ title, details, timestamp });

    // Keep latest 20 entries
    if (notificationHistory.length > 20) {
        notificationHistory = notificationHistory.slice(0, 20);
    }

    localStorage.setItem('studyPlannerNotificationHistory', JSON.stringify(notificationHistory));
    renderNotificationHistory();
}

function renderNotificationHistory() {
    if (!notificationHistoryList) return;

    notificationHistoryList.innerHTML = '';
    if (notificationHistory.length === 0) {
        notificationHistoryList.innerHTML = '<li>No notifications yet.</li>';
        return;
    }

    notificationHistory.forEach(entry => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${entry.timestamp}</strong><br>${entry.details}`;
        notificationHistoryList.appendChild(li);
    });
}
// END ADD

// Progress Chart
function renderProgressChart() {
    // Simple progress chart using canvas
    const canvas = document.getElementById('progress-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a simple bar chart
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;
    
    const barWidth = 50;
    const maxHeight = 150;
    const scale = maxHeight / Math.max(tasks.length || 1, 1);
    
    // Completed bar
    ctx.fillStyle = '#10b981';
    ctx.fillRect(50, canvas.height - (completed * scale) - 50, barWidth, completed * scale);
    ctx.fillStyle = '#1f2937';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Completed', 75, canvas.height - 20);
    ctx.fillText(completed, 75, canvas.height - (completed * scale) - 55);
    
    // Pending bar
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(150, canvas.height - (pending * scale) - 50, barWidth, pending * scale);
    ctx.fillStyle = '#1f2937';
    ctx.fillText('Pending', 175, canvas.height - 20);
    ctx.fillText(pending, 175, canvas.height - (pending * scale) - 55);
    
    // Subject progress
    renderSubjectProgress();
}

function renderSubjectProgress() {
    const subjects = {};
    tasks.forEach(task => {
        if (!subjects[task.subject]) {
            subjects[task.subject] = { total: 0, completed: 0 };
        }
        subjects[task.subject].total++;
        if (task.completed) {
            subjects[task.subject].completed++;
        }
    });
    
    subjectBars.innerHTML = '';
    Object.keys(subjects).forEach(subject => {
        const { total, completed } = subjects[subject];
        const percentage = Math.round((completed / total) * 100);
        
        const div = document.createElement('div');
        div.className = 'subject-bar';
        div.innerHTML = `
            <h4>${subject}</h4>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
            <p>${completed}/${total} tasks completed</p>
        `;
        subjectBars.appendChild(div);
    });
}

// UPDATE THIS FUNCTION - Enhanced Reminder System
function checkReminders() {
    const now = new Date();
    let upcomingCount = 0;

    tasks.forEach(task => {
        if (!task.completed) {
            const deadline = new Date(task.deadline);
            const timeDiff = deadline - now;
            const minutesDiff = timeDiff / (1000 * 60);

            if (minutesDiff <= 10 && minutesDiff > 0 && !task.reminderSent) {
                upcomingCount++;

                // Mark as reminder sent so it doesn't duplicate
                task.reminderSent = true;
                saveTasks();

                const message = `Reminder: "${task.title}" is due in ${Math.round(minutesDiff)} minutes!`;

                // Notification API
                if ('Notification' in window && Notification.permission === 'default') {
                    Notification.requestPermission();
                }

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('Task Reminder', {
                        body: message,
                        icon: 'https://images.unsplash.com/photo-1518081461909-8707c5a8e143?ixlib=rb-4.0.3&auto=format&fit=crop&w=64&q=80'
                    });
                } else {
                    alert(message);
                }

                addNotificationHistory(task.title, message);

                // Email integration via mailto if configured
                if (reminderEmail) {
                    const subject = encodeURIComponent(`Reminder: ${task.title} due soon`);
                    const body = encodeURIComponent(`${message}\n\nDeadline: ${formatDate(task.deadline)} ${formatTime(task.deadline)}`);
                    window.open(`mailto:${encodeURIComponent(reminderEmail)}?subject=${subject}&body=${body}`, '_blank');
                }
            }
        }
    });

    // Update reminder count
    reminderCount.textContent = upcomingCount;
    reminderCount.style.display = upcomingCount > 0 ? 'flex' : 'none';

    renderNotificationHistory();

    // Check every minute
    setTimeout(checkReminders, 60000);
}
// END UPDATE

// Modal close
document.querySelector('.close').addEventListener('click', () => {
    taskModal.classList.remove('show');
});

window.addEventListener('click', (e) => {
    if (e.target === taskModal) {
        taskModal.classList.remove('show');
    }
});

// Utility functions
function saveTasks() {
    localStorage.setItem('studyPlannerTasks', JSON.stringify(tasks));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
