document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector(".reception tbody");

    // Function to fetch random user data and populate the table
    async function fetchRandomUserData() {
        try {
            const response = await fetch("https://randomuser.me/api/?results=5");
            const data = await response.json();
            const users = data.results;

            // Clear existing table rows
            tableBody.innerHTML = "";

            // Populate the table with fetched user data
            users.forEach(user => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td><img src="${user.picture.thumbnail}" alt="User Picture"></td>
                    <td>${user.name.first}</td>
                    <td>${user.name.last}</td>
                    <td>${user.email}</td>
                    <td></td> <!-- Empty for Status -->
                    <td></td> <!-- Empty for Out Time -->
                    <td></td> <!-- Empty for Duration -->
                    <td></td> <!-- Empty for Expected Return Time -->
                `;

                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Error fetching random user data:", error);
        }
    }

    // Fetch data on page load
    fetchRandomUserData();
});
