function SaveAdminlogin() {
    var username = document.getElementById('username').value; 
    var password = document.getElementById('password').value; 

    $.ajax({
        type: 'POST',
        url: '/admin-login',
        data: {
            username: username,
            password: password
        },
        success: function(response) {
            // Redirect to admin dashboard upon successful login
            window.location.href = '/admin-dashboard';
        },
        error: function(xhr, status, error) {
            // Check if the error status is 401 (Unauthorized)
            if (xhr.status === 401) {
                // Display an error message indicating username and password not found
                $('#status').html('<p class="message" style="color: red;">Username or password not found.</p>');
            } else {
                // Display a generic error message
                $('#status').html('<p class="message" style="color: red;">Username or password not found.</p>');
            }
        }
    });
}
