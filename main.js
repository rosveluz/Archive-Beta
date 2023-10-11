/* main.js */
// QR code generation
var qrcode = new QRCode(document.getElementById("qrcode"), {
    text: "https://www.example.com",
    width: 256,
    height: 256,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
});

document.addEventListener("DOMContentLoaded", function() {

    // Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyBaih7B-5kAh4IcChzlGs53peLCl091Gr4",
        authDomain: "archive-beta.firebaseapp.com",
        databaseURL: "https://archive-beta-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "archive-beta",
        storageBucket: "archive-beta.appspot.com",
        messagingSenderId: "316568638029",
        appId: "1:316568638029:web:7dbbc4a2dd1b68c5b38204"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    const saveDataButton = document.getElementById('save-data');
    const clearDataButton = document.getElementById('clear-data');
    const form = document.getElementById('data-form');
    const photoUpload = document.getElementById('photo-upload');
    const photoCapture = document.getElementById('photo-capture');
    const uploadedFiles = [];
    
    function appendFilesToList(files) {
        const uploadedFilesDiv = document.getElementById('uploaded-files');

        for (let file of files) {
            uploadedFiles.push(file);
            const fileName = file.name;
            const fileItem = document.createElement('div');
            fileItem.innerHTML = `
                ${fileName} <button class="delete-file-btn" data-filename="${fileName}">Delete</button>
            `;
            uploadedFilesDiv.appendChild(fileItem);
            
            fileItem.querySelector('.delete-file-btn').addEventListener('click', function() {
                const fileNameToRemove = this.getAttribute('data-filename');
                const index = uploadedFiles.findIndex(f => f.name === fileNameToRemove);
                if (index > -1) {
                    uploadedFiles.splice(index, 1);
                }
                uploadedFilesDiv.removeChild(fileItem);
            });
        }
    }

    photoUpload.addEventListener('change', function() {
        appendFilesToList(this.files);
        this.value = ""; 
    });

    photoCapture.addEventListener('change', function() {
        appendFilesToList(this.files);
        this.value = ""; 
    });

    async function uploadQRCode() {
        return new Promise(async (resolve, reject) => {
            var qrCanvas = document.querySelector('#qrcode canvas');
            qrCanvas.toBlob(async function(blob) {
                var qrFile = new File([blob], "qrcode.png");
                var qrRef = firebase.storage().ref('qrcodes/' + Date.now() + '.png');

                await qrRef.put(qrFile).then(async function(snapshot) {
                    await snapshot.ref.getDownloadURL().then(function(downloadURL) {
                        resolve(downloadURL);
                    });
                }).catch(error => {
                    reject(error);
                });
            });
        });
    }

    async function uploadPhotos(file) {
        return new Promise(async (resolve, reject) => {
            let storageRef = firebase.storage().ref('photos/' + Date.now() + '_' + file.name);

            await storageRef.put(file).then(async function(snapshot) {
                await snapshot.ref.getDownloadURL().then(function(downloadURL) {
                    resolve(downloadURL);
                });
            }).catch(error => {
                reject(error);
            });
        });
    }

    saveDataButton.addEventListener('click', async function(e) {
        e.preventDefault();

        let qrURL = await uploadQRCode();

        let photoURLs = [];
        for (let file of uploadedFiles) {
            let uploadedURL = await uploadPhotos(file);
            photoURLs.push(uploadedURL);
        }

        let formData = {
            artworkName: form.artworkName.value,
            lastName: form.lastName.value,
            firstName: form.firstName.value,
            middleName: form.middleName.value,
            prefix: form.prefix.value,
            suffix: form.suffix.value,
            dateCreated: form.dateCreated.value,
            medium: form.medium.value,
            category: form.category.value,
            status: form.status.value,
            photoURLs: photoURLs,
            qrCodeURL: qrURL
        };

        // Push form data to Firebase Realtime Database
        db.ref('artworks/').push(formData).then((snapshot) => {
            const itemID = snapshot.key;
            const qrCodeURL = `https://yourwebsite.com/artwork-details?itemID=${itemID}`;
            qrcode.makeCode(qrCodeURL);
            alert('Data and images saved successfully!');
            form.reset();
            document.getElementById('uploaded-files').innerHTML = '';
            uploadedFiles.length = 0;
        }).catch(error => {
            console.error("Error saving data: ", error);
            alert('Failed to save data. Please check the console for more details.');
        });
    });

    clearDataButton.addEventListener('click', function(e) {
        e.preventDefault();
        form.reset();
        qrcode.clear();
        document.getElementById('uploaded-files').innerHTML = '';
        uploadedFiles.length = 0;
    });

    function openPopup(data) {
        // Create the popup container
        const popupContainer = document.createElement('div');
        popupContainer.style.position = 'fixed';
        popupContainer.style.top = '0';
        popupContainer.style.left = '0';
        popupContainer.style.width = '100vw';
        popupContainer.style.height = '100vh';
        popupContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
        popupContainer.style.zIndex = '1000';
        popupContainer.style.display = 'flex';
        popupContainer.style.alignItems = 'center';
        popupContainer.style.justifyContent = 'center';
    
        // Create the popup content holder
        const popupContent = document.createElement('div');
        popupContent.style.width = '90%';
        popupContent.style.maxHeight = '90vh';
        popupContent.style.overflowY = 'auto';
        popupContent.style.backgroundColor = '#fff';
        popupContent.style.padding = '20px';
        popupContent.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
        popupContent.style.borderRadius = '10px';
    
        // Images container
        const imagesContainer = document.createElement('div');
        let imageIndex = 0;
    
        function updateImage() {
            imagesContainer.innerHTML = ''; // Clear current image
            const img = document.createElement('img');
            img.src = data.photoURLs[imageIndex];
            img.style.width = '100%';
            img.style.maxHeight = '60vh'; // Ensuring the image fits the viewport
            img.style.objectFit = 'contain';
            img.style.marginBottom = '10px';
            imagesContainer.appendChild(img);
        }
    
        // Navigation buttons for images
        if (data.photoURLs.length > 1) {
            const prevButton = document.createElement('button');
            prevButton.innerText = 'Previous';
            prevButton.onclick = function() {
                imageIndex = (imageIndex - 1 + data.photoURLs.length) % data.photoURLs.length;
                updateImage();
            };
    
            const nextButton = document.createElement('button');
            nextButton.innerText = 'Next';
            nextButton.onclick = function() {
                imageIndex = (imageIndex + 1) % data.photoURLs.length;
                updateImage();
            };
    
            popupContent.appendChild(prevButton);
            popupContent.appendChild(nextButton);
        }
    
        updateImage(); // Display the first image
    
        // Artwork information
        const info = document.createElement('div');
        info.innerHTML = `
            <strong>Artwork Name:</strong> ${data.artworkName} <br>
            <strong>Last Name:</strong> ${data.lastName} <br>
            <strong>First Name:</strong> ${data.firstName}
        `;
    
        // Close button
        const closeButton = document.createElement('button');
        closeButton.innerText = 'Close';
        closeButton.onclick = function() {
            document.body.removeChild(popupContainer);
        };
    
        // Assemble everything
        popupContent.appendChild(imagesContainer);
        popupContent.appendChild(info);
        popupContent.appendChild(closeButton);
        popupContainer.appendChild(popupContent);
        document.body.appendChild(popupContainer);
    }
    

    function populateArtworkTable() {
        console.log("Attempting to populate table...");
        const tableBody = document.getElementById('artwork-table').querySelector('tbody');
        const artworksRef = db.ref('artworks/');

        tableBody.innerHTML = "";

        artworksRef.on('value', function(snapshot) {
            if (snapshot.exists()) {
                snapshot.forEach(function(childSnapshot) {
                    const data = childSnapshot.val();
                    const row = tableBody.insertRow();
                    row.insertCell(0).innerText = data.lastName || '';
                    row.insertCell(1).innerText = data.firstName || '';
                    row.insertCell(2).innerText = data.artworkName || '';
                    row.insertCell(3).innerText = data.dateCreated || '';
                    row.insertCell(4).innerText = data.category || '';
                    row.insertCell(5).innerText = data.status || '';

                    let linkCell = row.insertCell(6);
                    if (data.photoURLs && data.photoURLs.length > 0) {
                        let link = document.createElement('a');
                        link.innerText = `View Images`;
                        link.href = "#";
                        link.onclick = function(e) {
                            e.preventDefault();
                            openPopup(data);
                        };
                        linkCell.appendChild(link);
                    }
                });
            } else {
                console.error("No data found in Firebase under 'artworks/' path");
            }
        }, error => {
            console.error("Error accessing Firebase:", error);
        });
    }

    populateArtworkTable(); 
});
