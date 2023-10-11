// Fetch data from Firebase and populate the table
const db = firebase.database();

function populateArtworkTable() {
    console.log("Attempting to populate table...");  // Log for debugging
    const tableBody = document.getElementById('artwork-table').querySelector('tbody');
    const artworksRef = db.ref('artworks/');  // Using "db" here

    // Clear the table first to prevent duplicate rows on subsequent updates
    tableBody.innerHTML = "";

    artworksRef.on('value', function(snapshot) {
        if (snapshot.exists()) {  // Check if there's any data
            console.log("Found data in Firebase");  // Log for debugging

            snapshot.forEach(function(childSnapshot) {
                const data = childSnapshot.val();
                const row = tableBody.insertRow();
                row.insertCell(0).innerText = data.lastName || '';
                row.insertCell(1).innerText = data.firstName || '';
                row.insertCell(2).innerText = data.artworkName || '';
                row.insertCell(3).innerText = data.dateCreated || '';
                row.insertCell(4).innerText = data.category || '';
                row.insertCell(5).innerText = data.status || '';

                // Adding the image cell here
                let imgCell = row.insertCell(6); // Assuming the image is the 7th column
                if (data.photoURLs && data.photoURLs.length > 0) {
                    let img = document.createElement('img');
                    img.src = data.photoURLs[0]; // Displaying the first image
                    img.width = 100; // Adjust as needed
                    imgCell.appendChild(img);
                }
            });
        } else {
            console.error("No data found in Firebase under 'artworks/' path");
        }
    }, error => {
        console.error("Error accessing Firebase:", error);
    });
}

populateArtworkTable(); // Call the function to populate the table
