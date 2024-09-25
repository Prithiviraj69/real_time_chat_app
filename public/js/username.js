// username.js
document.getElementById('username-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the form from submitting traditionally

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();

    if (username.length > 4 && email) {
        fetch('/send-verification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Verification email sent. Please check your email to continue.');
                } else {
                    alert('Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to send verification email.');
            });
    } else {
        alert('Username must be more than 4 characters and email must be valid.');
    }
});
