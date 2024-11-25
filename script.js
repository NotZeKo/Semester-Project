class StaffManager {
    constructor() {
        this.tableBody = document.querySelector(".reception tbody");
        this.transportTableBody = document.querySelector(".transport tbody");
        this.selectedRow = null;

        this.toast = new bootstrap.Toast(document.getElementById("timeoutToast"));
        this.toastPicture = document.getElementById("toastPicture");
        this.toastName = document.getElementById("toastName");
        this.toastMessage = document.getElementById("toastMessage");

        this.initEventListeners();
        this.fetchRandomUserData();
        this.startOverdueCheck();
    }

    // Initialize event listeners
    initEventListeners() {
        this.tableBody.addEventListener("click", this.handleRowSelection.bind(this));
        this.transportTableBody.addEventListener("click", this.handleRowSelection.bind(this));
        document.querySelector(".btn-danger").addEventListener("click", this.handleOutAction.bind(this));
        document.querySelector(".btn-success").addEventListener("click", this.handleInAction.bind(this));
        document.querySelector(".scheduleButtons .btn-success").addEventListener("click", this.handleAddTransport.bind(this));
        document.querySelector(".scheduleButtons .btn-danger").addEventListener("click", this.handleRemoveRow.bind(this));
    }

    // Fetch random user data
    async fetchRandomUserData() {
        try {
            const response = await fetch("https://randomuser.me/api/?results=5");
            const data = await response.json();
            const users = data.results;

            this.tableBody.innerHTML = "";

            users.forEach(user => this.addUserRow(user));
        } catch (error) {
            console.error("Error fetching random user data:", error);
        }
    }

    // Add a user row to the table
    addUserRow(user) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><img src="${user.picture.thumbnail}" alt="User Picture"></td>
            <td>${user.name.first}</td>
            <td>${user.name.last}</td>
            <td>${user.email}</td>
            <td>In</td>
            <td></td>
            <td></td>
            <td></td>
        `;
        this.tableBody.appendChild(row);
    }

    // Handle row selection
    handleRowSelection(e) {
        const clickedRow = e.target.closest("tr");
        if (!clickedRow) return;

        if (clickedRow === this.selectedRow) {
            clickedRow.classList.remove("table-active");
            this.selectedRow = null;
        } else {
            Array.from(this.tableBody.querySelectorAll("tr")).forEach(row => row.classList.remove("table-active"));
            Array.from(this.transportTableBody.querySelectorAll("tr")).forEach(row => row.classList.remove("table-active"));
            clickedRow.classList.add("table-active");
            this.selectedRow = clickedRow;
        }
    }

    // Format the time into hours and minutes
    formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}${remainingMinutes > 0 ? ` and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}` : ''}`;
        } else {
            return `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
        }
    }

    // Handle "Out" button action
    handleOutAction() {
        if (this.selectedRow) {
            const duration = prompt("Enter duration in minutes:");
            if (duration && !isNaN(duration)) {
                const durationMinutes = parseInt(duration);
                const currentTime = new Date();
                const outTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                currentTime.setMinutes(currentTime.getMinutes() + durationMinutes);
                const returnTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                this.selectedRow.cells[4].textContent = "Out";
                this.selectedRow.cells[5].textContent = outTime;
                this.selectedRow.cells[6].textContent = this.formatTime(durationMinutes);
                this.selectedRow.cells[7].textContent = returnTime;

                this.selectedRow.dataset.returnTime = currentTime.getTime();
            } else {
                alert("Please enter a valid duration in minutes.");
            }
        } else {
            alert("Please select a row first.");
        }
    }

    // Handle "In" button action
    handleInAction() {
        if (this.selectedRow) {
            this.selectedRow.cells[4].textContent = "In";
            this.selectedRow.cells[5].textContent = "";
            this.selectedRow.cells[6].textContent = "";
            this.selectedRow.cells[7].textContent = "";
            delete this.selectedRow.dataset.returnTime;
        } else {
            alert("Please select a row first.");
        }
    }

    // Handle adding a new transport row
    handleAddTransport() {
        const inputs = [
            {
                label: "Vehicle",
                validator: val => ["car", "motorcycle"].includes(val.trim().toLowerCase()),
                transform: val => val.trim().toLowerCase()
            },
            { label: "Name", validator: val => /^[a-zA-Z\s]+$/.test(val) },
            { label: "Surname", validator: val => /^[a-zA-Z\s]+$/.test(val) },
            { label: "Telephone", validator: val => /^\d+$/.test(val) },
            { label: "Delivery Address", validator: val => val.trim() !== "" },
            { label: "Return Time (minutes)", validator: val => !isNaN(val) && val.trim() !== "" }
        ];

        const userInputs = {};
        for (const input of inputs) {
            let value;
            do {
                value = prompt(`Enter ${input.label}:`);
                if (!value || !input.validator(value)) {
                    alert(`Invalid ${input.label}. Please try again.`);
                } else {
                    userInputs[input.label] = input.transform ? input.transform(value) : value;
                    break;
                }
            } while (true);
        }

        // Convert return time (minutes) into hours and minutes
        const returnTimeFormatted = this.formatTime(parseInt(userInputs["Return Time (minutes)"]));

        // Determine the icon based on the vehicle
        const vehicleIcon = userInputs["Vehicle"] === "car"
            ? "🚗" // Car icon
            : "🏍️"; // Motorcycle icon

        // Add new row to the transport table
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${vehicleIcon}</td>
            <td>${userInputs["Name"]}</td>
            <td>${userInputs["Surname"]}</td>
            <td>${userInputs["Telephone"]}</td>
            <td>${userInputs["Delivery Address"]}</td>
            <td>${returnTimeFormatted}</td>
        `;
        this.transportTableBody.appendChild(row);
    }

    // Handle removing the selected row
    handleRemoveRow() {
        if (this.selectedRow && this.selectedRow.parentNode === this.transportTableBody) {
            this.transportTableBody.removeChild(this.selectedRow);
            this.selectedRow = null;
        } else {
            alert("Please select a row from the Transport table first.");
        }
    }

    // Start periodic overdue check
    startOverdueCheck() {
        setInterval(() => {
            const currentTime = new Date().getTime();

            Array.from(this.tableBody.querySelectorAll("tr")).forEach(row => {
                if (row.cells[4].textContent === "Out" && row.dataset.returnTime) {
                    const returnTime = parseInt(row.dataset.returnTime, 10);

                    if (currentTime > returnTime) {
                        const picture = row.cells[0].querySelector("img").src;
                        const name = row.cells[1].textContent;
                        const surname = row.cells[2].textContent;

                        const elapsedMinutes = Math.floor((currentTime - returnTime) / 60000);

                        this.toastPicture.src = picture;
                        this.toastName.textContent = `${name} ${surname}`;
                        this.toastMessage.textContent = `Has been out of the office for ${elapsedMinutes} minute${elapsedMinutes > 1 ? 's' : ''}.`;

                        this.toast.show();
                        delete row.dataset.returnTime;
                    }
                }
            });
        }, 10000);
    }
}

// Initialize the StaffManager on DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
    new StaffManager();
});








// Function to format the time with leading zeros
function formatTime(value) {
    return value < 10 ? `0${value}` : value;
}

// Function to update the clock every second
function updateClock() {
    const clockElement = document.querySelector(".clock");
    const now = new Date();

    const days = [
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ];
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const day = days[now.getDay()];
    const date = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = formatTime(now.getHours());
    const minutes = formatTime(now.getMinutes());
    const seconds = formatTime(now.getSeconds());

    clockElement.textContent = `${day}, ${date} ${month} ${year} ${hours}:${minutes}:${seconds}`;
}

// Update the clock every second
setInterval(updateClock, 1000);
updateClock(); // Call immediately to avoid delay


class DeliveryManager {
    constructor() {
        this.transportTableBody = document.querySelector(".transport tbody");
        this.toastContainer = this.createToastContainer();
        this.initOverdueCheck();
    }

    // Create a container for overdue toasts
    createToastContainer() {
        const container = document.createElement("div");
        container.className = "toast-container position-fixed top-0 end-0 p-3";
        document.body.appendChild(container);
        return container;
    }

    // Create an overdue toast
    createToast({ name, surname, telephone, returnTime, address }) {
        const toast = document.createElement("div");
        toast.className = "toast align-items-center text-white bg-danger border-0";
        toast.role = "alert";
        toast.style.display = "flex";
        toast.innerHTML = `
            <div class="toast-body">
                <strong>${name} ${surname}</strong><br>
                <strong>Phone:</strong> ${telephone}<br>
                <strong>Return Time:</strong> ${returnTime}<br>
                <strong>Address:</strong> ${address}
            </div>
            <button type="button" class="btn-close btn-close-white ms-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        `;

        this.toastContainer.appendChild(toast);

        const bsToast = new bootstrap.Toast(toast, { autohide: false });
        bsToast.show();
    }

    // Check for overdue deliveries periodically
    initOverdueCheck() {
        setInterval(() => {
            const currentTime = new Date();

            Array.from(this.transportTableBody.querySelectorAll("tr")).forEach(row => {
                if (!row.dataset.returnTimeNotified) {
                    const returnTimeCell = row.cells[5];
                    const returnTimeText = returnTimeCell.textContent;

                    if (returnTimeText) {
                        const returnTimeParts = returnTimeText.split(":");
                        const returnTime = new Date();
                        returnTime.setHours(parseInt(returnTimeParts[0], 10));
                        returnTime.setMinutes(parseInt(returnTimeParts[1], 10));

                        if (currentTime > returnTime) {
                            const name = row.cells[1].textContent;
                            const surname = row.cells[2].textContent;
                            const telephone = row.cells[3].textContent;
                            const address = row.cells[4].textContent;

                            this.createToast({
                                name,
                                surname,
                                telephone,
                                returnTime: returnTimeText,
                                address
                            });

                            // Mark row as notified to avoid duplicate toasts
                            row.dataset.returnTimeNotified = true;
                        }
                    }
                }
            });
        }, 10000); // Check every 10 seconds
    }
}

// Initialize the DeliveryManager on DOM content loaded
document.addEventListener("DOMContentLoaded", () => {
    new DeliveryManager();
});
