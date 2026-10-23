const tableBody = document.getElementById("studentTableBody");
const searchInput = document.getElementById("searchInput");
const modal = document.getElementById("studentModal");
const form = document.getElementById("studentForm");
const notice = document.getElementById("notice");
let students = [];

const fields = {
  student_name: document.getElementById("studentName"),
  roll_number: document.getElementById("rollNumber"),
  department: document.getElementById("department"),
  year_of_study: document.getElementById("yearOfStudy"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
  address: document.getElementById("address")
};

function showNotice(message, isError = false) {
  notice.textContent = message;
  notice.classList.toggle("error", isError);
  if (message) setTimeout(() => { notice.textContent = ""; notice.classList.remove("error"); }, 5000);
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

async function loadStudents() {
  try {
    students = await api("/api/students");
    renderStudents();
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(error.message)} Please check that the server and database are configured.</td></tr>`;
    showNotice(error.message, true);
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function renderStudents() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = students.filter(student =>
    [student.student_name, student.roll_number, student.department, student.year_of_study, student.email, student.phone]
      .some(value => String(value || "").toLowerCase().includes(query))
  );
  document.getElementById("totalCount").textContent = students.length;
  document.getElementById("departmentCount").textContent = new Set(students.map(s => s.department.toLowerCase())).size;
  document.getElementById("visibleCount").textContent = filtered.length;

  if (!filtered.length) {
    tableBody.innerHTML = `<tr><td colspan="6" class="empty">${query ? "No matching students found." : "No student records yet. Select “Add student” to create one."}</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered.map(student => `
    <tr>
      <td><div class="student-name">${escapeHtml(student.student_name)}</div><div class="student-email">${escapeHtml(student.email || "No email provided")}</div></td>
      <td>${escapeHtml(student.roll_number)}</td>
      <td><span class="pill">${escapeHtml(student.department)}</span></td>
      <td>${escapeHtml(student.year_of_study)}</td>
      <td>${escapeHtml(student.phone || "—")}</td>
      <td><div class="actions"><button class="small-btn edit-btn" data-action="edit" data-id="${student.id}">Edit</button><button class="small-btn delete-btn" data-action="delete" data-id="${student.id}">Delete</button></div></td>
    </tr>`).join("");
}

function openModal(student = null) {
  form.reset();
  document.getElementById("studentId").value = student ? student.id : "";
  document.getElementById("modalTitle").textContent = student ? "Edit student" : "Add student";
  document.getElementById("saveBtn").textContent = student ? "Save changes" : "Save student";
  Object.keys(fields).forEach(key => { fields[key].value = student ? (student[key] || "") : ""; });
  modal.classList.remove("hidden");
  fields.student_name.focus();
}

function closeModal() {
  modal.classList.add("hidden");
}

document.getElementById("addStudentBtn").addEventListener("click", () => openModal());
document.getElementById("closeModalBtn").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") closeModal(); });
searchInput.addEventListener("input", renderStudents);

form.addEventListener("submit", async event => {
  event.preventDefault();
  const id = document.getElementById("studentId").value;
  const payload = Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value.trim()]));
  const saveButton = document.getElementById("saveBtn");
  saveButton.disabled = true;
  saveButton.textContent = "Saving…";
  try {
    await api(id ? `/api/students/${id}` : "/api/students", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    closeModal();
    await loadStudents();
    showNotice(id ? "Student details updated successfully." : "Student added successfully.");
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = id ? "Save changes" : "Save student";
  }
});

tableBody.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const student = students.find(item => String(item.id) === button.dataset.id);
  if (!student) return;
  if (button.dataset.action === "edit") {
    openModal(student);
  } else if (button.dataset.action === "delete") {
    if (!confirm(`Delete the record for ${student.student_name}? This cannot be undone.`)) return;
    try {
      await api(`/api/students/${student.id}`, { method: "DELETE" });
      await loadStudents();
      showNotice("Student record deleted.");
    } catch (error) {
      showNotice(error.message, true);
    }
  }
});

loadStudents();
