// QR code generation
var qrcode = new QRCode(document.getElementById("qrcode"), {
    text: "https://www.example.com",
    width: 256,
    height: 256,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
});

var database; // Declare the variable outside of any function

document.addEventListener("DOMContentLoaded", function() {
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
    database = firebase.database(); // Initialize the variable here

    if (document.getElementById('artwork-table')) { // Check if the element exists on the page
        populateArtworkTable(); // Call the function to populate the table
    }

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
        database.ref('artworks/').push(formData).then((snapshot) => {
            const itemID = snapshot.key;
            const qrCodeURL = `https://yourwebsite.com/artwork-details?itemID=${itemID}`;
            qrcode.makeCode(qrCodeURL);
            alert('Data and images saved successfully!');
            form.reset();
            document.getElementById('uploaded-files').innerHTML = ''; // Clear the file list display
            uploadedFiles.length = 0; // Clear the uploadedFiles array
        }).catch(error => {
            console.error("Error saving data: ", error);
            alert('Failed to save data. Please check the console for more details.');
        });
    });

    clearDataButton.addEventListener('click', function(e) {
        e.preventDefault(); 
        form.reset(); 
        qrcode.clear(); 
        document.getElementById('uploaded-files').innerHTML = ''; // Clear the file list display
        uploadedFiles.length = 0; // Clear the uploadedFiles array
    });

});
