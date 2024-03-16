$(document).ready(function(){
    
    $(".analytics-area").hide();
     $(".conversation").hide();


  $(".file-upload-btn").click(function(){
      $(".file_upload").show();
      $(".conversation").hide();
      $(".analytics-area").hide();
  });

  $(".analytics-btn").click(function(){
    $(".file_upload").hide();
    $(".conversation").hide();
    $(".analytics-area").show();
});

  $(".chat-history-btn").click(function(){
      $(".file_upload").hide();
      $(".conversation").show();
      $(".analytics-area").hide();
  });

  // Function to handle logout
// Define logout function using jQuery
function logout() {
    $.ajax({
        url: '/logout',
        type: 'POST',
        success: function(response) {
            // Redirect to admin login page after logout
            window.location.href = '/chatbot-admin';
        },
        error: function(error) {
            console.error('Error:', error);
        }
    });
}

// Event listener for logout button click using jQuery
$('.logout').on('click', function(event) {
    event.preventDefault(); // Prevent default form submission
    logout(); // Call logout function
});

});

