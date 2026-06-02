// ------------------- Load Parts -------------------
function loadParts() {
    fetch("http://127.0.0.1:5000/parts")
    .then(res => res.json())
    .then(data => {
        const table = document.getElementById("partsTable");
        table.innerHTML = "";
        data.forEach(part => {
            table.innerHTML += `
                <tr>
                    <td>${part.barcode}</td>
                    <td>${part.part_name}</td>
                    <td>${part.manufacturer}</td>
                    <td>${part.status.charAt(0).toUpperCase() + part.status.slice(1)}</td>
                    <td><button onclick="deletePart('${part.barcode}')">Delete</button></td>
                </tr>
            `;
        });
    });
}

// ------------------- Add Part -------------------
function addPart(barcode, name, brand, status) {
    if(!barcode || !name || !brand) {
        alert("⚠ Please fill all fields");
        return;
    }

    fetch("http://127.0.0.1:5000/add-part", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, name, brand, status })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        loadParts(); // <-- refresh table immediately
    })
    .catch(err => {
        alert("❌ Error connecting to backend");
        console.error(err);
    });
}

// ------------------- Delete Part -------------------
function deletePart(barcode) {
    fetch("http://127.0.0.1:5000/delete-part", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        loadParts(); // <-- refresh table after delete
    });
}

// ------------------- Manual Entry -------------------
document.getElementById("manualAddBtn").onclick = function() {
    const barcode = document.getElementById("manualBarcode").value.trim();
    const name = document.getElementById("manualName").value.trim();
    const brand = document.getElementById("manualBrand").value.trim();
    const status = document.getElementById("manualStatus").value;
    addPart(barcode, name, brand, status);
};

// ------------------- Camera Scan -------------------
let html5QrCode;
const readerDiv = document.getElementById("reader");

// Default text before starting camera
readerDiv.innerHTML = '<p id="cameraText" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); opacity:0.7;">Camera preview will appear here</p>';

// START CAMERA button
document.getElementById("cameraStartBtn").onclick = function() {
    const cameraText = document.getElementById("cameraText");

    if(html5QrCode) {
        html5QrCode.stop().catch(e=>console.log(e));
        html5QrCode.clear();
    }

    html5QrCode = new Html5Qrcode("reader");
    cameraText.style.display = "none";

    html5QrCode.start(
        { facingMode: "environment" },
        { 
            fps: 10, 
            qrbox: 250,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E
            ]
        },
        decodedText => {
            html5QrCode.stop().then(() => html5QrCode.clear());
            const status = document.getElementById("cameraStatus").value;
            const name = prompt("Enter Part Name:");
            const brand = prompt("Enter Manufacturer:");
            addPart(decodedText, name, brand, status);
        },
        errorMessage => console.log("Scan error:", errorMessage)
    ).catch(err => {
        alert("❌ Unable to access camera. Make sure permissions are granted.");
        console.error(err);
    });
};

// STOP CAMERA button
const stopCameraBtn = document.createElement("button");
stopCameraBtn.className = "primary-btn";
stopCameraBtn.style.marginTop = "10px";
stopCameraBtn.textContent = "Stop Camera";
document.getElementById("cameraStartBtn").parentNode.appendChild(stopCameraBtn);

stopCameraBtn.onclick = function() {
    const cameraText = document.getElementById("cameraText");
    if(html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            html5QrCode = null;
            cameraText.style.display = "block";
        }).catch(() => {
            html5QrCode = null;
            cameraText.style.display = "block";
        });
    } else {
        cameraText.style.display = "block";
    }
};

// ------------------- Upload QR -------------------
const uploadBox = document.getElementById("uploadBox");
const uploadInput = document.getElementById("uploadInput");
const previewImage = document.getElementById("previewImage");

uploadBox.onclick = () => uploadInput.click();

uploadInput.onchange = function(e) {
    const file = e.target.files[0];
    if(!file) return;
    previewImage.src = URL.createObjectURL(file);
};

document.getElementById("uploadAddBtn").onclick = function() {
    if(!uploadInput.files[0]) {
        alert("⚠ Please upload a file");
        return;
    }

    const html5QrCodeUpload = new Html5Qrcode("upload-reader");

    html5QrCodeUpload.scanFile(uploadInput.files[0], true)
        .then(decodedText => {
            const status = document.getElementById("uploadStatus").value;
            const name = prompt("Enter Part Name:");
            const brand = prompt("Enter Manufacturer:");
            addPart(decodedText, name, brand, status);
        })
        .catch(err => alert("❌ Unable to decode QR code"));
};

// ------------------- Auto-load -------------------
window.onload = loadParts;