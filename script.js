var qrcode = new QRCode(document.getElementById("qrcode"), {
    text: "https://www.example.com",
    width: 128,
    height: 128,
    colorDark : "#000000",
    colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
});

document.addEventListener("DOMContentLoaded", function() {
    const saveDataButton = document.getElementById('save-data');
    const form = document.querySelector('form');

    saveDataButton.addEventListener('click', function(e) {
        e.preventDefault();  // prevent default button behavior
        form.submit();      // submit the form
    });
});
