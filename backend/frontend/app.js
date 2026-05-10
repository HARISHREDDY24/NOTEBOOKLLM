const BACKEND_URL = "";




// ================= UPLOAD PDF =================

async function uploadPDF() {

    const fileInput =
        document.getElementById("pdfFile");

    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a PDF");
        return;
    }

    const formData = new FormData();

    formData.append("pdf", file);

    document.getElementById("uploadStatus")
        .innerText = "Uploading PDF...";

    try {

        const response = await fetch(
            `${BACKEND_URL}/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        const data = await response.json();

        if (response.ok) {

            document.getElementById("uploadStatus")
                .innerText = data.message;

        } else {

            document.getElementById("uploadStatus")
                .innerText = data.error;
        }

    } catch (error) {

        console.log(error);

        document.getElementById("uploadStatus")
            .innerText = "Upload failed";
    }
}





// ================= ASK QUESTION =================

async function askQuestion() {

    const question =
        document.getElementById("question").value;

    if (!question) {
        alert("Please enter a question");
        return;
    }

    document.getElementById("answer")
        .innerText = "Generating answer...";

    try {

        const response = await fetch(
            `${BACKEND_URL}/ask`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    question,
                }),
            }
        );

        const data = await response.json();

        if (response.ok) {

            document.getElementById("answer")
                .innerText = data.answer;

        } else {

            document.getElementById("answer")
                .innerText = data.error;
        }

    } catch (error) {

        console.log(error);

        document.getElementById("answer")
            .innerText = "Something went wrong";
    }
}